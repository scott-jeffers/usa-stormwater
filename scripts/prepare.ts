/**
 * Download queue PDFs (if needed) and extract plain text for Cursor agents.
 * No Gemini / no cloud AI keys.
 *
 *   npm run prepare:queue
 *   npm run prepare:queue -- portland-or chicago-il
 */
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  assertPdfLooksValid,
  samplesQueuePath,
  writePreparedText,
} from "./lib/pdfText";
import {
  buildCoverageReport,
  formatP1GapLines,
} from "../lib/coverage";

const QUEUE_DIR = path.resolve(process.cwd(), "data/queue");
const MANIFEST_PATH = path.join(QUEUE_DIR, "manifest.json");
const PROGRESS_PATH = path.join(QUEUE_DIR, "progress.json");
const RUN_LOG_PATH = path.join(QUEUE_DIR, "run-log.jsonl");
const NOTES_PATH = path.join(QUEUE_DIR, "NOTES.md");

interface ManifestJob {
  id: string;
  jurisdictionHint: string;
  levelHint: string;
  pdfUrl: string | null;
  landingPageUrl: string | null;
  cityCoords: [number, number] | null;
  notes?: string;
}

type ProgressStatus =
  | "pending"
  | "downloading"
  | "prepared"
  | "done"
  | "skipped"
  | "deferred";

interface ProgressEntry {
  status: ProgressStatus;
  updatedAt: string;
  error?: string | null;
  slug?: string | null;
  chars?: number | null;
  pages?: number | null;
}

type ProgressMap = Record<string, ProgressEntry>;

const DOWNLOAD_TIMEOUT_MS = 180_000;

async function loadJson<T>(filePath: string, fallback: T): Promise<T> {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(await readFile(filePath, "utf-8")) as T;
}

async function saveProgress(progress: ProgressMap): Promise<void> {
  await mkdir(QUEUE_DIR, { recursive: true });
  await writeFile(PROGRESS_PATH, JSON.stringify(progress, null, 2) + "\n");
}

async function appendLog(line: object): Promise<void> {
  await appendFile(RUN_LOG_PATH, JSON.stringify(line) + "\n", "utf-8");
}

