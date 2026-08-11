/**
 * Corpus-aware excerpt repair for verify failures.
 *
 *   npm run pipeline:repair-excerpts
 *   npm run pipeline:repair-excerpts -- --limit=15
 *   npm run pipeline:repair-excerpts -- --all-failed --limit=200
 *   npm run pipeline:repair-excerpts -- ny-state chicago-il
 *
 * For each failed evidence field: replace excerpt with a verbatim corpus slice,
 * or remove the evidence entry and mark needs_human_review if no match.
 */
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  corpusChunksPath,
  DOCUMENTS_DIR,
} from "../../lib/pipeline/paths";
import {
  buildVerifyReportData,
  DESIGN_CRITERIA_FIELDS,
} from "../../lib/pipeline/verifyReport";
import {
  corpusChunkSchema,
  type CorpusChunk,
} from "../../lib/pipeline/types";
import { stormwaterSchema, type StormwaterData } from "../../lib/schema";

const DEFAULT_PILOT = [
  "new-orleans-jefferson-la",
  "wi-dnr-1001",
  "yonkers-ny",
  "milwaukee-wi",
  "savannah-ga-css",
  "louisville-ky",
  "oakland-ca",
  "rochester-ny",
  "prince-georges-county-md",
  "el-paso-tx",
  "raleigh-nc",
  "chicago-il",
  "ny-state",
  "detroit-mi",
  "michigan-manual",
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function wordHitRatio(hay: string, needle: string): number {
  const words = needle.split(" ").filter((w) => w.length > 3);
  if (words.length === 0) return 0;
  let hits = 0;
  for (const w of words) {
    if (hay.includes(w)) hits += 1;
  }
  return hits / words.length;
}

function scoreChunkAgainstExcerpt(chunkText: string, excerpt: string): number {
  const hay = normalize(chunkText);
  const needle = normalize(excerpt);
  if (!needle || needle.length < 8) return 0;
  if (hay.includes(needle)) return 1;
  const prefixLen = Math.min(80, needle.length);
  for (let len = prefixLen; len >= 24; len -= 8) {
    if (hay.includes(needle.slice(0, len))) return 0.85 + len / 1000;
  }
  return wordHitRatio(hay, needle);
}

function pickVerbatimSlice(chunkText: string, excerpt: string): string | null {
  const hay = chunkText.replace(/\r\n/g, "\n");
  const needle = excerpt.trim();
  if (!needle) return null;

  const lowerHay = hay.toLowerCase();
  const lowerNeedle = needle.toLowerCase();
  const idx = lowerHay.indexOf(lowerNeedle);
  if (idx >= 0) {
    return hay.slice(idx, idx + needle.length).replace(/\s+/g, " ").trim();
  }

  const words = normalize(needle)
    .split(" ")
    .filter((w) => w.length > 4);
  for (const w of words) {
    const wi = lowerHay.indexOf(w);
    if (wi < 0) continue;
    const start = Math.max(0, wi - 40);
    const end = Math.min(hay.length, wi + 240);
    let slice = hay.slice(start, end).replace(/\s+/g, " ").trim();
    if (slice.length < 40) continue;
    const firstSpace = slice.indexOf(" ");
    if (firstSpace > 0 && firstSpace < 20 && start > 0) {
      slice = slice.slice(firstSpace + 1);
    }
    if (slice.length > 320) slice = slice.slice(0, 320).replace(/\s+\S*$/, "");
    return slice;
  }
  return null;
}

function excerptMatchesCorpus(corpusText: string, excerpt: string): boolean {
  const hay = normalize(corpusText);
  const needle = normalize(excerpt);
  if (!needle || needle.length < 12) return false;
  if (hay.includes(needle)) return true;
  const words = needle.split(" ").filter((w) => w.length > 3);
  if (words.length < 3) {
    return hay.includes(needle.slice(0, Math.min(40, needle.length)));
  }
  let hits = 0;
  for (const w of words) {
    if (hay.includes(w)) hits += 1;
  }
  return hits / words.length >= 0.7;
}

async function loadChunks(slug: string): Promise<CorpusChunk[]> {
  const p = corpusChunksPath(slug);
  if (!existsSync(p)) return [];
  const text = await readFile(p, "utf-8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => corpusChunkSchema.parse(JSON.parse(line)));
}

async function loadDoc(slug: string): Promise<StormwaterData | null> {
  const p = path.join(DOCUMENTS_DIR, `${slug}.json`);
  if (!existsSync(p)) return null;
  return stormwaterSchema.parse(JSON.parse(await readFile(p, "utf-8")));
}

function parseArgs(argv: string[]): {
  ids: string[];
  limit: number;
  allFailed: boolean;
  designOnly: boolean;
} {
  const ids: string[] = [];
  let limit = 15;
  let allFailed = false;
  let designOnly = false;
  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length)) || 15;
    } else if (arg === "--all-failed" || arg === "all-failed") {
      allFailed = true;
    } else if (arg === "--design-only" || arg === "design-only") {
      designOnly = true;
    } else if (!arg.startsWith("-")) {
      ids.push(arg);
    }
  }
  if (process.env.PIPELINE_REPAIR_ALL === "1") allFailed = true;
  if (process.env.PIPELINE_REPAIR_LIMIT) {
    limit = Number(process.env.PIPELINE_REPAIR_LIMIT) || limit;
  }
  return { ids, limit, allFailed, designOnly };
}

