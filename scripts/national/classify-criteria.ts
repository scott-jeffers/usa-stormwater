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
const IN = path.join(ROOT, "data/national/hand-checks.json");
const OUT = path.join(ROOT, "data/national/criteria-classification.json");

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
  const criteria = Object.entries(CRITERIA).map(([key, meta]) => {
    const kept = checks.values.filter((v) => v.param === key && v.verdict !== "excluded");
    const byState = new Map<string, number[]>();
    for (const v of kept) byState.set(v.state, [...(byState.get(v.state) ?? []), v.value]);
    const states = [...byState.keys()].sort();
    const xs = states.map((s) => median(byState.get(s)!));
    const labels = states.map((s) => REGION_OF.get(s) ?? "Other");
    const n = xs.length;

    // most common value, counting values within ±10% of it as agreeing
    const candidates = [...new Set(xs)];
    const within = (c: number) => xs.filter((x) => Math.abs(x - c) <= 0.1 * c).length;
    const mode = candidates.sort((a, b) => within(b) - within(a) || a - b)[0]!;
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
