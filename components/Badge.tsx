import type { StormwaterData } from "@/lib/schema";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";

const CONFIDENCE_STYLES: Record<
  StormwaterData["extraction_quality"]["confidence"],
  string
> = {
  high: "bg-emerald-50 text-emerald-800 ring-emerald-700/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20",
  medium:
    "bg-amber-50 text-amber-900 ring-amber-700/15 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-400/20",
  low: "bg-rose-50 text-rose-800 ring-rose-700/15 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-400/20",
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
      <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-fg-secondary ring-1 ring-inset ring-edge-strong/40">
        No
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-800 ring-1 ring-inset ring-orange-600/15 dark:bg-orange-950/50 dark:text-orange-200 dark:ring-orange-400/20">
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
      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-inset ring-emerald-700/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20">
        Citations verified
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-800 ring-1 ring-inset ring-rose-700/15 dark:bg-rose-950/50 dark:text-rose-300 dark:ring-rose-400/20">
        {mismatchCount > 0
          ? `${mismatchCount} citation mismatch${mismatchCount === 1 ? "" : "es"}`
          : "Citation mismatches"}
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <span className="inline-flex items-center rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-fg-secondary ring-1 ring-inset ring-edge-strong/40">
        Verify skipped
      </span>
    );
  }
  if (status === "running" || status === "pending") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-400/20">
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
  county:
    "bg-cyan-50 text-cyan-900 ring-cyan-700/20 dark:bg-cyan-950/45 dark:text-cyan-200 dark:ring-cyan-400/25",
  municipality:
    "bg-teal-50 text-teal-900 ring-teal-700/20 dark:bg-teal-950/45 dark:text-teal-200 dark:ring-teal-400/25",
  special_district:
    "bg-sky-50 text-sky-900 ring-sky-700/20 dark:bg-sky-950/45 dark:text-sky-200 dark:ring-sky-400/25",
  tribal: "bg-surface-muted text-ink ring-ink/15",
  other: "bg-surface-muted text-fg-secondary ring-edge-strong/40",
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
    return <span className="text-fg-subtle">{"\u2014"}</span>;
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

const AGENCY_STYLES: Record<"dot" | "dep_deq" | "other", string> = {
  dot: "bg-amber-50 text-amber-900 ring-amber-700/20 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-400/25",
  dep_deq:
    "bg-emerald-50 text-emerald-900 ring-emerald-700/20 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/25",
  other: "bg-surface-muted text-fg-secondary ring-edge-strong/40",
};

function HighwayIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M3 1.5h10l1.5 13h-13L3 1.5zm1.2 1.5-.9 8h1.4l.2-1.5h2.4L7.1 11h1.4l.2-1.5h2.4l.2 1.5h1.4l-.9-8H4.2zm1.1 2h1.35l.15 1.2H5.45L5.3 5zm3.9 0H12.2l-.15 1.2H9.05L9.2 5zM5.15 8h1.5l.15 1.2H5.3L5.15 8zm3.95 0H12l-.15 1.2H9.25L9.1 8z"
      />
    </svg>
  );
}

function LeafIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 2.5c-3.5-.2-6.8 1.2-8.6 3.8C3.2 8.5 2.8 11 3.5 13c1.8-.4 3.5-1.5 4.6-3.1.4.9.6 1.9.5 2.9h1.5c.2-1.8 0-3.6-.7-5.2 1.8-1.3 4-1.9 6.1-1.7V2.5z"
      />
    </svg>
  );
}

/** Agency-type badge — DOT gets a distinct highway icon. */
export function AgencyBadge({
  category,
}: {
  category: "dot" | "dep_deq" | "dnr" | "other" | null | undefined;
}) {
  if (!category) return null;
  const key = category === "dnr" ? "dep_deq" : category;
  if (key !== "dot" && key !== "dep_deq" && key !== "other") return null;

  const label =
    key === "dot" ? "DOT" : key === "dep_deq" ? "DEP / DEQ" : "Agency";
  const Icon = key === "dot" ? HighwayIcon : LeafIcon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${AGENCY_STYLES[key]}`}
      title={label}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {label}
    </span>
  );
}
