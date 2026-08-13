/**
 * Shared helpers for practice parameter enrichment / matrix stats.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  corpusChunksPath,
  DOCUMENTS_DIR,
} from "../pipeline/paths";
import { corpusChunkSchema, type CorpusChunk } from "../pipeline/types";
import {
  type DesignParameters,
  type DesignParametersEnrichment,
  type StormwaterData,
} from "../schema";
import { detectPracticeMentions } from "../ontology/bmp";
import { isChapterProxy } from "../national/tierA";
import { ENRICH_SCHEMA_VERSION } from "./fields";

const PARAM_EVIDENCE_PREFIX = "design_parameters.";

export function loadDocumentJson(slug: string): StormwaterData | null {
  const p = path.join(DOCUMENTS_DIR, `${slug}.json`);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf-8")) as StormwaterData;
  } catch {
    return null;
  }
}

export function loadCorpusChunks(slug: string): CorpusChunk[] {
  const p = corpusChunksPath(slug);
  if (!existsSync(p)) return [];
  const text = readFileSync(p, "utf-8");
  const out: CorpusChunk[] = [];
  for (const line of text.split(/\r?\n/).filter(Boolean)) {
    try {
      out.push(corpusChunkSchema.parse(JSON.parse(line)));
    } catch {
      /* skip */
    }
  }
  return out;
}

export function loadQueueText(slug: string): string | null {
  const candidates = [
    path.resolve(process.cwd(), "samples/queue", `${slug}.txt`),
    path.resolve(process.cwd(), "samples", `${slug}.txt`),
  ];
  for (const p of candidates) {
    if (existsSync(p)) {
      try {
        return readFileSync(p, "utf-8");
      } catch {
        /* skip */
      }
    }
  }
  return null;
}

const ENRICH_KEYWORDS = [
  "bioretention",
  "rain garden",
  "raingarden",
  "media depth",
  "filter media",
  "planting soil",
  "drawdown",
  "dewatering",
  "drain time",
  "water quality volume",
  "wqv",
  "first flush",
  "90th",
  "seasonal high",
  "water table",
  "groundwater",
  "shwt",
  "separation",
  "permeable pavement",
  "porous pavement",
  "infiltration rate",
  "permanent pool",
  "extended detention",
  "wet pond",
  "constructed wetland",
  "swale",
  "green roof",
  "vegetated roof",
  "tape",
  "njcat",
];

function scoreEnrichChunk(chunk: CorpusChunk): number {
  let score = 0;
  if (chunk.contains_requirements) score += 4;
  const hay = (
    chunk.section_title +
    " " +
    chunk.summary +
    " " +
    chunk.topic_tags.join(" ") +
    " " +
    chunk.text.slice(0, 2500)
  ).toLowerCase();
  for (const kw of ENRICH_KEYWORDS) {
    if (hay.includes(kw)) score += 2;
  }
  return score;
}

/** Rank corpus chunks for parameter enrichment; fall back to queue text. */
export function selectEnrichSourceText(
  slug: string,
  maxChars = 70_000
): { text: string; source: "corpus" | "queue_txt" | "atlas_only" } {
  const chunks = loadCorpusChunks(slug);
  if (chunks.length) {
    const ranked = [...chunks].sort(
      (a, b) => scoreEnrichChunk(b) - scoreEnrichChunk(a)
    );
    const selected: CorpusChunk[] = [];
    let chars = 0;
    for (const c of ranked) {
      const bodyLen = Math.min(c.text.length, 3500);
      if (chars + bodyLen > maxChars && selected.length > 0) continue;
      selected.push(c);
      chars += bodyLen;
      if (selected.length >= 22) break;
    }
    if (selected.length) {
      const parts = selected
        .sort((a, b) => a.page_start - b.page_start)
        .map(
          (c) =>
            `### ${c.chunk_id} | ${c.section_title} | pages ${c.page_start}-${c.page_end}\n${c.text.slice(0, 3500)}`
        );
      return {
        text: parts.join("\n\n"),
        source: "corpus",
      };
    }
  }

  const queueTxt = loadQueueText(slug);
  if (queueTxt?.trim()) {
    return {
      text: queueTxt.slice(0, maxChars),
      source: "queue_txt",
    };
  }

  return { text: "", source: "atlas_only" };
}

