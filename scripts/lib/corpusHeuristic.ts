/**
 * Offline / no-API corpus helpers — TOC-ish structure + keyword tagging.
 * Used when CURSOR_API_KEY is absent or PIPELINE_LLM=heuristic.
 */
import type {
  CorpusChunk,
  CorpusStructure,
  DocumentScope,
} from "../../lib/pipeline/types";
import type { CorpusPage, CorpusPagesFile } from "./corpusPages";

const TOPIC_KEYWORDS: Array<{ tag: string; patterns: RegExp[] }> = [
  { tag: "hydrology", patterns: [/hydrolog/i, /design storm/i, /rainfall/i, /runoff/i, /hydrograph/i] },
  { tag: "water_quality", patterns: [/water quality/i, /\bwqv\b/i, /treatment volume/i, /pollutant/i, /tss/i] },
  { tag: "peak_flow", patterns: [/peak flow/i, /peak discharge/i, /rational method/i, /tr-?\s*55/i] },
  { tag: "detention", patterns: [/detention/i, /retention/i, /release rate/i, /storage volume/i] },
  { tag: "bmp_sizing", patterns: [/bioretention/i, /rain garden/i, /swale/i, /permeable/i, /\bbmp\b/i] },
  { tag: "construction_esc", patterns: [/erosion/i, /sediment control/i, /construction/i, /\besc\b/i] },
  { tag: "om", patterns: [/operation and maintenance/i, /\bo\s*&\s*m\b/i, /inspection/i, /maintenance/i] },
  { tag: "software", patterns: [/hec-ras/i, /swmm/i, /hydrocad/i, /modeling software/i] },
];

const REQUIREMENT_KEYWORDS: Array<{ type: string; patterns: RegExp[] }> = [
  { type: "design_storm", patterns: [/design storm/i, /\d+-year/i, /return period/i] },
  { type: "wqv", patterns: [/water quality volume/i, /\bwqv\b/i, /treatment volume/i, /first flush/i] },
  { type: "peak_flow", patterns: [/peak flow/i, /peak discharge/i, /rational/i] },
  { type: "bmp_list", patterns: [/approved.*bmp/i, /best management practice/i, /stormwater control measure/i] },
  { type: "software", patterns: [/shall use/i, /required.*software/i, /hec-/i, /swmm/i] },
  { type: "release_rate", patterns: [/release rate/i, /allowable discharge/i, /pre-development/i] },
];

function looksLikeHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 4 || t.length > 120) return false;
  if (/^--- page \d+ ---$/.test(t)) return false;
  if (/^page\s+\d+/i.test(t)) return false;
  // Table-of-contents dotted leaders are not real section starts
  if (/\.{4,}/.test(t) || /_{4,}/.test(t)) return false;
  if (/intentionally left blank/i.test(t)) return false;

  if (/^(chapter|appendix|section|part)\s+[\dA-Z]/i.test(t)) {
    return true;
  }
  if (/^\d+(\.\d+)+\s+[A-Z]/.test(t) && !/\.{3,}/.test(t)) return true;
  if (/^[A-Z][A-Z0-9\s\-&,.:/()]{8,}$/.test(t) && t === t.toUpperCase()) {
    const letters = t.replace(/[^A-Z]/g, "");
    return letters.length >= 6 && !/DECEMBER|JANUARY|FEBRUARY|MARCH|APRIL|MAY|JUNE|JULY|AUGUST|SEPTEMBER|OCTOBER|NOVEMBER/i.test(t);
  }
  return false;
}

function isStrongHeading(line: string): boolean {
  const t = line.trim();
  // Real headings only: "Chapter 1. Title" / "Appendix A. Title"
  // (avoid body cross-refs like "Chapter 5 for drainage...")
  if (/^Chapter\s+\d+\.\s+[A-Z]/.test(t) && t.length < 100) return true;
  if (/^Appendix\s+[A-Z]\.\s+\S/.test(t) && t.length < 100) return true;
  if (/^Appendix\s+[A-Z]\s+[A-Z]/.test(t) && t.length < 100) return true;
  return false;
}



