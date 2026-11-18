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
