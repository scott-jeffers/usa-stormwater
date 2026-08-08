/**
 * Crash-resilient overnight batch: one manual at a time.
 * Downloads → ingest → log → progress; skips failures; resume-safe.
 *
 *   npm run overnight
 *   npm run overnight -- --retry-skips
 */
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { ingestOnePdf, QuotaError } from "./lib/ingestOne";

const QUEUE_DIR = path.resolve(process.cwd(), "data/queue");
const SAMPLES_DIR = path.resolve(process.cwd(), "samples/queue");
const MANIFEST_PATH = path.join(QUEUE_DIR, "manifest.json");
const PROGRESS_PATH = path.join(QUEUE_DIR, "progress.json");
const RUN_LOG_PATH = path.join(QUEUE_DIR, "run-log.jsonl");
const NOTES_PATH = path.join(QUEUE_DIR, "NOTES.md");
const CITY_COORDS_PATH = path.resolve(
  process.cwd(),
  "lib/cityCoords.generated.ts"
);

const DOWNLOAD_TIMEOUT_MS = 180_000;
const MIN_PDF_BYTES = 5_000;
const DELAY_BETWEEN_MS = 45_000;
const QUOTA_FAIL_THRESHOLD = 2;

export interface ManifestJob {
  id: string;
  jurisdictionHint: string;
  levelHint: "state" | "municipality" | "county" | "regional" | "other";
  pdfUrl: string | null;
  landingPageUrl: string | null;
  /** [lng, lat] for city map dots */
  cityCoords: [number, number] | null;
  notes?: string;
}

type ProgressStatus =
  | "pending"
  | "downloading"
  | "ingesting"
  | "done"
  | "skipped"
  | "deferred";

interface ProgressEntry {
  status: ProgressStatus;
  updatedAt: string;
  error?: string | null;
  slug?: string | null;
  chars?: number | null;
  durationMs?: number | null;
}

type ProgressMap = Record<string, ProgressEntry>;

interface RunLogLine {
  ts: string;
  id: string;
  status: string;
  detail: string;
  slug?: string;
  chars?: number;
  durationMs?: number;
}

let shuttingDown = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function loadJson<T>(filePath: string, fallback: T): Promise<T> {
  if (!existsSync(filePath)) return fallback;
  const raw = await readFile(filePath, "utf-8");
  return JSON.parse(raw) as T;
}

async function saveProgress(progress: ProgressMap): Promise<void> {
  await mkdir(QUEUE_DIR, { recursive: true });
  await writeFile(PROGRESS_PATH, JSON.stringify(progress, null, 2) + "\n", "utf-8");
}

async function appendLog(line: RunLogLine): Promise<void> {
  await mkdir(QUEUE_DIR, { recursive: true });
  await appendFile(RUN_LOG_PATH, JSON.stringify(line) + "\n", "utf-8");
}

async function writeNotes(
  manifest: ManifestJob[],
  progress: ProgressMap
): Promise<void> {
  const counts: Record<string, number> = {
    pending: 0,
    downloading: 0,
    ingesting: 0,
    done: 0,
    skipped: 0,
    deferred: 0,
  };
  const done: string[] = [];
  const skipped: string[] = [];
  const deferred: string[] = [];

  for (const job of manifest) {
    const entry = progress[job.id] ?? { status: "pending" as const };
    counts[entry.status] = (counts[entry.status] ?? 0) + 1;
    if (entry.status === "done") {
      done.push(`- \`${job.id}\` → \`${entry.slug ?? "?"}\``);
    } else if (entry.status === "skipped") {
      skipped.push(`- \`${job.id}\`: ${entry.error ?? "skipped"}`);
    } else if (entry.status === "deferred") {
      deferred.push(`- \`${job.id}\`: ${entry.error ?? "deferred"}`);
    }
  }

  const body = `# Overnight queue notes

Updated: ${new Date().toISOString()}

## Tally

| Status | Count |
|--------|------:|
| done | ${counts.done} |
| pending | ${counts.pending} |
| skipped | ${counts.skipped} |
| deferred | ${counts.deferred} |
| other | ${(counts.downloading ?? 0) + (counts.ingesting ?? 0)} |

## Worked

${done.length ? done.join("\n") : "_none yet_"}

## Failed / skipped

${skipped.length ? skipped.join("\n") : "_none_"}

## Deferred (quota / hard stop)

${deferred.length ? deferred.join("\n") : "_none_"}

See \`run-log.jsonl\` for per-attempt detail.
`;

  await writeFile(NOTES_PATH, body, "utf-8");
}

function isPdfMagic(buf: Buffer): boolean {
  return buf.subarray(0, 5).toString("utf-8") === "%PDF-";
}

