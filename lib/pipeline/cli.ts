import type { PipelineCliOptions } from "./types";

const KNOWN_STAGES = new Set([
  "prepare",
  "corpus",
  "extract",
  "verify",
  "outline",
  "draft",
]);

export function parsePipelineArgs(argv: string[]): PipelineCliOptions {
  const ids: string[] = [];
  let stage: string | null = null;
  let force = false;
  let dryRun = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--force" || arg === "-force" || arg === "force") {
      force = true;
    } else if (arg === "--dry-run" || arg === "-dry-run" || arg === "dry-run") {
      dryRun = true;
    } else if (arg === "--stage" || arg.startsWith("--stage=") || arg === "-stage") {
      stage = arg.startsWith("--stage=")
        ? arg.slice("--stage=".length)
        : (argv[++i] ?? null);
    } else if (arg.startsWith("-") && !arg.startsWith("--")) {
      // ignore unknown short flags
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    } else if (!stage && KNOWN_STAGES.has(arg) && ids.length === 0) {
      // Windows/npm sometimes strips "--stage"; allow bare stage token first
      stage = arg;
    } else {
      ids.push(arg);
    }
  }

  // Env fallbacks (useful when shells eat --flags)
  if (!stage && process.env.PIPELINE_STAGE) {
    stage = process.env.PIPELINE_STAGE;
  }
  if (process.env.PIPELINE_DRY_RUN === "1" || process.env.PIPELINE_DRY_RUN === "true") {
    dryRun = true;
  }
  if (process.env.PIPELINE_FORCE === "1" || process.env.PIPELINE_FORCE === "true") {
    force = true;
  }

  return { ids, stage, force, dryRun };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
