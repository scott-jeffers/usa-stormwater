/**
 * Curate citations for all national draft sections (core + remaining).
 * Scores existing citations, drops noise/proxies/dupes, fills from corpus.
 *
 *   npx tsx scripts/national/curate-citations.ts
 *   npx tsx scripts/national/curate-citations.ts --dry-run
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clearManualsCache, getAllManuals } from "../../lib/data";
import {
  getTierASlugSet,
  isChapterProxy,
  tierACitationBoost,
} from "../../lib/national/tierA";
import { CORPUS_DIR, DRAFT_DIR } from "../../lib/pipeline/paths";
import {
  corpusChunkSchema,
  draftSectionSchema,
  type CorpusChunk,
  type DraftSection,
} from "../../lib/pipeline/types";
import {
  KEYWORD_BY_SECTION,
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

const REMAINING = [
  "applicability",
  "channel-flood",
  "channel-flood.release",
  "construction-esc",
  "om",
  "regional",
  "submittals",
] as const;

const ALL_SECTIONS = [...CORE, ...REMAINING] as const;

const dryRun = process.argv.includes("--dry-run");

const TOC_NOISE =
  /\d+-\d+\s+\d+\.\d|table of contents|contents\s+\d|chapter \d+\s+[A-Z]/i;
const PURPOSE_ONLY =
  /purpose of (this|the) (manual|document|chapter|section)/i;

function scoreExisting(
  excerpt: string,
  slug: string,
  sectionId: string
): number {
  let score = 0;
  if (isNoisy(excerpt)) score -= 50;
  if (TOC_NOISE.test(excerpt)) score -= 40;
  if (PURPOSE_ONLY.test(excerpt) && sectionId !== "intro") score -= 20;
  if (isChapterProxy(slug)) score -= 15;
  score += tierACitationBoost(slug) * 5;
  const patterns = KEYWORD_BY_SECTION[sectionId] ?? [];
  for (const p of patterns) {
    if (p.test(excerpt)) score += 8;
  }
  if (/stormwater|drainage|runoff|design storm|bmp|wqv|hydrolog/i.test(excerpt))
    score += 5;
  if (excerpt.length < 60) score -= 10;
  return score;
}

function loadChunksForSlugs(
  slugs: Set<string>
): Array<{ slug: string; chunk: CorpusChunk }> {
  const out: Array<{ slug: string; chunk: CorpusChunk }> = [];
  if (!existsSync(CORPUS_DIR)) return out;
  for (const slug of slugs) {
    const p = path.join(CORPUS_DIR, slug, "chunks.jsonl");
    if (!existsSync(p)) continue;
    const text = readFileSync(p, "utf-8");
    for (const line of text.split(/\r?\n/).filter(Boolean)) {
      try {
        out.push({ slug, chunk: corpusChunkSchema.parse(JSON.parse(line)) });
      } catch {
        // skip
      }
    }
  }
  return out;
}

clearManualsCache();
const manuals = getAllManuals();
const stateBySlug = new Map(
  manuals.map((m) => [m.slug, m.data.document_metadata.state_code] as const)
);
const tierA = getTierASlugSet();

// Prefetch Tier A corpus for refill (avoid loading all 298)
const allChunks = loadChunksForSlugs(tierA);
console.log(`Loaded ${allChunks.length} Tier A corpus chunks`);

function topicTagsFor(sectionId: string): string[] {
  if (sectionId.startsWith("hydrology") || sectionId.startsWith("channel-flood"))
    return ["hydrology"];
  if (sectionId.startsWith("water-quality")) return ["water_quality"];
  if (sectionId.startsWith("bmp")) return ["bmp_sizing"];
  if (sectionId === "construction-esc") return ["erosion_sediment"];
  if (sectionId === "om") return ["operation_maintenance"];
  if (sectionId === "regional") return ["regional"];
  if (sectionId === "submittals") return ["submittals"];
  if (sectionId === "applicability") return ["applicability", "general"];
  return ["general"];
}

for (const sectionId of ALL_SECTIONS) {
  const filePath = path.join(DRAFT_DIR, `${sectionId}.json`);
  if (!existsSync(filePath)) {
    console.warn(`missing ${sectionId}`);
    continue;
  }
  const draft = draftSectionSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8"))
  );

  const kept: DraftSection["citations"] = [];
  const seen = new Set<string>();
  const slugCounts = new Map<string, number>();
  const states = new Set<string>();

  const ranked = [...draft.citations]
    .map((c) => ({
      c,
      score: scoreExisting(c.excerpt, c.slug, sectionId),
    }))
    .sort((a, b) => b.score - a.score);

  const dropped: string[] = [];
  for (const { c, score } of ranked) {
    if (kept.length >= 14) break;
    if (score < 0) {
      dropped.push(`${c.slug} (score ${score})`);
      continue;
    }
    const key = c.excerpt.toLowerCase().slice(0, 100);
    if (seen.has(key)) {
      dropped.push(`${c.slug} (dupe)`);
      continue;
    }
    const n = slugCounts.get(c.slug) ?? 0;
    if (n >= 2) {
      dropped.push(`${c.slug} (per-slug cap)`);
      continue;
    }
    // Prefer dropping chapter proxies when we already have enough
    if (isChapterProxy(c.slug) && kept.length >= 6) {
      dropped.push(`${c.slug} (proxy)`);
      continue;
    }
    seen.add(key);
    slugCounts.set(c.slug, n + 1);
    const st = stateBySlug.get(c.slug);
    if (st) states.add(st);
    kept.push(c);
  }

  // Refill if thin or too few states
  if (kept.length < 8 || states.size < 6) {
    const fakeSection = {
      id: sectionId,
      title: draft.title,
      level: 1,
      parent_id: null,
      prevalence: null,
      topic_tags: topicTagsFor(sectionId),
      source_manual_count: null,
      regional_notes: [] as string[],
      summary: null,
    };
    const candidates = retrieveScoredChunks(fakeSection, allChunks, 80);
    const picked = pickCitations({
      section: fakeSection,
      candidates: candidates as RetrievedChunk[],
      maxTotal: 14,
      maxPerSlug: 2,
      minStates: 8,
    });
    for (const p of picked) {
      if (kept.length >= 14) break;
      const key = p.excerpt.toLowerCase().slice(0, 100);
      if (seen.has(key)) continue;
      if (isChapterProxy(p.slug) && kept.length >= 8) continue;
      const n = slugCounts.get(p.slug) ?? 0;
      if (n >= 2) continue;
      seen.add(key);
      slugCounts.set(p.slug, n + 1);
      if (p.state_code) states.add(p.state_code);
      kept.push({
        slug: p.slug,
        chunk_id: p.chunk_id,
        page_or_section: p.page_or_section,
        excerpt: p.excerpt,
      });
    }
  }

  const supporting = [...new Set(kept.map((c) => c.slug))];
  console.log(
    `${sectionId}: ${draft.citations.length} → ${kept.length} citations, ${states.size} states; dropped ${dropped.length}`
  );
  if (dropped.length && dryRun) {
    console.log(`  drop sample: ${dropped.slice(0, 5).join("; ")}`);
  }

  if (!dryRun) {
    const next: DraftSection = {
      ...draft,
      generated_at: new Date().toISOString(),
      citations: kept,
      supporting_slugs: supporting,
    };
    writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  }
}

console.log(dryRun ? "Dry run complete" : "Citation curation written");
