import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  emptyJob,
  emptyPipelineProgress,
  emptyStage,
  pipelineProgressSchema,
  type CorpusSubstep,
  type JobProgress,
  type PipelineProgress,
  type StageProgress,
  type StepStatus,
} from "./types";
import { PIPELINE_DIR, PROGRESS_PATH, RUN_LOG_PATH, STATUS_PATH } from "./paths";

async function loadJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(await readFile(filePath, "utf-8")) as T;
}

export class PipelineProgressStore {
  private data: PipelineProgress;
  private dirty = false;

  private constructor(data: PipelineProgress) {
    this.data = data;
  }

  static async load(): Promise<PipelineProgressStore> {
    await mkdir(PIPELINE_DIR, { recursive: true });
    const raw = await loadJsonFile(PROGRESS_PATH, emptyPipelineProgress());
    const parsed = pipelineProgressSchema.safeParse(raw);
    const data = parsed.success ? parsed.data : emptyPipelineProgress();
    return new PipelineProgressStore(data);
  }

  get snapshot(): PipelineProgress {
    return this.data;
  }

  ensureJob(id: string): JobProgress {
    if (!this.data.jobs[id]) {
      this.data.jobs[id] = emptyJob(id);
      this.dirty = true;
    }
    return this.data.jobs[id];
  }

  async log(event: Record<string, unknown>): Promise<void> {
    await mkdir(PIPELINE_DIR, { recursive: true });
    await appendFile(
      RUN_LOG_PATH,
      JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n",
      "utf-8"
    );
  }

  setJobSlug(id: string, slug: string): void {
    const job = this.ensureJob(id);
    job.slug = slug;
    this.touch();
  }

  setStage(
    id: string,
    stage: keyof JobProgress["stages"],
    patch: Partial<StageProgress> & { status?: StepStatus }
  ): void {
    const job = this.ensureJob(id);
    const current = job.stages[stage];
    job.stages[stage] = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
      substeps: patch.substeps ?? current.substeps,
      meta: { ...(current.meta ?? {}), ...(patch.meta ?? {}) },
    };
    this.touch();
  }

  setCorpusSubstep(
    id: string,
    substep: CorpusSubstep,
    status: StepStatus,
    error?: string | null
  ): void {
    const job = this.ensureJob(id);
    const corpus = job.stages.corpus;
    const substeps = { ...(corpus.substeps ?? {}), [substep]: status };
    const values = Object.values(substeps);
    const allDone = values.every((s) => s === "done" || s === "skipped");
    const anyFailed = values.some((s) => s === "failed");
    const anyRunning = values.some((s) => s === "running");

    let corpusStatus: StepStatus = corpus.status;
    if (anyFailed) corpusStatus = "failed";
    else if (allDone) corpusStatus = "done";
    else if (anyRunning) corpusStatus = "running";
    else corpusStatus = "pending";

    const now = new Date().toISOString();
    job.stages.corpus = {
      ...corpus,
      status: corpusStatus,
      substeps,
      updatedAt: now,
      error: error !== undefined ? error : corpus.error,
      completedAt: corpusStatus === "done" ? now : corpus.completedAt,
    };
    this.touch();
  }

  setOutline(patch: Partial<StageProgress> & { status?: StepStatus }): void {
    this.data.outline = {
      ...this.data.outline,
      ...patch,
      updatedAt: new Date().toISOString(),
      meta: { ...(this.data.outline.meta ?? {}), ...(patch.meta ?? {}) },
    };
    this.touch();
  }

  setDraftSection(
    sectionId: string,
    patch: Partial<StageProgress> & { status?: StepStatus }
  ): void {
    const current = this.data.draft.sections[sectionId] ?? emptyStage();
    this.data.draft.sections[sectionId] = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
      meta: { ...(current.meta ?? {}), ...(patch.meta ?? {}) },
    };
    this.data.draft.updatedAt = new Date().toISOString();

    const sections = Object.values(this.data.draft.sections);
    if (sections.length === 0) {
      this.data.draft.status = "pending";
    } else if (sections.every((s) => s.status === "done")) {
      this.data.draft.status = "done";
    } else if (sections.some((s) => s.status === "failed")) {
      this.data.draft.status = "failed";
    } else if (sections.some((s) => s.status === "running")) {
      this.data.draft.status = "running";
    } else {
      this.data.draft.status = "pending";
    }
    this.touch();
  }

  private touch(): void {
    this.data.updatedAt = new Date().toISOString();
    this.dirty = true;
  }

  async save(): Promise<void> {
    if (!this.dirty) return;
    await mkdir(PIPELINE_DIR, { recursive: true });
    await writeFile(
      PROGRESS_PATH,
      JSON.stringify(this.data, null, 2) + "\n",
      "utf-8"
    );
    this.dirty = false;
  }

  async saveAndLog(event: Record<string, unknown>): Promise<void> {
    await this.save();
    await this.log(event);
  }
}

