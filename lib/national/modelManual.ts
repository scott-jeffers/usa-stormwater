/**
 * Draft model-manual provisions (proposal stage) + the evidence they rest on
 * (data/national/criteria-classification.json, built by npm run national:classify).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export interface CriterionEvidence {
  key: string;
  label: string;
  unit: string;
  reads_as: string;
  states: number;
  records: number;
  excluded: number;
  min: number | null;
  median: number | null;
  max: number | null;
  most_common: number;
  agreement: number;
  climate_eta2: number;
  climate_p: number;
  class: "consensus" | "climate-linked" | "divergent" | "insufficient";
  by_state: Array<{ state: string; region: string; value: number; records: number }>;
  by_region: Array<{ region: string; states: number; median: number; min: number; max: number }>;
}

export const CLASS_LABELS: Record<CriterionEvidence["class"], { label: string; meaning: string }> = {
  consensus: { label: "Near-consensus", meaning: "Half or more of states already use one value: a national default." },
  "climate-linked": { label: "Climate-linked (suggestive)", meaning: "Values differ between climate regions more than chance would suggest: a default plus regional adjustments." },
  divergent: { label: "Unexplained divergence", meaning: "States differ, but not by climate: a candidate to harmonize." },
  insufficient: { label: "Too little evidence", meaning: "Fewer than 8 states state a value." },
};

/** Which model-manual clause (content/manual/model-manual.md) each hand-checked criterion sets. */
export const CRITERION_CLAUSE: Record<string, string> = {
  wqv_depth_inches: "3.2",
  tss_removal_target_pct: "3.3",
  ed_drain_time_hours: "3.4",
  design_infiltration_rate_in_per_hr: "5.2",
  infiltration_safety_factor: "5.3",
  shwt_separation_inches: "5.4",
  max_drawdown_hours: "6.0.1",
  bioretention_media_depth_min_inches: "6.1.1",
  bioretention_ponding_depth_max_inches: "6.1.2",
  permanent_pool_depth_inches: "6.5.2",
  pond_length_width_min: "6.5.3",
};

const FILE = path.resolve(process.cwd(), "data/national/criteria-classification.json");

export function loadCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(FILE)) return null;
  return JSON.parse(readFileSync(FILE, "utf-8"));
}
