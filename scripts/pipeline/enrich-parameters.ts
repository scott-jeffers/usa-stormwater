/**
 * Enrich atlas JSON with optional design_parameters (resume-safe).
 *
 *   $env:PIPELINE_LLM='cursor'
 *   npx tsx scripts/pipeline/enrich-parameters.ts --upgrade-heuristic
 *   npx tsx scripts/pipeline/enrich-parameters.ts --tier-a
 *   $env:PIPELINE_LLM='heuristic'
 *   npx tsx scripts/pipeline/enrich-parameters.ts --tier-a
 *   npx tsx scripts/pipeline/enrich-parameters.ts --slug wa-state --force
 */
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { clearManualsCache } from "../../lib/data";
import {
  getTierAEntries,
  isChapterProxy,
} from "../../lib/national/tierA";
import { listCanonicalPracticeKeys } from "../../lib/ontology/bmp";
import {
  ENRICH_PROMPT_FIELD_LINES,
  ENRICH_SCHEMA_VERSION,
  NUMERIC_PARAM_FIELD_NAMES,
} from "../../lib/practices/fields";
import {
  DOCUMENTS_DIR,
  ENRICH_PROGRESS_PATH,
  PIPELINE_DIR,
} from "../../lib/pipeline/paths";
import {
  designParametersEnrichmentSchema,
  stormwaterSchema,
  type DesignParameters,
  type StormwaterData,
} from "../../lib/schema";
import {
  atlasContextBlob,
  designParametersFromEnrichment,
  hasEnrichment,
  heuristicEnrichParameters,
  isStaleEnrichment,
  loadDocumentJson,
  mergeParameterEvidence,
  numericParamValue,
  selectEnrichSourceText,
} from "../../lib/practices/params";
import {
  assertPipelineModelAvailable,
  cursorJsonPrompt,
  getPipelineModel,
} from "../lib/cursorLlm";
import { useHeuristicLlm } from "../lib/corpusHeuristic";
import { loadEnvLocal } from "../lib/loadEnv";
import { pipelineDelay } from "./shared";

type ProgressStatus = "pending" | "done" | "failed" | "skipped";

type EnrichProgress = {
  version: 1;
  updated_at: string;
  slugs: Record<
    string,
    {
      status: ProgressStatus;
      updated_at: string;
      error?: string | null;
      source?: string;
      model?: string | null;
      filled?: string[];
      schema_version?: number;
    }
  >;
};

export type EnrichParametersOptions = {
  force: boolean;
  dryRun: boolean;
  tierA: boolean;
  upgradeHeuristic: boolean;
  limit: number | null;
  slugs: string[];
};

export type EnrichParametersResult = {
  done: number;
  failed: number;
  skipped: number;
  noop: number;
  slugs: string[];
};

function parseArgs(argv: string[]): EnrichParametersOptions {
  const force = argv.includes("--force");
  const dryRun = argv.includes("--dry-run");
  const tierA = argv.includes("--tier-a");
  const upgradeHeuristic = argv.includes("--upgrade-heuristic");
  let limit: number | null = null;
  const slugs: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
    } else if (a.startsWith("--limit=")) {
      limit = Number(a.slice("--limit=".length));
    } else if (a === "--slug" && argv[i + 1]) {
      slugs.push(argv[++i]!);
    } else if (a.startsWith("--slug=")) {
      slugs.push(a.slice("--slug=".length));
    } else if (a === "--") {
      slugs.push(...argv.slice(i + 1));
      break;
    } else if (!a.startsWith("-")) {
      slugs.push(a);
    }
  }
  return { force, dryRun, tierA, upgradeHeuristic, limit, slugs };
}

function loadProgress(): EnrichProgress {
  if (!existsSync(ENRICH_PROGRESS_PATH)) {
    return { version: 1, updated_at: new Date().toISOString(), slugs: {} };
  }
  try {
    return JSON.parse(
      readFileSync(ENRICH_PROGRESS_PATH, "utf-8")
    ) as EnrichProgress;
  } catch {
    return { version: 1, updated_at: new Date().toISOString(), slugs: {} };
  }
}

async function saveProgress(progress: EnrichProgress): Promise<void> {
  await mkdir(PIPELINE_DIR, { recursive: true });
  progress.updated_at = new Date().toISOString();
  await writeFile(
    ENRICH_PROGRESS_PATH,
    JSON.stringify(progress, null, 2) + "\n",
    "utf-8"
  );
}

