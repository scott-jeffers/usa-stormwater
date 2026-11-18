import { z } from "zod";

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/**
 * Coerce common date spellings to ISO ("YYYY", "YYYY-MM" or "YYYY-MM-DD").
 * Returns the input unchanged when it can't be parsed (the schema then
 * rejects it, so it gets fixed rather than displayed inconsistently).
 */
export function normalizeIsoishDate(value: string): string {
  const v = value.trim();
  if (/^\d{4}(-\d{2}(-\d{2})?)?$/.test(v)) return v;
  const pad = (n: number) => String(n).padStart(2, "0");
  const m1 = v.match(/^([A-Za-z]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m1) {
    const mi = MONTHS.findIndex((m) => m.startsWith(m1[1]!.toLowerCase().slice(0, 3)));
    if (mi >= 0) return `${m1[3]}-${pad(mi + 1)}-${pad(Number(m1[2]))}`;
  }
  const m2 = v.match(/^([A-Za-z]+)\.?,?\s+(\d{4})$/);
  if (m2) {
    const mi = MONTHS.findIndex((m) => m.startsWith(m2[1]!.toLowerCase().slice(0, 3)));
    if (mi >= 0) return `${m2[2]}-${pad(mi + 1)}`;
  }
  const m3 = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m3) return `${m3[3]}-${pad(Number(m3[1]))}-${pad(Number(m3[2]))}`;
  return v;
}

/** ISO date with optional precision: 2024, 2024-07, 2024-07-01. */
const isoishDate = z
  .string()
  .regex(/^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/, {
    message: "Use YYYY, YYYY-MM or YYYY-MM-DD",
  });

/** Absolute http(s) link (blocks javascript:, data:, relative paths). */
const webUrl = z
  .string()
  .regex(/^https?:\/\/[^\s]+$/i, { message: "Must be an absolute http(s) URL" });

const EVIDENCE_ROOTS = [
  "document_metadata.",
  "design_criteria.",
  "design_parameters.",
  "extraction_quality.",
];

/** Metadata about where the PDF came from — provided by the prepare/save CLI or agent. */
export const sourceSchema = z.object({
  document_url: webUrl
    .nullable()
    .describe("Direct public URL to the PDF or primary document file"),
  landing_page_url: webUrl
    .nullable()
    .describe("Official agency page that hosts or describes the manual"),
  retrieved_at: z
    .string()
    .nullable()
    .describe("ISO 8601 timestamp when this file was ingested"),
  original_filename: z
    .string()
    .nullable()
    .describe("Local filename of the PDF that was ingested"),
});

/**
 * Fields a Cursor agent extracts from the PDF text.
 * Source links are intentionally excluded — pass them via CLI / agent source block.
 */
export const extractionSchema = z.object({
  document_metadata: z.object({
    jurisdiction_name: z.string(),
    jurisdiction_level: z.enum([
      "state",
      "county",
      "municipality",
      "special_district",
      "tribal",
      "federal",
      "other",
    ]),
    state_code: z
      .string()
      .regex(/^[A-Z]{2}$/, { message: "2-letter uppercase USPS code" })
      .nullable()
      .describe("2-letter USPS code, or null"),
    document_title: z.string(),
    version_or_edition: z.string().nullable(),
    adoption_or_effective_date: isoishDate
      .nullable()
      .describe("ISO 8601 if determinable, else null"),
    last_revised_date: isoishDate.nullable(),
    relationship_to_state_manual: z.enum([
      "independent",
      "adopts_state_manual_directly",
      "deemed_equivalent_to_state_manual",
      "unknown",
    ]),
    issuing_agency_category: z
      .enum(["dot", "dep_deq", "dnr", "other"])
      .nullable()
      .optional()
      .describe(
        "Issuing agency type when the manual is from DOT, DEP/DEQ, DNR, etc.; null/omit for typical city/county manuals"
      ),
  }),
  design_criteria: z.object({
    design_storm_return_periods_years: z.array(z.number()),
    water_quality_volume_method: z
      .string()
      .nullable()
      .describe("Plain-language summary of the method"),
    peak_flow_calculation_method: z.array(z.string()),
    required_hydrologic_hydraulic_software: z.array(z.string()),
    approved_bmp_categories: z.array(z.string()),
  }),
  evidence: z
    .array(
      z.object({
        field: z
          .string()
          .refine((f) => EVIDENCE_ROOTS.some((r) => f.startsWith(r)), {
            message: `Evidence field must be a dot-path under ${EVIDENCE_ROOTS.join(" | ")}`,
          })
          .describe("Dot-path to the field"),
        excerpt: z
          .string()
          .describe("Short verbatim excerpt supporting the extracted value"),
        page_or_section: z.string().nullable(),
      })
    )
    .describe(
      "One entry per populated field above, linking it back to where it came from"
    ),
  extraction_quality: z.object({
    confidence: z.enum(["high", "medium", "low"]),
    needs_human_review: z.boolean(),
    review_notes: z.string().nullable(),
    fields_not_found: z.array(z.string()),
  }),
});

