/**
 * Canonical design_parameters numeric catalog for enrich, matrix, and synthesis.
 * Bump ENRICH_SCHEMA_VERSION when adding fields so overnight re-enriches stale records.
 */
export const ENRICH_SCHEMA_VERSION = 2;

export type NumericParamField = {
  field: string;
  label: string;
  unit: string;
  /** Practice keys that use this field in the matrix. "*" = every practice. */
  practices: string[] | "*";
  /** When true, stats only include manuals that mention the practice. */
  practiceScoped: boolean;
  /** Site-wide sizing context — not a facility spec for that practice. */
  siteWide?: boolean;
};

export const NUMERIC_PARAM_FIELDS: NumericParamField[] = [
  {
    field: "wqv_depth_inches",
    label: "Site water-quality depth (not practice-specific)",
    unit: "inches",
    practices: "*",
    practiceScoped: false,
    siteWide: true,
  },
  {
    field: "max_drawdown_hours",
    label: "Max drawdown / dewatering time",
    unit: "hours",
    practices: "*",
    practiceScoped: false,
    siteWide: true,
  },
  {
    field: "shwt_separation_inches",
    label: "SHWT separation",
    unit: "inches",
    practices: "*",
    practiceScoped: false,
    siteWide: true,
  },
  {
    field: "bioretention_media_depth_min_inches",
    label: "Bioretention media depth (min)",
    unit: "inches",
    practices: ["bioretention"],
    practiceScoped: true,
  },
  {
    field: "bioretention_ponding_depth_inches",
    label: "Bioretention ponding depth",
    unit: "inches",
    practices: ["bioretention"],
    practiceScoped: true,
  },
  {
    field: "permeable_pavement_storage_depth_inches",
    label: "Permeable pavement storage / section depth",
    unit: "inches",
    practices: ["permeable_pavement"],
    practiceScoped: true,
  },
  {
    field: "design_infiltration_rate_in_per_hr",
    label: "Design infiltration rate",
    unit: "in/hr",
    practices: [
      "infiltration_trench",
      "infiltration_basin",
      "permeable_pavement",
      "bioretention",
    ],
    practiceScoped: true,
  },
  {
    field: "permanent_pool_depth_inches",
    label: "Permanent pool depth",
    unit: "inches",
    practices: ["wet_pond", "constructed_wetland"],
    practiceScoped: true,
  },
  {
    field: "ed_drain_time_hours",
    label: "Extended-detention drain time",
    unit: "hours",
    practices: ["extended_detention", "wet_pond"],
    practiceScoped: true,
  },
  {
    field: "length_to_width_ratio",
    label: "Length-to-width ratio",
    unit: "ratio",
    practices: ["wet_pond", "extended_detention", "constructed_wetland"],
    practiceScoped: true,
  },
  {
    field: "wetland_detention_hours",
    label: "Constructed-wetland detention time",
    unit: "hours",
    practices: ["constructed_wetland"],
    practiceScoped: true,
  },
  {
    field: "swale_bottom_width_inches",
    label: "Swale bottom width",
    unit: "inches",
    practices: ["swale"],
    practiceScoped: true,
  },
  {
    field: "swale_longitudinal_slope_percent",
    label: "Swale longitudinal slope",
    unit: "percent",
    practices: ["swale"],
    practiceScoped: true,
  },
  {
    field: "green_roof_media_depth_inches",
    label: "Green-roof media depth",
    unit: "inches",
    practices: ["green_roof"],
    practiceScoped: true,
  },
  {
    field: "green_roof_slope_percent",
    label: "Green-roof slope",
    unit: "percent",
    practices: ["green_roof"],
    practiceScoped: true,
  },
];

export function fieldsForPractice(practiceKey: string): NumericParamField[] {
  return NUMERIC_PARAM_FIELDS.filter((f) => {
    if (f.practices === "*") return true;
    return f.practices.includes(practiceKey);
  });
}

export const NUMERIC_PARAM_FIELD_NAMES = NUMERIC_PARAM_FIELDS.map((f) => f.field);

export const ENRICH_PROMPT_FIELD_LINES = [
  "- wqv_depth_inches: water-quality rainfall/runoff depth in inches (e.g. 1.0, 1.5). Not a return period.",
  "- max_drawdown_hours: maximum drawdown/dewatering time in hours (site or SCM when explicit).",
  "- shwt_separation_inches: minimum separation from seasonal high water table in inches (convert feet×12 when text says feet).",
  "- bioretention_media_depth_min_inches: minimum bioretention/rain-garden filter media depth in inches.",
  "- bioretention_ponding_depth_inches: bioretention surface ponding / ponding zone depth in inches.",
  "- permeable_pavement_storage_depth_inches: permeable/porous pavement storage or section depth in inches.",
  "- design_infiltration_rate_in_per_hr: design infiltration / exfiltration rate in inches per hour.",
  "- permanent_pool_depth_inches: wet-pond or wetland permanent pool depth in inches (convert feet×12).",
  "- ed_drain_time_hours: extended-detention drain / drawdown time in hours.",
  "- length_to_width_ratio: facility length-to-width ratio (dimensionless, e.g. 2 or 3).",
  "- wetland_detention_hours: constructed-wetland hydraulic detention time in hours.",
  "- swale_bottom_width_inches: vegetated swale bottom width in inches (convert feet×12).",
  "- swale_longitudinal_slope_percent: swale longitudinal slope in percent (e.g. 1 or 2).",
  "- green_roof_media_depth_inches: green/vegetated roof media depth in inches.",
  "- green_roof_slope_percent: green-roof slope in percent.",
  "- mtd_verification_program: named manufactured-treatment verification program if explicit (TAPE, NJCAT, etc.), else null.",
].join("\n");
