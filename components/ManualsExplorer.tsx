"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import type { ManualRecord } from "@/lib/data";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";
import { ConfidenceBadge, LevelBadge, NeedsReviewBadge, StateBadge } from "@/components/Badge";
import { CoverageMap, type LocalityMarker } from "@/components/CoverageMap";
import { lookupCityCoordinates } from "@/lib/geoCenters";

type SortKey = "jurisdiction" | "level" | "date" | "confidence";
type SortDir = "asc" | "desc";

const CONFIDENCE_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

const CONTROL =
  "h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 focus:border-water focus:outline-none focus:ring-2 focus:ring-water/20";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export function ManualsExplorer({ manuals }: { manuals: ManualRecord[] }) {
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [confidenceFilter, setConfidenceFilter] = useState<string>("all");
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);
  const [groupByState, setGroupByState] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("jurisdiction");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const countsByState = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const record of manuals) {
      const code = record.data.document_metadata.state_code;
      if (!code) continue;
      counts[code] = (counts[code] ?? 0) + 1;
    }
    return counts;
  }, [manuals]);

  const localityMarkers: LocalityMarker[] = useMemo(() => {
    const markers: LocalityMarker[] = [];
    for (const record of manuals) {
      const meta = record.data.document_metadata;
      const level = meta.jurisdiction_level;
      if (
        (level !== "municipality" &&
          level !== "county" &&
          level !== "special_district") ||
        !meta.state_code
      ) {
        continue;
      }
      const coordinates = lookupCityCoordinates(
        record.slug,
        meta.jurisdiction_name,
        meta.state_code
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
        name: meta.jurisdiction_name,
        stateCode: meta.state_code,
        coordinates,
        kind,
      });
    }
    return markers;
  }, [manuals]);

  const availableLevels = useMemo(
    () =>
      Array.from(
        new Set(manuals.map((r) => r.data.document_metadata.jurisdiction_level))
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
      const meta = record.data.document_metadata;
      if (
        term &&
        !meta.jurisdiction_name.toLowerCase().includes(term) &&
        !meta.document_title.toLowerCase().includes(term)
      ) {
        return false;
      }
      if (levelFilter !== "all" && meta.jurisdiction_level !== levelFilter) {
        return false;
      }
      if (stateFilter && meta.state_code !== stateFilter) {
        return false;
      }
      if (
        confidenceFilter !== "all" &&
        record.data.extraction_quality.confidence !== confidenceFilter
      ) {
        return false;
      }
      if (needsReviewOnly && !record.data.extraction_quality.needs_human_review) {
        return false;
      }
      return true;
    });
  }, [manuals, search, levelFilter, stateFilter, confidenceFilter, needsReviewOnly]);

  const sorted = useMemo(() => {
    const dirMultiplier = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      switch (sortKey) {
        case "level":
          return (
            a.data.document_metadata.jurisdiction_level.localeCompare(
              b.data.document_metadata.jurisdiction_level
            ) * dirMultiplier
          );
        case "date":
          return (
            (new Date(a.processedAt).getTime() -
              new Date(b.processedAt).getTime()) *
            dirMultiplier
          );
        case "confidence":
          return (
            (CONFIDENCE_RANK[a.data.extraction_quality.confidence] -
              CONFIDENCE_RANK[b.data.extraction_quality.confidence]) *
            dirMultiplier
          );
        case "jurisdiction":
        default:
          return (
            a.data.document_metadata.jurisdiction_name.localeCompare(
              b.data.document_metadata.jurisdiction_name
            ) * dirMultiplier
          );
      }
    });
  }, [filtered, sortKey, sortDir]);

  const grouped = useMemo(() => {
    if (!groupByState) return null;
    const groups = new Map<string, ManualRecord[]>();
    for (const record of sorted) {
      const code = record.data.document_metadata.state_code ?? "__none__";
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
    setStateFilter(null);
    setConfidenceFilter("all");
    setNeedsReviewOnly(false);
  }

  const hasActiveFilters =
    search !== "" ||
    levelFilter !== "all" ||
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
                    label="Date Processed"
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

function ManualRow({ record }: { record: ManualRecord }) {
  const { document_metadata, extraction_quality, source } = record.data;
  const sourceUrl = source.document_url ?? source.landing_page_url;
  return (
    <tr className="hover:bg-mist/30">
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/${record.slug}`}
              className="font-medium text-water-link hover:text-water-deep hover:underline"
            >
              {document_metadata.jurisdiction_name}
            </Link>
            <div className="text-xs text-slate-500">
              {document_metadata.document_title}
            </div>
          </div>
          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open source document"
              className="shrink-0 text-xs font-medium text-slate-400 hover:text-water-link"
              onClick={(e) => e.stopPropagation()}
            >
              PDF ↗
            </a>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <LevelBadge level={document_metadata.jurisdiction_level} />
      </td>
      <td className="px-4 py-3">
        <StateBadge stateCode={document_metadata.state_code} showName />
      </td>
      <td className="px-4 py-3 text-slate-600">
        {formatDate(record.processedAt)}
      </td>
      <td className="px-4 py-3">
        <ConfidenceBadge confidence={extraction_quality.confidence} />
      </td>
      <td className="px-4 py-3">
        <NeedsReviewBadge needsReview={extraction_quality.needs_human_review} />
      </td>
    </tr>
  );
}

function ManualCard({ record }: { record: ManualRecord }) {
  const { document_metadata, extraction_quality, source } = record.data;
  const sourceUrl = source.document_url ?? source.landing_page_url;

  return (
    <article className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/${record.slug}`}
            className="font-medium text-water-link hover:text-water-deep hover:underline"
          >
            {document_metadata.jurisdiction_name}
          </Link>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">
            {document_metadata.document_title}
          </p>
        </div>
        {sourceUrl && (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Open source document"
            className="shrink-0 text-xs font-medium text-slate-400 hover:text-water-link"
          >
            PDF ↗
          </a>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <LevelBadge level={document_metadata.jurisdiction_level} />
        <StateBadge stateCode={document_metadata.state_code} />
        <ConfidenceBadge confidence={extraction_quality.confidence} />
        <NeedsReviewBadge needsReview={extraction_quality.needs_human_review} />
      </div>

      <div className="mt-3 text-xs text-slate-500">
        Processed {formatDate(record.processedAt)}
      </div>
    </article>
  );
}
