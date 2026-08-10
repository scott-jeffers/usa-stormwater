/**
 * Print pipeline status and regenerate data/pipeline/STATUS.md
 *
 *   npm run pipeline:status
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  MANIFEST_PATH,
  STATUS_PATH,
} from "../../lib/pipeline/paths";
import {
  PipelineProgressStore,
  writeStatusReport,
} from "../../lib/pipeline/progress";
import type { ManifestJob } from "../../lib/pipeline/types";
import { bootstrapPipelineProgress } from "./bootstrap";

async function main() {
  const store = await PipelineProgressStore.load();
  const manifest: ManifestJob[] = existsSync(MANIFEST_PATH)
    ? (JSON.parse(await readFile(MANIFEST_PATH, "utf-8")) as ManifestJob[])
    : [];

  const boot = await bootstrapPipelineProgress(store, manifest);
  if (boot.prepared || boot.extracted) {
    console.log(
      `Bootstrapped: prepare=${boot.prepared}, extract=${boot.extracted}`
    );
  }

  await writeStatusReport(store.snapshot);
  const status = await readFile(STATUS_PATH, "utf-8");
  console.log(status);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
