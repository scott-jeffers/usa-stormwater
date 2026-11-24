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

/** Part B (construction erosion and sediment control) criteria and their clauses. */
export const ESC_CRITERION_CLAUSE: Record<string, string> = {
  stabilization_days: "14.1",
  natural_buffer_ft: "14.4",
  basin_threshold_acres: "15.1",
  basin_storage_cf_per_acre: "15.2",
  silt_fence_drainage_acres_per_100ft: "15.4",
  silt_fence_slope_length_ft: "15.4",
  construction_entrance_length_ft: "15.5",
  inspection_days: "16.1",
  inspection_storm_trigger_in: "16.1",
};

/** Detention, outlet and spillway criteria (model manual Section 7) and their clauses. */
export const DET_CRITERION_CLAUSE: Record<string, string> = {
  det_spillway_storm_yr: "7.8.1",
  det_freeboard_ft: "7.8.3",
  det_downstream_pct: "7.3",
  det_orifice_c: "7.6.1",
  det_min_orifice_in: "7.6.2",
  det_bottom_slope_pct: "7.9.2",
  det_max_depth_ft: "7.9.3",
  det_parking_depth_ft: "7.10.1",
  det_min_barrel_in: "7.5.2",
};

/** Water-quality treatment, media and materials criteria (model manual 3.10, 6.1) and their clauses. */
export const PT_CRITERION_CLAUSE: Record<string, string> = {
  pt_tp_removal_pct: "3.10.1",
  pt_tn_removal_pct: "3.10.2",
  pt_media_sand_pct: "6.1.5",
  pt_media_clay_max_pct: "6.1.5",
  pt_media_om_pct: "6.1.5",
  pt_media_p_max: "6.1.6",
  pt_compost_om_pct: "6.1.7",
  pt_media_ksat_inhr: "6.1.3",
  pt_underdrain_dia_in: "6.1.9",
};

const PT_FILE = path.resolve(process.cwd(), "data/national/pt-classification.json");

export function loadPtCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(PT_FILE)) return null;
  return JSON.parse(readFileSync(PT_FILE, "utf-8"));
}

/** Site-design and volume-credit criteria (model manual 3.8-3.9) and their clauses. */
export const SD_CRITERION_CLAUSE: Record<string, string> = {
  sd_disc_roof_max_sf: "3.8.2",
  sd_disc_flow_path_ft: "3.8.3",
  sd_disc_slope_max_pct: "3.8.3",
  sd_soil_amend_depth_in: "3.8.4",
  sd_tree_credit_sf: "3.8.5",
  sd_rr_bio_inf_pct: "3.9",
  sd_rr_bio_ud_pct: "3.9",
  sd_rr_pp_inf_pct: "3.9",
  sd_rr_pp_ud_pct: "3.9",
  sd_rr_green_roof_pct: "3.9",
  sd_rr_harvest_pct: "3.9",
  sd_rr_conservation_pct: "3.9",
  sd_rr_grass_channel_pct: "3.9",
};

const SD_FILE = path.resolve(process.cwd(), "data/national/sd-classification.json");

export function loadSdCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(SD_FILE)) return null;
  return JSON.parse(readFileSync(SD_FILE, "utf-8"));
}

/** Hydrology criteria (model manual Section 4) and their clauses. */
export const HYD_CRITERION_CLAUSE: Record<string, string> = {
  hyd_rational_max_ac: "4.3",
  hyd_sheet_flow_max_ft: "4.4.2",
  hyd_min_tc_min: "4.4.3",
  hyd_rational_c_impervious: "4.5.1",
  hyd_cn_impervious: "4.6.1",
};

const HYD_FILE = path.resolve(process.cwd(), "data/national/hyd-classification.json");

export function loadHydCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(HYD_FILE)) return null;
  return JSON.parse(readFileSync(HYD_FILE, "utf-8"));
}

/** Conveyance criteria (model manual Section 8) and their clauses. */
export const CONV_CRITERION_CLAUSE: Record<string, string> = {
  conv_storm_drain_storm_yr: "8.1.1",
  conv_inlet_storm_yr: "8.1.1",
  culv_design_storm_yr: "8.1.4",
  chan_design_storm_yr: "8.1.5",
  conv_min_pipe_in: "8.3.1",
  conv_manning_n_concrete: "8.3.2",
  conv_min_velocity_fps: "8.3.3",
  conv_max_velocity_fps: "8.3.4",
  conv_min_cover_ft: "8.3.5",
  conv_manhole_spacing_ft: "8.3.7",
  conv_hgl_clearance_ft: "8.4.3",
  culv_hw_d: "8.5.2",
  culv_min_dia_in: "8.5.3",
  chan_freeboard_ft: "8.6.2",
};

const CONV_FILE = path.resolve(process.cwd(), "data/national/conv-classification.json");

export function loadConvCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(CONV_FILE)) return null;
  return JSON.parse(readFileSync(CONV_FILE, "utf-8"));
}

const DET_FILE = path.resolve(process.cwd(), "data/national/det-classification.json");

export function loadDetCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(DET_FILE)) return null;
  return JSON.parse(readFileSync(DET_FILE, "utf-8"));
}

const FILE = path.resolve(process.cwd(), "data/national/criteria-classification.json");
const ESC_FILE = path.resolve(process.cwd(), "data/national/esc-classification.json");

export function loadEscCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(ESC_FILE)) return null;
  return JSON.parse(readFileSync(ESC_FILE, "utf-8"));
}

export function loadCriteria(): { generated_at: string; method: string; criteria: CriterionEvidence[] } | null {
  if (!existsSync(FILE)) return null;
  return JSON.parse(readFileSync(FILE, "utf-8"));
}
