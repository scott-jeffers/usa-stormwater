/**
 * Requirements: one entry per design criterion, with every jurisdiction's value.
 *
 * Permanent-practice criteria come from the atlas records (design_parameters,
 * with their qualifier, quote, page and citation check). Construction erosion and
 * sediment control criteria come from the hand-read Part B evidence
 * (data/national/esc-checks.json). Each criterion links to the model-manual
 * clause that sets it.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { getAllManuals } from "./data";
import { checkParameterValue, type ValueCheck } from "./qa/load";
import { coverageBasisFor } from "./sharedManuals";

export type RequirementGroup = "Site sizing" | "Infiltration" | "Bioretention" | "Ponds and detention" | "Detention outlets and spillways" | "Swales and other practices" | "Construction (Part B)";

export interface Criterion {
  key: string;
  label: string;
  short: string;
  unit: string;
  group: RequirementGroup;
  means: string;
  clause?: string;
  source: "records" | "esc" | "det";
}

export const CRITERIA: Criterion[] = [
  { key: "wqv_depth_inches", short: "Water-quality depth", label: "Water-quality rainfall depth", unit: "in", group: "Site sizing", source: "records", clause: "3.2", means: "Rainfall (or runoff) depth the water-quality volume is sized for." },
  { key: "ed_drain_time_hours", short: "Extended-detention time", label: "Extended-detention release time", unit: "hours", group: "Ponds and detention", source: "records", clause: "6.6.1", means: "Time over which an extended-detention volume is released." },
  { key: "max_drawdown_hours", short: "Maximum drawdown", label: "Maximum drawdown time", unit: "hours", group: "Site sizing", source: "records", clause: "6.0.1", means: "Longest time a practice may hold water after a storm." },
  { key: "shwt_separation_inches", short: "Water-table separation", label: "Separation from seasonal high water table", unit: "in", group: "Infiltration", source: "records", clause: "5.4", means: "Minimum depth from an infiltrating practice's bottom to the seasonal high water table." },
  { key: "design_infiltration_rate_in_per_hr", short: "Infiltration rate", label: "Infiltration rate threshold", unit: "in/hr", group: "Infiltration", source: "records", clause: "5.2", means: "Soil infiltration rate needed for infiltration (or the design rate or cap the manual sets)." },
  { key: "bioretention_media_depth_min_inches", short: "Bioretention media depth", label: "Bioretention media depth", unit: "in", group: "Bioretention", source: "records", clause: "6.1.1", means: "Depth of engineered bioretention soil." },
  { key: "bioretention_ponding_depth_inches", short: "Bioretention ponding", label: "Bioretention ponding depth", unit: "in", group: "Bioretention", source: "records", clause: "6.1.2", means: "Depth of water allowed over the bioretention surface." },
  { key: "permeable_pavement_storage_depth_inches", short: "Pavement storage depth", label: "Permeable pavement storage depth", unit: "in", group: "Swales and other practices", source: "records", clause: "6.2.1", means: "Depth of aggregate storage below permeable pavement." },
  { key: "permanent_pool_depth_inches", short: "Wet-pond pool depth", label: "Wet-pond permanent pool depth", unit: "in", group: "Ponds and detention", source: "records", clause: "6.5.2", means: "Depth of a wet pond's permanent pool." },
  { key: "length_to_width_ratio", short: "Pond length:width", label: "Pond length-to-width ratio", unit: "ratio", group: "Ponds and detention", source: "records", clause: "6.5.3", means: "Flow-path length to width for ponds, basins or wetlands (x means x:1)." },
  { key: "wetland_detention_hours", short: "Wetland detention", label: "Constructed wetland detention time", unit: "hours", group: "Ponds and detention", source: "records", clause: "6.7.1", means: "Time a constructed wetland holds the water-quality volume." },
  { key: "swale_bottom_width_inches", short: "Swale bottom width", label: "Swale bottom width", unit: "in", group: "Swales and other practices", source: "records", clause: "6.4.1", means: "Bottom width of a water-quality swale." },
  { key: "swale_longitudinal_slope_percent", short: "Swale slope", label: "Swale longitudinal slope", unit: "%", group: "Swales and other practices", source: "records", clause: "6.4.2", means: "Longitudinal slope of a swale (minimum or maximum)." },
  { key: "green_roof_media_depth_inches", short: "Green roof media", label: "Green roof growing media depth", unit: "in", group: "Swales and other practices", source: "records", clause: "6.9.1", means: "Depth of green roof growing media." },
  { key: "green_roof_slope_percent", short: "Green roof slope", label: "Green roof slope", unit: "%", group: "Swales and other practices", source: "records", clause: "6.9.2", means: "Roof slope allowed for a green roof." },
  { key: "det_spillway_storm_yr", short: "Spillway design storm", label: "Emergency spillway design storm", unit: "years", group: "Detention outlets and spillways", source: "det", clause: "7.8.1", means: "Return period of the storm a detention facility's emergency spillway must pass safely." },
  { key: "det_freeboard_ft", short: "Freeboard", label: "Detention embankment freeboard", unit: "ft", group: "Detention outlets and spillways", source: "det", clause: "7.8.3", means: "Minimum height of the embankment or berm above the highest design water surface." },
  { key: "det_min_orifice_in", short: "Minimum orifice", label: "Minimum outlet orifice diameter", unit: "in", group: "Detention outlets and spillways", source: "det", clause: "7.6.2", means: "Smallest orifice allowed in a detention or pond outlet." },
  { key: "det_orifice_c", short: "Orifice coefficient", label: "Orifice discharge coefficient", unit: "", group: "Detention outlets and spillways", source: "det", clause: "7.6.1", means: "Discharge coefficient C in Q = C A √(2gh) the manual gives for outlet orifices." },
  { key: "det_downstream_pct", short: "Downstream analysis", label: "Downstream analysis limit", unit: "%", group: "Detention outlets and spillways", source: "det", clause: "7.3", means: "Share of the total drainage area the site makes up at the point where downstream analysis may stop (the 10% rule)." },
  { key: "det_bottom_slope_pct", short: "Basin bottom slope", label: "Dry basin bottom slope", unit: "%", group: "Detention outlets and spillways", source: "det", clause: "7.9.2", means: "Minimum slope of a dry detention basin bottom toward its outlet." },
  { key: "det_parking_depth_ft", short: "Parking-lot depth", label: "Parking-lot detention depth", unit: "ft", group: "Detention outlets and spillways", source: "det", clause: "7.10.1", means: "Deepest water allowed where a parking lot is used for detention." },
  { key: "stabilization_days", short: "Stabilization deadline", label: "Time to stabilize inactive areas", unit: "days", group: "Construction (Part B)", source: "esc", clause: "13.1", means: "Days within which disturbed areas must be stabilized once work stops or final grade is reached." },
  { key: "inspection_days", short: "Inspection interval", label: "Construction inspection interval", unit: "days", group: "Construction (Part B)", source: "esc", clause: "15.1", means: "Days between routine erosion and sediment control inspections." },
  { key: "inspection_storm_trigger_in", short: "Inspection storm trigger", label: "Rainfall that triggers an inspection", unit: "in", group: "Construction (Part B)", source: "esc", clause: "15.1", means: "Rainfall after which controls must be inspected, usually within 24 hours." },
  { key: "basin_threshold_acres", short: "Sediment basin threshold", label: "Drainage area needing a sediment basin", unit: "acres", group: "Construction (Part B)", source: "esc", clause: "14.1", means: "Drainage area above which a sediment basin, not a trap, is required." },
  { key: "basin_storage_cf_per_acre", short: "Sediment storage", label: "Sediment trap and basin storage", unit: "cf/acre", group: "Construction (Part B)", source: "esc", clause: "14.2", means: "Minimum storage per acre draining to a sediment trap or basin." },
  { key: "silt_fence_drainage_acres_per_100ft", short: "Silt fence drainage area", label: "Silt fence drainage area", unit: "acres/100 ft", group: "Construction (Part B)", source: "esc", clause: "14.4", means: "Maximum drainage area per 100 ft of silt fence." },
  { key: "silt_fence_slope_length_ft", short: "Silt fence slope length", label: "Slope length above silt fence", unit: "ft", group: "Construction (Part B)", source: "esc", clause: "14.4", means: "Maximum slope length draining to a silt fence." },
  { key: "construction_entrance_length_ft", short: "Construction entrance", label: "Construction entrance length", unit: "ft", group: "Construction (Part B)", source: "esc", clause: "14.5", means: "Minimum length of a stabilized construction entrance." },
  { key: "natural_buffer_ft", short: "Natural buffer", label: "Natural buffer from waters", unit: "ft", group: "Construction (Part B)", source: "esc", clause: "13.4", means: "Undisturbed natural buffer kept between disturbance and surface waters." },
];

export const GROUPS: RequirementGroup[] = ["Site sizing", "Infiltration", "Bioretention", "Ponds and detention", "Detention outlets and spillways", "Swales and other practices", "Construction (Part B)"];

export interface RequirementValue {
  slug: string;
  name: string;
  state: string | null;
  level: string;
  basis: string;
  value: number;
  qualifier: string | null;
  basisNote: string | null;
  quote: string | null;
  page: string | number | null;
  pdf: string | null;
  check: ValueCheck | "hand";
}

export interface RequirementStats {
  n: number;
  states: number;
  min: number;
  max: number;
  median: number;
  mode: number;
  modeCount: number;
  byState: Record<string, number>;
}

const ROOT = process.cwd();

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

/** Manuals with their own rules: one value per source document (members of a shared manual and stand-ins are not counted again). */
export const countsTowardStats = (v: RequirementValue) => v.basis === "own" || v.basis === "issuer";