async function downloadPdf(url: string, destPath: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "usa-stormwater-overnight/0.1 (research; local batch)",
        Accept: "application/pdf,*/*",
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const ab = await res.arrayBuffer();
    const buf = Buffer.from(ab);
    if (buf.length < MIN_PDF_BYTES) {
      throw new Error(`Downloaded file too small (${buf.length} bytes)`);
    }
    if (!isPdfMagic(buf)) {
      throw new Error("Downloaded file is not a PDF (%PDF magic missing)");
    }
    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, buf);
  } finally {
    clearTimeout(timer);
  }
}

function slugifyCoordKey(id: string): string {
  return id
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function registerCityCoords(
  job: ManifestJob,
  outputSlug: string
): Promise<void> {
  if (!job.cityCoords || job.levelHint !== "municipality") return;

  const [lng, lat] = job.cityCoords;
  let existing: Record<string, [number, number]> = {};
  if (existsSync(CITY_COORDS_PATH)) {
    const raw = await readFile(CITY_COORDS_PATH, "utf-8");
    const match = raw.match(
      /GENERATED_CITY_CENTERS[^=]*=\s*(\{[\s\S]*?\n\});/
    );
    if (match) {
      try {
        existing = Function(`"use strict"; return (${match[1]})`)() as Record<
          string,
          [number, number]
        >;
      } catch {
        existing = {};
      }
    }
  }

  const keys = new Set<string>([
    outputSlug,
    slugifyCoordKey(job.id),
    slugifyCoordKey(job.jurisdictionHint),
  ]);
  for (const key of keys) {
    if (key) existing[key] = [lng, lat];
  }

  const entries = Object.entries(existing)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([k, v]) => `  ${JSON.stringify(k)}: [${v[0]}, ${v[1]}],`
    )
    .join("\n");

  const file = `/**
 * Auto-updated by scripts/overnight.ts when a city manual is ingested.
 * Do not hand-edit unless needed — merge happens in lib/geoCenters.ts.
 */
export const GENERATED_CITY_CENTERS: Record<string, [number, number]> = {
${entries}
};
`;
  await writeFile(CITY_COORDS_PATH, file, "utf-8");
  console.log(`  Registered city coords for ${[...keys].join(", ")}`);
}

function parseArgs(argv: string[]): { retrySkips: boolean } {
  return { retrySkips: argv.includes("--retry-skips") };
}

