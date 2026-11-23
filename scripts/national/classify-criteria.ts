/**
 * Classify national criteria for a model-manual proposal.
 *
 *   npx tsx scripts/national/classify-criteria.ts
 *
 * Input: data/national/hand-checks.json (state-level values read by hand).
 * Output: data/national/criteria-classification.json
 *
 * Per criterion: one value per state (median of that state's checked
 * records), then
 *   agreement  = share of states within ±10% of the most common value
 *   climate    = eta² of the value across NOAA's U.S. climate regions, with a
 *                permutation p-value (10,000 shuffles of the region labels)
 * Classes:
 *   insufficient   fewer than 8 states
 *   consensus      agreement ≥ 50%            → one national default
 *   climate-linked p < 0.10 (suggestive)      → national default + regional modifiers
 *   divergent      otherwise                  → no evidence-based reason for the spread; harmonize
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
// --part=esc classifies Part B (construction erosion and sediment control);
// --part=det classifies detention, outlets and spillways (model manual §7);
// --part=conv classifies conveyance: storm drains, inlets, culverts, channels (§8)
const PART = process.argv.find((a) => a.startsWith("--part="))?.slice(7) ?? "a";
const FILES: Record<string, [string, string]> = {
  a: ["data/national/hand-checks.json", "data/national/criteria-classification.json"],
  esc: ["data/national/esc-checks.json", "data/national/esc-classification.json"],
  det: ["data/national/det-checks.json", "data/national/det-classification.json"],
  conv: ["data/national/conv-checks.json", "data/national/conv-classification.json"],
};
const IN = path.join(ROOT, FILES[PART]![0]);
const OUT = path.join(ROOT, FILES[PART]![1]);

/** NOAA NCEI U.S. climate regions (contiguous U.S.), plus Alaska and Hawaii. */
export const CLIMATE_REGIONS: Record<string, string[]> = {
  Northeast: ["CT", "DE", "ME", "MD", "MA", "NH", "NJ", "NY", "PA", "RI", "VT", "DC"],
  "Upper Midwest": ["IA", "MI", "MN", "WI"],
  "Ohio Valley": ["IL", "IN", "KY", "MO", "OH", "TN", "WV"],
  Southeast: ["AL", "FL", "GA", "NC", "SC", "VA"],
  "Northern Rockies & Plains": ["MT", "NE", "ND", "SD", "WY"],
  South: ["AR", "KS", "LA", "MS", "OK", "TX"],
  Southwest: ["AZ", "CO", "NM", "UT"],
  Northwest: ["ID", "OR", "WA"],
  West: ["CA", "NV"],
  Alaska: ["AK"],
  Hawaii: ["HI"],
};
const REGION_OF = new Map(Object.entries(CLIMATE_REGIONS).flatMap(([r, ss]) => ss.map((s) => [s, r] as const)));

export const CRITERIA: Record<string, { label: string; unit: string; reads_as: string }> = {
  wqv_depth_inches: { label: "Water-quality rainfall depth", unit: "in", reads_as: "rainfall depth the water-quality volume is sized for" },
  max_drawdown_hours: { label: "Maximum drawdown time", unit: "hours", reads_as: "longest time a practice may hold water after a storm" },
  shwt_separation_inches: { label: "Separation from seasonal high water table", unit: "in", reads_as: "minimum depth from an infiltrating practice's bottom to the seasonal high water table" },
  bioretention_media_depth_min_inches: { label: "Minimum bioretention media depth", unit: "in", reads_as: "minimum depth of engineered bioretention soil" },
  design_infiltration_rate_in_per_hr: { label: "Minimum soil infiltration rate", unit: "in/hr", reads_as: "lowest native-soil infiltration rate at which infiltration is allowed" },
  permanent_pool_depth_inches: { label: "Minimum wet-pond permanent pool depth", unit: "in", reads_as: "minimum depth of a wet pond's permanent pool" },
  bioretention_ponding_depth_max_inches: { label: "Maximum bioretention ponding depth", unit: "in", reads_as: "deepest water allowed over a bioretention surface for the design storm" },
  ed_drain_time_hours: { label: "Extended-detention time", unit: "hours", reads_as: "time over which an extended-detention volume (water quality or channel protection) is released" },
  pond_length_width_min: { label: "Minimum pond length-to-width ratio", unit: "ratio", reads_as: "minimum flow-path length to width for ponds and basins" },
  tss_removal_target_pct: { label: "TSS removal target", unit: "%", reads_as: "required removal of average annual total suspended solids" },
  infiltration_safety_factor: { label: "Infiltration safety factor", unit: "factor", reads_as: "factor the measured infiltration rate is divided by to get the design rate" },
};

