/**
 * Citation picker for national draft sections — Tier A weighted,
 * state-stratified, noise-filtered.
 */
import { getAllManuals } from "../../lib/data";
import {
  getTierASlugSet,
  isChapterProxy,
  tierACitationBoost,
} from "../../lib/national/tierA";
import type {
  CorpusChunk,
  NationalOutline,
} from "../../lib/pipeline/types";

export type RetrievedChunk = {
  slug: string;
  chunk: CorpusChunk;
  score: number;
};

export type PickedCitation = {
  slug: string;
  chunk_id: string | null;
  page_or_section: string | null;
  excerpt: string;
  state_code: string | null;
  score: number;
};

const NOISE_PATTERNS: RegExp[] = [
  /traffic impact analysis/i,
  /\bTIA\b/,
  /subdivision (plat|street)/i,
  /historic preservation/i,
  /transfer of (development )?rights/i,
  /development bonus program/i,
  /zoning and development code/i,
  /thoroughfare system/i,
  /parking lot drive aisles/i,
  /floodproofing techniques/i,
];

const STORMWATER_CONTEXT: RegExp[] = [
  /stormwater/i,
  /drainage/i,
  /\bbmp\b/i,
  /\bscm\b/i,
  /runoff/i,
  /detention/i,
  /retention/i,
  /infiltration/i,
  /water quality/i,
  /hydrolog/i,
  /design storm/i,
  /ms4/i,
  /erosion/i,
  /sediment/i,
];

const KEYWORD_BY_SECTION: Record<string, RegExp[]> = {
  intro: [/purpose of this manual/i, /scope/i, /how to use/i, /applicability/i],
  applicability: [
    /applicab/i,
    /new development/i,
    /redevelopment/i,
    /threshold/i,
    /permit/i,
  ],
  hydrology: [/design storm/i, /return period/i, /hydrolog/i, /\d+[-\s]?year/i],
  "hydrology.design-storms": [
    /design storm/i,
    /\d+[-\s]?year/i,
    /return period/i,
    /24[-\s]?hour/i,
    /rainfall/i,
  ],
  "hydrology.methods": [
    /rational/i,
    /nrcs|tr-?55|scs/i,
    /curve number/i,
    /peak flow/i,
    /hydrograph/i,
  ],
  "hydrology.software": [
    /hec-?hms/i,
    /hec-?ras/i,
    /swmm/i,
    /hydrocad/i,
    /approved software/i,
  ],
  "water-quality": [
    /water quality volume/i,
    /\bwqv\b/i,
    /treatment volume/i,
    /first (flush|inch)/i,
  ],
  "water-quality.sizing": [
    /water quality volume/i,
    /\bwqv\b/i,
    /treatment volume/i,
    /first (flush|inch)/i,
    /90\s*%/i,
  ],
  "channel-flood": [/channel protection/i, /flood control/i, /overbank/i],
  "channel-flood.release": [/release rate/i, /peak rate/i, /post.?development/i],
  bmps: [/best management/i, /\bbmp\b/i, /\bscm\b/i, /bioretention/i],
  "bmps.selection": [/bmp selection/i, /treatment train/i, /suitability/i],
  "bmps.sizing": [/sizing/i, /drawdown/i, /underdrain/i, /surface area/i],
  "bmps.manufactured": [
    /manufactured/i,
    /proprietary/i,
    /hydrodynamic/i,
    /mtds/i,
  ],
  "construction-esc": [/erosion/i, /sediment control/i, /\be&s\b/i, /esc\b/i],
  om: [/operation and maintenance/i, /\bo&m\b/i, /inspection/i],
  regional: [/regional/i, /arid/i, /cold climate/i, /coastal/i],
  submittals: [/submittal/i, /plan review/i, /checklist/i, /as-built/i],
};

