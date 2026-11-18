import path from "node:path";
import { z } from "zod";

export const QA_DIR = path.resolve(process.cwd(), "data/qa");
export const QA_EVIDENCE_PATH = path.join(QA_DIR, "evidence.json");

export const qaWarningSchema = z.object({
  field: z.string(),
  kind: z.enum(["no_evidence", "value_not_in_excerpt"]),
  detail: z.string(),
});
export type QaWarning = z.infer<typeof qaWarningSchema>;

export const excerptQaSchema = z.object({
  field: z.string(),
  status: z.enum(["exact", "fuzzy", "unverifiable", "fail"]),
  score: z.number(),
  /** 1-based PDF page index where the excerpt was found. */
  page: z.number().int().nullable(),
  missing_numbers: z.array(z.string()),
  /** Different numbers the source shows at that spot (a contradiction). */
  source_numbers: z.array(z.string()).optional(),
  /** Unverifiable from text, but checked by eye on the page image (date). */
  visual_check: z.string().optional(),
});
export type ExcerptQa = z.infer<typeof excerptQaSchema>;

export const evidenceQaRecordSchema = z.object({
  slug: z.string(),
  checked_at: z.string(),
  corpus_pages: z.number().int(),
  /** How many independent text extractions were checked (1 or 2). */
  text_sources: z.number().int().optional(),
  status: z.enum(["passed", "warnings", "failed"]),
  counts: z.object({
    exact: z.number(),
    fuzzy: z.number(),
    unverifiable: z.number(),
    fail: z.number(),
  }),
  /** Same order as the document's evidence array. */
  excerpts: z.array(excerptQaSchema),
  warnings: z.array(qaWarningSchema),
});
export type EvidenceQaRecord = z.infer<typeof evidenceQaRecordSchema>;

export const evidenceQaFileSchema = z.object({
  version: z.literal(1),
  generated_at: z.string(),
  records: z.record(z.string(), evidenceQaRecordSchema),
  /** Quotes cited by data/national drafts and practice matrices. */
  national: z
    .object({
      counts: z.object({
        exact: z.number(),
        fuzzy: z.number(),
        unverifiable: z.number(),
        fail: z.number(),
        unchecked: z.number(),
      }),
      failing: z.array(z.object({ file: z.string(), slug: z.string(), excerpt: z.string() })),
    })
    .optional(),
});
export type EvidenceQaFile = z.infer<typeof evidenceQaFileSchema>;
