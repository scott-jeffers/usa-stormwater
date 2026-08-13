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
import { isPermanentHttpError } from "./shared";

const DOWNLOAD_TIMEOUT_MS = 180_000;

export async function downloadPdf(url: string, destPath: string): Promise<void> {
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

/** Ensure samples/queue/{id}.pdf exists; download if needed. */
export async function ensureJobPdf(job: ManifestJob): Promise<string> {
  const pdfPath = samplesQueuePath(job.id, "pdf");
  if (existsSync(pdfPath)) return pdfPath;
  if (!job.pdfUrl) {
    throw new Error(`PDF missing and no pdfUrl for ${job.id}`);
  }
  console.log(`[${job.id}] Downloading PDF...`);
  await downloadPdf(job.pdfUrl, pdfPath);
  return pdfPath;
}

export async function runPrepareStage(
  store: PipelineProgressStore,
  job: ManifestJob,
  opts: { force: boolean; dryRun: boolean }
): Promise<"done" | "skipped" | "failed" | "noop"> {
  const current = store.ensureJob(job.id).stages.prepare;
  const pdfPath = samplesQueuePath(job.id, "pdf");
  const pdfMissing = !existsSync(pdfPath);

  // Re-run prepare when bootstrapped "done" but PDF was never downloaded locally
  if (
    !opts.force &&
    current.status === "done" &&
    !pdfMissing
  ) {
    return "noop";
  }
  if (!opts.force && current.status === "skipped") {
    return "noop";
  }
  if (
    !opts.force &&
    current.status === "failed" &&
    isPermanentHttpError(current.error ?? "")
  ) {
    store.setStage(job.id, "prepare", {
      status: "skipped",
      error: `http_404: ${current.error}`,
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      id: job.id,
      stage: "prepare",
      status: "skipped",
      detail: current.error,
    });
    return "skipped";
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
    await ensureJobPdf(job);
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
    const permanent = isPermanentHttpError(message);
    store.setStage(job.id, "prepare", {
      status: permanent ? "skipped" : "failed",
      error: permanent ? `http_404: ${message}` : message,
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      id: job.id,
      stage: "prepare",
      status: permanent ? "skipped" : "failed",
      detail: message,
    });
    console.error(
      `[${job.id}] prepare ${permanent ? "skipped (dead URL)" : "failed"}: ${message}`
    );
    return permanent ? "skipped" : "failed";
  }
}