function excerptFromChunk(chunk: CorpusChunk, patterns: RegExp[]): string {
  const text = chunk.text
    .replace(/^--- page \d+ ---\s*/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
  for (const p of patterns) {
    const m = text.match(p);
    if (!m || m.index == null) continue;
    const start = Math.max(0, m.index - 80);
    const end = Math.min(text.length, m.index + m[0].length + 160);
    return text.slice(start, end).trim();
  }
  const summary = (chunk.summary ?? "").trim();
  if (summary.length > 40) return summary.slice(0, 280);
  return text.slice(0, 280);
}

function isNoisy(text: string): boolean {
  if (NOISE_PATTERNS.some((p) => p.test(text))) {
    // Allow if strong stormwater context also present
    const stormHits = STORMWATER_CONTEXT.filter((p) => p.test(text)).length;
    if (stormHits < 2) return true;
  }
  // Generic "purpose" without stormwater
  if (
    /purpose of (this|the) (chapter|section|ordinance)/i.test(text) &&
    !STORMWATER_CONTEXT.some((p) => p.test(text))
  ) {
    return true;
  }
  return false;
}

function scoreChunk(
  section: NationalOutline["sections"][number],
  item: { slug: string; chunk: CorpusChunk },
  reviewBySlug: Map<string, boolean>
): number {
  const tags = new Set(section.topic_tags.map((t) => t.toLowerCase()));
  const titleWords = section.title
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 3);
  const patterns = KEYWORD_BY_SECTION[section.id] ?? [];

  const hay = (
    item.chunk.topic_tags.join(" ") +
    " " +
    (item.chunk.summary ?? "") +
    " " +
    item.chunk.section_title +
    " " +
    item.chunk.requirement_types.join(" ")
  ).toLowerCase();

  const body = item.chunk.text;
  if (isNoisy(body) || isNoisy(hay)) return -100;

  let score = 0;
  for (const t of tags) {
    if (
      hay.includes(t) ||
      item.chunk.topic_tags.some((x) => x.toLowerCase() === t)
    ) {
      score += 4;
    }
  }
  for (const w of titleWords) {
    if (hay.includes(w)) score += 1;
    if (body.toLowerCase().includes(w)) score += 0.5;
  }
  for (const p of patterns) {
    if (p.test(hay) || p.test(body)) score += 3;
  }
  if (item.chunk.contains_requirements) score += 2;
  if (item.chunk.requirement_types.length) score += 1;

  score += tierACitationBoost(item.slug);
  if (isChapterProxy(item.slug)) score -= 2;
  if (reviewBySlug.get(item.slug)) score -= 1.5;

  return score;
}

/**
 * Score and retrieve candidate chunks for a section (pre-diversify).
 */
export function retrieveScoredChunks(
  section: NationalOutline["sections"][number],
  all: Array<{ slug: string; chunk: CorpusChunk }>,
  maxCandidates = 120
): RetrievedChunk[] {
  const manuals = getAllManuals();
  const reviewBySlug = new Map(
    manuals.map((m) => [
      m.slug,
      m.data.extraction_quality.needs_human_review,
    ] as const)
  );

  const scored = all.map((item) => ({
    ...item,
    score: scoreChunk(section, item, reviewBySlug),
  }));

  return scored
    .filter((s) => s.score > 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxCandidates);
}

/**
 * Diversify with state stratification and Tier A preference.
 */
export function pickCitations(opts: {
  section: NationalOutline["sections"][number];
  candidates: RetrievedChunk[];
  maxTotal?: number;
  maxPerSlug?: number;
  minStates?: number;
}): PickedCitation[] {
  const maxTotal = opts.maxTotal ?? 22;
  const maxPerSlug = opts.maxPerSlug ?? 2;
  const minStates = opts.minStates ?? 8;
  const patterns =
    KEYWORD_BY_SECTION[opts.section.id] ??
    opts.section.title
      .split(/\W+/)
      .filter((w) => w.length > 4)
      .map((w) => new RegExp(w, "i"));

  const manuals = getAllManuals();
  const stateBySlug = new Map(
    manuals.map((m) => [m.slug, m.data.document_metadata.state_code] as const)
  );
  const tierA = getTierASlugSet();

  const slugCounts = new Map<string, number>();
  const stateCounts = new Map<string, number>();
  const seenExcerpts = new Set<string>();
  const out: PickedCitation[] = [];

  const tryAdd = (item: RetrievedChunk, forceState = false): boolean => {
    const n = slugCounts.get(item.slug) ?? 0;
    if (n >= maxPerSlug) return false;
    const state = stateBySlug.get(item.slug) ?? "??";
    if (forceState && (stateCounts.get(state) ?? 0) > 0) return false;

    const excerpt = excerptFromChunk(item.chunk, patterns);
    const key = excerpt.toLowerCase().slice(0, 120);
    if (seenExcerpts.has(key)) return false;
    if (isNoisy(excerpt)) return false;

    seenExcerpts.add(key);
    slugCounts.set(item.slug, n + 1);
    stateCounts.set(state, (stateCounts.get(state) ?? 0) + 1);
    out.push({
      slug: item.slug,
      chunk_id: item.chunk.chunk_id,
      page_or_section: `pages ${item.chunk.page_start}-${item.chunk.page_end}`,
      excerpt,
      state_code: state === "??" ? null : state,
      score: item.score,
    });
    return true;
  };

  // Pass 1: Tier A only
  for (const item of opts.candidates) {
    if (out.length >= maxTotal) break;
    if (!tierA.has(item.slug)) continue;
    tryAdd(item);
  }

  // Pass 2: fill new states from remaining
  if (stateCounts.size < minStates) {
    for (const item of opts.candidates) {
      if (out.length >= maxTotal) break;
      if (stateCounts.size >= minStates) break;
      const state = stateBySlug.get(item.slug) ?? "??";
      if ((stateCounts.get(state) ?? 0) > 0) continue;
      tryAdd(item, true);
    }
  }

  // Pass 3: fill remaining slots
  for (const item of opts.candidates) {
    if (out.length >= maxTotal) break;
    tryAdd(item);
  }

  return out;
}

export { KEYWORD_BY_SECTION, excerptFromChunk, isNoisy };
