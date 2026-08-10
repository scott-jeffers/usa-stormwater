/**
 * Pipeline prepare stage: ensure PDF exists under samples/queue/{id}.pdf
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  assertPdfLooksValid,
  samplesQueuePath,
} from "../lib/pdfText";
import type { PipelineProgressStore } from "../../lib/pipeline/progress";
import type { ManifestJob } from "../../lib/pipeline/types";

const DOWNLOAD_TIMEOUT_MS = 180_000;

async function downloadPdf(url: string, destPath: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "stormwater-atlas-pipeline/0.1 (research; local batch)",
        Accept: "application/pdf,*/*",
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const buf = Buffer.from(await res.arrayBuffer());
    assertPdfLooksValid(buf);
    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, buf);
  } finally {
    clearTimeout(timer);
  }
}

export async function runPrepareStage(
  store: PipelineProgressStore,
  job: ManifestJob,
  opts: { force: boolean; dryRun: boolean }
): Promise<"done" | "skipped" | "failed" | "noop"> {
  const current = store.ensureJob(job.id).stages.prepare;
  if (!opts.force && (current.status === "done" || current.status === "skipped")) {
    return "noop";
  }

  if (!job.pdfUrl) {
    store.setStage(job.id, "prepare", {
      status: "skipped",
      error: job.notes ?? "skipped_no_single_pdf",
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      id: job.id,
      stage: "prepare",
      status: "skipped",
      detail: job.notes ?? "skipped_no_single_pdf",
    });
    return "skipped";
  }

  const pdfPath = samplesQueuePath(job.id, "pdf");
  if (opts.dryRun) {
    console.log(`[${job.id}] dry-run prepare → ${pdfPath}`);
    return "noop";
  }

  const now = new Date().toISOString();
  store.setStage(job.id, "prepare", {
    status: "running",
    startedAt: now,
    error: null,
  });
  await store.saveAndLog({ id: job.id, stage: "prepare", status: "running" });

  try {
    if (!existsSync(pdfPath)) {
      console.log(`[${job.id}] Downloading PDF...`);
      await downloadPdf(job.pdfUrl, pdfPath);
    } else {
      console.log(`[${job.id}] Using existing PDF`);
    }
    store.setJobSlug(job.id, job.id);
    store.setStage(job.id, "prepare", {
      status: "done",
      completedAt: new Date().toISOString(),
      error: null,
      meta: { pdfPath },
    });
    await store.saveAndLog({
      id: job.id,
      stage: "prepare",
      status: "done",
    });
    return "done";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setStage(job.id, "prepare", {
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      id: job.id,
      stage: "prepare",
      status: "failed",
      detail: message,
    });
    console.error(`[${job.id}] prepare failed: ${message}`);
    return "failed";
  }
}