export function atlasContextBlob(data: StormwaterData): string {
  const dc = data.design_criteria;
  const cats = dc.approved_bmp_categories?.join("; ") ?? "";
  return [
    `Title: ${data.document_metadata.document_title}`,
    `Jurisdiction: ${data.document_metadata.jurisdiction_name} (${data.document_metadata.state_code ?? "?"})`,
    `WQv method: ${dc.water_quality_volume_method ?? "null"}`,
    `Approved BMPs: ${cats || "none"}`,
    `Review notes: ${data.extraction_quality.review_notes ?? "null"}`,
  ].join("\n");
}

function parseFirstNumber(
  re: RegExp,
  text: string
): { value: number; excerpt: string } | null {
  const m = text.match(re);
  if (!m) return null;
  const raw = m[1] ?? m[0];
  const n = Number(String(raw).replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const excerpt = m[0].slice(0, 220).trim();
  return { value: n, excerpt };
}

/**
 * Offline heuristic enrichment from atlas fields + source text.
 * Conservative — only clear numeric patterns; never invents.
 */
export function heuristicEnrichParameters(
  data: StormwaterData,
  sourceText: string
): {
  params: Omit<
    DesignParameters,
    "enriched_at" | "enrich_model"
  >;
  evidence: Array<{
    field: string;
    excerpt: string;
    page_or_section: string | null;
  }>;
} {
  const blob = `${atlasContextBlob(data)}\n${sourceText}`;
  const evidence: Array<{
    field: string;
    excerpt: string;
    page_or_section: string | null;
  }> = [];
  const fields_not_found: string[] = [];

  const wqv =
    parseFirstNumber(
      /(?:wqv|water quality(?: volume)?|first[- ]flush|90th(?:\s+percentile)?)\D{0,40}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?)\b/i,
      blob
    ) ??
    parseFirstNumber(
      /\b(?:P|depth)\s*=\s*(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?)\b/i,
      blob
    );

  const drawdown = parseFirstNumber(
    /(?:drawdown|drain(?:ing|age)? time|dewater(?:ing)?)\D{0,40}?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i,
    blob
  );

  const shwt = parseFirstNumber(
    /(?:seasonal high(?: water)?(?: table)?|SHWT|groundwater|water table)\D{0,60}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?|feet|ft)\b/i,
    blob
  );

  const media = parseFirstNumber(
    /(?:bioretention|rain\s*garden|filter media|planting (?:soil|media)|media depth)\D{0,50}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?)\b/i,
    blob
  );

  let wqv_depth_inches: number | null = null;
  let max_drawdown_hours: number | null = null;
  let shwt_separation_inches: number | null = null;
  let bioretention_media_depth_min_inches: number | null = null;

  if (wqv && wqv.value > 0 && wqv.value <= 6) {
    wqv_depth_inches = wqv.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}wqv_depth_inches`,
      excerpt: wqv.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("wqv_depth_inches");
  }

  if (drawdown && drawdown.value > 0 && drawdown.value <= 168) {
    max_drawdown_hours = drawdown.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}max_drawdown_hours`,
      excerpt: drawdown.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("max_drawdown_hours");
  }

  if (shwt && shwt.value > 0) {
    // Convert feet → inches when unit looks like feet
    let inches = shwt.value;
    if (/feet|ft\b/i.test(shwt.excerpt) && shwt.value <= 10) {
      inches = shwt.value * 12;
    }
    if (inches <= 120) {
      shwt_separation_inches = inches;
      evidence.push({
        field: `${PARAM_EVIDENCE_PREFIX}shwt_separation_inches`,
        excerpt: shwt.excerpt,
        page_or_section: null,
      });
    } else {
      fields_not_found.push("shwt_separation_inches");
    }
  } else {
    fields_not_found.push("shwt_separation_inches");
  }

  if (media && media.value >= 6 && media.value <= 72) {
    bioretention_media_depth_min_inches = media.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}bioretention_media_depth_min_inches`,
      excerpt: media.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("bioretention_media_depth_min_inches");
  }

  function takeInches(
    hit: { value: number; excerpt: string } | null,
    field: string,
    min: number,
    max: number,
    feetToInches = false
  ): number | null {
    if (!hit) {
      fields_not_found.push(field);
      return null;
    }
    let n = hit.value;
    if (feetToInches && /feet|ft\b/i.test(hit.excerpt) && n <= 20) {
      n = n * 12;
    }
    if (n < min || n > max) {
      fields_not_found.push(field);
      return null;
    }
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}${field}`,
      excerpt: hit.excerpt,
      page_or_section: null,
    });
    return n;
  }

  const ponding = parseFirstNumber(
    /(?:ponding (?:depth|zone)|surface ponding)\D{0,40}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?)\b/i,
    blob
  );
  const pavement = parseFirstNumber(
    /(?:permeable|porous|pervious)\s+(?:pavement|paving|concrete|asphalt)[\s\S]{0,80}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?)\b/i,
    blob
  );
  const infil = parseFirstNumber(
    /(?:infiltration rate|exfiltration rate|design infiltration)\D{0,40}?(\d+(?:\.\d+)?)\s*(?:in(?:ches)?\s*\/\s*h(?:ou)?r|in\/hr)\b/i,
    blob
  );
  const pool = parseFirstNumber(
    /(?:permanent pool|normal pool)\D{0,40}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?|feet|ft)\b/i,
    blob
  );
  const edDrain = parseFirstNumber(
    /(?:extended detention|ED drain(?:ing|age)? time)\D{0,40}?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i,
    blob
  );
  const lwr = parseFirstNumber(
    /(?:length[- ]to[- ]width|L\s*:\s*W|L\/W)\D{0,20}?(\d+(?:\.\d+)?)\s*(?::\s*1)?\b/i,
    blob
  );
  const wetlandHrs = parseFirstNumber(
    /(?:wetland)\D{0,40}?(?:detention|residence)\D{0,20}?(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i,
    blob
  );
  const swaleWidth = parseFirstNumber(
    /(?:swale|bioswale)\D{0,40}?(?:bottom width|width)\D{0,20}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?|feet|ft)\b/i,
    blob
  );
  const swaleSlope = parseFirstNumber(
    /(?:swale|bioswale)\D{0,50}?(?:longitudinal )?slope\D{0,20}?(\d+(?:\.\d+)?)\s*%/i,
    blob
  );
  const greenMedia = parseFirstNumber(
    /(?:green roof|vegetated roof|ecoroof|living roof)\D{0,40}?(?:media|growing medium)\D{0,20}?(\d+(?:\.\d+)?)\s*(?:inches|inch|in\.?)\b/i,
    blob
  );
  const greenSlope = parseFirstNumber(
    /(?:green roof|vegetated roof)\D{0,40}?slope\D{0,20}?(\d+(?:\.\d+)?)\s*%/i,
    blob
  );

  const bioretention_ponding_depth_inches = takeInches(
    ponding,
    "bioretention_ponding_depth_inches",
    2,
    24
  );
  const permeable_pavement_storage_depth_inches = takeInches(
    pavement,
    "permeable_pavement_storage_depth_inches",
    4,
    48
  );
  let design_infiltration_rate_in_per_hr: number | null = null;
  if (infil && infil.value > 0 && infil.value <= 50) {
    design_infiltration_rate_in_per_hr = infil.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}design_infiltration_rate_in_per_hr`,
      excerpt: infil.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("design_infiltration_rate_in_per_hr");
  }
  const permanent_pool_depth_inches = takeInches(
    pool,
    "permanent_pool_depth_inches",
    6,
    180,
    true
  );
  let ed_drain_time_hours: number | null = null;
  if (edDrain && edDrain.value > 0 && edDrain.value <= 168) {
    ed_drain_time_hours = edDrain.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}ed_drain_time_hours`,
      excerpt: edDrain.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("ed_drain_time_hours");
  }
  let length_to_width_ratio: number | null = null;
  if (lwr && lwr.value >= 1 && lwr.value <= 10) {
    length_to_width_ratio = lwr.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}length_to_width_ratio`,
      excerpt: lwr.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("length_to_width_ratio");
  }
  let wetland_detention_hours: number | null = null;
  if (wetlandHrs && wetlandHrs.value > 0 && wetlandHrs.value <= 168) {
    wetland_detention_hours = wetlandHrs.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}wetland_detention_hours`,
      excerpt: wetlandHrs.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("wetland_detention_hours");
  }
  const swale_bottom_width_inches = takeInches(
    swaleWidth,
    "swale_bottom_width_inches",
    6,
    240,
    true
  );
  let swale_longitudinal_slope_percent: number | null = null;
  if (swaleSlope && swaleSlope.value > 0 && swaleSlope.value <= 10) {
    swale_longitudinal_slope_percent = swaleSlope.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}swale_longitudinal_slope_percent`,
      excerpt: swaleSlope.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("swale_longitudinal_slope_percent");
  }
  const green_roof_media_depth_inches = takeInches(
    greenMedia,
    "green_roof_media_depth_inches",
    1,
    24
  );
  let green_roof_slope_percent: number | null = null;
  if (greenSlope && greenSlope.value >= 0 && greenSlope.value <= 40) {
    green_roof_slope_percent = greenSlope.value;
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}green_roof_slope_percent`,
      excerpt: greenSlope.excerpt,
      page_or_section: null,
    });
  } else {
    fields_not_found.push("green_roof_slope_percent");
  }

  let mtd_verification_program: string | null = null;
  const mtdHit = blob.match(/\b(TAPE|NJCAT|MCTP|ETV)\b/i);
  if (mtdHit) {
    mtd_verification_program = mtdHit[1]!.toUpperCase();
    evidence.push({
      field: `${PARAM_EVIDENCE_PREFIX}mtd_verification_program`,
      excerpt: mtdHit[0].slice(0, 80),
      page_or_section: null,
    });
  } else {
    fields_not_found.push("mtd_verification_program");
  }

  const practice_mentions = detectPracticeMentions([
    data.design_criteria.approved_bmp_categories?.join(" "),
    data.design_criteria.water_quality_volume_method,
    data.extraction_quality.review_notes,
    sourceText.slice(0, 80_000),
  ]);

  return {
    params: {
      wqv_depth_inches,
      max_drawdown_hours,
      shwt_separation_inches,
      bioretention_media_depth_min_inches,
      bioretention_ponding_depth_inches,
      permeable_pavement_storage_depth_inches,
      design_infiltration_rate_in_per_hr,
      permanent_pool_depth_inches,
      ed_drain_time_hours,
      length_to_width_ratio,
      wetland_detention_hours,
      swale_bottom_width_inches,
      swale_longitudinal_slope_percent,
      green_roof_media_depth_inches,
      green_roof_slope_percent,
      mtd_verification_program,
      practice_mentions,
      enrich_notes: "heuristic regex enrichment",
      enrich_schema_version: ENRICH_SCHEMA_VERSION,
      fields_not_found,
    },
    evidence,
  };
}

