/**
 * Practice matrix + Base/Modifier synthesis schemas.
 */
import { z } from "zod";

export const practiceMatrixCellSchema = z.object({
  slug: z.string(),
  state_code: z.string().nullable(),
  jurisdiction_name: z.string(),
  value: z.number().nullable(),
  chapter_proxy: z.boolean().optional(),
  excerpt: z.string().nullable().optional(),
});

export type PracticeMatrixCell = z.infer<typeof practiceMatrixCellSchema>;

export const practiceNumericStatSchema = z.object({
  field: z.string(),
  label: z.string(),
  unit: z.string(),
  values: z.array(z.number()),
  min: z.number().nullable(),
  max: z.number().nullable(),
  mode: z.number().nullable(),
  median: z.number().nullable(),
  count: z.number().int(),
  missing_count: z.number().int(),
  cells: z.array(practiceMatrixCellSchema),
});

export type PracticeNumericStat = z.infer<typeof practiceNumericStatSchema>;

export const practiceMatrixSchema = z.object({
  version: z.literal(1),
  practice_key: z.string(),
  practice_label: z.string(),
  generated_at: z.string(),
  tier_a_only: z.boolean(),
  manuals_with_practice: z.number().int(),
  manuals_scanned: z.number().int(),
  numeric_fields: z.array(practiceNumericStatSchema),
  mentioning_slugs: z.array(z.string()),
  notes: z.array(z.string()),
});

export type PracticeMatrix = z.infer<typeof practiceMatrixSchema>;

export const regionalModifierSchema = z.object({
  id: z.string(),
  title: z.string(),
  text: z.string(),
  states: z.array(z.string()),
  citation_slugs: z.array(z.string()),
});

export type RegionalModifier = z.infer<typeof regionalModifierSchema>;

export const practiceSynthesisSchema = z.object({
  version: z.literal(1),
  practice_key: z.string(),
  practice_label: z.string(),
  generated_at: z.string(),
  model: z.string().optional(),
  editorial_status: z.enum(["draft", "reviewed"]).optional(),
  national_baseline: z.string(),
  regional_modifiers: z.array(regionalModifierSchema),
  open_issues: z.string().nullable(),
  matrix_summary: z.string().nullable().optional(),
  supporting_slugs: z.array(z.string()),
});

export type PracticeSynthesis = z.infer<typeof practiceSynthesisSchema>;

/** LLM output only — matrix numbers are injected by the script. */
export const practiceSynthesisLlmSchema = z.object({
  national_baseline: z.string(),
  regional_modifiers: z.array(regionalModifierSchema),
  open_issues: z.string().nullable(),
  matrix_summary: z.string().nullable(),
});