export const ESC_CRITERIA: Record<string, { label: string; unit: string; reads_as: string }> = {
  basin_threshold_acres: { label: "Drainage area needing a sediment basin", unit: "acres", reads_as: "drainage area above which a sediment basin (not a trap) is required" },
  basin_storage_cf_per_acre: { label: "Sediment basin or trap storage", unit: "cf/acre", reads_as: "minimum storage per acre draining to a sediment trap or basin" },
  stabilization_days: { label: "Time to stabilize inactive areas", unit: "days", reads_as: "days within which disturbed areas must be stabilized once work stops or final grade is reached" },
  inspection_days: { label: "Routine inspection interval", unit: "days", reads_as: "days between routine erosion and sediment control inspections" },
  inspection_storm_trigger_in: { label: "Storm that triggers an inspection", unit: "in", reads_as: "rainfall depth after which controls must be inspected (usually within 24 hours)" },
  silt_fence_drainage_acres_per_100ft: { label: "Silt fence drainage area", unit: "acres per 100 ft", reads_as: "maximum drainage area per 100 ft of silt fence" },
  silt_fence_slope_length_ft: { label: "Silt fence slope length", unit: "ft", reads_as: "maximum slope length draining to a silt fence" },
  construction_entrance_length_ft: { label: "Construction entrance length", unit: "ft", reads_as: "minimum length of a stabilized construction entrance" },
  natural_buffer_ft: { label: "Natural buffer from waters", unit: "ft", reads_as: "undisturbed natural buffer kept between disturbance and surface waters" },
};

export const DET_CRITERIA: Record<string, { label: string; unit: string; reads_as: string }> = {
  det_spillway_storm_yr: { label: "Emergency spillway design storm", unit: "years", reads_as: "return period of the storm the emergency (auxiliary) spillway must pass safely" },
  det_freeboard_ft: { label: "Detention freeboard", unit: "ft", reads_as: "minimum height of embankment or berm above the highest design water surface" },
  det_min_orifice_in: { label: "Minimum orifice diameter", unit: "in", reads_as: "smallest orifice allowed in a detention or pond outlet" },
  det_orifice_c: { label: "Orifice discharge coefficient", unit: "coefficient", reads_as: "discharge coefficient the manual gives for outlet orifices" },
  det_downstream_pct: { label: "Downstream analysis limit", unit: "%", reads_as: "share of the total drainage area the site makes up at the point where downstream analysis may stop" },
  det_bottom_slope_pct: { label: "Dry basin bottom slope", unit: "%", reads_as: "minimum slope of a dry basin bottom toward the outlet" },
  det_max_depth_ft: { label: "Maximum detention depth", unit: "ft", reads_as: "deepest design water allowed in a surface detention or retention basin" },
  det_parking_depth_ft: { label: "Parking-lot detention depth", unit: "ft", reads_as: "deepest water allowed where a parking lot is used for detention" },
  det_min_barrel_in: { label: "Minimum outlet pipe diameter", unit: "in", reads_as: "smallest barrel or outlet pipe allowed from a detention facility" },
};

export const CONV_CRITERIA: Record<string, { label: string; unit: string; reads_as: string }> = {
  conv_storm_drain_storm_yr: { label: "Storm drain design storm", unit: "years", reads_as: "return period a storm drain (pipe system) must carry without surcharge on a typical street" },
  conv_inlet_storm_yr: { label: "Inlet and gutter spread design storm", unit: "years", reads_as: "return period inlets and gutter spread are designed for on a typical street on grade" },
  conv_min_pipe_in: { label: "Minimum storm drain diameter", unit: "in", reads_as: "smallest public storm drain pipe allowed" },
  conv_min_velocity_fps: { label: "Minimum storm drain velocity", unit: "ft/s", reads_as: "lowest self-cleaning velocity a storm drain must reach (usually flowing full)" },
  conv_max_velocity_fps: { label: "Maximum storm drain velocity", unit: "ft/s", reads_as: "highest velocity allowed in a storm drain (concrete pipe, mains)" },
  conv_hgl_clearance_ft: { label: "Hydraulic grade line clearance", unit: "ft", reads_as: "minimum distance the design hydraulic grade line must stay below inlet grates, rims or ground" },
  conv_manhole_spacing_ft: { label: "Maximum access structure spacing", unit: "ft", reads_as: "longest run between manholes or access structures on smaller storm drains" },
  conv_min_cover_ft: { label: "Minimum pipe cover", unit: "ft", reads_as: "least cover over a storm drain pipe" },
  conv_manning_n_concrete: { label: "Manning's n for concrete pipe", unit: "coefficient", reads_as: "design roughness the manual gives for concrete storm drain pipe" },
  culv_design_storm_yr: { label: "Culvert design storm", unit: "years", reads_as: "return period a road culvert must pass within its headwater limits (local or typical road)" },
  culv_hw_d: { label: "Allowable culvert headwater ratio", unit: "ratio", reads_as: "largest headwater depth to culvert rise (HW/D) allowed at the design flow" },
  culv_min_dia_in: { label: "Minimum culvert diameter", unit: "in", reads_as: "smallest culvert allowed under a public road" },
  chan_design_storm_yr: { label: "Open channel design storm", unit: "years", reads_as: "return period a constructed open channel must carry" },
  chan_freeboard_ft: { label: "Open channel freeboard", unit: "ft", reads_as: "minimum height of channel bank above the design water surface" },
};

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b), m = s.length >> 1;
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
};
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function eta2(xs: number[], labels: string[]): number {
  const mu = mean(xs), sst = xs.reduce((s, x) => s + (x - mu) ** 2, 0);
  if (!sst) return 0;
  const g = new Map<string, number[]>();
  xs.forEach((x, i) => g.set(labels[i]!, [...(g.get(labels[i]!) ?? []), x]));
  let ssb = 0;
  for (const a of g.values()) ssb += a.length * (mean(a) - mu) ** 2;
  return ssb / sst;
}