export function statsOf(values: RequirementValue[]): RequirementStats | null {
  const own = values.filter(countsTowardStats);
  if (!own.length) return null;
  const xs = own.map((v) => v.value);
  const counts = new Map<number, number>();
  for (const x of xs) counts.set(x, (counts.get(x) ?? 0) + 1);
  const [mode, modeCount] = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0])[0]!;
  const perState = new Map<string, number[]>();
  for (const v of own) if (v.state) perState.set(v.state, [...(perState.get(v.state) ?? []), v.value]);
  return {
    n: own.length,
    states: perState.size,
    min: Math.min(...xs),
    max: Math.max(...xs),
    median: median(xs),
    mode,
    modeCount,
    byState: Object.fromEntries([...perState.entries()].map(([s, vs]) => [s, Math.round(median(vs) * 1000) / 1000])),
  };
}

let cache: Map<string, RequirementValue[]> | null = null;

export function allRequirementValues(): Map<string, RequirementValue[]> {
  if (cache) return cache;
  const out = new Map<string, RequirementValue[]>(CRITERIA.map((c) => [c.key, []]));
  const manuals = getAllManuals();
  const bySlug = new Map(manuals.map((m) => [m.slug, m]));
  for (const m of manuals) {
    const d = m.data;
    const dp = (d.design_parameters ?? {}) as Record<string, unknown> & { value_qualifiers?: Record<string, string>; wqv_basis?: string | null };
    const meta = d.document_metadata;
    for (const c of CRITERIA.filter((x) => x.source === "records")) {
      const v = dp[c.key];
      if (typeof v !== "number") continue;
      const ev = d.evidence?.find((e) => e.field === `design_parameters.${c.key}`);
      out.get(c.key)!.push({
        slug: m.slug,
        name: meta.jurisdiction_name,
        state: meta.state_code ?? null,
        level: meta.jurisdiction_level,
        basis: coverageBasisFor(m.slug),
        value: v,
        qualifier: dp.value_qualifiers?.[c.key] ?? null,
        basisNote: c.key === "wqv_depth_inches" && dp.wqv_basis === "runoff" ? "runoff" : null,
        quote: ev?.excerpt ?? null,
        page: ev?.page_or_section ?? null,
        pdf: d.source?.document_url ?? null,
        check: checkParameterValue(m.slug, c.key, d.evidence),
      });
    }
  }
  const hand = ["data/national/esc-checks.json", "data/national/det-checks.json"].flatMap((f) => {
    const file = path.join(ROOT, f);
    return existsSync(file)
      ? (JSON.parse(readFileSync(file, "utf-8")).values as Array<{ param: string; slug: string; state: string; level: string; value: number | null; verdict: string; page: number; quote: string; note?: string }>)
      : [];
  });
  {
    for (const e of hand) {
      if (e.verdict === "excluded" || !out.has(e.param) || typeof e.value !== "number") continue;
      const m = bySlug.get(e.slug);
      out.get(e.param)!.push({
        slug: e.slug,
        name: m?.data.document_metadata.jurisdiction_name ?? e.slug,
        state: e.state || null,
        level: e.level,
        basis: coverageBasisFor(e.slug),
        value: e.value,
        qualifier: e.verdict === "typical" ? "recommended" : null,
        basisNote: e.note ?? null,
        quote: e.quote,
        page: e.page,
        pdf: m?.data.source?.document_url ?? null,
        check: "hand",
      });
    }
  }
  for (const vs of out.values()) vs.sort((a, b) => (a.state ?? "").localeCompare(b.state ?? "") || a.name.localeCompare(b.name));
  cache = out;
  return out;
}

