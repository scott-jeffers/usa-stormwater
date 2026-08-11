import type { ReactNode } from "react";
import type { StormwaterData } from "@/lib/schema";
import { findEvidence, isFieldNotFound } from "@/lib/evidence";

interface FieldWithEvidenceProps {
  label: string;
  fieldPath: string;
  value: ReactNode;
  evidence: StormwaterData["evidence"];
  fieldsNotFound: string[];
}

export function FieldWithEvidence({
  label,
  fieldPath,
  value,
  evidence,
  fieldsNotFound,
}: FieldWithEvidenceProps) {
  const match = findEvidence(evidence, fieldPath);
  const notFound = isFieldNotFound(fieldsNotFound, fieldPath);

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-edge py-4 last:border-b-0 sm:grid-cols-2">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {label}
        </div>
        <div className="mt-1 text-sm text-foreground">
          {notFound || value === null || value === undefined || value === "" ? (
            <span className="italic text-fg-subtle">Not found in document</span>
          ) : (
            value
          )}
        </div>
      </div>
      <div>
        {match ? (
          <blockquote className="rounded-md border border-edge border-l-4 border-l-water/40 bg-mist/40 px-3 py-2 text-xs text-fg-secondary">
            <p className="italic">&ldquo;{match.excerpt}&rdquo;</p>
            {match.page_or_section && (
              <p className="mt-1 font-medium text-fg-subtle">
                {match.page_or_section}
              </p>
            )}
          </blockquote>
        ) : (
          <p className="text-xs text-fg-faint">No evidence cited</p>
        )}
      </div>
    </div>
  );
}
