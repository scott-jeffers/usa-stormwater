/**
 * Full overnight go: prepare → pipeline → repair excerpts → verify →
 * Cursor enrich (schema v2) → all practices → export.
 *
 *   npm run pipeline:cursor-login   # once, browser
 *   npm run overnight:go            # then sleep
 *   npx tsx scripts/pipeline/overnight-go.ts --heuristic   # offline fallback
 *
 * Only processes jobs already in data/queue/manifest.json — never auto-adds manuals.
 * Does not --force extract on existing atlas JSON.
 * Resume-safe. Log → data/pipeline/overnight-go.log; status → data/pipeline/GO.md
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { listCanonicalPracticeKeys } from "../../lib/ontology/bmp";
import { PIPELINE_DIR } from "../../lib/pipeline/paths";
import {
  assertPipelineModelAvailable,
  getPipelineModel,
} from "../lib/cursorLlm";
import { loadEnvLocal } from "../lib/loadEnv";
import { runEnrichParameters } from "./enrich-parameters";

const LOG_PATH = path.join(PIPELINE_DIR, "overnight-go.log");
const STATUS_PATH = path.join(PIPELINE_DIR, "GO.md");

function parseArgs(argv: string[]) {
  return { heuristic: argv.includes("--heuristic") };
}

function logLine(msg: string) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(msg);
  try {
    appendFileSync(LOG_PATH, line + "\n", "utf-8");
  } catch {
    /* ignore */
  }
}