function resolveSlugList(opts: {
  tierA: boolean;
  slugs: string[];
}): string[] {
  if (opts.slugs.length) return [...new Set(opts.slugs)];
  if (opts.tierA) {
    return getTierAEntries().map((e) => e.slug);
  }
  if (!existsSync(DOCUMENTS_DIR)) return [];
  return readdirSync(DOCUMENTS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.replace(/\.json$/, ""));
}

function filledFields(p: DesignParameters): string[] {
  const out: string[] = [];
  for (const name of NUMERIC_PARAM_FIELD_NAMES) {
    if (numericParamValue(p, name) != null) out.push(name);
  }
  if (p.mtd_verification_program) out.push("mtd_verification_program");
  if (p.practice_mentions?.length) out.push("practice_mentions");
  return out;
}

function sanitizePracticeMentions(raw: string[]): string[] {
  const known = new Set(listCanonicalPracticeKeys());
  return [
    ...new Set(
      raw.map((s) => s.trim().toLowerCase()).filter((s) => known.has(s))
    ),
  ].sort();
}

/** True when enrichment is missing or was produced by offline regex heuristics. */
export function isHeuristicEnrichment(data: StormwaterData): boolean {
  if (!hasEnrichment(data)) return true;
  const model = (data.design_parameters?.enrich_model ?? "").trim().toLowerCase();
  if (!model) return true;
  return model === "heuristic" || model.startsWith("heuristic");
}

function progressLooksHeuristic(
  prev: EnrichProgress["slugs"][string] | undefined
): boolean {
  if (!prev || prev.status !== "done") return true;
  const model = (prev.model ?? "").trim().toLowerCase();
  if (!model) return true;
  return model === "heuristic" || model.startsWith("heuristic");
}

async function enrichOne(
  slug: string,
  data: StormwaterData,
  opts: { dryRun: boolean }
): Promise<{
  model: string;
  source: string;
  params: DesignParameters;
  evidenceCount: number;
}> {
  const { text, source } = selectEnrichSourceText(slug);
  const atlasBlob = atlasContextBlob(data);
  const practiceKeys = listCanonicalPracticeKeys().join(", ");

  if (useHeuristicLlm()) {
    const { params, evidence } = heuristicEnrichParameters(data, text);
    const design_parameters: DesignParameters = {
      ...params,
      practice_mentions: sanitizePracticeMentions(params.practice_mentions),
      enriched_at: new Date().toISOString(),
      enrich_model: "heuristic",
      enrich_schema_version: ENRICH_SCHEMA_VERSION,
    };
    if (!opts.dryRun) {
      const next = stormwaterSchema.parse({
        ...data,
        design_parameters,
        evidence: mergeParameterEvidence(data.evidence, evidence),
      });
      await writeFile(
        path.join(DOCUMENTS_DIR, `${slug}.json`),
        JSON.stringify(next, null, 2) + "\n",
        "utf-8"
      );
    }
    return {
      model: "heuristic",
      source,
      params: design_parameters,
      evidenceCount: evidence.length,
    };
  }

  const corpusBlock =
    text.trim() ||
    "(No corpus/queue text available — use only atlas fields below; leave unknowns null.)";

  await pipelineDelay();
  const { data: enrichment, model, runId } = await cursorJsonPrompt({
    name: `enrich-params-${slug}`,
    schema: designParametersEnrichmentSchema,
    retries: 2,
    prompt: `You are extracting numeric stormwater design parameters from a U.S. design manual.
Only report values EXPLICITLY present in the provided text. Do not invent, average, or infer missing numbers.
If a value is absent or ambiguous, return null and list the field in fields_not_found.

Canonical practice keys (use ONLY these in practice_mentions): ${practiceKeys}

Numeric / named fields (null if not found):
${ENRICH_PROMPT_FIELD_LINES}

Also return practice_mentions (canonical keys clearly discussed), enrich_notes, fields_not_found, and evidence[] with field paths like "design_parameters.wqv_depth_inches", short verbatim excerpt, and page_or_section when available.

Slug: ${slug}
Chapter proxy: ${isChapterProxy(slug)}

Atlas context:
${atlasBlob}

Source excerpts (${source}):
${corpusBlock.slice(0, 90_000)}`,
  });

  const design_parameters = designParametersFromEnrichment(enrichment, {
    model: `${model}:${runId}`,
    practiceMentions: sanitizePracticeMentions(enrichment.practice_mentions),
  });

  if (!opts.dryRun) {
    const next = stormwaterSchema.parse({
      ...data,
      design_parameters,
      evidence: mergeParameterEvidence(data.evidence, enrichment.evidence),
    });
    await writeFile(
      path.join(DOCUMENTS_DIR, `${slug}.json`),
      JSON.stringify(next, null, 2) + "\n",
      "utf-8"
    );
  }

  return {
    model,
    source,
    params: design_parameters,
    evidenceCount: enrichment.evidence.length,
  };
}

