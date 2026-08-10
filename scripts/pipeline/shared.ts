/**
 * Shared helpers for pipeline stages: load manifest, delay, stage gating.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { MANIFEST_PATH } from "../../lib/pipeline/paths";
import type { ManifestJob, PipelineCliOptions } from "../../lib/pipeline/types";
import { sleep } from "../../lib/pipeline/cli";
import { loadEnvLocal } from "../lib/loadEnv";

export async function loadManifest(): Promise<ManifestJob[]> {
  if (!existsSync(MANIFEST_PATH)) return [];
  return JSON.parse(await readFile(MANIFEST_PATH, "utf-8")) as ManifestJob[];
}

export function filterJobs(
  manifest: ManifestJob[],
  opts: PipelineCliOptions
): ManifestJob[] {
  if (!opts.ids.length) return manifest;
  const set = new Set(opts.ids);
  return manifest.filter((j) => set.has(j.id));
}

export function shouldRunStage(
  status: string,
  force: boolean
): boolean {
  if (force) return status !== "running";
  return status === "pending" || status === "failed";
}

export async function pipelineDelay(): Promise<void> {
  loadEnvLocal();
  const ms = Number(process.env.PIPELINE_DELAY_MS ?? "2000");
  if (ms > 0) await sleep(ms);
}