export function getCriterion(key: string): Criterion | undefined {
  return CRITERIA.find((c) => c.key === key);
}

/** National context for one value: where it sits among all manuals with their own rules. */
export function contextFor(key: string): RequirementStats | null {
  return statsOf(allRequirementValues().get(key) ?? []);
}

export function fmtValue(v: number, unit: string): string {
  const n = Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
  if (unit === "ratio") return `${n}:1`;
  if (unit === "%") return `${n}%`;
  if (unit === "cf/acre") return `${Number(n).toLocaleString("en-US")} cf/acre`;
  if (!unit) return n;
  if (unit === "years") return `${n}-year`;
  return `${n} ${unit}`;
}

/** A range written once with its unit: 0.37–2 in, 2:1–4:1, 1,800–3,600 cf/acre. */
export function fmtRange(a: number, b: number, unit: string): string {
  if (a === b) return fmtValue(a, unit);
  if (unit === "ratio" || unit === "%") return `${fmtValue(a, unit)} – ${fmtValue(b, unit)}`;
  if (!unit) return `${fmtValue(a, unit)}–${fmtValue(b, unit)}`;
  if (unit === "years") return `${fmtValue(a, "")}–${fmtValue(b, "")}-year`;
  const strip = (v: number) => fmtValue(v, unit).replace(new RegExp(` ${unit.replace(/[/.]/g, "\\$&")}$`), "");
  return `${strip(a)}–${strip(b)} ${unit}`;
}

export const QUALIFIER_LABEL: Record<string, string> = { min: "min", max: "max", design: "design", typical: "typical", range: "range", average: "avg" };
