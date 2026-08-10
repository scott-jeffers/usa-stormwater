/**
 * Draft national manual sections from outline + corpus chunks (resumable).
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  CORPUS_DIR,
  DRAFT_DIR,
  OUTLINE_PATH,
  draftSectionPath,
} from "../../lib/pipeline/paths";
import type { PipelineProgressStore } from "../../lib/pipeline/progress";
import {
  corpusChunkSchema,
  draftSectionSchema,
  nationalOutlineSchema,
  type CorpusChunk,
  type NationalOutline,
} from "../../lib/pipeline/types";
import { cursorJsonPrompt } from "../lib/cursorLlm";
import { pipelineDelay } from "./shared";

async function loadOutline(): Promise<NationalOutline | null> {
  if (!existsSync(OUTLINE_PATH)) return null;
  return nationalOutlineSchema.parse(
    JSON.parse(await readFile(OUTLINE_PATH, "utf-8"))
  );
}

async function loadAllChunks(): Promise<
  Array<{ slug: string; chunk: CorpusChunk }>
> {
  if (!existsSync(CORPUS_DIR)) return [];
  const dirs = await readdir(CORPUS_DIR, { withFileTypes: true });
  const out: Array<{ slug: string; chunk: CorpusChunk }> = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const p = path.join(CORPUS_DIR, d.name, "chunks.jsonl");
    if (!existsSync(p)) continue;
    const text = await readFile(p, "utf-8");
    for (const line of text.split(/\r?\n/).filter(Boolean)) {
      try {
        out.push({
          slug: d.name,
          chunk: corpusChunkSchema.parse(JSON.parse(line)),
        });
      } catch {
        // skip
      }
    }
  }
  return out;
}

function retrieveForSection(
  section: NationalOutline["sections"][number],
  all: Array<{ slug: string; chunk: CorpusChunk }>,
  maxChunks = 18
): Array<{ slug: string; chunk: CorpusChunk }> {
  const tags = new Set(section.topic_tags.map((t) => t.toLowerCase()));
  const titleWords = section.title
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);

  const scored = all.map((item) => {
    let score = 0;
    const hay = (
      item.chunk.topic_tags.join(" ") +
      " " +
      (item.chunk.summary ?? "") +
      " " +
      item.chunk.section_title +
      " " +
      item.chunk.requirement_types.join(" ")
    ).toLowerCase();
    for (const t of tags) {
      if (hay.includes(t) || item.chunk.topic_tags.some((x) => x.toLowerCase() === t))
        score += 3;
    }
    for (const w of titleWords) {
      if (hay.includes(w) || item.chunk.text.toLowerCase().includes(w)) score += 1;
    }
    if (item.chunk.contains_requirements) score += 1;
    return { ...item, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxChunks);
}

export async function runDraftStage(
  store: PipelineProgressStore,
  opts: { force: boolean; dryRun: boolean; sectionIds?: string[] }
): Promise<{ done: number; failed: number; noop: number }> {
  const outline = await loadOutline();
  if (!outline) {
    console.log("draft: no outline.json — run outline stage first");
    return { done: 0, failed: 0, noop: 0 };
  }

  // Ensure progress entries exist
  for (const section of outline.sections) {
    if (!store.snapshot.draft.sections[section.id]) {
      store.setDraftSection(section.id, {
        status: "pending",
        meta: { title: section.title },
      });
    }
  }
  await store.save();

  const allChunks = await loadAllChunks();
  let done = 0;
  let failed = 0;
  let noop = 0;

  const sections = outline.sections.filter((s) => {
    if (opts.sectionIds?.length) return opts.sectionIds.includes(s.id);
    return true;
  });

  for (const section of sections) {
    const status = store.snapshot.draft.sections[section.id]?.status ?? "pending";
    if (!opts.force && status === "done" && existsSync(draftSectionPath(section.id))) {
      noop += 1;
      continue;
    }

    if (opts.dryRun) {
      console.log(`dry-run draft → ${section.id}`);
      noop += 1;
      continue;
    }

    store.setDraftSection(section.id, {
      status: "running",
      startedAt: new Date().toISOString(),
      error: null,
    });
    await store.saveAndLog({
      stage: "draft",
      section_id: section.id,
      status: "running",
    });

    try {
      const retrieved = retrieveForSection(section, allChunks);
      const evidenceBlock =
        retrieved.length === 0
          ? "(No matching corpus chunks — draft from outline context only; note uncertainty.)"
          : retrieved
              .map(
                ({ slug, chunk }) =>
                  `### ${slug} / ${chunk.chunk_id} (p.${chunk.page_start}-${chunk.page_end})\n${chunk.summary ?? ""}\n${chunk.text.slice(0, 1800)}`
              )
              .join("\n\n");

      await pipelineDelay();
      const { data, model, runId } = await cursorJsonPrompt({
        name: `draft-${section.id}`,
        schema: draftSectionSchema.omit({
          generated_at: true,
          model: true,
          section_id: true,
          title: true,
        }),
        retries: 2,
        prompt: `Draft one section of a proposed national U.S. stormwater design manual (committee strawman).

Section id: ${section.id}
Title: ${section.title}
Outline summary: ${section.summary ?? ""}
Regional notes: ${(section.regional_notes ?? []).join(", ")}

Return JSON with:
- practice_survey: what jurisdictions commonly do (cite patterns; do not invent numbers you cannot support)
- draft_recommendation: proposed national language (clearly labeled as draft recommendation)
- regional_variants: string or null
- open_issues: string or null
- citations: [{ slug, chunk_id, page_or_section, excerpt }] — use real slugs/chunk_ids from evidence when possible
- supporting_slugs: string[]

Separate survey voice from recommendation voice. Prefer evidence from the excerpts.

Evidence excerpts:
${evidenceBlock}`,
      });

      const draft = draftSectionSchema.parse({
        ...data,
        section_id: section.id,
        title: section.title,
        generated_at: new Date().toISOString(),
        model,
      });

      await mkdir(DRAFT_DIR, { recursive: true });
      await writeFile(
        draftSectionPath(section.id),
        JSON.stringify(draft, null, 2) + "\n",
        "utf-8"
      );

      store.setDraftSection(section.id, {
        status: "done",
        completedAt: new Date().toISOString(),
        error: null,
        meta: {
          model,
          runId,
          citations: draft.citations.length,
          supporting: draft.supporting_slugs.length,
        },
      });
      await store.saveAndLog({
        stage: "draft",
        section_id: section.id,
        status: "done",
        model,
        runId,
      });
      console.log(`[draft] ${section.id} DONE`);
      done += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      store.setDraftSection(section.id, {
        status: "failed",
        error: message,
        completedAt: new Date().toISOString(),
      });
      await store.saveAndLog({
        stage: "draft",
        section_id: section.id,
        status: "failed",
        detail: message,
      });
      console.error(`[draft] ${section.id} failed: ${message}`);
      failed += 1;
    }
  }

  return { done, failed, noop };
}
