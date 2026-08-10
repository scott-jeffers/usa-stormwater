/**
 * National outline synthesis from all corpus structure.json files.
 */
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  CORPUS_DIR,
  NATIONAL_DIR,
  OUTLINE_PATH,
} from "../../lib/pipeline/paths";
import type { PipelineProgressStore } from "../../lib/pipeline/progress";
import {
  corpusStructureSchema,
  nationalOutlineSchema,
  type CorpusStructure,
} from "../../lib/pipeline/types";
import { cursorJsonPrompt } from "../lib/cursorLlm";
import { pipelineDelay } from "./shared";

async function loadAllStructures(): Promise<
  Array<{ slug: string; structure: CorpusStructure }>
> {
  if (!existsSync(CORPUS_DIR)) return [];
  const dirs = await readdir(CORPUS_DIR, { withFileTypes: true });
  const out: Array<{ slug: string; structure: CorpusStructure }> = [];
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const p = path.join(CORPUS_DIR, d.name, "structure.json");
    if (!existsSync(p)) continue;
    try {
      const structure = corpusStructureSchema.parse(
        JSON.parse(await readFile(p, "utf-8"))
      );
      out.push({ slug: d.name, structure });
    } catch {
      // skip invalid
    }
  }
  return out;
}

function summarizeTopicCounts(
  items: Array<{ slug: string; structure: CorpusStructure }>
): string {
  const counts = new Map<string, number>();
  const tocTitles = new Map<string, number>();
  for (const { structure } of items) {
    for (const t of structure.topics_present) {
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    for (const entry of structure.toc.slice(0, 30)) {
      const key = entry.title.toLowerCase().replace(/\s+/g, " ").trim();
      if (key.length < 4) continue;
      tocTitles.set(key, (tocTitles.get(key) ?? 0) + 1);
    }
  }
  const topicLines = [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 40)
    .map(([k, n]) => `${k}: ${n}`)
    .join("\n");
  const tocLines = [...tocTitles.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 60)
    .map(([k, n]) => `${n}× ${k}`)
    .join("\n");
  return `Topic tag counts:\n${topicLines}\n\nCommon TOC titles:\n${tocLines}`;
}

export async function runOutlineStage(
  store: PipelineProgressStore,
  opts: { force: boolean; dryRun: boolean }
): Promise<"done" | "noop" | "failed"> {
  const current = store.snapshot.outline;
  if (!opts.force && current.status === "done" && existsSync(OUTLINE_PATH)) {
    return "noop";
  }

  const structures = await loadAllStructures();
  if (structures.length === 0) {
    console.log("outline: no corpus structures yet — run corpus first");
    return "noop";
  }

  if (opts.dryRun) {
    console.log(`dry-run outline from ${structures.length} manuals → ${OUTLINE_PATH}`);
    return "noop";
  }

  store.setOutline({
    status: "running",
    startedAt: new Date().toISOString(),
    error: null,
  });
  await store.saveAndLog({
    stage: "outline",
    status: "running",
    manuals: structures.length,
  });

  try {
    const sampleManuals = structures
      .slice(0, 40)
      .map(({ slug, structure }) => {
        const toc = structure.toc
          .slice(0, 12)
          .map((t) => `  - ${t.title}`)
          .join("\n");
        return `- ${slug} [${structure.document_scope}] ${structure.document_title_normalized}\n  topics: ${structure.topics_present.join(", ")}\n${toc}`;
      })
      .join("\n");

    const stats = summarizeTopicCounts(structures);

    await pipelineDelay();
    const { data, model, runId } = await cursorJsonPrompt({
      name: "national-outline",
      schema: nationalOutlineSchema.omit({ generated_at: true, model: true }),
      retries: 2,
      prompt: `You are drafting the outline for a proposed national U.S. stormwater design manual (ASCE committee strawman).

Synthesize a chapter/section tree from practice across ${structures.length} jurisdiction manuals.

Return JSON:
{
  "version": 1,
  "title": "...",
  "sections": [
    {
      "id": "hydrology.design-storms",
      "title": "Design Storms",
      "level": 1 or 2 or 3,
      "parent_id": null or parent section id,
      "prevalence": 0-1 estimate of how often this topic appears,
      "topic_tags": [],
      "source_manual_count": number or null,
      "regional_notes": ["arid_west", ...],
      "summary": "1-2 sentences"
    }
  ]
}

Use kebab-case ids with dotted hierarchy. Cover hydrology, water quality, BMPs, construction ESC, detention/peak control, O&M, regional considerations. Note where practice diverges regionally.

${stats}

Sample manuals:
${sampleManuals}`,
    });

    const outline = nationalOutlineSchema.parse({
      ...data,
      generated_at: new Date().toISOString(),
      model,
    });

    await mkdir(NATIONAL_DIR, { recursive: true });
    await writeFile(OUTLINE_PATH, JSON.stringify(outline, null, 2) + "\n", "utf-8");

    // Seed draft section progress entries
    for (const section of outline.sections) {
      const existing = store.snapshot.draft.sections[section.id];
      if (!existing || opts.force) {
        store.setDraftSection(section.id, {
          status: "pending",
          error: null,
          meta: { title: section.title },
        });
      }
    }

    store.setOutline({
      status: "done",
      completedAt: new Date().toISOString(),
      error: null,
      meta: {
        model,
        runId,
        section_count: outline.sections.length,
        manuals: structures.length,
      },
    });
    await store.saveAndLog({
      stage: "outline",
      status: "done",
      sections: outline.sections.length,
      model,
      runId,
    });
    console.log(
      `outline DONE — ${outline.sections.length} sections from ${structures.length} manuals`
    );
    return "done";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setOutline({
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      stage: "outline",
      status: "failed",
      detail: message,
    });
    console.error(`outline failed: ${message}`);
    return "failed";
  }
}
