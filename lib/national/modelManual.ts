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

export interface Provision {
  id: string;
  title: string;
  criterion?: string;
  status: "drafted" | "open question" | "not drafted" | "provisional";
  text: string;
  regional?: string;
  open?: string;
}

export const CLASS_LABELS: Record<CriterionEvidence["class"], { label: string; meaning: string }> = {
  consensus: { label: "Near-consensus", meaning: "Half or more of states already use one value: a national default." },
  "climate-linked": { label: "Climate-linked (suggestive)", meaning: "Values differ between climate regions more than chance would suggest: a default plus regional adjustments." },
  divergent: { label: "Unexplained divergence", meaning: "States differ, but not by climate: a candidate to harmonize." },
  insufficient: { label: "Too little evidence", meaning: "Fewer than 8 states state a value." },
};

export const PROVISIONS: Provision[] = [
  {
    id: "MM-1",
    title: "Water-quality volume",
    criterion: "wqv_depth_inches",
    status: "drafted",
    text: "Size permanent practices for the runoff from 1.0 in of rainfall.",
    regional: "A state may instead adopt a documented 90th-percentile storm, as Connecticut (1.3 in), New York (1.2 in) and Iowa (1.25 in) do.",
  },
  {
    id: "MM-2",
    title: "Maximum drawdown",
    criterion: "max_drawdown_hours",
    status: "drafted",
    text: "Practices that hold water after a storm must drain within 72 hours.",
    regional: "Suggestive regional adjustment: 48 hours in the Upper Midwest and Ohio Valley; up to 96–120 hours in the West, Southwest and South.",
  },
  {
    id: "MM-3",
    title: "Separation from the seasonal high water table",
    criterion: "shwt_separation_inches",
    status: "open question",
    text: "The bottom of an infiltrating practice must sit at least 24 in above the seasonal high water table.",
    open: "13 states require 30–60 in, mostly for infiltration basins and trenches. Should a deeper separation apply to those practices?",
  },
  {
    id: "MM-4",
    title: "Bioretention media depth",
    criterion: "bioretention_media_depth_min_inches",
    status: "open question",
    text: "Use at least 18 in of engineered bioretention media, and 24 in where trees are planted.",
    open: "11 states require 24–48 in. Should 24 in be the default?",
  },
  {
    id: "MM-5",
    title: "Minimum soil infiltration rate",
    criterion: "design_infiltration_rate_in_per_hr",
    status: "drafted",
    text: "Infiltration without an underdrain is allowed where tested native soils infiltrate at 0.5 in/hr or more; below that, use an underdrain.",
  },
  {
    id: "MM-6",
    title: "Wet-pond permanent pool depth",
    criterion: "permanent_pool_depth_inches",
    status: "not drafted",
    text: "Not drafted: only 6 states state a minimum depth.",
  },
  {
    id: "MM-7",
    title: "Design storms by purpose",
    status: "provisional",
    text: "State manuals most often name the 100-, 10-, 2-, 50- and 25-year storms. A purpose-based set (channel protection, minor conveyance, major flood) needs the atlas to record what each storm is for.",
  },
];

const FILE = path.resolve(process.cwd(), "data/national/criteria-classification.json");

export function loadCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(FILE)) return null;
  return JSON.parse(readFileSync(FILE, "utf-8"));
}
