import type { StormwaterData } from "./schema";

type Evidence = StormwaterData["evidence"][number];

export function findEvidence(
  evidence: Evidence[],
  fieldPath: string
): Evidence | undefined {
  const exact = evidence.find((e) => e.field === fieldPath);
  if (exact) return exact;

  const lastSegment = fieldPath.split(".").pop() ?? fieldPath;
  return evidence.find((e) => e.field.endsWith(lastSegment));
}

export function isFieldNotFound(
  fieldsNotFound: string[],
  fieldPath: string
): boolean {
  const lastSegment = fieldPath.split(".").pop() ?? fieldPath;
  return fieldsNotFound.some(
    (f) => f === fieldPath || f.endsWith(lastSegment)
  );
}
