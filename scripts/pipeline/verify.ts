/**
 * Verify evidence excerpts against corpus chunk text (deterministic).
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  corpusChunksPath,
  DOCUMENTS_DIR,
} from "../../lib/pipeline/paths";
import type { PipelineProgressStore } from "../../lib/pipeline/progress";
import {
  corpusChunkSchema,
  type CorpusChunk,
  type ManifestJob,
} from "../../lib/pipeline/types";
import { stormwaterSchema, type StormwaterData } from "../../lib/schema";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .trim();
}

function excerptMatches(corpus: string, excerpt: string): boolean {
  const hay = normalize(corpus);
  const needle = normalize(excerpt);
  if (!needle || needle.length < 12) return false;
  if (hay.includes(needle)) return true;

  // Soft match: require ~70% of significant words in order-ish presence
  const words = needle.split(" ").filter((w) => w.length > 3);
  if (words.length < 3) return hay.includes(needle.slice(0, Math.min(40, needle.length)));
  let hits = 0;
  for (const w of words) {
    if (hay.includes(w)) hits += 1;
  }
  return hits / words.length >= 0.7;
}

async function loadChunks(slug: string): Promise<CorpusChunk[]> {
  if (!existsSync(corpusChunksPath(slug))) return [];
  const text = await readFile(corpusChunksPath(slug), "utf-8");
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => corpusChunkSchema.parse(JSON.parse(line)));
}

async function loadDocument(slug: string): Promise<StormwaterData | null> {
  const p = path.join(DOCUMENTS_DIR, `${slug}.json`);
  if (!existsSync(p)) return null;
  return stormwaterSchema.parse(JSON.parse(await readFile(p, "utf-8")));
}

export async function runVerifyStage(
  store: PipelineProgressStore,
  job: ManifestJob,
  opts: { force: boolean; dryRun: boolean }
): Promise<"done" | "skipped" | "failed" | "noop"> {
  const jobProg = store.ensureJob(job.id);
  if (
    jobProg.stages.prepare.status === "skipped" ||
    jobProg.stages.extract.status === "skipped"
  ) {
    store.setStage(job.id, "verify", {
      status: "skipped",
      error: "upstream_skipped",
      completedAt: new Date().toISOString(),
    });
    await store.save();
    return "skipped";
  }

  const current = jobProg.stages.verify;
  if (!opts.force && (current.status === "done" || current.status === "skipped")) {
    return "noop";
  }

  if (jobProg.stages.extract.status !== "done") {
    console.log(`[${job.id}] verify waiting — extract not done`);
    return "noop";
  }

  const slug = jobProg.slug ?? job.id;
  if (opts.dryRun) {
    console.log(`[${job.id}] dry-run verify → ${slug}`);
    return "noop";
  }

  store.setStage(job.id, "verify", {
    status: "running",
    startedAt: new Date().toISOString(),
    error: null,
  });
  await store.saveAndLog({ id: job.id, stage: "verify", status: "running" });

  try {
    const doc = await loadDocument(slug);
    if (!doc) throw new Error(`Document missing: ${slug}.json`);

    const chunks = await loadChunks(slug);
    const corpusText = chunks.map((c) => c.text).join("\n\n");
    if (!corpusText.trim()) {
      // Allow verify to pass with warning when corpus not built (bootstrapped extracts)
      store.setStage(job.id, "verify", {
        status: "done",
        completedAt: new Date().toISOString(),
        error: null,
        meta: {
          verification_passed: false,
          skipped_reason: "no_corpus_chunks",
          failed_fields: [],
        },
      });
      await store.saveAndLog({
        id: job.id,
        stage: "verify",
        status: "done",
        verification_passed: false,
        skipped_reason: "no_corpus_chunks",
      });
      console.log(`[${job.id}] verify DONE (no corpus — flagged)`);
      return "done";
    }

    const failedFields: string[] = [];
    for (const ev of doc.evidence) {
      if (!excerptMatches(corpusText, ev.excerpt)) {
        failedFields.push(ev.field);
      }
    }

    const verification_passed = failedFields.length === 0;
    store.setStage(job.id, "verify", {
      status: verification_passed ? "done" : "failed",
      completedAt: new Date().toISOString(),
      error: verification_passed
        ? null
        : `${failedFields.length} evidence excerpt(s) not found in corpus`,
      meta: {
        verification_passed,
        failed_fields: failedFields,
        evidence_count: doc.evidence.length,
      },
    });
    await store.saveAndLog({
      id: job.id,
      stage: "verify",
      status: verification_passed ? "done" : "failed",
      verification_passed,
      failed_fields: failedFields,
    });
    console.log(
      `[${job.id}] verify ${verification_passed ? "PASSED" : "FAILED"} (${failedFields.length} mismatches)`
    );
    return verification_passed ? "done" : "failed";
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    store.setStage(job.id, "verify", {
      status: "failed",
      error: message,
      completedAt: new Date().toISOString(),
    });
    await store.saveAndLog({
      id: job.id,
      stage: "verify",
      status: "failed",
      detail: message,
    });
    console.error(`[${job.id}] verify failed: ${message}`);
    return "failed";
  }
}
