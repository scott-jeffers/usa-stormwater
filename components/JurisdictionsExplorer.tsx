"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";
import { CoverageMap, type LocalityMarker } from "@/components/CoverageMap";
import { lookupCityCoordinates } from "@/lib/geoCenters";

export type JurisdictionRow = {
  slug: string;
  name: string;
  level: string;
  state: string | null;
  title: string;
  basis: string;
  revised: string | null;
  values: number;
  pdf: string | null;
};

const LEVEL: Record<string, string> = {
  federal: "Federal",
  state: "State",
  regional: "Regional",
  county: "County",
  municipality: "City",
  special_district: "District",
};
const BASIS: Record<string, string> = {
  own: "Own manual",
  issuer: "Issuing agency",
  state_manual: "Uses the state manual",
  regional_manual: "Uses a regional manual",
  stand_in: "Stand-in (no manual found yet)",
};
const PAGE = 50;
const CONTROL = "h-10 rounded-md border border-edge-strong bg-surface px-3 text-sm text-foreground focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30";

type Filters = { q: string; state: string; level: string; basis: string; sort: string; page: number };
const DEFAULTS: Filters = { q: "", state: "", level: "", basis: "", sort: "name", page: 1 };

function readUrl(): Filters {
  if (typeof window === "undefined") return DEFAULTS;
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get("q") ?? "",
    state: (p.get("state") ?? "").toUpperCase(),
    level: p.get("level") ?? "",
    basis: p.get("basis") ?? "",
    sort: p.get("sort") ?? "name",
    page: Math.max(1, Number(p.get("page") ?? 1) || 1),
  };
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.state) p.set("state", f.state);
  if (f.level) p.set("level", f.level);
  if (f.basis) p.set("basis", f.basis);
  if (f.sort !== "name") p.set("sort", f.sort);
  if (f.page > 1) p.set("page", String(f.page));
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

