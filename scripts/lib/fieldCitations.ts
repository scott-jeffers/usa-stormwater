/**
 * Resolve exact per-manual evidence citations for structured atlas criteria.
 * Joins design_criteria values to each manual's evidence[] excerpts — no LLM.
 */
import type { ManualRecord } from "../../lib/data";
import {
  getTierASlugSet,
  tierACitationBoost,
} from "../../lib/national/tierA";
import type {
  CitationRegistryEntry,
  DraftCitation,
} from "../../lib/pipeline/types";
import { findEvidence } from "../../lib/evidence";

export type FieldCitation = {
  slug: string;
  state_code: string | null;
  excerpt: string;
  page_or_section: string | null;
  field: string;
};

export type CitationConfidence =
  | "field_verified"
  | "corpus_pattern"
  | "editorial";

const DEFAULT_MAX = 5;

function hasValue(v: unknown): boolean {
  if (v == null) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "string") return v.trim().length > 0;
  return true;
}

export function normalizeMethod(s: string): string {
  const t = s.toLowerCase().replace(/\s+/g, " ").trim();
  if (/rational/.test(t)) return "Rational";
  if (/nrcs|scs|tr-?55|curve.?number|cn\b/.test(t)) return "NRCS/SCS";
  if (/swmm|hec-?hms|continuous|hydrocad/.test(t))
    return "Continuous/event model";
  if (/unit hydrograph|snyder|scs uh/.test(t)) return "Unit hydrograph";
  if (/green.?ampt/.test(t)) return "Green-Ampt";
  return s.length > 48 ? s.slice(0, 45) + "…" : s;
}

export function normalizeSoftware(s: string): string {
  const t = s.toLowerCase();
  if (/hec-?ras/.test(t)) return "HEC-RAS";
  if (/hec-?hms/.test(t)) return "HEC-HMS";
  if (/swmm/.test(t)) return "EPA SWMM";
  if (/hydrocad/.test(t)) return "HydroCAD";
  if (/pondpack|civil.?storm|stormcad/.test(t))
    return "Bentley / CivilStorm family";
  return s.length > 40 ? s.slice(0, 37) + "…" : s;
}

export function bmpHint(s: string): string | null {
  const t = s.toLowerCase();
  if (/bioretention|rain garden/.test(t)) return "bioretention";
  if (/infiltration/.test(t)) return "infiltration";
  if (/permeable|porous pavement/.test(t)) return "permeable pavement";
  if (/wet pond|retention pond|wetland/.test(t)) return "wet pond / wetland";
  if (/detention|dry pond/.test(t)) return "detention";
  if (/green roof|vegetated roof/.test(t)) return "green roof";
  if (/manufactured|proprietary|mtds|hydrodynamic/.test(t))
    return "manufactured treatment";
  if (/swale|filter strip/.test(t)) return "swale / filter strip";
  return null;
}

function evidenceFor(
  manual: ManualRecord,
  fieldPath: string
): { excerpt: string; page_or_section: string | null } | null {
  const hit = findEvidence(manual.data.evidence, fieldPath);
  if (!hit?.excerpt?.trim()) return null;
  return {
    excerpt: hit.excerpt.replace(/\s+/g, " ").trim().slice(0, 320),
    page_or_section: hit.page_or_section,
  };
}

function rankAndCap(
  citations: FieldCitation[],
  max = DEFAULT_MAX
): FieldCitation[] {
  const seen = new Set<string>();
  const ranked = [...citations].sort((a, b) => {
    const boost =
      tierACitationBoost(b.slug) - tierACitationBoost(a.slug) ||
      (a.slug < b.slug ? -1 : 1);
    return boost;
  });
  const out: FieldCitation[] = [];
  for (const c of ranked) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}

/** Manuals listing a given return-period year, with field evidence. */
export function resolveReturnPeriodCitations(
  manuals: ManualRecord[],
  year: number,
  opts?: { max?: number }
): FieldCitation[] {
  const field = "design_criteria.design_storm_return_periods_years";
  const hits: FieldCitation[] = [];
  for (const m of manuals) {
    const years = m.data.design_criteria.design_storm_return_periods_years ?? [];
    if (!years.includes(year)) continue;
    const ev = evidenceFor(m, field);
    if (!ev) continue;
    hits.push({
      slug: m.slug,
      state_code: m.data.document_metadata.state_code,
      excerpt: ev.excerpt,
      page_or_section: ev.page_or_section,
      field,
    });
  }
  return rankAndCap(hits, opts?.max ?? DEFAULT_MAX);
}

