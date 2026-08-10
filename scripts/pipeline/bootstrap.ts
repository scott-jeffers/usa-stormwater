import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import {
  DOCUMENTS_DIR,
  QUEUE_PROGRESS_PATH,
} from "../../lib/pipeline/paths";
import type { PipelineProgressStore } from "../../lib/pipeline/progress";
import type { ManifestJob } from "../../lib/pipeline/types";

interface QueueProgressEntry {
  status?: string;
  slug?: string | null;
  error?: string | null;
}

type QueueProgressMap = Record<string, QueueProgressEntry>;

async function loadQueueProgress(): Promise<QueueProgressMap> {
  if (!existsSync(QUEUE_PROGRESS_PATH)) return {};
  const { readFile } = await import("node:fs/promises");
  return JSON.parse(await readFile(QUEUE_PROGRESS_PATH, "utf-8")) as QueueProgressMap;
}

async function listDocumentSlugs(): Promise<Set<string>> {
  if (!existsSync(DOCUMENTS_DIR)) return new Set();
  const files = await readdir(DOCUMENTS_DIR);
  return new Set(
    files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""))
  );
}

/**
 * On first run (and later), mark prepare/extract done for manuals that already
 * exist so we don't re-process curated atlas records. Only fills pending stages.
 */
export async function bootstrapPipelineProgress(
  store: PipelineProgressStore,
  manifest: ManifestJob[]
): Promise<{ prepared: number; extracted: number }> {
  const queueProgress = await loadQueueProgress();
  const documentSlugs = await listDocumentSlugs();
  let prepared = 0;
  let extracted = 0;
  const now = new Date().toISOString();

  for (const job of manifest) {
    const jobProg = store.ensureJob(job.id);
    const qp = queueProgress[job.id];
    const slug =
      jobProg.slug ??
      qp?.slug ??
      (documentSlugs.has(job.id) ? job.id : null);

    if (slug) {
      store.setJobSlug(job.id, slug);
    }

    const pdfReady =
      qp?.status === "prepared" ||
      qp?.status === "done" ||
      existsSync(path.resolve(process.cwd(), "samples/queue", `${job.id}.pdf`));

    const shouldSkip =
      qp?.status === "skipped" || (!job.pdfUrl && !pdfReady);

    if (shouldSkip) {
      for (const stage of ["prepare", "corpus", "extract", "verify"] as const) {
        if (jobProg.stages[stage].status === "pending") {
          store.setStage(job.id, stage, {
            status: "skipped",
            error:
              stage === "prepare"
                ? (qp?.error ?? job.notes ?? "skipped_no_single_pdf")
                : "prepare_skipped",
            completedAt: now,
          });
        }
      }
      continue;
    }

    if (pdfReady && jobProg.stages.prepare.status === "pending") {
      store.setStage(job.id, "prepare", {
        status: "done",
        completedAt: now,
        meta: { bootstrapped: true },
      });
      prepared += 1;
    }

    const hasDoc =
      (slug != null && documentSlugs.has(slug)) || documentSlugs.has(job.id);
    if (hasDoc && jobProg.stages.extract.status === "pending") {
      store.setStage(job.id, "extract", {
        status: "done",
        completedAt: now,
        meta: { bootstrapped: true },
      });
      extracted += 1;
    }
  }

  await store.save();
  return { prepared, extracted };
}