export function designParametersFromEnrichment(
  enrichment: DesignParametersEnrichment,
  opts: { model: string; practiceMentions: string[] }
): DesignParameters {
  return {
    wqv_depth_inches: enrichment.wqv_depth_inches ?? null,
    max_drawdown_hours: enrichment.max_drawdown_hours ?? null,
    shwt_separation_inches: enrichment.shwt_separation_inches ?? null,
    bioretention_media_depth_min_inches:
      enrichment.bioretention_media_depth_min_inches ?? null,
    bioretention_ponding_depth_inches:
      enrichment.bioretention_ponding_depth_inches ?? null,
    permeable_pavement_storage_depth_inches:
      enrichment.permeable_pavement_storage_depth_inches ?? null,
    design_infiltration_rate_in_per_hr:
      enrichment.design_infiltration_rate_in_per_hr ?? null,
    permanent_pool_depth_inches: enrichment.permanent_pool_depth_inches ?? null,
    ed_drain_time_hours: enrichment.ed_drain_time_hours ?? null,
    length_to_width_ratio: enrichment.length_to_width_ratio ?? null,
    wetland_detention_hours: enrichment.wetland_detention_hours ?? null,
    swale_bottom_width_inches: enrichment.swale_bottom_width_inches ?? null,
    swale_longitudinal_slope_percent:
      enrichment.swale_longitudinal_slope_percent ?? null,
    green_roof_media_depth_inches:
      enrichment.green_roof_media_depth_inches ?? null,
    green_roof_slope_percent: enrichment.green_roof_slope_percent ?? null,
    mtd_verification_program: enrichment.mtd_verification_program ?? null,
    practice_mentions: opts.practiceMentions,
    enriched_at: new Date().toISOString(),
    enrich_model: opts.model,
    enrich_notes: enrichment.enrich_notes ?? null,
    enrich_schema_version: ENRICH_SCHEMA_VERSION,
    fields_not_found: enrichment.fields_not_found ?? [],
  };
}