/** Small seeded PRNG so the p-values reproduce. */
function rng(seed: number) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

function main() {
  const checks = JSON.parse(readFileSync(IN, "utf-8")) as {
    values: Array<{ param: string; state: string; slug: string; value: number; verdict: string }>;
  };
  const rand = rng(20261118);
  const criteria = Object.entries(PART === "esc" ? ESC_CRITERIA : PART === "det" ? DET_CRITERIA : PART === "conv" ? CONV_CRITERIA : CRITERIA).map(([key, meta]) => {
    const kept = checks.values.filter((v) => v.param === key && v.verdict !== "excluded" && v.state);
    const byState = new Map<string, number[]>();
    for (const v of kept) byState.set(v.state, [...(byState.get(v.state) ?? []), v.value]);
    const states = [...byState.keys()].sort();
    const xs = states.map((s) => Math.round(median(byState.get(s)!) * 1000) / 1000);
    const labels = states.map((s) => REGION_OF.get(s) ?? "Other");
    const n = xs.length;

    // most common exact value (ties: the one with most states within ±10%, then
    // the smaller); agreement counts states within ±10% of it
    const candidates = [...new Set(xs)];
    const exact = (c: number) => xs.filter((x) => x === c).length;
    const within = (c: number) => xs.filter((x) => Math.abs(x - c) <= 0.1 * c + 1e-9).length;
    const mode = candidates.sort((a, b) => exact(b) - exact(a) || within(b) - within(a) || a - b)[0]!;
    const agreement = n ? within(mode) / n : 0;

    const e = n > 2 ? eta2(xs, labels) : 0;
    let hits = 0;
    const SHUFFLES = 10000;
    for (let i = 0; i < SHUFFLES && n > 2; i++) {
      const l = [...labels];
      for (let j = l.length - 1; j > 0; j--) {
        const k = Math.floor(rand() * (j + 1));
        [l[j], l[k]] = [l[k]!, l[j]!];
      }
      if (eta2(xs, l) >= e) hits++;
    }
    const p = n > 2 ? hits / SHUFFLES : 1;

    const klass =
      n < 8 ? "insufficient" : agreement >= 0.5 ? "consensus" : p < 0.1 ? "climate-linked" : "divergent";

    const regions = Object.keys(CLIMATE_REGIONS)
      .map((r) => {
        const v = states.filter((s, i) => labels[i] === r).map((s) => median(byState.get(s)!));
        return v.length ? { region: r, states: v.length, median: median(v), min: Math.min(...v), max: Math.max(...v) } : null;
      })
      .filter(Boolean);

    return {
      key,
      ...meta,
      states: n,
      records: kept.length,
      excluded: checks.values.filter((v) => v.param === key && v.verdict === "excluded").length,
      min: n ? Math.min(...xs) : null,
      median: n ? median(xs) : null,
      max: n ? Math.max(...xs) : null,
      distinct_values: new Set(xs).size,
      most_common: mode,
      agreement: Math.round(agreement * 100) / 100,
      climate_eta2: Math.round(e * 100) / 100,
      climate_p: p,
      class: klass,
      by_state: states.map((s, i) => ({ state: s, region: labels[i], value: xs[i], records: byState.get(s)!.length })),
      by_region: regions,
    };
  });

  writeFileSync(
    OUT,
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        part:
          PART === "esc"
            ? "B: construction erosion and sediment control (state and local manuals)"
            : PART === "det"
              ? "Detention, outlets and spillways (state and local manuals)"
              : PART === "conv"
                ? "Conveyance: storm drains, inlets, culverts and open channels (state and local manuals)"
                : "A: permanent stormwater (state-level manuals)",
        method:
          "One value per state (median of hand-checked state-level records). Agreement = share of states within ±10% of the most common value. Climate = eta² across NOAA U.S. climate regions with a 10,000-shuffle permutation p-value. Classes: insufficient (<8 states), consensus (agreement ≥ 50%), climate-linked (p < 0.10, suggestive), divergent (otherwise).",
        criteria,
      },
      null,
      1
    ) + "\n"
  );
  for (const c of criteria)
    console.log(
      `${c.class.padEnd(14)} ${c.key.padEnd(38)} n=${c.states} common=${c.most_common} (${Math.round(c.agreement * 100)}%) median=${c.median} range=${c.min}-${c.max} eta2=${c.climate_eta2} p=${c.climate_p}`
    );
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("classify-criteria.ts")) main();
