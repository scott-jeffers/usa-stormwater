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
    <div className="grid grid-cols-1 gap-3 border-b border-slate-100 py-4 last:border-b-0 sm:grid-cols-2">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </div>
        <div className="mt-1 text-sm text-slate-900">
          {notFound || value === null || value === undefined || value === "" ? (
            <span className="italic text-slate-400">Not found in document</span>
          ) : (
            value
          )}
        </div>
      </div>
      <div>
        {match ? (
          <blockquote className="rounded-md border border-slate-200 border-l-4 border-l-water/40 bg-mist/40 px-3 py-2 text-xs text-slate-600">
            <p className="italic">&ldquo;{match.excerpt}&rdquo;</p>
            {match.page_or_section && (
              <p className="mt-1 font-medium text-slate-400">
                {match.page_or_section}
              </p>
            )}
          </blockquote>
        ) : (
          <p className="text-xs text-slate-300">No evidence cited</p>
        )}
      </div>
    </div>
  );
}