export async function writeStatusReport(
  progress: PipelineProgress
): Promise<void> {
  const jobs = Object.values(progress.jobs);
  const countBy = (fn: (j: JobProgress) => StepStatus) => {
    const tally: Record<string, number> = {};
    for (const job of jobs) {
      const st = fn(job);
      tally[st] = (tally[st] ?? 0) + 1;
    }
    return tally;
  };

  const prepare = countBy((j) => j.stages.prepare.status);
  const corpus = countBy((j) => j.stages.corpus.status);
  const extract = countBy((j) => j.stages.extract.status);
  const verify = countBy((j) => j.stages.verify.status);

  const runningJobs = jobs.filter(
    (j) =>
      j.stages.prepare.status === "running" ||
      j.stages.corpus.status === "running" ||
      j.stages.extract.status === "running" ||
      j.stages.verify.status === "running"
  );

  const failedJobs = jobs.filter(
    (j) =>
      j.stages.prepare.status === "failed" ||
      j.stages.corpus.status === "failed" ||
      j.stages.extract.status === "failed" ||
      j.stages.verify.status === "failed"
  );

  const draftSections = Object.entries(progress.draft.sections);
  const draftDone = draftSections.filter(([, s]) => s.status === "done").length;

  const body = `# Pipeline status

Updated: ${progress.updatedAt}

Resume with: \`npm run pipeline:run\` or \`npm run pipeline:status\`

## Per-manual stages

| Stage | done | running | pending | failed | skipped |
|-------|-----:|--------:|--------:|-------:|--------:|
| prepare | ${prepare.done ?? 0} | ${prepare.running ?? 0} | ${prepare.pending ?? 0} | ${prepare.failed ?? 0} | ${prepare.skipped ?? 0} |
| corpus | ${corpus.done ?? 0} | ${corpus.running ?? 0} | ${corpus.pending ?? 0} | ${corpus.failed ?? 0} | ${corpus.skipped ?? 0} |
| extract | ${extract.done ?? 0} | ${extract.running ?? 0} | ${extract.pending ?? 0} | ${extract.failed ?? 0} | ${extract.skipped ?? 0} |
| verify | ${verify.done ?? 0} | ${verify.running ?? 0} | ${verify.pending ?? 0} | ${verify.failed ?? 0} | ${verify.skipped ?? 0} |

## Global stages

| Stage | Status |
|-------|--------|
| outline | ${progress.outline.status}${progress.outline.error ? ` — ${progress.outline.error}` : ""} |
| draft | ${progress.draft.status} (${draftDone}/${draftSections.length} sections done) |

## Currently running

${runningJobs.length ? runningJobs.map((j) => `- \`${j.id}\``).join("\n") : "_none_"}

## Failed (retry with \`npm run pipeline:run -- <id> --force\`)

${
  failedJobs.length
    ? failedJobs
        .map((j) => {
          const errs = [
            j.stages.prepare.status === "failed"
              ? `prepare: ${j.stages.prepare.error}`
              : null,
            j.stages.corpus.status === "failed"
              ? `corpus: ${j.stages.corpus.error}`
              : null,
            j.stages.extract.status === "failed"
              ? `extract: ${j.stages.extract.error}`
              : null,
            j.stages.verify.status === "failed"
              ? `verify: ${j.stages.verify.error}`
              : null,
          ].filter(Boolean);
          return `- \`${j.id}\` — ${errs.join("; ")}`;
        })
        .join("\n")
    : "_none_"
}

## Corpus substeps in progress

${
  jobs
    .filter(
      (j) =>
        j.stages.corpus.status === "running" ||
        (j.stages.corpus.substeps &&
          Object.values(j.stages.corpus.substeps).includes("running"))
    )
    .map((j) => {
      const subs = j.stages.corpus.substeps ?? {};
      const active = Object.entries(subs)
        .filter(([, st]) => st === "running" || st === "pending")
        .map(([k, st]) => `${k}:${st}`)
        .join(", ");
      return `- \`${j.id}\` — ${active || j.stages.corpus.status}`;
    })
    .join("\n") || "_none_"
}

## Log

Append-only: \`data/pipeline/run-log.jsonl\`
Progress state: \`data/pipeline/progress.json\`
`;

  await mkdir(PIPELINE_DIR, { recursive: true });
  await writeFile(STATUS_PATH, body, "utf-8");
}