/** Manuals whose normalized peak-method / software / BMP label matches. */
export function resolveNormalizedFieldCitations(
  manuals: ManualRecord[],
  key:
    | "peak_flow_calculation_method"
    | "required_hydrologic_hydraulic_software"
    | "approved_bmp_categories",
  normalizeFn: (raw: string) => string | null,
  targetLabel: string,
  opts?: { max?: number; match?: "includes" | "exact" }
): FieldCitation[] {
  const field = `design_criteria.${key}`;
  const match = opts?.match ?? "includes";
  const target = targetLabel.toLowerCase();
  const hits: FieldCitation[] = [];

  for (const m of manuals) {
    const raw = m.data.design_criteria[key] ?? [];
    if (!hasValue(raw)) continue;
    const labels = raw
      .map((v) => normalizeFn(String(v)))
      .filter((v): v is string => Boolean(v));
    const ok = labels.some((lab) => {
      const l = lab.toLowerCase();
      return match === "exact" ? l === target : l.includes(target);
    });
    if (!ok) continue;
    const ev = evidenceFor(m, field);
    if (!ev) continue;
    hits.push({
      slug: m.slug,
      state_code: m.data.document_metadata.state_code,
      excerpt: ev.excerpt,
      page_or_section: ev.page_or_section,
      field,
    });
  }
  return rankAndCap(hits, opts?.max ?? DEFAULT_MAX);
}

/** Manuals with a populated WQ method + evidence. */
export function resolveWqMethodCitations(
  manuals: ManualRecord[],
  opts?: { max?: number; tierAOnly?: boolean }
): FieldCitation[] {
  const field = "design_criteria.water_quality_volume_method";
  const tierA = getTierASlugSet();
  const hits: FieldCitation[] = [];
  for (const m of manuals) {
    if (opts?.tierAOnly && !tierA.has(m.slug)) continue;
    const method = m.data.design_criteria.water_quality_volume_method;
    if (!method || !String(method).trim()) continue;
    const ev = evidenceFor(m, field);
    if (!ev) continue;
    hits.push({
      slug: m.slug,
      state_code: m.data.document_metadata.state_code,
      excerpt: ev.excerpt,
      page_or_section: ev.page_or_section,
      field,
    });
  }
  return rankAndCap(hits, opts?.max ?? DEFAULT_MAX);
}

function dedupeKey(slug: string, field: string): string {
  return `${slug}::${field}`;
}

/**
 * Build a numbered citation registry: field-verified first, then corpus-pattern.
 * Returns registry entries and a lookup from FieldCitation → key.
 */
export function buildCitationRegistry(opts: {
  fieldVerified: FieldCitation[];
  corpusCitations?: DraftCitation[];
  stateBySlug?: Map<string, string | null>;
  maxCorpus?: number;
}): {
  registry: CitationRegistryEntry[];
  keyForFieldCitation: (c: FieldCitation) => string | undefined;
  keysForCitations: (citations: FieldCitation[]) => string[];
} {
  const registry: CitationRegistryEntry[] = [];
  const keyByDedupe = new Map<string, string>();
  let next = 1;

  const add = (
    slug: string,
    field: string,
    entry: Omit<CitationRegistryEntry, "key">
  ): string => {
    const dk = dedupeKey(slug, field);
    const existing = keyByDedupe.get(dk);
    if (existing) return existing;
    const key = String(next++);
    keyByDedupe.set(dk, key);
    registry.push({ key, ...entry });
    return key;
  };

  for (const c of opts.fieldVerified) {
    add(c.slug, c.field, {
      slug: c.slug,
      state_code: c.state_code,
      excerpt: c.excerpt,
      page_or_section: c.page_or_section,
      confidence: "field_verified",
      field: c.field,
    });
  }

  const maxCorpus = opts.maxCorpus ?? 14;
  let corpusAdded = 0;
  for (const c of opts.corpusCitations ?? []) {
    if (corpusAdded >= maxCorpus) break;
    const field = "corpus_chunk";
    const dk = dedupeKey(c.slug, field);
    if (keyByDedupe.has(dk)) continue;
    // Also skip if same slug already has a field_verified entry and we're capping noise
    add(c.slug, field, {
      slug: c.slug,
      state_code: opts.stateBySlug?.get(c.slug) ?? null,
      excerpt: c.excerpt.replace(/\s+/g, " ").trim().slice(0, 320),
      page_or_section: c.page_or_section,
      confidence: "corpus_pattern",
      field,
    });
    corpusAdded += 1;
  }

  const keyForFieldCitation = (c: FieldCitation): string | undefined =>
    keyByDedupe.get(dedupeKey(c.slug, c.field));

  const keysForCitations = (citations: FieldCitation[]): string[] => {
    const keys: string[] = [];
    const seen = new Set<string>();
    for (const c of citations) {
      const k = keyForFieldCitation(c);
      if (!k || seen.has(k)) continue;
      seen.add(k);
      keys.push(k);
    }
    return keys;
  };

  return { registry, keyForFieldCitation, keysForCitations };
}

/** Merge FieldCitation lists, prefer first occurrence, rank Tier A. */
export function mergeFieldCitations(
  lists: FieldCitation[][],
  max = 40
): FieldCitation[] {
  const out: FieldCitation[] = [];
  const seen = new Set<string>();
  for (const list of lists) {
    for (const c of list) {
      const dk = dedupeKey(c.slug, c.field);
      if (seen.has(dk)) continue;
      seen.add(dk);
      out.push(c);
    }
  }
  return rankAndCap(out, max);
}
