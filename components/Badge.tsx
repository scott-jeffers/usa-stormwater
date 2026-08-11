import type { StormwaterData } from "@/lib/schema";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";

const CONFIDENCE_STYLES: Record<
  StormwaterData["extraction_quality"]["confidence"],
  string
> = {
  high: "bg-emerald-50 text-emerald-800 ring-emerald-700/15",
  medium: "bg-amber-50 text-amber-900 ring-amber-700/15",
  low: "bg-rose-50 text-rose-800 ring-rose-700/15",
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
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/15">
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-600/15">
      Needs review
    </span>
  );
}

export function VerifyBadge({
  status,
  mismatchCount = 0,
}: {
  status: "passed" | "failed" | "skipped" | "pending" | "running" | "unknown";
  mismatchCount?: number;
}) {
  if (status === "passed") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-700/15">
        Citations verified
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-inset ring-rose-700/15">
        {mismatchCount > 0
          ? `${mismatchCount} citation mismatch${mismatchCount === 1 ? "" : "es"}`
          : "Citation mismatches"}
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-500/15">
        Verify skipped
      </span>
    );
  }
  if (status === "running" || status === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15">
        Verify {status}
      </span>
    );
  }
  return null;
}

const LEVEL_STYLES: Record<
  StormwaterData["document_metadata"]["jurisdiction_level"],
  string
> = {
  state: "bg-mist text-water-deep ring-water/25",
  county: "bg-cyan-50 text-cyan-900 ring-cyan-700/20",
  municipality: "bg-teal-50 text-teal-900 ring-teal-700/20",
  special_district: "bg-sky-50 text-sky-900 ring-sky-700/20",
  tribal: "bg-slate-100 text-ink ring-ink/15",
  other: "bg-slate-100 text-slate-700 ring-slate-500/15",
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

function PinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5zm0 6.25a1.75 1.75 0 1 1 0-3.5 1.75 1.75 0 0 1 0 3.5z"
      />
    </svg>
  );
}

function LevelIcon({
  level,
}: {
  level: StormwaterData["document_metadata"]["jurisdiction_level"];
}) {
  const common = "h-3 w-3 shrink-0";
  if (level === "municipality") {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
        <path
          fill="currentColor"
          d="M2 14V7l3-2v2h2V4l3-2v12H2zm8 0V8h3v6h-3z"
        />
      </svg>
    );
  }
  if (level === "county") {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 1.5 1.5 5v1.5h13V5L8 1.5zM3 8v6h3.5V9.5h3V14H13V8H3z"
        />
      </svg>
    );
  }
  if (level === "special_district") {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 1.5 2 4.5v3c0 3.5 2.5 6.2 6 7 3.5-.8 6-3.5 6-7v-3L8 1.5zm0 2.1 4 1.6v2.3c0 2.3-1.5 4.2-4 4.9-2.5-.7-4-2.6-4-4.9V5.2l4-1.6z"
        />
      </svg>
    );
  }
  if (level === "tribal") {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 1.5 3 5v9h3.5V9h3v5H13V5L8 1.5z"
        />
      </svg>
    );
  }
  if (level === "other") {
    return (
      <svg viewBox="0 0 16 16" className={common} aria-hidden="true">
        <path
          fill="currentColor"
          d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM7.25 4.5h1.5v5h-1.5v-5zm.75 8a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
        />
      </svg>
    );
  }
  // state
  return <PinIcon className={common} />;
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

/** Compact state affiliation badge (pin + code) for table/card rows. */
export function StateBadge({
  stateCode,
  showName = false,
}: {
  stateCode: string | null | undefined;
  showName?: boolean;
}) {
  if (!stateCode) {
    return <span className="text-slate-400">{"\u2014"}</span>;
  }

  const name = STATE_CODE_TO_NAME[stateCode] ?? stateCode;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-mist px-2 py-0.5 text-xs font-medium text-water-deep ring-1 ring-inset ring-water/20"
      title={name}
    >
      <PinIcon className="h-3 w-3 shrink-0" />
      {showName ? name : stateCode}
    </span>
  );
}