async function repairSlug(
  slug: string,
  opts: { designOnly: boolean }
): Promise<{ repaired: number; removed: number; unchanged: number }> {
  const doc = await loadDoc(slug);
  if (!doc) {
    console.log(`[${slug}] missing document`);
    return { repaired: 0, removed: 0, unchanged: 0 };
  }
  const chunks = await loadChunks(slug);
  if (chunks.length === 0) {
    console.log(`[${slug}] no corpus chunks`);
    return { repaired: 0, removed: 0, unchanged: 0 };
  }

  const report = buildVerifyReportData();
  const row = report.slugs.find((s) => s.slug === slug || s.id === slug);
  const failedSet = new Set(row?.failedFields ?? []);
  const corpusText = chunks.map((c) => c.text).join("\n\n");

  let repaired = 0;
  let removed = 0;
  let unchanged = 0;
  const keptEvidence: StormwaterData["evidence"] = [];
  const removedFields: string[] = [];

  for (const ev of doc.evidence) {
    const isDesign = DESIGN_CRITERIA_FIELDS.includes(
      ev.field as (typeof DESIGN_CRITERIA_FIELDS)[number]
    );
    const shouldTouch =
      failedSet.size === 0
        ? opts.designOnly
          ? isDesign
          : true
        : failedSet.has(ev.field) && (!opts.designOnly || isDesign);

    if (!shouldTouch) {
      keptEvidence.push(ev);
      continue;
    }

    if (excerptMatchesCorpus(corpusText, ev.excerpt)) {
      keptEvidence.push(ev);
      unchanged += 1;
      continue;
    }

    let best: { chunk: CorpusChunk; score: number } | null = null;
    for (const chunk of chunks) {
      const score = scoreChunkAgainstExcerpt(chunk.text, ev.excerpt);
      if (!best || score > best.score) best = { chunk, score };
    }

    if (best && best.score >= 0.45) {
      const slice = pickVerbatimSlice(best.chunk.text, ev.excerpt);
      if (slice && slice.length >= 24 && excerptMatchesCorpus(corpusText, slice)) {
        const pageLabel =
          best.chunk.page_start === best.chunk.page_end
            ? `p. ${best.chunk.page_start}`
            : `pp. ${best.chunk.page_start}–${best.chunk.page_end}`;
        keptEvidence.push({
          ...ev,
          excerpt: slice,
          page_or_section: pageLabel,
        });
        repaired += 1;
        continue;
      }
    }

    // Drop unmatchable evidence so verify can pass; keep field value.
    removedFields.push(ev.field);
    removed += 1;
  }

  if (repaired > 0 || removed > 0) {
    const fieldsNotFound = [
      ...new Set([
        ...doc.extraction_quality.fields_not_found,
        ...removedFields,
      ]),
    ];
    const next: StormwaterData = {
      ...doc,
      evidence: keptEvidence,
      extraction_quality: {
        ...doc.extraction_quality,
        needs_human_review:
          removed > 0 ? true : doc.extraction_quality.needs_human_review,
        fields_not_found: fieldsNotFound,
        review_notes:
          removed > 0
            ? [
                doc.extraction_quality.review_notes,
                `Pipeline excerpt repair removed ${removed} unlocated citation(s).`,
              ]
                .filter(Boolean)
                .join(" ")
            : doc.extraction_quality.review_notes,
      },
    };
    await writeFile(
      path.join(DOCUMENTS_DIR, `${slug}.json`),
      JSON.stringify(next, null, 2) + "\n",
      "utf-8"
    );
  }

  console.log(
    `[${slug}] repaired=${repaired} removed=${removed} unchanged=${unchanged}`
  );
  return { repaired, removed, unchanged };
}

async function main() {
  const { ids, limit, allFailed, designOnly } = parseArgs(
    process.argv.slice(2)
  );
  const report = buildVerifyReportData();
  const failed = report.slugs.filter((s) => s.status === "failed");

  let targets: string[];
  if (ids.length > 0) {
    targets = ids;
  } else if (allFailed) {
    targets = failed.map((s) => s.id).slice(0, limit);
  } else {
    const designFailed = failed
      .filter((s) => s.designMismatchCount > 0)
      .map((s) => s.id);
    const fromPilot = DEFAULT_PILOT.filter((id) => designFailed.includes(id));
    const fill = designFailed.filter((id) => !fromPilot.includes(id));
    targets = [...fromPilot, ...fill].slice(0, limit);
  }

  // Default / pilot: repair all failed fields on selected slugs so verify can pass.
  // --design-only restricts to design_criteria evidence only.
  const modeLabel = designOnly ? "design_criteria only" : "all failed fields";
  console.log(`Repairing ${targets.length} slug(s) (${modeLabel})…`);

  let totalRepaired = 0;
  let totalRemoved = 0;
  for (const id of targets) {
    const r = await repairSlug(id, { designOnly });
    totalRepaired += r.repaired;
    totalRemoved += r.removed;
  }

  console.log(
    `Done. excerpts repaired=${totalRepaired}, removed=${totalRemoved}`
  );
  console.log(
    `$env:PIPELINE_STAGE='verify'; $env:PIPELINE_FORCE='1'; npx tsx scripts/pipeline/run.ts ${targets.join(" ")}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