export function numericParamValue(
  params: DesignParameters | undefined,
  field: string
): number | null {
  if (!params) return null;
  const raw = (params as Record<string, unknown>)[field];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function isStaleEnrichment(data: StormwaterData): boolean {
  const ver = data.design_parameters?.enrich_schema_version ?? 0;
  return ver < ENRICH_SCHEMA_VERSION;
}

export function mergeParameterEvidence(
  existing: StormwaterData["evidence"],
  incoming: Array<{
    field: string;
    excerpt: string;
    page_or_section?: string | null;
  }>
): StormwaterData["evidence"] {
  const kept = existing.filter((e) => !e.field.startsWith(PARAM_EVIDENCE_PREFIX));
  return [
    ...kept,
    ...incoming.map((e) => ({
      field: e.field,
      excerpt: e.excerpt,
      page_or_section: e.page_or_section ?? null,
    })),
  ];
}

export function hasEnrichment(data: StormwaterData): boolean {
  return Boolean(data.design_parameters?.enriched_at);
}

export function modeOf(nums: number[]): number | null {
  if (!nums.length) return null;
  const counts = new Map<number, number>();
  for (const n of nums) counts.set(n, (counts.get(n) ?? 0) + 1);
  let best: number | null = null;
  let bestCount = 0;
  for (const [n, c] of counts) {
    if (c > bestCount || (c === bestCount && best !== null && n < best)) {
      best = n;
      bestCount = c;
    }
  }
  return best;
}

export function medianOf(nums: number[]): number | null {
  if (!nums.length) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function manualMentionsPractice(
  data: StormwaterData,
  practiceKey: string
): boolean {
  const mentions = data.design_parameters?.practice_mentions ?? [];
  if (mentions.includes(practiceKey)) return true;
  return detectPracticeMentions([
    data.design_criteria.approved_bmp_categories?.join(" "),
    data.design_criteria.water_quality_volume_method,
    data.extraction_quality.review_notes,
  ]).includes(practiceKey);
}

export { isChapterProxy, PARAM_EVIDENCE_PREFIX };
