import { existsSync, readFileSync } from "node:fs";
import {
  QA_EVIDENCE_PATH,
  evidenceQaFileSchema,
  type EvidenceQaFile,
  type EvidenceQaRecord,
} from "./types";

let cached: EvidenceQaFile | null | undefined;

export function loadEvidenceQa(): EvidenceQaFile | null {
  if (cached !== undefined) return cached;
  if (!existsSync(QA_EVIDENCE_PATH)) return (cached = null);
  const parsed = evidenceQaFileSchema.safeParse(
    JSON.parse(readFileSync(QA_EVIDENCE_PATH, "utf-8"))
  );
  if (!parsed.success) {
    console.warn(`[qa] ${QA_EVIDENCE_PATH} failed validation; ignoring`);
    return (cached = null);
  }
  return (cached = parsed.data);
}

export function getEvidenceQa(slug: string): EvidenceQaRecord | null {
  return loadEvidenceQa()?.records[slug] ?? null;
}

export function clearEvidenceQaCache(): void {
  cached = undefined;
}

export type ValueCheck = "verified" | "value_not_stated" | "unverifiable" | "not_found" | "no_quote" | "unchecked";

/**
 * Strict-check result for one numeric design parameter on one record:
 * verified only if a quote for that field was found in the source AND the
 * value is stated in it.
 */
export function checkParameterValue(
  slug: string,
  field: string,
  evidence: Array<{ field: string }>
): ValueCheck {
  const qa = getEvidenceQa(slug);
  if (!qa) return "unchecked";
  const path = `design_parameters.${field}`;
  const statuses = evidence
    .map((e, i) => (e.field === path ? qa.excerpts[i]?.status : undefined))
    .filter((x): x is NonNullable<typeof x> => !!x);
  if (statuses.length === 0) return "no_quote";
  if (qa.warnings.some((w) => w.field === path && w.kind === "value_not_in_excerpt")) {
    return "value_not_stated";
  }
  if (statuses.some((x) => x === "exact" || x === "fuzzy")) return "verified";
  if (statuses.some((x) => x === "unverifiable")) return "unverifiable";
  return "not_found";
}
