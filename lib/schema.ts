import { z } from "zod";

/** Metadata about where the PDF came from — provided by the prepare/save CLI or agent. */
export const sourceSchema = z.object({
  document_url: z
    .string()
    .nullable()
    .describe("Direct public URL to the PDF or primary document file"),
  landing_page_url: z
    .string()
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
      "other",
    ]),
    state_code: z
      .string()
      .nullable()
      .describe("2-letter USPS code, or null"),
    document_title: z.string(),
    version_or_edition: z.string().nullable(),
    adoption_or_effective_date: z
      .string()
      .nullable()
      .describe("ISO 8601 if determinable, else null"),
    last_revised_date: z.string().nullable(),
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
        field: z.string().describe("Dot-path to the field"),
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

const emptySource = {
  document_url: null,
  landing_page_url: null,
  retrieved_at: null,
  original_filename: null,
};

/** Full stored record: agent extraction + CLI/agent-provided source links. */
export const stormwaterSchema = extractionSchema.extend({
  source: sourceSchema.default(emptySource),
});

export type StormwaterData = z.infer<typeof stormwaterSchema>;
export type StormwaterExtraction = z.infer<typeof extractionSchema>;
export type DocumentSource = z.infer<typeof sourceSchema>;