export async function runEnrichParameters(
  opts: EnrichParametersOptions
): Promise<EnrichParametersResult> {
  loadEnvLocal();

  if (!useHeuristicLlm()) {
    await assertPipelineModelAvailable();
  }

  const progress = loadProgress();
  let slugs = resolveSlugList(opts);
  if (opts.limit != null && opts.limit > 0) {
    slugs = slugs.slice(0, opts.limit);
  }

  console.log(
    `enrich-parameters: ${slugs.length} slug(s) | llm=${useHeuristicLlm() ? "heuristic" : "cursor"} | model=${getPipelineModel()} | force=${opts.force} | upgradeHeuristic=${opts.upgradeHeuristic} | dryRun=${opts.dryRun}`
  );

  let done = 0;
  let skipped = 0;
  let failed = 0;
  let noop = 0;

  for (const slug of slugs) {
    const prev = progress.slugs[slug];
    const prevSchemaOk =
      (prev?.schema_version ?? 0) >= ENRICH_SCHEMA_VERSION;
    if (
      !opts.force &&
      prev?.status === "done" &&
      prevSchemaOk &&
      !(opts.upgradeHeuristic && progressLooksHeuristic(prev))
    ) {
      noop += 1;
      continue;
    }

    const data = loadDocumentJson(slug);
    if (!data) {
      progress.slugs[slug] = {
        status: "skipped",
        updated_at: new Date().toISOString(),
        error: "missing_document",
      };
      skipped += 1;
      console.log(`[${slug}] skipped — no data/documents/${slug}.json`);
      await saveProgress(progress);
      continue;
    }

    const needsUpgrade =
      isStaleEnrichment(data) ||
      (opts.upgradeHeuristic && isHeuristicEnrichment(data));
    if (!opts.force && hasEnrichment(data) && !needsUpgrade) {
      progress.slugs[slug] = {
        status: "done",
        updated_at: new Date().toISOString(),
        error: null,
        model: data.design_parameters?.enrich_model ?? null,
        filled: filledFields(data.design_parameters!),
        schema_version:
          data.design_parameters?.enrich_schema_version ??
          ENRICH_SCHEMA_VERSION,
      };
      noop += 1;
      await saveProgress(progress);
      continue;
    }

    try {
      const result = await enrichOne(slug, data, { dryRun: opts.dryRun });
      const filled = filledFields(result.params);
      progress.slugs[slug] = {
        status: "done",
        updated_at: new Date().toISOString(),
        error: null,
        source: result.source,
        model: result.model,
        filled,
        schema_version: ENRICH_SCHEMA_VERSION,
      };
      done += 1;
      console.log(
        `[${slug}] ${opts.dryRun ? "dry-run OK" : "DONE"} source=${result.source} filled=[${filled.join(", ") || "none"}] evidence=${result.evidenceCount}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      progress.slugs[slug] = {
        status: "failed",
        updated_at: new Date().toISOString(),
        error: message,
      };
      failed += 1;
      console.error(`[${slug}] FAILED: ${message}`);
    }
    await saveProgress(progress);
  }

  clearManualsCache();
  console.log(
    `enrich-parameters finished: done=${done} failed=${failed} skipped=${skipped} noop=${noop}`
  );
  console.log(`progress → ${ENRICH_PROGRESS_PATH}`);
  return { done, failed, skipped, noop, slugs };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const result = await runEnrichParameters(opts);
  if (result.failed > 0) process.exitCode = 1;
}

const isDirectRun =
  typeof process.argv[1] === "string" &&
  /enrich-parameters\.(ts|js|mjs|cjs)$/i.test(process.argv[1].replace(/\\/g, "/"));

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
