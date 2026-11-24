/** Dataset version and research field dictionary (used by export-research and /data/). */
export const DATASET_VERSION = "2026.11.7";

/** Field dictionary: the research-facing meaning of every value field. */
export const FIELDS: Record<string, { label: string; unit: string; type: "number" | "list" | "text"; meaning: string }> = {
  "design_criteria.design_storm_return_periods_years": { label: "Design storms", unit: "years", type: "list", meaning: "Return periods of the design storms the manual names, for any purpose (peak control, conveyance, flood). Purpose is not yet recorded." },
  "design_criteria.water_quality_volume_method": { label: "Water-quality volume method", unit: "", type: "text", meaning: "Plain-language summary of how the manual sizes its water-quality volume." },
  "design_criteria.peak_flow_calculation_method": { label: "Peak-flow methods", unit: "", type: "list", meaning: "Hydrologic methods the manual names (Rational, TR-55, etc.)." },
  "design_criteria.required_hydrologic_hydraulic_software": { label: "Software", unit: "", type: "list", meaning: "Hydrologic or hydraulic software the manual names." },
  "design_criteria.approved_bmp_categories": { label: "Approved practice categories", unit: "", type: "list", meaning: "Categories of permanent practices the manual allows." },
  "design_parameters.wqv_depth_inches": { label: "Water-quality rainfall depth", unit: "in", type: "number", meaning: "Site-wide rainfall depth the water-quality volume is sized for." },
  "design_parameters.max_drawdown_hours": { label: "Maximum drawdown", unit: "hours", type: "number", meaning: "Site-wide longest time a practice may hold water after a storm." },
  "design_parameters.shwt_separation_inches": { label: "Seasonal high water table separation", unit: "in", type: "number", meaning: "Minimum depth from an infiltrating practice's bottom to the seasonal high water table." },
  "design_parameters.bioretention_media_depth_min_inches": { label: "Bioretention media depth (min)", unit: "in", type: "number", meaning: "Minimum depth of engineered bioretention soil." },
  "design_parameters.bioretention_ponding_depth_inches": { label: "Bioretention ponding depth", unit: "in", type: "number", meaning: "Ponding depth over bioretention (usually a maximum; the qualifier is not yet recorded)." },
  "design_parameters.permeable_pavement_storage_depth_inches": { label: "Permeable pavement storage depth", unit: "in", type: "number", meaning: "Depth of aggregate storage below permeable pavement." },
  "design_parameters.design_infiltration_rate_in_per_hr": { label: "Infiltration rate", unit: "in/hr", type: "number", meaning: "Infiltration-rate threshold or design rate (minimum, assumption or cap; qualifier not yet recorded)." },
  "design_parameters.permanent_pool_depth_inches": { label: "Permanent pool depth", unit: "in", type: "number", meaning: "Wet-pond permanent pool depth (minimum, average or maximum; qualifier not yet recorded)." },
  "design_parameters.ed_drain_time_hours": { label: "Extended-detention drain time", unit: "hours", type: "number", meaning: "Time over which an extended-detention volume is released." },
  "design_parameters.length_to_width_ratio": { label: "Length-to-width ratio", unit: "ratio", type: "number", meaning: "Flow-path length to width for ponds, basins or wetlands (x means x:1)." },
  "design_parameters.wetland_detention_hours": { label: "Wetland detention time", unit: "hours", type: "number", meaning: "Detention time for constructed wetlands." },
  "design_parameters.swale_bottom_width_inches": { label: "Swale bottom width", unit: "in", type: "number", meaning: "Swale bottom width (usually a minimum)." },
  "design_parameters.swale_longitudinal_slope_percent": { label: "Swale longitudinal slope", unit: "%", type: "number", meaning: "Swale longitudinal slope (minimum or maximum)." },
  "design_parameters.green_roof_media_depth_inches": { label: "Green roof media depth", unit: "in", type: "number", meaning: "Green roof growing-media depth (usually a minimum)." },
  "design_parameters.green_roof_slope_percent": { label: "Green roof slope", unit: "%", type: "number", meaning: "Green roof slope (usually a maximum)." },
  "design_parameters.mtd_verification_program": { label: "MTD verification program", unit: "", type: "text", meaning: "Testing program the manual accepts for manufactured treatment devices (TAPE, NJCAT, etc.)." },
  "design_parameters.wqv_basis": { label: "Water-quality depth basis", unit: "", type: "text", meaning: "Whether the water-quality depth is a rainfall depth or a depth of runoff (usually from impervious area)." },
  "design_parameters.design_storms": { label: "Design storms by purpose", unit: "years", type: "list", meaning: "Each named storm with what it is used for: water quality, channel protection, peak control, conveyance or flood safety. Assigned automatically from the manual's requirement sentences (spot check of 30: 21 assigned, 16 of those right). Download: design-storms.csv." },
  "design_parameters.practice_mentions": { label: "Practices mentioned", unit: "", type: "list", meaning: "Canonical practice keys the manual mentions (data/ontology/bmp-aliases.json)." },
};