function runNodeScript(
  scriptRel: string,
  args: string[] = [],
  envExtra: Record<string, string> = {}
): Promise<number> {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(process.cwd(), scriptRel);
    const child = spawn("npx", ["tsx", scriptPath, ...args], {
      cwd: process.cwd(),
      env: { ...process.env, ...envExtra },
      stdio: ["ignore", "pipe", "pipe"],
      shell: true,
    });
    child.stdout.on("data", (buf: Buffer) => {
      const text = buf.toString();
      process.stdout.write(text);
      try {
        appendFileSync(LOG_PATH, text, "utf-8");
      } catch {
        /* ignore */
      }
    });
    child.stderr.on("data", (buf: Buffer) => {
      const text = buf.toString();
      process.stderr.write(text);
      try {
        appendFileSync(LOG_PATH, text, "utf-8");
      } catch {
        /* ignore */
      }
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

function isSoftPipelineExit(code: number): boolean {
  return code === 0 || code === 2;
}

async function main() {
  loadEnvLocal();
  const { heuristic } = parseArgs(process.argv.slice(2));

  // Overnight go ignores .env PIPELINE_LLM unless --heuristic.
  process.env.PIPELINE_LLM = heuristic ? "heuristic" : "cursor";

  if (!heuristic) {
    await assertPipelineModelAvailable();
  }

  mkdirSync(PIPELINE_DIR, { recursive: true });
  writeFileSync(
    LOG_PATH,
    `overnight-go start ${new Date().toISOString()}\n`,
    "utf-8"
  );

  const llm = heuristic ? "heuristic" : "cursor";
  const model = getPipelineModel();
  logLine(`LLM=${llm} model=${model} (login ${heuristic ? "skipped" : "ok"})`);

  logLine("Step 1/7: prepare queue (existing manifest only)…");
  const prepareCode = await runNodeScript("scripts/prepare.ts");
  logLine(`prepare exit=${prepareCode}`);

  logLine(
    "Step 2/7: pipeline run (prepare/corpus/extract/verify/outline/draft; no extract --force)…"
  );
  const pipelineCode = await runNodeScript("scripts/pipeline/run.ts");
  logLine(`pipeline exit=${pipelineCode}`);

  logLine("Step 3/7: repair-excerpts --all-failed --limit=250…");
  const repairCode = await runNodeScript("scripts/pipeline/repair-excerpts.ts", [
    "--all-failed",
    "--limit=250",
  ]);
  logLine(`repair-excerpts exit=${repairCode}`);

  logLine("Step 4/7: verify --force…");
  const verifyCode = await runNodeScript("scripts/pipeline/run.ts", [
    "--stage=verify",
    "--force",
  ]);
  logLine(`verify exit=${verifyCode}`);

  logLine("Step 5/7: enrich (schema v2 + upgrade heuristic)…");
  const enrich = await runEnrichParameters({
    force: false,
    dryRun: false,
    tierA: false,
    upgradeHeuristic: true,
    limit: null,
    slugs: [],
  });
  logLine(
    `Enrich done: done=${enrich.done} failed=${enrich.failed} skipped=${enrich.skipped} noop=${enrich.noop}`
  );

  const practices = listCanonicalPracticeKeys();
  logLine(`Step 6/7: matrix + synthesize for ${practices.length} practices…`);
  const practiceResults: Array<{
    practice: string;
    matrixCode: number;
    synthCode: number;
  }> = [];

  for (const practice of practices) {
    logLine(`Matrix ${practice}…`);
    const matrixCode = await runNodeScript(
      "scripts/national/build-practice-matrix.ts",
      ["--practice", practice]
    );
    logLine(`Synthesize ${practice}…`);
    const synthCode = await runNodeScript(
      "scripts/national/synthesize-practice.ts",
      ["--practice", practice, "--force"]
    );
    practiceResults.push({ practice, matrixCode, synthCode });
  }

  logLine("Step 7/7: export:data…");
  const exportCode = await runNodeScript("scripts/export-data.ts");

  const pipelineWarning = !isSoftPipelineExit(pipelineCode)
    ? `pipeline crashed (exit ${pipelineCode})`
    : pipelineCode === 2
      ? "pipeline leftover failures (exit 2) — recorded, not overnight hard-fail"
      : null;
  const verifyWarning = !isSoftPipelineExit(verifyCode)
    ? `verify crashed (exit ${verifyCode})`
    : verifyCode === 2
      ? "verify leftover failures (exit 2) — recorded, not overnight hard-fail"
      : null;

  const md = [
    `# Overnight go`,
    "",
    `- Finished: ${new Date().toISOString()}`,
    `- LLM: ${llm} (model=${model})`,
    `- Prepare exit: ${prepareCode}`,
    `- Pipeline exit: ${pipelineCode}${pipelineCode === 2 ? " (warning, not hard-fail)" : ""}`,
    `- Repair-excerpts exit: ${repairCode}`,
    `- Verify exit: ${verifyCode}${verifyCode === 2 ? " (warning, not hard-fail)" : ""}`,
    `- Enrich: done=${enrich.done} failed=${enrich.failed} skipped=${enrich.skipped} noop=${enrich.noop}`,
    `- Export exit: ${exportCode}`,
    "",
    `## Practices (${practiceResults.length})`,
    ...practiceResults.map(
      (p) =>
        `- **${p.practice}**: matrix exit ${p.matrixCode}, synthesize exit ${p.synthCode} → \`/national/practices/${p.practice}/\``
    ),
    "",
    `## Logs`,
    `- \`${LOG_PATH}\``,
    `- \`data/pipeline/enrich-parameters-progress.json\``,
    `- \`data/pipeline/progress.json\``,
    `- \`data/queue/progress.json\``,
    "",
    `## Notes`,
    "- Does **not** auto-add manuals to the queue.",
    "- Does **not** `--force` overwrite existing `data/documents/` extracts.",
    "- Cursor enrich uses schema v2 (practice-specific numeric fields). Resume skips v2 Cursor-done slugs.",
    "- HTTP 404/410 corpus URLs are skipped, not retried.",
    "- Pipeline/verify exit 2 (leftover stage failures) is a warning, not an overnight hard-fail.",
    "- Re-run `npm run overnight:go` — completed work is skipped where safe.",
    "",
  ].join("\n");

  writeFileSync(STATUS_PATH, md, "utf-8");
  logLine(`Wrote ${STATUS_PATH}`);

  if (pipelineWarning) logLine(`Warning: ${pipelineWarning}`);
  if (verifyWarning) logLine(`Warning: ${verifyWarning}`);

  const hardFail =
    prepareCode !== 0 ||
    !isSoftPipelineExit(pipelineCode) ||
    repairCode !== 0 ||
    !isSoftPipelineExit(verifyCode) ||
    enrich.failed > 0 ||
    exportCode !== 0 ||
    practiceResults.some((p) => p.matrixCode !== 0 || p.synthCode !== 0);
  if (hardFail) {
    logLine("Completed with failures — see GO.md / log.");
    process.exitCode = 1;
  } else {
    logLine("Overnight go finished OK.");
  }
}

main().catch((err) => {
  console.error(err);
  try {
    appendFileSync(
      LOG_PATH,
      `\nFATAL ${new Date().toISOString()} ${err instanceof Error ? err.stack ?? err.message : String(err)}\n`,
      "utf-8"
    );
  } catch {
    /* ignore */
  }
  process.exit(1);
});
