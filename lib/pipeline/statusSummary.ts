import { existsSync, readFileSync } from "node:fs";
import {
  emptyPipelineProgress,
  pipelineProgressSchema,
  type JobProgress,
  type StepStatus,
} from "./types";
import { PROGRESS_PATH } from "./paths";
import { getTierASlugSet } from "../national/tierA";
import { getAllDraftSections } from "../national";

export type StageCountKey =
  | "done"
  | "running"
  | "pending"
  | "failed"
  | "skipped";

export type StageCounts = Record<StageCountKey, number>;

export interface PipelineFailedJob {
  id: string;
  slug: string | null;
  stage: string;
  error: string | null;
}

export interface PipelineStatusSummary {
  updatedAt: string | null;
  jobCount: number;
  stages: {
    prepare: StageCounts;
    corpus: StageCounts;
    extract: StageCounts;
    verify: StageCounts;
  };
  /** Verify counts restricted to Tier A evidence anchors. */
  tierAVerify: StageCounts & { total: number };
  outline: { status: StepStatus; error: string | null };
  draft: {
    status: StepStatus;
    done: number;
    total: number;
    reviewed: number;
  };
  failed: PipelineFailedJob[];
}

const EMPTY_COUNTS = (): StageCounts => ({
  done: 0,
  running: 0,
  pending: 0,
  failed: 0,
  skipped: 0,
});

function tally(jobs: JobProgress[], pick: (j: JobProgress) => StepStatus): StageCounts {
  const counts = EMPTY_COUNTS();
  for (const job of jobs) {
    const st = pick(job);
    counts[st] = (counts[st] ?? 0) + 1;
  }
  return counts;
}

let cachedSummary: PipelineStatusSummary | null | undefined;

/** Clear module cache (tests / after mutating pipeline progress). */
export function clearPipelineStatusCache(): void {
  cachedSummary = undefined;
}

export function getPipelineStatusSummary(): PipelineStatusSummary | null {
  if (cachedSummary !== undefined) return cachedSummary;

  if (!existsSync(PROGRESS_PATH)) {
    cachedSummary = null;
    return null;
  }
  try {
    const raw = JSON.parse(readFileSync(PROGRESS_PATH, "utf-8"));
    const parsed = pipelineProgressSchema.safeParse(raw);
    const progress = parsed.success ? parsed.data : emptyPipelineProgress();
    const jobs = Object.values(progress.jobs);

    const failed: PipelineFailedJob[] = [];
    for (const job of jobs) {
      for (const stage of ["prepare", "corpus", "extract", "verify"] as const) {
        const s = job.stages[stage];
        if (s.status === "failed") {
          failed.push({
            id: job.id,
            slug: job.slug ?? null,
            stage,
            error: s.error ?? null,
          });
        }
      }
    }

    const draftSections = Object.values(progress.draft.sections);
    const tierA = getTierASlugSet();
    const tierAJobs = jobs.filter(
      (j) => tierA.has(j.slug ?? "") || tierA.has(j.id)
    );
    const reviewedCount = getAllDraftSections().filter(
      (d) => d.editorial_status === "reviewed"
    ).length;

    cachedSummary = {
      updatedAt: progress.updatedAt,
      jobCount: jobs.length,
      stages: {
        prepare: tally(jobs, (j) => j.stages.prepare.status),
        corpus: tally(jobs, (j) => j.stages.corpus.status),
        extract: tally(jobs, (j) => j.stages.extract.status),
        verify: tally(jobs, (j) => j.stages.verify.status),
      },
      tierAVerify: {
        ...tally(tierAJobs, (j) => j.stages.verify.status),
        total: tierAJobs.length,
      },
      outline: {
        status: progress.outline.status,
        error: progress.outline.error ?? null,
      },
      draft: {
        status: progress.draft.status,
        done: draftSections.filter((s) => s.status === "done").length,
        total: draftSections.length,
        reviewed: reviewedCount,
      },
      failed,
    };
    return cachedSummary;
  } catch {
    cachedSummary = null;
    return null;
  }
}
