/**
 * Set-and-forget overnight enrich runner.
 *
 *   npm run pipeline:cursor-login   # once
 *   npm run overnight:enrich
 *   npx tsx scripts/pipeline/overnight-enrich.ts --heuristic
 *
 * Fills missing / stale (schema < v2) / heuristic design_parameters,
 * rebuilds bioretention + permeable_pavement, exports, writes OVERNIGHT.md.
 * Resume-safe. Log → data/pipeline/overnight-enrich.log
 */
import { appendFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { PIPELINE_DIR } from "../../lib/pipeline/paths";
import { assertPipelineModelAvailable, getPipelineModel } from "../lib/cursorLlm";
import { loadEnvLocal } from "../lib/loadEnv";
import { runEnrichParameters } from "./enrich-parameters";

const LOG_PATH = path.join(PIPELINE_DIR, "overnight-enrich.log");
const STATUS_PATH = path.join(PIPELINE_DIR, "OVERNIGHT.md");
const PRACTICES = ["bioretention", "permeable_pavement"] as const;

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
  args: string[],
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

async function main() {
  loadEnvLocal();
  const { heuristic } = parseArgs(process.argv.slice(2));
  process.env.PIPELINE_LLM = heuristic ? "heuristic" : "cursor";

  if (!heuristic) {
    await assertPipelineModelAvailable();
  }

  mkdirSync(PIPELINE_DIR, { recursive: true });
  writeFileSync(
    LOG_PATH,
    `overnight-enrich start ${new Date().toISOString()}\n`,
    "utf-8"
  );

  logLine(
    `Starting schema-v2 enrich (full atlas). llm=${heuristic ? "heuristic" : "cursor"} model=${getPipelineModel()}`
  );

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

  const practiceResults: Array<{
    practice: string;
    matrixCode: number;
    synthCode: number;
  }> = [];

  for (const practice of PRACTICES) {
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

  logLine("export:data…");
  const exportCode = await runNodeScript("scripts/export-data.ts", []);

  const md = [
    `# Overnight enrich`,
    "",
    `- Finished: ${new Date().toISOString()}`,
    `- LLM: ${heuristic ? "heuristic" : "cursor"} (model=${getPipelineModel()})`,
    `- Enrich: done=${enrich.done} failed=${enrich.failed} skipped=${enrich.skipped} noop=${enrich.noop}`,
    `- Export exit: ${exportCode}`,
    "",
    `## Practices`,
    ...practiceResults.map(
      (p) =>
        `- **${p.practice}**: matrix exit ${p.matrixCode}, synthesize exit ${p.synthCode} → \`/national/practices/${p.practice}/\``
    ),
    "",
    `## Logs`,
    `- \`${LOG_PATH}\``,
    `- \`data/pipeline/enrich-parameters-progress.json\``,
    "",
    `## Resume`,
    "Re-run `npx tsx scripts/pipeline/overnight-enrich.ts` — finished work is skipped where safe.",
    "",
  ].join("\n");

  writeFileSync(STATUS_PATH, md, "utf-8");
  logLine(`Wrote ${STATUS_PATH}`);

  const hardFail =
    enrich.failed > 0 ||
    exportCode !== 0 ||
    practiceResults.some((p) => p.matrixCode !== 0 || p.synthCode !== 0);
  if (hardFail) {
    logLine("Completed with failures — see OVERNIGHT.md / log.");
    process.exitCode = 1;
  } else {
    logLine("Overnight enrich finished OK.");
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
