/**
 * Corpus stage: pages → structure (AI) → chunks (AI/heuristic) → tagging (AI) → manifest
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { z } from "zod";
import {
  corpusChunksPath,
  corpusDirFor,
  corpusManifestPath,
  corpusPagesPath,
  corpusStructurePath,
} from "../../lib/pipeline/paths";
import type { PipelineProgressStore } from "../../lib/pipeline/progress";
import {
  CORPUS_SUBSTEPS,
  corpusChunkSchema,
  corpusManifestSchema,
  corpusStructureSchema,
  type CorpusChunk,
  type CorpusStructure,
  type ManifestJob,
} from "../../lib/pipeline/types";
import {
  loadCorpusPages,
  pagesTextSlice,
  samplePagesForStructure,
  writeCorpusPages,
  type CorpusPagesFile,
} from "../lib/corpusPages";
import { cursorJsonPrompt } from "../lib/cursorLlm";
import {
  buildHeuristicStructure,
  tagChunksHeuristic,
  useHeuristicLlm,
} from "../lib/corpusHeuristic";
import { loadEnvLocal } from "../lib/loadEnv";
import { ensureJobPdf } from "./prepareStage";
import { pipelineDelay } from "./shared";

const structureAiSchema = corpusStructureSchema.omit({
  model: true,
  generated_at: true,
});

const chunkPlanSchema = z.object({
  chunks: z.array(
    z.object({
      chunk_id: z.string(),
      section_id: z.string(),
      section_title: z.string(),
      page_start: z.number().int().min(1),
      page_end: z.number().int().min(1),
    })
  ),
});

const tagBatchSchema = z.object({
  tags: z.array(
    z.object({
      chunk_id: z.string(),
      summary: z.string().nullable(),
      topic_tags: z.array(z.string()),
      contains_requirements: z.boolean(),
      requirement_types: z.array(z.string()),
    })
  ),
});

async function loadChunks(slug: string): Promise<CorpusChunk[]> {
  const p = corpusChunksPath(slug);
  if (!existsSync(p)) return [];
  const text = await readFile(p, "utf-8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => corpusChunkSchema.parse(JSON.parse(line)));
}

async function writeChunks(slug: string, chunks: CorpusChunk[]): Promise<void> {
  await mkdir(corpusDirFor(slug), { recursive: true });
  const body = chunks.map((c) => JSON.stringify(c)).join("\n") + (chunks.length ? "\n" : "");
  await writeFile(corpusChunksPath(slug), body, "utf-8");
}

function heuristicChunks(pages: CorpusPagesFile, structure: CorpusStructure): CorpusChunk[] {
  const chunks: CorpusChunk[] = [];
  const toc = structure.toc.length
    ? structure.toc
    : [
        {
          id: "body",
          title: structure.document_title_normalized || "Document",
          level: 1,
          page_start: 1,
          page_end: pages.total_pages,
        },
      ];

  const TARGET = 3500;
  let counter = 0;

  for (const entry of toc) {
    const start = entry.page_start;
    const end = entry.page_end ?? pages.total_pages;
    let cursor = start;
    while (cursor <= end) {
      let pageEnd = cursor;
      let chars = 0;
      while (pageEnd <= end) {
        const page = pages.pages.find((p) => p.page === pageEnd);
        const nextChars = chars + (page?.char_count ?? 0);
        if (chars > 0 && nextChars > TARGET) break;
        chars = nextChars;
        pageEnd += 1;
      }
      const last = Math.max(cursor, pageEnd - 1);
      const text = pagesTextSlice(pages.pages, cursor, last).trim();
      if (text.length > 40) {
        counter += 1;
        chunks.push({
          chunk_id: `${pages.slug}-c${String(counter).padStart(4, "0")}`,
          section_id: entry.id,
          section_title: entry.title,
          page_start: cursor,
          page_end: last,
          text,
          summary: null,
          topic_tags: [],
          contains_requirements: false,
          requirement_types: [],
          char_count: text.length,
        });
      }
      cursor = last + 1;
    }
  }
  return chunks;
}

async function runSubstepPages(
  store: PipelineProgressStore,
  job: ManifestJob,
  slug: string,
  force: boolean
): Promise<void> {
  const status = store.ensureJob(job.id).stages.corpus.substeps?.pages;
  if (!force && status === "done" && existsSync(corpusPagesPath(slug))) return;

  store.setCorpusSubstep(job.id, "pages", "running");
  await store.save();

  const pdfPath = await ensureJobPdf(job);
  const file = await writeCorpusPages({
    slug,
    queueId: job.id,
    pdfPath,
  });
  store.setCorpusSubstep(job.id, "pages", "done");
  store.setStage(job.id, "corpus", {
    status: "running",
    meta: { pages: file.total_pages, chars: file.char_count },
  });
  await store.saveAndLog({
    id: job.id,
    stage: "corpus",
    substep: "pages",
    status: "done",
    pages: file.total_pages,
  });
  console.log(`[${job.id}] pages: ${file.total_pages} pages, ${file.char_count.toLocaleString()} chars`);
}

async function runSubstepStructure(
  store: PipelineProgressStore,
  job: ManifestJob,
  slug: string,
  force: boolean
): Promise<CorpusStructure> {
  const status = store.ensureJob(job.id).stages.corpus.substeps?.structure;
  if (!force && status === "done" && existsSync(corpusStructurePath(slug))) {
    return corpusStructureSchema.parse(
      JSON.parse(await readFile(corpusStructurePath(slug), "utf-8"))
    );
  }

  store.setCorpusSubstep(job.id, "structure", "running");
  await store.save();

  const pages = await loadCorpusPages(slug);
  if (!pages) throw new Error("pages.json missing");

  loadEnvLocal();
  let structure: CorpusStructure;

  if (useHeuristicLlm()) {
    console.log(`[${job.id}] structure: heuristic (no Cursor API key)`);
    structure = buildHeuristicStructure({
      pages,
      jurisdictionHint: job.jurisdictionHint,
      levelHint: job.levelHint,
    });
  } else {
    const sample = samplePagesForStructure(pages.pages);
    await pipelineDelay();

    const { data, model } = await cursorJsonPrompt({
      name: `corpus-structure-${job.id}`,
      schema: structureAiSchema,
      prompt: `You are structuring a U.S. stormwater design manual for a research corpus.

Queue id: ${job.id}
Jurisdiction hint: ${job.jurisdictionHint}
Level hint: ${job.levelHint}
Total pages: ${pages.total_pages}

From the page samples below, produce JSON with:
- document_scope: one of full_manual | chapter_only | volume_only | esc_construction_only | bmp_catalog_only | hydrology_only | other
- document_title_normalized
- jurisdiction_name, jurisdiction_level, state_code (2-letter or null)
- topics_present: short topic tags (e.g. hydrology, water_quality, bmp_sizing, construction_esc, detention, om)
- toc: array of { id, title, level, page_start, page_end } covering major sections (estimate page_end from next section or total pages)
- quality_flags: e.g. scanned_pages, missing_toc, chapter_only, truncated_sample

Page samples:
${sample}`,
    });

    structure = {
      ...data,
      model,
      generated_at: new Date().toISOString(),
    };
  }

  await mkdir(corpusDirFor(slug), { recursive: true });
  await writeFile(
    corpusStructurePath(slug),
    JSON.stringify(structure, null, 2) + "\n",
    "utf-8"
  );
  store.setCorpusSubstep(job.id, "structure", "done");
  await store.saveAndLog({
    id: job.id,
    stage: "corpus",
    substep: "structure",
    status: "done",
    scope: structure.document_scope,
  });
  console.log(`[${job.id}] structure: ${structure.document_scope}, ${structure.toc.length} TOC entries`);
  return structure;
}

async function runSubstepChunks(
  store: PipelineProgressStore,
  job: ManifestJob,
  slug: string,
  structure: CorpusStructure,
  force: boolean
): Promise<CorpusChunk[]> {
  const status = store.ensureJob(job.id).stages.corpus.substeps?.chunks;
  if (!force && status === "done" && existsSync(corpusChunksPath(slug))) {
    return loadChunks(slug);
  }

  store.setCorpusSubstep(job.id, "chunks", "running");
  await store.save();

  const pages = await loadCorpusPages(slug);
  if (!pages) throw new Error("pages.json missing");

  let chunks: CorpusChunk[] = [];
  loadEnvLocal();
  if (useHeuristicLlm()) {
    console.log(`[${job.id}] chunks: heuristic`);
    chunks = heuristicChunks(pages, structure);
  } else {
    try {
      await pipelineDelay();
      const tocSummary = structure.toc
        .slice(0, 80)
        .map(
          (t) =>
            `${t.id}: ${t.title} (p.${t.page_start}-${t.page_end ?? pages.total_pages})`
        )
        .join("\n");

      const { data } = await cursorJsonPrompt({
        name: `corpus-chunks-${job.id}`,
        schema: chunkPlanSchema,
        prompt: `Plan text chunks for retrieval from this stormwater manual.
Slug: ${slug}
Total pages: ${pages.total_pages}

TOC:
${tocSummary}

Return JSON { "chunks": [ { chunk_id, section_id, section_title, page_start, page_end } ] }.
Rules:
- Cover the whole document without large gaps
- Prefer ~2–8 pages per chunk (more for sparse pages)
- chunk_id like "${slug}-c0001"
- Use TOC section ids/titles when possible
- Do not include full text — page ranges only`,
      });

      chunks = data.chunks
        .map((c) => {
          const text = pagesTextSlice(pages.pages, c.page_start, c.page_end).trim();
          return {
            ...c,
            text,
            summary: null,
            topic_tags: [],
            contains_requirements: false,
            requirement_types: [],
            char_count: text.length,
          };
        })
        .filter((c) => c.char_count > 40);
    } catch (error) {
      console.warn(
        `[${job.id}] AI chunk plan failed, using heuristic:`,
        error instanceof Error ? error.message : error
      );
      chunks = heuristicChunks(pages, structure);
    }
  }

  if (chunks.length === 0) {
    chunks = heuristicChunks(pages, structure);
  }

  await writeChunks(slug, chunks);
  store.setCorpusSubstep(job.id, "chunks", "done");
  await store.saveAndLog({
    id: job.id,
    stage: "corpus",
    substep: "chunks",
    status: "done",
    count: chunks.length,
  });
  console.log(`[${job.id}] chunks: ${chunks.length}`);
  return chunks;
}

async function runSubstepTagging(
  store: PipelineProgressStore,
  job: ManifestJob,
  slug: string,
  chunks: CorpusChunk[],
  force: boolean
): Promise<CorpusChunk[]> {
  const status = store.ensureJob(job.id).stages.corpus.substeps?.tagging;
  if (
    !force &&
    status === "done" &&
    chunks.length > 0 &&
    chunks.every((c) => c.summary !== null || c.topic_tags.length > 0)
  ) {
    return chunks;
  }

  // Resume: if partially tagged, only tag untagged
  store.setCorpusSubstep(job.id, "tagging", "running");
  await store.save();

  loadEnvLocal();
  let updated = [...chunks];

  if (useHeuristicLlm()) {
    console.log(`[${job.id}] tagging: heuristic`);
    updated = tagChunksHeuristic(updated);
    await writeChunks(slug, updated);
  } else {
    const BATCH = 8;
    for (let i = 0; i < updated.length; i += BATCH) {
      const batch = updated.slice(i, i + BATCH);
      const needs = batch.filter(
        (c) => c.summary === null && c.topic_tags.length === 0
      );
      if (needs.length === 0) continue;

      await pipelineDelay();
      try {
        const { data } = await cursorJsonPrompt({
          name: `corpus-tag-${job.id}-${i}`,
          schema: tagBatchSchema,
          prompt: `Tag stormwater manual chunks for retrieval.

For each chunk return: chunk_id, summary (1-2 sentences), topic_tags (short), contains_requirements (bool), requirement_types (e.g. design_storm, wqv, bmp_list, peak_flow, software, release_rate).

Chunks:
${needs
  .map(
    (c) =>
      `### ${c.chunk_id} (${c.section_title}, p.${c.page_start}-${c.page_end})\n${c.text.slice(0, 2500)}`
  )
  .join("\n\n")}`,
        });

        const byId = new Map(data.tags.map((t) => [t.chunk_id, t]));
        for (let j = 0; j < updated.length; j++) {
          const tag = byId.get(updated[j].chunk_id);
          if (!tag) continue;
          updated[j] = {
            ...updated[j],
            summary: tag.summary,
            topic_tags: tag.topic_tags,
            contains_requirements: tag.contains_requirements,
            requirement_types: tag.requirement_types,
          };
        }
        await writeChunks(slug, updated);
        console.log(
          `[${job.id}] tagging: ${Math.min(i + BATCH, updated.length)}/${updated.length}`
        );
      } catch (error) {
        console.warn(
          `[${job.id}] tagging batch failed, falling back to heuristic for batch:`,
          error instanceof Error ? error.message : error
        );
        for (let j = 0; j < updated.length; j++) {
          if (updated[j].summary === null && updated[j].topic_tags.length === 0) {
            updated[j] = tagChunksHeuristic([updated[j]])[0];
          }
        }
        await writeChunks(slug, updated);
      }
    }
  }

  store.setCorpusSubstep(job.id, "tagging", "done");
  await store.saveAndLog({
    id: job.id,
    stage: "corpus",
    substep: "tagging",
    status: "done",
  });
  return updated;
}

async function runSubstepManifest(
  store: PipelineProgressStore,
  job: ManifestJob,
  slug: string,
  structure: CorpusStructure,
  chunks: CorpusChunk[],
  force: boolean
): Promise<void> {
  const status = store.ensureJob(job.id).stages.corpus.substeps?.manifest;
  if (!force && status === "done" && existsSync(corpusManifestPath(slug))) return;

  store.setCorpusSubstep(job.id, "manifest", "running");
  await store.save();

  const pages = await loadCorpusPages(slug);
  const manifest = corpusManifestSchema.parse({
    slug,
    queue_id: job.id,
    total_pages: pages?.total_pages ?? 0,
    total_chunks: chunks.length,
    char_count: pages?.char_count ?? 0,
    structure,
    generated_at: new Date().toISOString(),
    pipeline_version: 1,
  });
  await writeFile(
    corpusManifestPath(slug),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  );
  store.setCorpusSubstep(job.id, "manifest", "done");
  store.setStage(job.id, "corpus", {
    status: "done",
    completedAt: new Date().toISOString(),
    error: null,
    meta: {
      chunks: chunks.length,
      pages: manifest.total_pages,
      scope: structure.document_scope,
    },
  });
  await store.saveAndLog({
    id: job.id,
    stage: "corpus",
    substep: "manifest",
    status: "done",
  });
  console.log(`[${job.id}] corpus DONE`);
}

export async function runCorpusStage(
  store: PipelineProgressStore,
  job: ManifestJob,
  opts: { force: boolean; dryRun: boolean }
): Promise<"done" | "skipped" | "failed" | "noop"> {
  const prepare = store.ensureJob(job.id).stages.prepare;
  if (prepare.status === "skipped") {
    store.setStage(job.id, "corpus", {
      status: "skipped",
      error: "prepare_skipped",
      completedAt: new Date().toISOString(),
    });
    await store.save();
    return "skipped";
  }
  if (prepare.status !== "done") {
    console.log(`[${job.id}] corpus skipped — prepare not done`);
    return "noop";
  }

  const current = store.ensureJob(job.id).stages.corpus;
  if (!opts.force && current.status === "done") return "noop";
  if (!opts.force && current.status === "skipped") return "skipped";

  const slug = store.ensureJob(job.id).slug ?? job.id;
  store.setJobSlug(job.id, slug);

  if (opts.dryRun) {
    console.log(`[${job.id}] dry-run corpus → data/corpus/${slug}/`);
    return "noop";
  }

  if (opts.force) {
    for (const s of CORPUS_SUBSTEPS) {
      store.setCorpusSubstep(job.id, s, "pending");
    }
  }

  store.setStage(job.id, "corpus", {
    status: "running",
    startedAt: new Date().toISOString(),
    error: null,
  });
  await store.saveAndLog({ id: job.id, stage: "corpus", status: "running" });

  try {
    await runSubstepPages(store, job, slug, opts.force);
    const structure = await runSubstepStructure(store, job, slug, opts.force);
    let chunks = await runSubstepChunks(store, job, slug, structure, opts.force);
    chunks = await runSubstepTagging(store, job, slug, chunks, opts.force);
    await runSubstepManifest(store, job, slug, structure, chunks, opts.force);
    return "done";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const subs = store.ensureJob(job.id).stages.corpus.substeps ?? {};
    for (const [key, st] of Object.entries(subs)) {
      if (st === "running") {
        store.setCorpusSubstep(
          job.id,
          key as (typeof CORPUS_SUBSTEPS)[number],
          "failed",
          message
        );
      }
    }
    store.setStage(job.id, "corpus", {
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      id: job.id,
      stage: "corpus",
      status: "failed",
      detail: message,
    });
    console.error(`[${job.id}] corpus failed: ${message}`);
    return "failed";
  }
}