function slugifyId(title: string, index: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
  return base || `sec-${index}`;
}

function inferScope(text: string): DocumentScope {
  const lower = text.toLowerCase();
  if (/chapter\s+\d+/i.test(text) && /handbook|manual/i.test(text) && text.length < 200_000) {
    // weak signal — chapter-only docs often say "Chapter N" on every page
  }
  if (/\besc\b|erosion.*(and|&)\s*sediment|construction stormwater/i.test(lower) &&
      !/post-construction|permanent bmp/i.test(lower)) {
    return "esc_construction_only";
  }
  if (/bmp catalog|bmp manual|fact sheet/i.test(lower) && !/hydrologic analysis/i.test(lower)) {
    return "bmp_catalog_only";
  }
  if (/hydrolog(y|ic)/i.test(lower) && !/water quality volume|post-construction/i.test(lower)) {
    return "hydrology_only";
  }
  if (/\bvolume\s+\d+\b/i.test(lower) || /\bvol\.\s*\d+\b/i.test(lower)) {
    return "volume_only";
  }
  if (/\bchapter\s+\d+\b/i.test(lower) && !/table of contents/i.test(lower.slice(0, 5000))) {
    // many full manuals still say chapter — prefer full_manual unless "chapter only" vibe
  }
  return "full_manual";
}

function inferTopics(text: string): string[] {
  const tags: string[] = [];
  for (const { tag, patterns } of TOPIC_KEYWORDS) {
    if (patterns.some((p) => p.test(text))) tags.push(tag);
  }
  return tags.length ? tags : ["general"];
}