/**
 * Optional numeric / canonical enrichments layered onto atlas records.
 * Additive — never replaces design_criteria prose. Null means not found.
 */
export const designParametersSchema = z.object({
  wqv_depth_inches: z
    .number()
    .nullable()
    .describe("Water-quality rainfall or runoff depth in inches when explicit"),
  max_drawdown_hours: z
    .number()
    .nullable()
    .describe("Maximum drawdown / dewatering time in hours when explicit"),
  shwt_separation_inches: z
    .number()
    .nullable()
    .describe(
      "Minimum separation from seasonal high water table in inches when explicit"
    ),
  bioretention_media_depth_min_inches: z
    .number()
    .nullable()
    .describe("Minimum bioretention / rain-garden filter media depth in inches"),
  bioretention_ponding_depth_inches: z.number().nullable().optional(),
  permeable_pavement_storage_depth_inches: z.number().nullable().optional(),
  design_infiltration_rate_in_per_hr: z.number().nullable().optional(),
  permanent_pool_depth_inches: z.number().nullable().optional(),
  ed_drain_time_hours: z.number().nullable().optional(),
  length_to_width_ratio: z.number().nullable().optional(),
  wetland_detention_hours: z.number().nullable().optional(),
  swale_bottom_width_inches: z.number().nullable().optional(),
  swale_longitudinal_slope_percent: z.number().nullable().optional(),
  green_roof_media_depth_inches: z.number().nullable().optional(),
  green_roof_slope_percent: z.number().nullable().optional(),
  mtd_verification_program: z
    .string()
    .nullable()
    .optional()
    .describe("Named MTD verification program (TAPE, NJCAT, etc.) when explicit"),
  practice_mentions: z
    .array(z.string())
    .describe("Canonical practice keys mentioned (see bmp-aliases ontology)"),
  enriched_at: z
    .string()
    .nullable()
    .optional()
    .describe("ISO 8601 when design_parameters were last enriched"),
  enrich_model: z.string().nullable().optional(),
  enrich_notes: z.string().nullable().optional(),
  enrich_schema_version: z.number().int().optional(),
  fields_not_found: z
    .array(z.string())
    .optional()
    .describe("Parameter field names searched but not found in source text"),
});

export type DesignParameters = z.infer<typeof designParametersSchema>;

/** Narrow LLM response for parameter enrichment (no document rewrite). */
export const designParametersEnrichmentSchema = z.object({
  wqv_depth_inches: z.number().nullish(),
  max_drawdown_hours: z.number().nullish(),
  shwt_separation_inches: z.number().nullish(),
  bioretention_media_depth_min_inches: z.number().nullish(),
  bioretention_ponding_depth_inches: z.number().nullish(),
  permeable_pavement_storage_depth_inches: z.number().nullish(),
  design_infiltration_rate_in_per_hr: z.number().nullish(),
  permanent_pool_depth_inches: z.number().nullish(),
  ed_drain_time_hours: z.number().nullish(),
  length_to_width_ratio: z.number().nullish(),
  wetland_detention_hours: z.number().nullish(),
  swale_bottom_width_inches: z.number().nullish(),
  swale_longitudinal_slope_percent: z.number().nullish(),
  green_roof_media_depth_inches: z.number().nullish(),
  green_roof_slope_percent: z.number().nullish(),
  mtd_verification_program: z.string().nullish(),
  practice_mentions: z.array(z.string()).default([]),
  enrich_notes: z.string().nullish(),
  fields_not_found: z.array(z.string()).default([]),
  evidence: z
    .array(
      z.object({
        field: z.string(),
        excerpt: z.string(),
        page_or_section: z.string().nullish(),
      })
    )
    .default([]),
});

export type DesignParametersEnrichment = z.infer<
  typeof designParametersEnrichmentSchema
>;

const emptySource = {
  document_url: null,
  landing_page_url: null,
  retrieved_at: null,
  original_filename: null,
};

/** Full stored record: agent extraction + CLI/agent-provided source links. */
export const stormwaterSchema = extractionSchema.extend({
  source: sourceSchema.default(emptySource),
  design_parameters: designParametersSchema.optional(),
});

export type StormwaterData = z.infer<typeof stormwaterSchema>;
export type StormwaterExtraction = z.infer<typeof extractionSchema>;
export type DocumentSource = z.infer<typeof sourceSchema>;