export async function writeNotes(
  manifest: ManifestJob[],
  progress: ProgressMap
): Promise<void> {
  const counts: Record<string, number> = {};
  const prepared: string[] = [];
  const done: string[] = [];
  const skipped: string[] = [];
  for (const job of manifest) {
    const st = progress[job.id]?.status ?? "pending";
    counts[st] = (counts[st] ?? 0) + 1;
    if (st === "prepared") prepared.push(`- \`${job.id}\` — text ready for Cursor agent`);
    if (st === "done") done.push(`- \`${job.id}\` → \`${progress[job.id].slug ?? "?"}\``);
    if (st === "skipped")
      skipped.push(`- \`${job.id}\`: ${progress[job.id].error ?? "skipped"}`);
  }
  const body = `# Overnight queue notes

Updated: ${new Date().toISOString()}

Extraction is done by **Cursor agents** (not Gemini). After \`npm run prepare:queue\`, ask Cursor to read \`samples/queue/<id>.txt\` and write \`data/documents/<id>.json\` matching \`lib/schema.ts\`, then \`npm run save -- samples/queue/<id>.extraction.json --slug=<id>\` (or have the agent write the document JSON directly).

## Tally

| Status | Count |
|--------|------:|
| done | ${counts.done ?? 0} |
| prepared (awaiting agent) | ${counts.prepared ?? 0} |
| pending | ${counts.pending ?? 0} |
| skipped | ${counts.skipped ?? 0} |
| deferred | ${counts.deferred ?? 0} |

## Ready for Cursor extract

${prepared.length ? prepared.join("\n") : "_none_"}

## Worked

${done.length ? done.join("\n") : "_none_"}

## Skipped

${skipped.length ? skipped.join("\n") : "_none_"}

## Coverage gaps (P1)

${(() => {
  try {
    const report = buildCoverageReport({ tierFilter: "p1" });
    const lines = formatP1GapLines(report, 10);
    const extra =
      report.summary.byTier.p1 > 10
        ? `\n_…and ${report.summary.byTier.p1 - 10} more. Full report: \`data/coverage/REPORT.md\` (run \`npm run coverage:report\`)._`
        : `\n_Full report: \`data/coverage/REPORT.md\` (run \`npm run coverage:report\`)._`;
    return (lines.length ? lines.join("\n") : "_none_") + extra;
  } catch (error) {
    return `_Coverage report unavailable: ${
      error instanceof Error ? error.message : String(error)
    }_`;
  }
})()}
`;
  await writeFile(NOTES_PATH, body, "utf-8");
}

async function downloadPdf(url: string, destPath: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "stormwater-atlas-prepare/0.1 (research; local batch)",
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

async function main() {
  const only = new Set(process.argv.slice(2).filter((a) => !a.startsWith("--")));
  const manifest = await loadJson<ManifestJob[]>(MANIFEST_PATH, []);
  const progress = await loadJson<ProgressMap>(PROGRESS_PATH, {});

  for (const job of manifest) {
    if (!progress[job.id]) {
      progress[job.id] = {
        status: "pending",
        updatedAt: new Date().toISOString(),
      };
    }
  }

  const targets = manifest.filter((job) => {
    if (only.size && !only.has(job.id)) return false;
    const st = progress[job.id]?.status ?? "pending";
    if (st === "done") return false;
    if (st === "prepared" && !only.size) return false;
    if (st === "skipped" && !only.size) return false;
    return true;
  });

  console.log(`Prepare: ${targets.length} job(s) (download + text extract, no AI)`);

  for (const job of targets) {
    if (!job.pdfUrl) {
      progress[job.id] = {
        status: "skipped",
        updatedAt: new Date().toISOString(),
        error: job.notes ?? "skipped_no_single_pdf",
      };
      await appendLog({
        ts: new Date().toISOString(),
        id: job.id,
        status: "skipped_no_single_pdf",
        detail: progress[job.id].error,
      });
      await saveProgress(progress);
      continue;
    }

    const pdfPath = samplesQueuePath(job.id, "pdf");
    const txtPath = samplesQueuePath(job.id, "txt");

    try {
      if (!existsSync(pdfPath)) {
        console.log(`[${job.id}] Downloading...`);
        progress[job.id] = {
          status: "downloading",
          updatedAt: new Date().toISOString(),
        };
        await saveProgress(progress);
        await downloadPdf(job.pdfUrl, pdfPath);
      } else {
        console.log(`[${job.id}] Using existing PDF`);
      }

      console.log(`[${job.id}] Extracting text...`);
      const meta = await writePreparedText(pdfPath, txtPath);
      progress[job.id] = {
        status: "prepared",
        updatedAt: new Date().toISOString(),
        chars: meta.charCount,
        pages: meta.totalPages,
        error: null,
      };
      await appendLog({
        ts: new Date().toISOString(),
        id: job.id,
        status: "prepared",
        detail: `Text ready at samples/queue/${job.id}.txt`,
        chars: meta.charCount,
        pages: meta.totalPages,
      });
      await saveProgress(progress);
      console.log(
        `[${job.id}] PREPARED — ${meta.totalPages} pages, ${meta.charCount.toLocaleString()} chars${meta.truncated ? " (truncated)" : ""}`
      );
      console.log(`  → Ask Cursor to extract → data/documents/${job.id}.json`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[${job.id}] SKIPPED: ${message}`);
      progress[job.id] = {
        status: "skipped",
        updatedAt: new Date().toISOString(),
        error: message,
      };
      await appendLog({
        ts: new Date().toISOString(),
        id: job.id,
        status: "skipped",
        detail: message,
      });
      await saveProgress(progress);
    }
  }

  await writeNotes(manifest, progress);
  console.log(`\nNotes: ${path.relative(process.cwd(), NOTES_PATH)}`);
}

const isDirectRun =
  process.argv[1] != null &&
  /prepare\.(ts|js|mts|mjs|cjs)$/.test(process.argv[1].replace(/\\/g, "/"));

if (isDirectRun) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
