import { existsSync, readFileSync } from "node:fs";
import {
  emptyPipelineProgress,
  pipelineProgressSchema,
  type PipelineProgress,
} from "./types";
import { PROGRESS_PATH } from "./paths";

export const DESIGN_CRITERIA_FIELDS = [
  "design_criteria.design_storm_return_periods_years",
  "design_criteria.water_quality_volume_method",
  "design_criteria.peak_flow_calculation_method",
  "design_criteria.approved_bmp_categories",
  "design_criteria.required_hydrologic_hydraulic_software",
] as const;

export interface VerifySlugRow {
  id: string;
  slug: string;
  status: string;
  failedFields: string[];
  mismatchCount: number;
  designMismatchCount: number;
  evidenceCount: number | null;
  verificationPassed: boolean | null;
}

export interface VerifyReportData {
  updatedAt: string;
  passed: number;
  failed: number;
  skipped: number;
  pending: number;
  running: number;
  fieldHistogram: Array<{ field: string; count: number }>;
  slugs: VerifySlugRow[];
}

export type JurisdictionVerifyStatus = {
  status: "passed" | "failed" | "skipped" | "pending" | "running" | "unknown";
  failedFields: string[];
  mismatchCount: number;
};

function loadProgress(): PipelineProgress {
  if (!existsSync(PROGRESS_PATH)) return emptyPipelineProgress();
  try {
    const raw = JSON.parse(readFileSync(PROGRESS_PATH, "utf-8"));
    const parsed = pipelineProgressSchema.safeParse(raw);
    return parsed.success ? parsed.data : emptyPipelineProgress();
  } catch {
    return emptyPipelineProgress();
  }
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

let cachedReport: VerifyReportData | undefined;
let cachedSlugMap: Map<string, VerifySlugRow> | undefined;
let cachedStatusMap: Map<string, JurisdictionVerifyStatus> | undefined;

/** Clear module cache (tests / after mutating pipeline progress). */
export function clearVerifyReportCache(): void {
  cachedReport = undefined;
  cachedSlugMap = undefined;
  cachedStatusMap = undefined;
}

function computeVerifyReportData(progress: PipelineProgress): VerifyReportData {
  const jobs = Object.values(progress.jobs);
  let passed = 0;
  let failed = 0;
  let skipped = 0;
  let pending = 0;
  let running = 0;
  const fieldCounts = new Map<string, number>();
  const slugs: VerifySlugRow[] = [];

  for (const job of jobs) {
    const v = job.stages.verify;
    const st = v.status;
    if (st === "done") passed += 1;
    else if (st === "failed") failed += 1;
    else if (st === "skipped") skipped += 1;
    else if (st === "running") running += 1;
    else pending += 1;

    const failedFields = asStringArray(v.meta?.failed_fields);
    for (const f of failedFields) {
      fieldCounts.set(f, (fieldCounts.get(f) ?? 0) + 1);
    }

    const designMismatchCount = failedFields.filter((f) =>
      DESIGN_CRITERIA_FIELDS.includes(
        f as (typeof DESIGN_CRITERIA_FIELDS)[number]
      )
    ).length;

    const evidenceCount =
      typeof v.meta?.evidence_count === "number"
        ? (v.meta.evidence_count as number)
        : null;
    const verificationPassed =
      typeof v.meta?.verification_passed === "boolean"
        ? (v.meta.verification_passed as boolean)
        : st === "done"
          ? true
          : st === "failed"
            ? false
            : null;

    slugs.push({
      id: job.id,
      slug: job.slug ?? job.id,
      status: st,
      failedFields,
      mismatchCount: failedFields.length,
      designMismatchCount,
      evidenceCount,
      verificationPassed,
    });
  }

  slugs.sort((a, b) => {
    if (b.mismatchCount !== a.mismatchCount) {
      return b.mismatchCount - a.mismatchCount;
    }
    if (b.designMismatchCount !== a.designMismatchCount) {
      return b.designMismatchCount - a.designMismatchCount;
    }
    return a.id.localeCompare(b.id);
  });

  const fieldHistogram = [...fieldCounts.entries()]
    .map(([field, count]) => ({ field, count }))
    .sort((a, b) => b.count - a.count || a.field.localeCompare(b.field));

  return {
    updatedAt: progress.updatedAt,
    passed,
    failed,
    skipped,
    pending,
    running,
    fieldHistogram,
    slugs,
  };
}

export function buildVerifyReportData(
  progress?: PipelineProgress
): VerifyReportData {
  // Explicit progress (scripts) bypasses cache.
  if (progress) return computeVerifyReportData(progress);
  if (cachedReport) return cachedReport;
  cachedReport = computeVerifyReportData(loadProgress());
  cachedSlugMap = undefined;
  cachedStatusMap = undefined;
  return cachedReport;
}

function ensureSlugMap(): Map<string, VerifySlugRow> {
  if (cachedSlugMap) return cachedSlugMap;
  const data = buildVerifyReportData();
  const map = new Map<string, VerifySlugRow>();
  for (const row of data.slugs) {
    map.set(row.slug, row);
    if (row.id !== row.slug) map.set(row.id, row);
  }
  cachedSlugMap = map;
  return map;
}

function rowToStatus(row: VerifySlugRow | undefined): JurisdictionVerifyStatus {
  if (!row) {
    return { status: "unknown", failedFields: [], mismatchCount: 0 };
  }
  if (row.status === "done" || row.verificationPassed === true) {
    return { status: "passed", failedFields: [], mismatchCount: 0 };
  }
  if (row.status === "failed") {
    return {
      status: "failed",
      failedFields: row.failedFields,
      mismatchCount: row.mismatchCount,
    };
  }
  if (
    row.status === "skipped" ||
    row.status === "pending" ||
    row.status === "running"
  ) {
    return {
      status: row.status,
      failedFields: row.failedFields,
      mismatchCount: row.mismatchCount,
    };
  }
  return { status: "unknown", failedFields: [], mismatchCount: 0 };
}

export function formatVerifyMarkdown(data: VerifyReportData): string {
  const failedSlugs = data.slugs.filter((s) => s.status === "failed");
  const designFailed = failedSlugs.filter((s) => s.designMismatchCount > 0);

  const histLines =
    data.fieldHistogram.length === 0
      ? "_none_"
      : data.fieldHistogram
          .map((h) => `| \`${h.field}\` | ${h.count} |`)
          .join("\n");

  const slugLines =
    failedSlugs.length === 0
      ? "_none_"
      : failedSlugs
          .map((s) => {
            const fields =
              s.failedFields.length > 0
                ? s.failedFields.map((f) => `\`${f}\``).join(", ")
                : "_(no field list)_";
            return `| \`${s.id}\` | ${s.mismatchCount} | ${s.designMismatchCount} | ${fields} | \`data/documents/${s.slug}.json\` | \`data/corpus/${s.slug}/\` |`;
          })
          .join("\n");

  return `# Verify report

Updated: ${data.updatedAt}

Resume with: \`npm run pipeline:verify-report\` or force-verify selected IDs.

## Summary

| Status | Count |
|--------|------:|
| passed (done) | ${data.passed} |
| failed | ${data.failed} |
| skipped | ${data.skipped} |
| pending | ${data.pending} |
| running | ${data.running} |

Design-criteria mismatches (any of the five design fields): **${designFailed.length}** failed slugs.

## Field histogram

| Field | Failures |
|-------|--------:|
${histLines}

## Failed slugs (worst first)

| Id | Mismatches | Design | Failed fields | Document | Corpus |
|----|----------:|-------:|---------------|----------|--------|
${slugLines}

## Triage notes

- Prefer fixing \`design_criteria.*\` excerpts before \`document_metadata.*\` (national strawman depends on design fields).
- \`va-state\` and chapter-only corpora may lack metadata date text — mark review-only rather than inventing excerpts.
- After repairs: \`$env:PIPELINE_STAGE='verify'; $env:PIPELINE_FORCE='1'; npx tsx scripts/pipeline/run.ts <ids...>\`
`;
}

export function getVerifySummaryForSlug(slug: string): {
  status: string;
  verificationPassed: boolean | null;
  failedFields: string[];
  mismatchCount: number;
} | null {
  const row = ensureSlugMap().get(slug);
  if (!row) return null;
  return {
    status: row.status,
    verificationPassed: row.verificationPassed,
    failedFields: row.failedFields,
    mismatchCount: row.mismatchCount,
  };
}

export function getVerifyStatusMap(): Map<string, JurisdictionVerifyStatus> {
  if (cachedStatusMap) return cachedStatusMap;
  const map = new Map<string, JurisdictionVerifyStatus>();
  const data = buildVerifyReportData();
  for (const row of data.slugs) {
    const status = rowToStatus(row);
    map.set(row.slug, status);
    if (row.id !== row.slug) map.set(row.id, status);
  }
  cachedStatusMap = map;
  return map;
}

export function getJurisdictionVerifyStatus(
  slug: string
): JurisdictionVerifyStatus {
  return getVerifyStatusMap().get(slug) ?? {
    status: "unknown",
    failedFields: [],
    mismatchCount: 0,
  };
}