export function buildHeuristicStructure(opts: {
  pages: CorpusPagesFile;
  jurisdictionHint: string;
  levelHint: string;
}): CorpusStructure {
  const samplePages = opts.pages.pages.slice(0, 20);
  const headText = samplePages.map((p) => p.text).join("\n");
  const allTextSample = opts.pages.pages
    .filter((_, i) => i < 30 || i % 20 === 0)
    .map((p) => p.text)
    .join("\n")
    .slice(0, 200_000);

  const toc: CorpusStructure["toc"] = [];
  const seenTitles = new Set<string>();
  let lastStrongTitle: string | null = null;

  // Prefer Chapter/Appendix first-occurrence headings; fall back to other headings
  const strongPass: Array<{ page: number; title: string }> = [];
  for (const page of opts.pages.pages) {
    const lines = page.text.split(/\n/).map((l) => l.trim()).filter(Boolean).slice(0, 30);
    for (const line of lines) {
      if (!isStrongHeading(line)) continue;
      const title = line.replace(/\s+/g, " ").trim();
      // Running headers repeat every page — keep first occurrence only
      if (title === lastStrongTitle) continue;
      lastStrongTitle = title;
      if (seenTitles.has(title.toLowerCase())) continue;
      seenTitles.add(title.toLowerCase());
      strongPass.push({ page: page.page, title });
      break;
    }
  }

  if (strongPass.length >= 2) {
    for (let i = 0; i < strongPass.length; i++) {
      const cur = strongPass[i];
      const next = strongPass[i + 1];
      toc.push({
        id: slugifyId(cur.title, i + 1),
        title: cur.title,
        level: 1,
        page_start: cur.page,
        page_end: next ? Math.max(cur.page, next.page - 1) : opts.pages.total_pages,
      });
    }
  } else {
    for (const page of opts.pages.pages) {
      const lines = page.text.split(/\n/).slice(0, 40);
      for (const line of lines) {
        if (!looksLikeHeading(line)) continue;
        const title = line.trim().replace(/\s+/g, " ");
        if (seenTitles.has(title.toLowerCase())) continue;
        seenTitles.add(title.toLowerCase());
        if (toc.length >= 80) break;
        toc.push({
          id: slugifyId(title, toc.length + 1),
          title,
          level: /^(chapter|appendix|part)\b/i.test(title)
            ? 1
            : /^\d+\.\d+/.test(title)
              ? 2
              : 1,
          page_start: page.page,
          page_end: null,
        });
      }
      if (toc.length >= 80) break;
    }

    for (let i = 0; i < toc.length; i++) {
      toc[i].page_end =
        i + 1 < toc.length
          ? Math.max(toc[i].page_start, toc[i + 1].page_start - 1)
          : opts.pages.total_pages;
    }
  }

  if (toc.length === 0) {
    toc.push({
      id: "body",
      title: opts.jurisdictionHint || "Document body",
      level: 1,
      page_start: 1,
      page_end: opts.pages.total_pages,
    });
  }

  const level = (["state", "county", "municipality", "special_district", "tribal", "other"] as const).includes(
    opts.levelHint as CorpusStructure["jurisdiction_level"]
  )
    ? (opts.levelHint as CorpusStructure["jurisdiction_level"])
    : "municipality";

  const stateMatch = headText.match(/\b([A-Z]{2})\b/);
  const stateFromHint = opts.jurisdictionHint.match(/,\s*([A-Z]{2})\b/);
  const state_code =
    stateFromHint?.[1] ??
    (/\bOregon\b/i.test(headText) ? "OR" : null) ??
    (stateMatch && ["OR", "WA", "CA", "TX", "NY", "FL"].includes(stateMatch[1])
      ? stateMatch[1]
      : null);

  const titleLine =
    headText
      .split(/\n/)
      .map((l) => l.trim().replace(/(.)\1{0}/g, "$1"))
      .map((l) => l.replace(/([A-Za-z])\1{2,}/g, "$1$1")) // mild de-dupe of doubled OCR
      .find((l) => /stormwater|manual|handbook|guidebook|bmp/i.test(l) && l.length < 100 && !/\.{3,}/.test(l)) ??
    `${opts.jurisdictionHint} Stormwater Manual`;

  // Prefer a clean known pattern if doubled PDF text
  const cleanTitle = titleLine
    .replace(/(\b\w+\b)\1/gi, "$1")
    .replace(/\s+/g, " ")
    .trim();

  const quality_flags: string[] = ["heuristic_structure"];
  if (opts.pages.char_count < 5000) quality_flags.push("short_text");
  if (opts.pages.pages.filter((p) => p.char_count < 40).length > opts.pages.total_pages * 0.3) {
    quality_flags.push("possible_scanned_pages");
  }

  return {
    document_scope: inferScope(allTextSample),
    document_title_normalized: cleanTitle || titleLine.replace(/\s+/g, " ").trim(),
    jurisdiction_name: opts.jurisdictionHint,
    jurisdiction_level: level,
    state_code,
    topics_present: inferTopics(allTextSample),
    toc,
    quality_flags,
    model: "heuristic",
    generated_at: new Date().toISOString(),
  };
}

export function tagChunkHeuristic(chunk: CorpusChunk): CorpusChunk {
  const hay = `${chunk.section_title}\n${chunk.text.slice(0, 4000)}`;
  const topic_tags = inferTopics(hay);
  const requirement_types: string[] = [];
  for (const { type, patterns } of REQUIREMENT_KEYWORDS) {
    if (patterns.some((p) => p.test(hay))) requirement_types.push(type);
  }
  const contains_requirements =
    requirement_types.length > 0 ||
    /\bshall\b|\bmust\b|\brequired\b|\bminimum\b/i.test(hay);

  const firstSentence = chunk.text
    .replace(/^--- page \d+ ---\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);

  return {
    ...chunk,
    summary: firstSentence || chunk.section_title,
    topic_tags,
    contains_requirements,
    requirement_types,
  };
}

export function tagChunksHeuristic(chunks: CorpusChunk[]): CorpusChunk[] {
  return chunks.map(tagChunkHeuristic);
}

/** True when pipeline should skip Cursor SDK and use heuristics. */
export function useHeuristicLlm(): boolean {
  const mode = (process.env.PIPELINE_LLM ?? "").trim().toLowerCase();
  if (mode === "heuristic" || mode === "offline" || mode === "local") return true;
  if (mode === "cursor" || mode === "sdk") return false;
  const key = process.env.CURSOR_API_KEY?.trim();
  return !key;
}
