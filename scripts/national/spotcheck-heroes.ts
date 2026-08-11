/**
 * Spot-check top hero citations for core national draft sections.
 * Re-verifies excerpts against corpus chunks; auto-replaces failed heroes
 * when Tier A candidates are available; writes data/national/HERO_CITATIONS.md
 *
 *   npx tsx scripts/national/spotcheck-heroes.ts
 *   npx tsx scripts/national/spotcheck-heroes.ts --dry-run
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clearManualsCache } from "../../lib/data";
import { clearNationalCache } from "../../lib/national";
import {
  getTierASlugSet,
  isChapterProxy,
} from "../../lib/national/tierA";
import {
  CORPUS_DIR,
  DRAFT_DIR,
  NATIONAL_DIR,
} from "../../lib/pipeline/paths";
import {
  corpusChunkSchema,
  draftSectionSchema,
  type CorpusChunk,
  type DraftSection,
} from "../../lib/pipeline/types";
import {
  isNoisy,
  pickCitations,
  retrieveScoredChunks,
  type RetrievedChunk,
} from "../lib/citationPicker";

const CORE = [
  "intro",
  "hydrology",
  "hydrology.design-storms",
  "hydrology.methods",
  "hydrology.software",
  "water-quality",
  "water-quality.sizing",
  "bmps",
  "bmps.selection",
  "bmps.sizing",
  "bmps.manufactured",
] as const;

const TOP_N = 5;
const dryRun = process.argv.includes("--dry-run");

const TOC_NOISE =
  /\d+-\d+\s+\d+\.\d|table of contents|contents\s+\d|chapter \d+\s+[A-Z]/i;

type Flag = {
  slug: string;
  reason: string;
  excerpt: string;
};

function normalize(s: string): string {
  return s.replace(/\s+/g, " ").trim().toLowerCase();
}

function loadChunks(slug: string): CorpusChunk[] {
  const p = path.join(CORPUS_DIR, slug, "chunks.jsonl");
  if (!existsSync(p)) return [];
  const out: CorpusChunk[] = [];
  for (const line of readFileSync(p, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    try {
      out.push(corpusChunkSchema.parse(JSON.parse(line)));
    } catch {
      /* skip */
    }
  }
  return out;
}

function excerptInCorpus(excerpt: string, chunks: CorpusChunk[]): boolean {
  const needle = normalize(excerpt).slice(0, 80);
  if (needle.length < 24) return false;
  for (const c of chunks) {
    const hay = normalize(c.text);
    if (hay.includes(needle)) return true;
    // Allow soft match on first 40 chars if whitespace differed in export
    if (needle.length >= 40 && hay.includes(needle.slice(0, 40))) return true;
  }
  return false;
}

function flagHero(excerpt: string, slug: string, chunks: CorpusChunk[]): string | null {
  if (isNoisy(excerpt)) return "noisy";
  if (TOC_NOISE.test(excerpt)) return "toc-like";
  if (excerpt.length < 50) return "too-short";
  if (chunks.length === 0) return "no-corpus";
  if (!excerptInCorpus(excerpt, chunks)) return "excerpt-not-in-corpus";
  if (isChapterProxy(slug)) return "chapter-proxy";
  return null;
}

clearManualsCache();
clearNationalCache();

const tierA = getTierASlugSet();

// Prefetch Tier A chunks for replacement
const tierAChunks: Array<{ slug: string; chunk: CorpusChunk }> = [];
for (const slug of tierA) {
  for (const chunk of loadChunks(slug)) {
    tierAChunks.push({ slug, chunk });
  }
}

const reportLines: string[] = [
  "# Hero citation spot-check",
  "",
  `Generated: ${new Date().toISOString()}`,
  "",
  "For each core section, the top 5 citations were re-checked against corpus chunks.",
  "Failed heroes were auto-replaced from Tier A candidates when possible.",
  "",
];

let totalFlags = 0;
let totalFixed = 0;

