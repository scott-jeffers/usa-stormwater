/**
 * Compact per-record rows for the /compare page (public/data/compare.json).
 * Members of a shared manual carry the representative's design values
 * ("effective design") so a comparison never shows two answers for one PDF.
 */
import { getAllManuals, getManualBySlug, revisionDateFromMetadata } from "./data";
import { checkParameterValue, getEvidenceQa, type ValueCheck } from "./qa/load";
import { coverageBasisFor, getSharedInfo } from "./sharedManuals";

export const COMPARE_PARAMS = [
  ["wqv_depth_inches", "Water-quality depth", "in"],
  ["max_drawdown_hours", "Max drawdown", "hr"],
  ["shwt_separation_inches", "Water-table separation", "in"],
  ["bioretention_media_depth_min_inches", "Bioretention media depth (min)", "in"],
  ["bioretention_ponding_depth_inches", "Bioretention ponding depth", "in"],
  ["design_infiltration_rate_in_per_hr", "Design infiltration rate", "in/hr"],
  ["permeable_pavement_storage_depth_inches", "Permeable pavement storage", "in"],
  ["permanent_pool_depth_inches", "Wet pond permanent pool depth", "in"],
  ["ed_drain_time_hours", "Extended detention drain time", "hr"],
  ["length_to_width_ratio", "Pond length:width", ":1"],
  ["swale_longitudinal_slope_percent", "Swale slope (max)", "%"],
  ["green_roof_media_depth_inches", "Green roof media depth", "in"],
] as const;

export const LIST_CAP = 8;
export interface CappedList {
  items: string[];
  total: number;
}
const cap = (xs: string[]): CappedList => ({ items: xs.slice(0, LIST_CAP), total: xs.length });

export interface CompareParam {
  value: number | string;
  check: ValueCheck;
}

export interface CompareRow {
  slug: string;
  name: string;
  state: string | null;
  level: string;
  title: string;
  revised: string | null;
  basis: string;
  design_from: string;
  pdf: string | null;
  storms: number[];
  wqv_method: string | null;
  /** Lists are capped at LIST_CAP items; `total` is the full length. */
  peak_flow: CappedList;
  software: CappedList;
  bmps: CappedList;
  params: Record<string, CompareParam>;
  citations: { status: string; exact: number; fuzzy: number; unverifiable: number; fail: number } | null;
}

export function getCompareRows(): CompareRow[] {
  return getAllManuals().map((m) => {
    const shared = getSharedInfo(m.slug);
    const rep =
      shared && !shared.isRepresentative && shared.representative !== m.slug
        ? getManualBySlug(shared.representative)
        : null;
    const d = (rep ?? m).data;
    const designSlug = rep?.slug ?? m.slug;
    const params: Record<string, CompareParam> = {};
    const dp = d.design_parameters as Record<string, unknown> | undefined;
    for (const [key] of COMPARE_PARAMS) {
      const v = dp?.[key];
      if (typeof v === "number" || (typeof v === "string" && v)) {
        params[key] = { value: v, check: checkParameterValue(designSlug, key, d.evidence) };
      }
    }
    const qa = getEvidenceQa(designSlug);
    const meta = m.data.document_metadata;
    return {
      slug: m.slug,
      name: meta.jurisdiction_name,
      state: meta.state_code ?? null,
      level: meta.jurisdiction_level,
      title: d.document_metadata.document_title,
      revised: revisionDateFromMetadata(d.document_metadata),
      basis: coverageBasisFor(m.slug),
      design_from: designSlug,
      pdf: d.source.document_url ?? null,
      storms: d.design_criteria.design_storm_return_periods_years,
      wqv_method: d.design_criteria.water_quality_volume_method,
      peak_flow: cap(d.design_criteria.peak_flow_calculation_method),
      software: cap(d.design_criteria.required_hydrologic_hydraulic_software),
      bmps: cap(d.design_criteria.approved_bmp_categories),
      params,
      citations: qa ? { status: qa.status, ...qa.counts } : null,
    };
  });
}
