/**
 * Master pipeline orchestrator — resume-safe set-and-forget runner.
 *
 *   npm run pipeline:run
 *   npm run pipeline:run -- portland-or --stage corpus
 *   npm run pipeline:run -- --force --dry-run
 */
import {
  PipelineProgressStore,
  writeStatusReport,
} from "../../lib/pipeline/progress";
import { parsePipelineArgs } from "../../lib/pipeline/cli";
import { loadEnvLocal } from "../lib/loadEnv";
import { bootstrapPipelineProgress } from "./bootstrap";
import { filterJobs, loadManifest, shouldRunStage } from "./shared";
import { runPrepareStage } from "./prepareStage";
import { runCorpusStage } from "./corpus";
import { runExtractStage } from "./extract";
import { runVerifyStage } from "./verify";
import { runOutlineStage } from "./outline";
import { runDraftStage } from "./draft";

const STAGES = [
  "prepare",
  "corpus",
  "extract",
  "verify",
  "outline",
  "draft",
] as const;

type StageName = (typeof STAGES)[number];

function wantsStage(requested: string | null, name: StageName): boolean {
  if (!requested) return true;
  return requested === name;
}

async function main() {
  loadEnvLocal();
  const opts = parsePipelineArgs(process.argv.slice(2));

  if (opts.stage && !STAGES.includes(opts.stage as StageName)) {
    console.error(
      `Unknown stage "${opts.stage}". Expected one of: ${STAGES.join(", ")}`
    );
    process.exit(1);
  }

  const store = await PipelineProgressStore.load();
  const manifest = await loadManifest();
  if (manifest.length === 0) {
    console.error("No jobs in data/queue/manifest.json");
    process.exit(1);
  }

  const boot = await bootstrapPipelineProgress(store, manifest);
  if (boot.prepared || boot.extracted) {
    console.log(
      `Bootstrapped existing work: prepare=${boot.prepared}, extract=${boot.extracted}`
    );
  }

  const jobs = filterJobs(manifest, opts);
  console.log(
    `Pipeline run — ${jobs.length} job(s)` +
      (opts.stage ? `, stage=${opts.stage}` : ", all stages") +
      (opts.force ? ", force" : "") +
      (opts.dryRun ? ", dry-run" : "")
  );

  let failures = 0;

  // Per-manual stages
  for (const job of jobs) {
    store.ensureJob(job.id);

    if (wantsStage(opts.stage, "prepare")) {
      const st = store.ensureJob(job.id).stages.prepare.status;
      if (shouldRunStage(st, opts.force) || opts.dryRun) {
        const r = await runPrepareStage(store, job, opts);
        if (r === "failed") failures += 1;
      }
    }

    if (wantsStage(opts.stage, "corpus")) {
      const st = store.ensureJob(job.id).stages.corpus.status;
      if (shouldRunStage(st, opts.force) || opts.dryRun) {
        const r = await runCorpusStage(store, job, opts);
        if (r === "failed") failures += 1;
      }
    }

    if (wantsStage(opts.stage, "extract")) {
      const st = store.ensureJob(job.id).stages.extract.status;
      if (shouldRunStage(st, opts.force) || opts.dryRun) {
        const r = await runExtractStage(store, job, opts);
        if (r === "failed") failures += 1;
      }
    }

    if (wantsStage(opts.stage, "verify")) {
      const st = store.ensureJob(job.id).stages.verify.status;
      if (shouldRunStage(st, opts.force) || opts.dryRun) {
        const r = await runVerifyStage(store, job, opts);
        if (r === "failed") failures += 1;
      }
    }
  }

  // Global stages (only when not targeting a single per-manual stage without globals,
  // or when explicitly requested / running all)
  const runGlobals =
    !opts.stage || opts.stage === "outline" || opts.stage === "draft";

  if (runGlobals && wantsStage(opts.stage, "outline")) {
    // Require at least some corpus done unless force
    const corpusDone = Object.values(store.snapshot.jobs).filter(
      (j) => j.stages.corpus.status === "done"
    ).length;
    if (corpusDone === 0 && !opts.force && !opts.dryRun) {
      console.log("outline deferred — no corpus-complete manuals yet");
    } else {
      const outlineStatus = store.snapshot.outline.status;
      if (shouldRunStage(outlineStatus, opts.force) || opts.dryRun) {
        const r = await runOutlineStage(store, opts);
        if (r === "failed") failures += 1;
      }
    }
  }

  if (runGlobals && wantsStage(opts.stage, "draft")) {
    if (store.snapshot.outline.status !== "done" && !opts.dryRun && !opts.force) {
      console.log("draft deferred — outline not done");
    } else {
      const r = await runDraftStage(store, {
        force: opts.force,
        dryRun: opts.dryRun,
        sectionIds: opts.ids.length && opts.stage === "draft" ? opts.ids : undefined,
      });
      failures += r.failed;
      console.log(
        `draft summary: done=${r.done}, failed=${r.failed}, skipped=${r.noop}`
      );
    }
  }

  await writeStatusReport(store.snapshot);
  console.log("\nStatus written to data/pipeline/STATUS.md");
  if (failures > 0) {
    console.error(`Completed with ${failures} failure(s). Re-run to resume.`);
    process.exit(2);
  }
  console.log("Pipeline pass complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
