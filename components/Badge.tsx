import type { StormwaterData } from "@/lib/schema";

const CONFIDENCE_STYLES: Record<
  StormwaterData["extraction_quality"]["confidence"],
  string
> = {
  high: "bg-emerald-100 text-emerald-800 ring-emerald-600/20",
  medium: "bg-amber-100 text-amber-800 ring-amber-600/20",
  low: "bg-rose-100 text-rose-800 ring-rose-600/20",
};

export function ConfidenceBadge({
  confidence,
}: {
  confidence: StormwaterData["extraction_quality"]["confidence"];
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${CONFIDENCE_STYLES[confidence]}`}
    >
      {confidence}
    </span>
  );
}

export function NeedsReviewBadge({ needsReview }: { needsReview: boolean }) {
  if (!needsReview) {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/20">
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-600/20">
      Needs review
    </span>
  );
}

const LEVEL_STYLES: Record<
  StormwaterData["document_metadata"]["jurisdiction_level"],
  string
> = {
  state: "bg-sky-100 text-sky-800 ring-sky-600/20",
  county: "bg-violet-100 text-violet-800 ring-violet-600/20",
  municipality: "bg-teal-100 text-teal-800 ring-teal-600/20",
  special_district: "bg-indigo-100 text-indigo-800 ring-indigo-600/20",
  tribal: "bg-amber-100 text-amber-900 ring-amber-600/20",
  other: "bg-slate-100 text-slate-700 ring-slate-500/20",
};

const LEVEL_LABELS: Record<
  StormwaterData["document_metadata"]["jurisdiction_level"],
  string
> = {
  state: "State",
  county: "County",
  municipality: "City",
  special_district: "Special District",
  tribal: "Tribal",
  other: "Other",
};

function LevelIcon({
  level,
}: {
  level: StormwaterData["document_metadata"]["jurisdiction_level"];
}) {
  const common = "h-3 w-3 shrink-0";
  if (level === "municipality") {
    // City / skyline
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
        <path
          fill="currentColor"
          d="M1 14h14v1H1zm2-1h2V8H3zm3 0h2V5H6zm3 0h2V7H9zm3 0h2V3h-2zM4 7h1V6H4zm3-2h1V4H7zm6-2h1V2h-1z"
        />
      </svg>
    );
  }
  if (level === "county") {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 1 1 5v2h14V5L8 1zm0 2.2L12.5 6H3.5L8 3.2zM3 8v6h3V9h4v5h3V8H3z"
        />
      </svg>
    );
  }
  // State / map pin
  return (
    <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4z"
      />
    </svg>
  );
}

export function LevelBadge({
  level,
}: {
  level: StormwaterData["document_metadata"]["jurisdiction_level"];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${LEVEL_STYLES[level]}`}
    >
      <LevelIcon level={level} />
      {LEVEL_LABELS[level]}
    </span>
  );
}