async function main() {
  const { retrySkips } = parseArgs(process.argv.slice(2));

  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your key."
    );
    process.exit(1);
  }

  if (!existsSync(MANIFEST_PATH)) {
    console.error(`Missing manifest: ${MANIFEST_PATH}`);
    process.exit(1);
  }

  const manifest = (await loadJson<ManifestJob[]>(MANIFEST_PATH, [])).filter(
    Boolean
  );
  const progress = await loadJson<ProgressMap>(PROGRESS_PATH, {});

  for (const job of manifest) {
    if (!progress[job.id]) {
      progress[job.id] = {
        status: "pending",
        updatedAt: new Date().toISOString(),
      };
    }
  }
  await saveProgress(progress);
  await writeNotes(manifest, progress);

  const onSignal = async (sig: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`\nCaught ${sig}; flushing progress and exiting...`);
    await saveProgress(progress);
    await writeNotes(manifest, progress);
    process.exit(0);
  };
  process.on("SIGINT", () => void onSignal("SIGINT"));
  process.on("SIGTERM", () => void onSignal("SIGTERM"));

  console.log(
    `Overnight batch: ${manifest.length} jobs in manifest (retry-skips=${retrySkips})`
  );

  let consecutiveQuotaFails = 0;
  let processedThisRun = 0;

  for (const job of manifest) {
    if (shuttingDown) break;

    const current = progress[job.id] ?? {
      status: "pending" as const,
      updatedAt: new Date().toISOString(),
    };

    if (current.status === "done") continue;
    if (current.status === "deferred") continue;
    if (current.status === "skipped" && !retrySkips) continue;

    if (!job.pdfUrl) {
      const detail =
        job.notes ?? "No single PDF URL (skipped_no_single_pdf)";
      progress[job.id] = {
        status: "skipped",
        updatedAt: new Date().toISOString(),
        error: detail,
      };
      await appendLog({
        ts: new Date().toISOString(),
        id: job.id,
        status: "skipped_no_single_pdf",
        detail,
      });
      await saveProgress(progress);
      await writeNotes(manifest, progress);
      continue;
    }

    const localPdf = path.join(SAMPLES_DIR, `${job.id}.pdf`);
    const started = Date.now();

    try {
      if (!existsSync(localPdf)) {
        console.log(`\n[${job.id}] Downloading...`);
        progress[job.id] = {
          status: "downloading",
          updatedAt: new Date().toISOString(),
        };
        await saveProgress(progress);
        await downloadPdf(job.pdfUrl, localPdf);
        console.log(`  Saved ${path.relative(process.cwd(), localPdf)}`);
      } else {
        const existing = await readFile(localPdf);
        if (existing.length < MIN_PDF_BYTES || !isPdfMagic(existing)) {
          throw new Error("Local PDF invalid (too small or not %PDF)");
        }
        console.log(`\n[${job.id}] Using existing PDF`);
      }

      if (shuttingDown) break;

      console.log(`[${job.id}] Ingesting...`);
      progress[job.id] = {
        status: "ingesting",
        updatedAt: new Date().toISOString(),
      };
      await saveProgress(progress);

      const result = await ingestOnePdf({
        pdfPath: localPdf,
        documentUrl: job.pdfUrl,
        landingPageUrl: job.landingPageUrl,
        preferredSlug: job.id,
        quiet: false,
      });

      await registerCityCoords(job, result.slug);

      const durationMs = Date.now() - started;
      progress[job.id] = {
        status: "done",
        updatedAt: new Date().toISOString(),
        slug: result.slug,
        chars: result.charCount,
        durationMs,
        error: null,
      };
      await appendLog({
        ts: new Date().toISOString(),
        id: job.id,
        status: "done",
        detail: `Saved ${result.slug}`,
        slug: result.slug,
        chars: result.charCount,
        durationMs,
      });
      await saveProgress(progress);
      await writeNotes(manifest, progress);
      consecutiveQuotaFails = 0;
      processedThisRun += 1;
      console.log(`[${job.id}] DONE → ${result.slug} (${durationMs} ms)`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - started;
      const isQuota = error instanceof QuotaError;

      if (isQuota) {
        consecutiveQuotaFails += 1;
        console.error(`[${job.id}] QUOTA/RATE LIMIT: ${message}`);
        progress[job.id] = {
          status: "deferred",
          updatedAt: new Date().toISOString(),
          error: message,
          durationMs,
        };
        await appendLog({
          ts: new Date().toISOString(),
          id: job.id,
          status: "deferred_quota",
          detail: message,
          durationMs,
        });
        await saveProgress(progress);
        await writeNotes(manifest, progress);

        if (consecutiveQuotaFails >= QUOTA_FAIL_THRESHOLD) {
          console.error(
            `\nRepeated quota errors (${consecutiveQuotaFails}). Marking remaining pending as deferred.`
          );
          for (const remaining of manifest) {
            const st = progress[remaining.id]?.status ?? "pending";
            if (st === "pending" || st === "downloading" || st === "ingesting") {
              progress[remaining.id] = {
                status: "deferred",
                updatedAt: new Date().toISOString(),
                error: "Deferred due to Gemini quota / rate limit",
              };
              await appendLog({
                ts: new Date().toISOString(),
                id: remaining.id,
                status: "deferred_quota_batch",
                detail: "Deferred due to Gemini quota / rate limit",
              });
            }
          }
          await saveProgress(progress);
          await writeNotes(manifest, progress);
          break;
        }
      } else {
        consecutiveQuotaFails = 0;
        console.error(`[${job.id}] SKIPPED: ${message}`);
        progress[job.id] = {
          status: "skipped",
          updatedAt: new Date().toISOString(),
          error: message,
          durationMs,
        };
        await appendLog({
          ts: new Date().toISOString(),
          id: job.id,
          status: "skipped",
          detail: message,
          durationMs,
        });
        await saveProgress(progress);
        await writeNotes(manifest, progress);
      }
    }

    if (shuttingDown) break;

    const hasMore = manifest.some((j) => {
      const st = progress[j.id]?.status ?? "pending";
      if (st === "pending") return true;
      if (st === "skipped" && retrySkips) return true;
      return false;
    });
    if (hasMore) {
      console.log(`Waiting ${DELAY_BETWEEN_MS / 1000}s before next job...`);
      await sleep(DELAY_BETWEEN_MS);
    }
  }

  await writeNotes(manifest, progress);
  const doneCount = Object.values(progress).filter((p) => p.status === "done")
    .length;
  const skippedCount = Object.values(progress).filter(
    (p) => p.status === "skipped"
  ).length;
  const deferredCount = Object.values(progress).filter(
    (p) => p.status === "deferred"
  ).length;
  const pendingCount = Object.values(progress).filter(
    (p) => p.status === "pending"
  ).length;

  console.log("\n=== Overnight summary ===");
  console.log(`Processed this run: ${processedThisRun}`);
  console.log(
    `Totals — done: ${doneCount}, skipped: ${skippedCount}, deferred: ${deferredCount}, pending: ${pendingCount}`
  );
  console.log(`Notes: ${path.relative(process.cwd(), NOTES_PATH)}`);
}

main().catch(async (error) => {
  console.error("Overnight runner crashed:", error);
  process.exit(1);
});
