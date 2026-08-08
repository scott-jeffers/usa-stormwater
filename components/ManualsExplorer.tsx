"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import type { ManualRecord } from "@/lib/data";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";
import { ConfidenceBadge, LevelBadge, NeedsReviewBadge } from "@/components/Badge";
import { CoverageMap, type CityMarker } from "@/components/CoverageMap";
import { lookupCityCoordinates } from "@/lib/geoCenters";

type SortKey = "jurisdiction" | "level" | "date" | "confidence";
type SortDir = "asc" | "desc";

const CONFIDENCE_RANK: Record<string, number> = { low: 0, medium: 1, high: 2 };

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

  const cityMarkers: CityMarker[] = useMemo(() => {
    const markers: CityMarker[] = [];
    for (const record of manuals) {
      const meta = record.data.document_metadata;
      if (meta.jurisdiction_level !== "municipality" || !meta.state_code) continue;
      const coordinates = lookupCityCoordinates(
        record.slug,
        meta.jurisdiction_name,
        meta.state_code
      );
      if (!coordinates) continue;
      markers.push({
        slug: record.slug,
        name: meta.jurisdiction_name,
        stateCode: meta.state_code,
        coordinates,
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
      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
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
          // Map filters by state only — clear search/level so city + state
          // manuals in that state both remain visible.
          setSearch("");
          setLevelFilter("all");
        }}
        cities={cityMarkers}
      />

      <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Jurisdiction or document title..."
            className="w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Level
          </label>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm capitalize focus:border-blue-500 focus:outline-none"
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
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
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
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm capitalize focus:border-blue-500 focus:outline-none"
          >
            <option value="all">Any</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <label className="flex items-center gap-2 pb-1.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={needsReviewOnly}
            onChange={(e) => setNeedsReviewOnly(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Needs review only
        </label>

        <label className="flex items-center gap-2 pb-1.5 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={groupByState}
            onChange={(e) => setGroupByState(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          Group by state
        </label>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="pb-1.5 text-sm font-medium text-blue-700 hover:underline"
          >
            Clear filters
          </button>
        )}

        <div className="ml-auto pb-1.5 text-sm text-slate-500">
          {sorted.length} of {manuals.length} manuals
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No manuals match the current filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
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
                      <tr className="bg-slate-50">
                        <td
                          colSpan={6}
                          className="px-4 py-2 text-xs font-semibold uppercase text-slate-500"
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
        className={`flex items-center gap-1 hover:text-slate-800 ${
          active ? "text-slate-900" : ""
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
    <tr className="hover:bg-slate-50">
      <td className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link
              href={`/${record.slug}`}
              className="font-medium text-blue-700 hover:underline"
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
              className="shrink-0 text-xs font-medium text-slate-400 hover:text-blue-700"
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
      <td className="px-4 py-3 text-slate-600">
        {document_metadata.state_code
          ? STATE_CODE_TO_NAME[document_metadata.state_code] ??
            document_metadata.state_code
          : "\u2014"}
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
