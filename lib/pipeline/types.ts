import { z } from "zod";

/** Lifecycle status for any pipeline step. */
export const stepStatusSchema = z.enum([
  "pending",
  "running",
  "done",
  "failed",
  "skipped",
]);

export type StepStatus = z.infer<typeof stepStatusSchema>;

export const documentScopeSchema = z.enum([
  "full_manual",
  "chapter_only",
  "volume_only",
  "esc_construction_only",
  "bmp_catalog_only",
  "hydrology_only",
  "other",
]);

export type DocumentScope = z.infer<typeof documentScopeSchema>;

export const corpusTocEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.number().int().min(1).max(6),
  page_start: z.number().int().min(1),
  page_end: z.number().int().min(1).nullable(),
});

export const corpusStructureSchema = z.object({
  document_scope: documentScopeSchema,
  document_title_normalized: z.string(),
  jurisdiction_name: z.string(),
  jurisdiction_level: z.enum([
    "state",
    "county",
    "municipality",
    "special_district",
    "tribal",
    "other",
  ]),
  state_code: z.string().nullable(),
  topics_present: z.array(z.string()),
  toc: z.array(corpusTocEntrySchema),
  quality_flags: z.array(z.string()),
  model: z.string().optional(),
  generated_at: z.string(),
});

export type CorpusStructure = z.infer<typeof corpusStructureSchema>;

export const corpusChunkSchema = z.object({
  chunk_id: z.string(),
  section_id: z.string(),
  section_title: z.string(),
  page_start: z.number().int().min(1),
  page_end: z.number().int().min(1),
  text: z.string(),
  summary: z.string().nullable(),
  topic_tags: z.array(z.string()),
  contains_requirements: z.boolean(),
  requirement_types: z.array(z.string()),
  char_count: z.number().int(),
});

export type CorpusChunk = z.infer<typeof corpusChunkSchema>;

export const corpusManifestSchema = z.object({
  slug: z.string(),
  queue_id: z.string(),
  total_pages: z.number().int(),
  total_chunks: z.number().int(),
  char_count: z.number().int(),
  structure: corpusStructureSchema,
  generated_at: z.string(),
  pipeline_version: z.literal(1),
});

export type CorpusManifest = z.infer<typeof corpusManifestSchema>;

export const outlineSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  level: z.number().int().min(1).max(3),
  parent_id: z.string().nullable(),
  prevalence: z.number().min(0).max(1).nullable(),
  topic_tags: z.array(z.string()),
  source_manual_count: z.number().int().nullable(),
  regional_notes: z.array(z.string()),
  summary: z.string().nullable(),
});

export const nationalOutlineSchema = z.object({
  version: z.number().int(),
  title: z.string(),
  generated_at: z.string(),
  model: z.string().optional(),
  sections: z.array(outlineSectionSchema),
});

export type NationalOutline = z.infer<typeof nationalOutlineSchema>;

export const draftCitationSchema = z.object({
  slug: z.string(),
  chunk_id: z.string().nullable(),
  page_or_section: z.string().nullable(),
  excerpt: z.string(),
});

export const draftSectionSchema = z.object({
  section_id: z.string(),
  title: z.string(),
  generated_at: z.string(),
  model: z.string().optional(),
  practice_survey: z.string(),
  draft_recommendation: z.string(),
  regional_variants: z.string().nullable(),
  open_issues: z.string().nullable(),
  citations: z.array(draftCitationSchema),
  supporting_slugs: z.array(z.string()),
});

export type DraftSection = z.infer<typeof draftSectionSchema>;

export const stageProgressSchema = z.object({
  status: stepStatusSchema,
  updatedAt: z.string(),
  startedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  error: z.string().nullable().optional(),
  substeps: z.record(z.string(), stepStatusSchema).optional(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type StageProgress = z.infer<typeof stageProgressSchema>;

export const jobProgressSchema = z.object({
  id: z.string(),
  slug: z.string().nullable().optional(),
  stages: z.object({
    prepare: stageProgressSchema,
    corpus: stageProgressSchema,
    extract: stageProgressSchema,
    verify: stageProgressSchema,
  }),
});

export type JobProgress = z.infer<typeof jobProgressSchema>;

export const pipelineProgressSchema = z.object({
  version: z.literal(1),
  updatedAt: z.string(),
  jobs: z.record(z.string(), jobProgressSchema),
  outline: stageProgressSchema,
  draft: z.object({
    status: stepStatusSchema,
    updatedAt: z.string(),
    sections: z.record(z.string(), stageProgressSchema),
  }),
});

export type PipelineProgress = z.infer<typeof pipelineProgressSchema>;

export const CORPUS_SUBSTEPS = [
  "pages",
  "structure",
  "chunks",
  "tagging",
  "manifest",
] as const;

export type CorpusSubstep = (typeof CORPUS_SUBSTEPS)[number];

export function emptyStage(status: StepStatus = "pending"): StageProgress {
  return {
    status,
    updatedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    error: null,
    substeps: {},
    meta: {},
  };
}

export function emptyJob(id: string): JobProgress {
  return {
    id,
    slug: null,
    stages: {
      prepare: emptyStage(),
      corpus: {
        ...emptyStage(),
        substeps: Object.fromEntries(
          CORPUS_SUBSTEPS.map((s) => [s, "pending" as StepStatus])
        ),
      },
      extract: emptyStage(),
      verify: emptyStage(),
    },
  };
}

export function emptyPipelineProgress(): PipelineProgress {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    jobs: {},
    outline: emptyStage(),
    draft: {
      status: "pending",
      updatedAt: new Date().toISOString(),
      sections: {},
    },
  };
}

export interface ManifestJob {
  id: string;
  jurisdictionHint: string;
  levelHint: string;
  pdfUrl: string | null;
  landingPageUrl: string | null;
  cityCoords: [number, number] | null;
  notes?: string;
}

export interface PipelineCliOptions {
  ids: string[];
  stage: string | null;
  force: boolean;
  dryRun: boolean;
}