export function JurisdictionsExplorer({ rows }: { rows: JurisdictionRow[] }) {
  const [f, setF] = useState<Filters>(DEFAULTS);
  const [ready, setReady] = useState(false);
  // The page is pre-rendered without a query string; read the filters once hydrated.
  useEffect(() => {
    queueMicrotask(() => {
      setF(readUrl());
      setReady(true);
    });
  }, []);
  useEffect(() => {
    if (ready) writeUrl(f);
  }, [f, ready]);
  const set = useCallback((patch: Partial<Filters>) => setF((x) => ({ ...x, page: 1, ...patch })), []);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of rows) if (r.state && r.basis !== "stand_in") c[r.state] = (c[r.state] ?? 0) + 1;
    return c;
  }, [rows]);

  const markers = useMemo(() => {
    const m: LocalityMarker[] = [];
    for (const r of rows) {
      if (!r.state || !["municipality", "county", "special_district"].includes(r.level)) continue;
      const coordinates = lookupCityCoordinates(r.slug, r.name, r.state);
      if (coordinates) m.push({ slug: r.slug, name: r.name, stateCode: r.state, coordinates, kind: r.level === "county" ? "county" : r.level === "special_district" ? "special_district" : "city" });
    }
    return m;
  }, [rows]);

  const shown = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const xs = rows.filter(
      (r) =>
        (!q || `${r.name} ${r.title} ${r.state ?? ""} ${STATE_CODE_TO_NAME[r.state ?? ""] ?? ""}`.toLowerCase().includes(q)) &&
        (!f.state || r.state === f.state) &&
        (!f.level || r.level === f.level) &&
        (!f.basis || (f.basis === "own" ? r.basis === "own" || r.basis === "issuer" : f.basis === "shared" ? r.basis.endsWith("_manual") : r.basis === f.basis))
    );
    const by = f.sort;
    return xs.sort((a, b) =>
      by === "values" ? b.values - a.values || a.name.localeCompare(b.name) : by === "revised" ? (b.revised ?? "").localeCompare(a.revised ?? "") : by === "state" ? (a.state ?? "").localeCompare(b.state ?? "") || a.name.localeCompare(b.name) : a.name.localeCompare(b.name)
    );
  }, [rows, f]);

  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const page = Math.min(f.page, pages);
  const slice = shown.slice((page - 1) * PAGE, page * PAGE);
  const levels = [...new Set(rows.map((r) => r.level))].sort((a, b) => Object.keys(LEVEL).indexOf(a) - Object.keys(LEVEL).indexOf(b));
  const states = Object.keys(counts).sort();
  const active = f.q || f.state || f.level || f.basis;

  return (
    <div className="space-y-5">
      <details className="group rounded-md border border-edge bg-surface" open>
        <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium text-fg-secondary">Map: select a state to filter</summary>
        <div className="border-t border-edge p-2">
          <CoverageMap counts={counts} selectedState={f.state || null} onSelectState={(s) => set({ state: s ?? "" })} localities={markers} />
        </div>
      </details>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[14rem] flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Find a jurisdiction</span>
          <input type="search" value={f.q} onChange={(e) => set({ q: e.target.value })} placeholder="City, county, state or manual title" className={`${CONTROL} w-full`} />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">State</span>
          <select value={f.state} onChange={(e) => set({ state: e.target.value })} className={CONTROL}>
            <option value="">All states</option>
            {states.map((s) => (
              <option key={s} value={s}>{STATE_CODE_TO_NAME[s] ?? s} ({counts[s]})</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Level</span>
          <select value={f.level} onChange={(e) => set({ level: e.target.value })} className={CONTROL}>
            <option value="">All levels</option>
            {levels.map((l) => (
              <option key={l} value={l}>{LEVEL[l] ?? l}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Manual</span>
          <select value={f.basis} onChange={(e) => set({ basis: e.target.value })} className={CONTROL}>
            <option value="">Any</option>
            <option value="own">Has its own manual</option>
            <option value="shared">Uses a state or regional manual</option>
            <option value="stand_in">Stand-ins</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Sort</span>
          <select value={f.sort} onChange={(e) => set({ sort: e.target.value })} className={CONTROL}>
            <option value="name">Name</option>
            <option value="state">State</option>
            <option value="values">Most requirements</option>
            <option value="revised">Most recently revised</option>
          </select>
        </label>
        {active ? (
          <button type="button" onClick={() => setF(DEFAULTS)} className="h-10 px-2 text-sm font-medium text-water-link hover:underline">
            Clear
          </button>
        ) : null}
      </div>

      <p className="text-sm text-fg-muted" aria-live="polite">
        {shown.length} of {rows.length} jurisdictions{f.state ? ` in ${STATE_CODE_TO_NAME[f.state] ?? f.state}` : ""}
        {pages > 1 ? ` · page ${page} of ${pages}` : ""}
      </p>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Jurisdiction</th>
              <th>Level</th>
              <th>State</th>
              <th>Manual</th>
              <th className="text-right">Requirements</th>
              <th>Revised</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((r) => (
              <tr key={r.slug} className="align-top">
                <td className="min-w-[12rem]">
                  <Link href={`/${r.slug}/`} className="font-medium text-water-link hover:underline">{r.name}</Link>
                </td>
                <td className="whitespace-nowrap text-fg-secondary">{LEVEL[r.level] ?? r.level}</td>
                <td className="whitespace-nowrap">{r.state ?? "—"}</td>
                <td className="min-w-[16rem] max-w-md">
                  <div className="text-sm text-foreground">{r.title}</div>
                  <div className="text-xs text-fg-muted">
                    {BASIS[r.basis] ?? r.basis}
                    {r.pdf ? (
                      <>
                        {" · "}
                        <a href={r.pdf} target="_blank" rel="noreferrer" className="font-medium text-water-link hover:underline">PDF ↗</a>
                      </>
                    ) : null}
                  </div>
                </td>
                <td className="num text-right">{r.values || <span className="text-fg-faint">—</span>}</td>
                <td className="num whitespace-nowrap text-fg-secondary">{r.revised ? r.revised.slice(0, 4) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-between text-sm">
          <button type="button" disabled={page <= 1} onClick={() => setF((x) => ({ ...x, page: page - 1 }))} className="h-10 rounded-md border border-edge-strong px-4 font-medium disabled:opacity-40">
            ← Previous
          </button>
          <span className="text-fg-muted">Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages} onClick={() => setF((x) => ({ ...x, page: page + 1 }))} className="h-10 rounded-md border border-edge-strong px-4 font-medium disabled:opacity-40">
            Next →
          </button>
        </nav>
      )}
    </div>
  );
}
