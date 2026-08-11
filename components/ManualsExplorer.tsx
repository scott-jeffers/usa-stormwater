"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import type { ManualListItem } from "@/lib/data";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";
import { ConfidenceBadge, LevelBadge, NeedsReviewBadge, StateBadge, AgencyBadge } from "@/components/Badge";
import { CoverageMap, type LocalityMarker } from "@/components/CoverageMap";
import { lookupCityCoordinates } from "@/lib/geoCenters";

type SortKey = "jurisdiction" | "level" | "date" | "confidence";
type SortDir = "asc" | "desc";

const CONFIDENCE_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

const CONTROL =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-water focus:outline-none focus:ring-2 focus:ring-water/20";

function formatManualDate(value: string | null | undefined): string {
  if (!value) return "—";
  const trimmed = value.trim();
  // Bare year from edition fallback (e.g. "2014")
  if (/^\d{4}$/.test(trimmed)) return trimmed;

  const ym = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (ym) {
    const d = new Date(Number(ym[1]), Number(ym[2]) - 1, 1);
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short" });
  }
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (ymd) {
    const d = new Date(
      Number(ymd[1]),
      Number(ymd[2]) - 1,
      Number(ymd[3])
    );
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  try {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  } catch {
    /* fall through */
  }
  return value;
}

/** Sort key for revision dates; null/unparseable → NaN (sorted last). */
function revisionSortTime(value: string | null | undefined): number {
  if (!value) return Number.NaN;
  const trimmed = value.trim();
  if (/^\d{4}$/.test(trimmed)) return Date.UTC(Number(trimmed), 0, 1);
  const ym = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (ym) return Date.UTC(Number(ym[1]), Number(ym[2]) - 1, 1);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (ymd)
    return Date.UTC(Number(ymd[1]), Number(ymd[2]) - 1, Number(ymd[3]));
  const t = new Date(value).getTime();
  return Number.isNaN(t) ? Number.NaN : t;
}

export function ManualsExplorer({ manuals }: { manuals: ManualListItem[] }) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [groupByState, setGroupByState] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("jurisdiction");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const countsByState = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const record of manuals) {
      const code = record.state_code;
      if (!code) continue;
      counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [manuals]);

  const localityMarkers: LocalityMarker[] = useMemo(() => {
    const markers: LocalityMarker[] = [];
    for (const record of manuals) {
      const level = record.jurisdiction_level;
      if (
        (level !== "municipality" &&
          level !== "county" &&
          level !== "special_district") ||
        !record.state_code
      ) {
        continue;
      }
      const coordinates = lookupCityCoordinates(
        record.slug,
        record.jurisdiction_name,
        record.state_code
      );
      if (!coordinates) continue;
      const kind =
        level === "county"
          ? "county"
          : level === "special_district"
            ? "special_district"
            : "city";
      markers.push({
        slug: record.slug,
        name: record.jurisdiction_name,
        stateCode: record.state_code,
        coordinates,
        kind,
      });
    }
    return markers;
  }, [manuals]);

  const availableLevels = useMemo(
    () =>
      Array.from(
        new Set(manuals.map((r) => r.jurisdiction_level))
      ).sort(),
    [manuals]
  );

  const availableStates = useMemo(
    () => Object.keys(countsByState).sort(),
    [countsByState]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return manuals.filter((record) => {
      if (
        term &&
        !record.jurisdiction_name.toLowerCase().includes(term) &&
        !record.document_title.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (levelFilter !== "all" && record.jurisdiction_level !== levelFilter) {
        return false;
      }
      if (agencyFilter === "dot") {
        if (record.issuing_agency_category !== "dot") return false;
      } else if (agencyFilter === "dep_deq") {
        if (
          record.issuing_agency_category !== "dep_deq" &&
          record.issuing_agency_category !== "dnr"
        ) {
          return false;
        }
      } else if (agencyFilter === "none") {
        if (record.issuing_agency_category) return false;
      }
      if (stateFilter && record.state_code !== stateFilter) {
        return false;
      }
      if (
        confidenceFilter !== "all" &&
        record.confidence !== confidenceFilter
      ) {
        return false;
      }
      if (needsReviewOnly && !record.needs_human_review) {
        return false;
      }
      return true;
    });
  }, [
    manuals,
    search,
    levelFilter,
    agencyFilter,
    stateFilter,
    confidenceFilter,
    needsReviewOnly,
  ]);

  const sorted = useMemo(() => {
    const dirMultiplier = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "level":
          return (
            a.jurisdiction_level.localeCompare(
              b.jurisdiction_level
            ) * dirMultiplier
          );
        case "date": {
          const aT = revisionSortTime(a.revisedAt);
          const bT = revisionSortTime(b.revisedAt);
          const aMissing = Number.isNaN(aT);
          const bMissing = Number.isNaN(bT);
          if (aMissing && bMissing) return 0;
          if (aMissing) return 1;
          if (bMissing) return -1;
          return (aT - bT) * dirMultiplier;
        }
        case "confidence":
          return (
            (CONFIDENCE_RANK[a.confidence] -
              CONFIDENCE_RANK[b.confidence]) *
            dirMultiplier
          );
        case "jurisdiction":
        default:
          return (
            a.jurisdiction_name.localeCompare(
              b.jurisdiction_name
            ) * dirMultiplier
          );
      }
    });
  }, [filtered, sortKey, sortDir]);

  const grouped = useMemo(() => {
    if (!groupByState) return null;
    const groups = new Map<string, ManualListItem[]>();
    for (const record of sorted) {
      const code = record.state_code ?? "__none__";
      if (!groups.has(code)) groups.set(code, []);
      groups.get(code)!.push(record);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === "__none__") return 1;
      if (b === "__none__") return -1;
      return a.localeCompare(b);
    });
  }, [sorted, groupByState]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setSearch("");
    setLevelFilter("all");
    setAgencyFilter("all");
    setStateFilter(null);
    setConfidenceFilter("all");
    setNeedsReviewOnly(false);
  }

  const hasActiveFilters =
    search !== "" ||
    levelFilter !== "all" ||
    agencyFilter !== "all" ||
    stateFilter !== null ||
    confidenceFilter !== "all" ||
    needsReviewOnly;

  if (manuals.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        <p className="font-medium">No manuals ingested yet.</p>
        <p className="mt-1 text-sm">
          Run <code className="rounded bg-slate-100 px-1.5 py-0.5">npm run ingest -- path/to/manual.pdf</code>{" "}
          to add your first jurisdiction.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <CoverageMap
        counts={countsByState}
        selectedState={stateFilter}
        onSelectState={(code) => {
          setStateFilter(code);
          setSearch("");
          setLevelFilter("all");
        }}
        localities={localityMarkers}
      />

      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Search
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Jurisdiction or document title..."
              className={CONTROL}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Level
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className={`${CONTROL} capitalize`}
            >
              <option value="all">All levels</option>
              {availableLevels.map((level) => (
                <option key={level} value={level} className="capitalize">
                  {level.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Agency
            </label>
            <select
              value={agencyFilter}
              onChange={(e) => setAgencyFilter(e.target.value)}
              className={CONTROL}
            >
              <option value="all">All agencies</option>
              <option value="dot">DOT</option>
              <option value="dep_deq">DEP / DEQ</option>
              <option value="none">No agency tag</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              State
            </label>
            <select
              value={stateFilter ?? "all"}
              onChange={(e) =>
                setStateFilter(e.target.value === "all" ? null : e.target.value)
              }
              className={CONTROL}
            >
              <option value="all">All states</option>
              {availableStates.map((code) => (
                <option key={code} value={code}>
                  {STATE_CODE_TO_NAME[code] ?? code} ({countsByState[code]})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Confidence
            </label>
            <select
              value={confidenceFilter}
              onChange={(e) => setConfidenceFilter(e.target.value)}
              className={`${CONTROL} capitalize`}
            >
              <option value="all">Any</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex flex-wrap items-end gap-x-4 gap-y-2 sm:col-span-2 lg:col-span-3">
            <label className="flex h-9 items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={needsReviewOnly}
                onChange={(e) => setNeedsReviewOnly(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-water focus:ring-water/30"
              />
              Needs review only
            </label>

            <label className="flex h-9 items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={groupByState}
                onChange={(e) => setGroupByState(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-water focus:ring-water/30"
              />
              Group by state
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-9 text-sm font-medium text-water-link hover:text-water-deep hover:underline"
              >
                Clear filters
              </button>
            )}

            <div className="ml-auto flex h-9 items-center text-sm text-slate-500">
              {sorted.length} of {manuals.length} manuals
            </div>
          </div>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No manuals match the current filters.
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {grouped
              ? grouped.map(([code, records]) => (
                  <div key={code} className="space-y-2">
                    <div className="rounded-lg bg-mist/60 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-water-deep">
                      {code === "__none__"
                        ? "Unspecified state"
                        : `${STATE_CODE_TO_NAME[code] ?? code} (${records.length})`}
                    </div>
                    {records.map((record) => (
                      <ManualCard key={record.slug} record={record} />
                    ))}
                  </div>
                ))
              : sorted.map((record) => (
                  <ManualCard key={record.slug} record={record} />
                ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-sm md:block">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50/80 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <SortableHeader
                    label="Jurisdiction"
                    active={sortKey === "jurisdiction"}
                    dir={sortDir}
                    onClick={() => toggleSort("jurisdiction")}
                  />
                  <SortableHeader
                    label="Level"
                    active={sortKey === "level"}
                    dir={sortDir}
                    onClick={() => toggleSort("level")}
                  />
                  <th className="px-4 py-3 font-medium">State</th>
                  <SortableHeader
                    label="Revised"
                    active={sortKey === "date"}
                    dir={sortDir}
                    onClick={() => toggleSort("date")}
                  />
                  <SortableHeader
                    label="Confidence"
                    active={sortKey === "confidence"}
                    dir={sortDir}
                    onClick={() => toggleSort("confidence")}
                  />
                  <th className="px-4 py-3 font-medium">Needs Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {grouped
                  ? grouped.map(([code, records]) => (
                      <Fragment key={code}>
                        <tr className="bg-mist/50">
                          <td
                            colSpan={6}
                            className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-water-deep"
                          >
                            {code === "__none__"
                              ? "Unspecified state"
                              : `${STATE_CODE_TO_NAME[code] ?? code} (${records.length})`}
                          </td>
                        </tr>
                        {records.map((record) => (
                          <ManualRow key={record.slug} record={record} />
                        ))}
                      </Fragment>
                    ))
                  : sorted.map((record) => (
                      <ManualRow key={record.slug} record={record} />
                    ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: SortDir;
  onClick: () => void;
}) {
  return (
    <th className="px-4 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={`flex items-center gap-1 hover:text-ink ${
          active ? "text-ink" : ""
        }`}
      >
        {label}
        {active && <span>{dir === "asc" ? "\u2191" : "\u2193"}</span>}
      </button>
    </th>
  );
}

function PdfIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14 2H7a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-6Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path
        d="M14 2v6h6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 13h7M8.5 16.5h5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PdfSourceLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title="Open source PDF"
      aria-label="Open source PDF"
      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200/90 bg-mist/60 px-2 py-1 text-[11px] font-semibold tracking-wide text-slate-500 transition-colors hover:border-water/35 hover:bg-white hover:text-water-link focus:outline-none focus:ring-2 focus:ring-water/20"
      onClick={(e) => e.stopPropagation()}
    >
      <PdfIcon className="h-3.5 w-3.5" />
      PDF
    </a>
  );
}

function ManualRow({ record }: { record: ManualListItem }) {
  const sourceUrl = record.document_url ?? record.landing_page_url;
  return (
    <tr className="hover:bg-mist/30">
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/${record.slug}`}
              className="font-medium text-water-link hover:text-water-deep hover:underline"
            >
              {record.jurisdiction_name}
            </Link>
            <div className="text-xs text-slate-500">
              {record.document_title}
            </div>
          </div>
          {sourceUrl && <PdfSourceLink href={sourceUrl} />}
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          <LevelBadge level={record.jurisdiction_level} />
          <AgencyBadge category={record.issuing_agency_category} />
        </div>
      </td>
      <td className="px-4 py-3">
        <StateBadge stateCode={record.state_code} showName />
      </td>
      <td className="px-4 py-3 text-slate-600">
        {formatManualDate(record.revisedAt)}
      </td>
      <td className="px-4 py-3">
        <ConfidenceBadge confidence={record.confidence} />
      </td>
      <td className="px-4 py-3">
        <NeedsReviewBadge needsReview={record.needs_human_review} />
      </td>
    </tr>
  );
}

function ManualCard({ record }: { record: ManualListItem }) {
  const sourceUrl = record.document_url ?? record.landing_page_url;

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/${record.slug}`}
            className="font-medium text-water-link hover:text-water-deep hover:underline"
          >
            {record.jurisdiction_name}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
            {record.document_title}
          </p>
        </div>
        {sourceUrl && <PdfSourceLink href={sourceUrl} />}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <LevelBadge level={record.jurisdiction_level} />
        <AgencyBadge category={record.issuing_agency_category} />
        <StateBadge stateCode={record.state_code} />
        <ConfidenceBadge confidence={record.confidence} />
        <NeedsReviewBadge needsReview={record.needs_human_review} />
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Revised {formatManualDate(record.revisedAt)}
      </div>
    </article>
  );
}