for (const sectionId of CORE) {
  const filePath = path.join(DRAFT_DIR, `${sectionId}.json`);
  if (!existsSync(filePath)) {
    reportLines.push(`## ${sectionId}`, "", "_Missing draft file._", "");
    continue;
  }
  const draft = draftSectionSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8"))
  );
  const heroes = draft.citations.slice(0, TOP_N);
  const flags: Flag[] = [];
  const replacements: DraftSection["citations"] = [];

  for (const c of heroes) {
    const chunks = loadChunks(c.slug);
    const reason = flagHero(c.excerpt, c.slug, chunks);
    if (reason) {
      flags.push({ slug: c.slug, reason, excerpt: c.excerpt.slice(0, 120) });
      totalFlags += 1;
    } else {
      replacements.push(c);
    }
  }

  // Auto-replace failed slots
  if (flags.length > 0) {
    const fakeSection = {
      id: sectionId,
      title: draft.title,
      level: 1,
      parent_id: null,
      prevalence: null,
      topic_tags: sectionId.startsWith("hydrology")
        ? ["hydrology"]
        : sectionId.startsWith("water-quality")
          ? ["water_quality"]
          : sectionId.startsWith("bmp")
            ? ["bmp_sizing"]
            : ["general"],
      source_manual_count: null,
      regional_notes: [] as string[],
      summary: null,
    };
    const candidates = retrieveScoredChunks(fakeSection, tierAChunks, 80);
    const picked = pickCitations({
      section: fakeSection,
      candidates: candidates as RetrievedChunk[],
      maxTotal: TOP_N + 4,
      maxPerSlug: 1,
      minStates: 4,
    });
    const usedKeys = new Set(
      replacements.map((c) => c.excerpt.toLowerCase().slice(0, 100))
    );
    const usedSlugs = new Set(replacements.map((c) => c.slug));
    for (const p of picked) {
      if (replacements.length >= TOP_N) break;
      const key = p.excerpt.toLowerCase().slice(0, 100);
      if (usedKeys.has(key) || usedSlugs.has(p.slug)) continue;
      if (isChapterProxy(p.slug)) continue;
      const chunks = loadChunks(p.slug);
      if (flagHero(p.excerpt, p.slug, chunks)) continue;
      usedKeys.add(key);
      usedSlugs.add(p.slug);
      replacements.push({
        slug: p.slug,
        chunk_id: p.chunk_id,
        page_or_section: p.page_or_section,
        excerpt: p.excerpt,
      });
      totalFixed += 1;
    }
  }

  // Rebuild citations: new heroes + rest of original (deduped)
  const rest = draft.citations.slice(TOP_N);
  const seen = new Set(
    replacements.map((c) => c.excerpt.toLowerCase().slice(0, 100))
  );
  const nextCitations = [...replacements];
  for (const c of rest) {
    const key = c.excerpt.toLowerCase().slice(0, 100);
    if (seen.has(key)) continue;
    seen.add(key);
    nextCitations.push(c);
  }

  reportLines.push(`## ${sectionId} — ${draft.title}`, "");
  if (flags.length === 0) {
    reportLines.push("All top-5 heroes passed corpus re-match.", "");
  } else {
    reportLines.push(`Flagged ${flags.length} of top ${TOP_N}:`, "");
    for (const f of flags) {
      reportLines.push(
        `- **${f.slug}** (${f.reason}): “${f.excerpt.replace(/\s+/g, " ").trim()}…”`
      );
    }
    reportLines.push(
      "",
      `After auto-replace: ${replacements.length}/${TOP_N} clean hero slots.`,
      ""
    );
  }

  if (!dryRun && flags.length > 0) {
    const next: DraftSection = {
      ...draft,
      generated_at: new Date().toISOString(),
      citations: nextCitations,
      supporting_slugs: [...new Set(nextCitations.map((c) => c.slug))],
    };
    writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  }
}

reportLines.push(
  "## Summary",
  "",
  `- Flags: ${totalFlags}`,
  `- Auto-replaced: ${totalFixed}`,
  `- Mode: ${dryRun ? "dry-run (no writes)" : "wrote draft JSON + this report"}`,
  ""
);

const reportPath = path.join(NATIONAL_DIR, "HERO_CITATIONS.md");
writeFileSync(reportPath, reportLines.join("\n"), "utf-8");
console.log(`Wrote ${reportPath}`);
console.log(`Flags: ${totalFlags}; auto-replaced: ${totalFixed}`);
