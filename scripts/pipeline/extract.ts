/**
 * Extract atlas JSON from corpus chunks via Cursor SDK.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  corpusChunksPath,
  corpusStructurePath,
  DOCUMENTS_DIR,
} from "../../lib/pipeline/paths";
import type { PipelineProgressStore } from "../../lib/pipeline/progress";
import {
  corpusChunkSchema,
  corpusStructureSchema,
  type CorpusChunk,
  type ManifestJob,
} from "../../lib/pipeline/types";
import { extractionSchema } from "../../lib/schema";
import { saveDocument } from "../lib/saveDocument";
import { cursorJsonPrompt } from "../lib/cursorLlm";
import { pipelineDelay } from "./shared";

const KEYWORDS = [
  "design storm",
  "return period",
  "water quality",
  "wqv",
  "treatment volume",
  "peak flow",
  "rational",
  "tr-55",
  "hydrograph",
  "bmp",
  "bioretention",
  "detention",
  "software",
  "hec-",
  "swmm",
];

async function loadChunks(slug: string): Promise<CorpusChunk[]> {
  if (!existsSync(corpusChunksPath(slug))) return [];
  const text = await readFile(corpusChunksPath(slug), "utf-8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => corpusChunkSchema.parse(JSON.parse(line)));
}

function scoreChunk(chunk: CorpusChunk): number {
  let score = 0;
  if (chunk.contains_requirements) score += 5;
  score += chunk.requirement_types.length * 2;
  const hay = (
    chunk.summary +
    " " +
    chunk.topic_tags.join(" ") +
    " " +
    chunk.section_title +
    " " +
    chunk.text.slice(0, 2000)
  ).toLowerCase();
  for (const kw of KEYWORDS) {
    if (hay.includes(kw)) score += 1;
  }
  return score;
}

function selectChunksForExtract(chunks: CorpusChunk[], maxChars = 90_000): CorpusChunk[] {
  const ranked = [...chunks].sort((a, b) => scoreChunk(b) - scoreChunk(a));
  const selected: CorpusChunk[] = [];
  let chars = 0;
  for (const c of ranked) {
    if (chars + c.char_count > maxChars && selected.length > 0) continue;
    selected.push(c);
    chars += Math.min(c.char_count, 4000);
    if (selected.length >= 25) break;
  }
  return selected.sort((a, b) => a.page_start - b.page_start);
}

export async function runExtractStage(
  store: PipelineProgressStore,
  job: ManifestJob,
  opts: { force: boolean; dryRun: boolean }
): Promise<"done" | "skipped" | "failed" | "noop"> {
  const jobProg = store.ensureJob(job.id);
  if (jobProg.stages.prepare.status === "skipped") {
    store.setStage(job.id, "extract", {
      status: "skipped",
      error: "prepare_skipped",
      completedAt: new Date().toISOString(),
    });
    await store.save();
    return "skipped";
  }

  const current = jobProg.stages.extract;
  if (!opts.force && (current.status === "done" || current.status === "skipped")) {
    return "noop";
  }

  // Prefer corpus done; allow extract if document already exists without force
  if (jobProg.stages.corpus.status !== "done" && !opts.force) {
    console.log(`[${job.id}] extract waiting — corpus not done`);
    return "noop";
  }

  const slug = jobProg.slug ?? job.id;
  store.setJobSlug(job.id, slug);

  if (opts.dryRun) {
    console.log(`[${job.id}] dry-run extract → data/documents/${slug}.json`);
    return "noop";
  }

  const now = new Date().toISOString();
  store.setStage(job.id, "extract", {
    status: "running",
    startedAt: now,
    error: null,
  });
  await store.saveAndLog({ id: job.id, stage: "extract", status: "running" });

  try {
    const chunks = await loadChunks(slug);
    if (chunks.length === 0) {
      throw new Error("No corpus chunks — run corpus stage first");
    }

    let structureNote = "";
    if (existsSync(corpusStructurePath(slug))) {
      const structure = corpusStructureSchema.parse(
        JSON.parse(await readFile(corpusStructurePath(slug), "utf-8"))
      );
      structureNote = `Document scope: ${structure.document_scope}
Title: ${structure.document_title_normalized}
Jurisdiction: ${structure.jurisdiction_name} (${structure.jurisdiction_level}, ${structure.state_code})
Topics: ${structure.topics_present.join(", ")}
`;
    }

    const selected = selectChunksForExtract(chunks);
    const corpusText = selected
      .map(
        (c) =>
          `### ${c.chunk_id} | ${c.section_title} | pages ${c.page_start}-${c.page_end}\n${c.text.slice(0, 4000)}`
      )
      .join("\n\n");

    await pipelineDelay();
    const { data, model, runId } = await cursorJsonPrompt({
      name: `extract-${job.id}`,
      schema: extractionSchema,
      retries: 2,
      prompt: `Extract structured stormwater design criteria from the corpus excerpts.
Only report values explicitly present in the text. Leave missing fields null/empty and list them in fields_not_found.
Every populated field must have a corresponding evidence entry with a short verbatim excerpt and page_or_section (use chunk page range if needed).

Hints:
- queue id: ${job.id}
- jurisdiction hint: ${job.jurisdictionHint}
- level hint: ${job.levelHint}
${job.agencyHint ? `- agency hint: ${job.agencyHint}` : ""}
${job.scopeHint ? `- scope hint: ${job.scopeHint}` : ""}
${structureNote}

Schema fields:
document_metadata: jurisdiction_name, jurisdiction_level (state|county|municipality|special_district|tribal|federal|other), state_code (2-letter or null; null for federal), document_title, version_or_edition, adoption_or_effective_date, last_revised_date, relationship_to_state_manual, issuing_agency_category (dot|dep_deq|dnr|other|null — set for statewide DOT/DEP/DEQ/DNR manuals; other for FHWA/federal; null for typical city/county)
design_criteria: design_storm_return_periods_years (number[]), water_quality_volume_method, peak_flow_calculation_method (string[]), required_hydrologic_hydraulic_software (string[]), approved_bmp_categories (string[])
evidence: [{ field, excerpt, page_or_section }]
extraction_quality: confidence (high|medium|low), needs_human_review, review_notes, fields_not_found

Corpus excerpts:
${corpusText}`,
    });

    const saved = await saveDocument({
      extraction: data,
      documentUrl: job.pdfUrl,
      landingPageUrl: job.landingPageUrl,
      originalFilename: `${job.id}.pdf`,
      preferredSlug: slug,
      overwrite: opts.force,
    });

    store.setJobSlug(job.id, saved.slug);
    store.setStage(job.id, "extract", {
      status: "done",
      completedAt: new Date().toISOString(),
      error: null,
      meta: {
        model,
        runId,
        slug: saved.slug,
        confidence: saved.data.extraction_quality.confidence,
        path: `${DOCUMENTS_DIR}/${saved.slug}.json`,
      },
    });
    await store.saveAndLog({
      id: job.id,
      stage: "extract",
      status: "done",
      slug: saved.slug,
      model,
      runId,
    });
    console.log(
      `[${job.id}] extract DONE → ${saved.slug} (${saved.data.extraction_quality.confidence})`
    );
    return "done";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setStage(job.id, "extract", {
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      id: job.id,
      stage: "extract",
      status: "failed",
      detail: message,
    });
    console.error(`[${job.id}] extract failed: ${message}`);
    return "failed";
  }
}
