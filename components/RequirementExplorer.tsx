"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { FIPS_TO_STATE_CODE, STATE_CODE_TO_NAME } from "@/lib/usStates";

export type Row = {
  slug: string;
  name: string;
  state: string | null;
  level: string;
  basis: string;
  value: number;
  qualifier: string | null;
  basisNote: string | null;
  quote: string | null;
  page: string | number | null;
  pdf: string | null;
  check: string;
};

const LEVEL: Record<string, string> = { federal: "Federal", state: "State", county: "County", city: "City", special_district: "District", regional: "Regional" };
const CHECK: Record<string, { label: string; cls: string }> = {
  verified: { label: "Quote and value found", cls: "status-strong" },
  hand: { label: "Read by hand", cls: "status-strong" },
  value_not_stated: { label: "Quote found, value not in it", cls: "status-open" },
  unverifiable: { label: "PDF text unreadable", cls: "status-neutral" },
  not_found: { label: "Quote not found", cls: "status-open" },
  no_quote: { label: "No quote", cls: "status-placeholder" },
  unchecked: { label: "Unchecked", cls: "status-placeholder" },
};
const BASIS: Record<string, string> = { own: "Own manual", issuer: "Issuing agency", state_manual: "Uses state manual", regional_manual: "Uses regional manual", stand_in: "Stand-in" };

const RAMP = ["#d7eef2", "#a5d4de", "#5ab8c5", "#1f8fa3", "#0e5f73"];

function fmt(v: number, unit: string) {
  const n = Number.isInteger(v) ? String(v) : String(Math.round(v * 1000) / 1000);
  return unit === "ratio" ? `${n}:1` : unit === "%" ? `${n}%` : unit === "cf/acre" ? Number(n).toLocaleString("en-US") : n;
}

export function RequirementExplorer({ rows, unit, byState, criterionKey }: { rows: Row[]; unit: string; byState: Record<string, number>; criterionKey: string }) {
  const [state, setState] = useState<string | null>(null);
  const [level, setLevel] = useState("");
  const [ownOnly, setOwnOnly] = useState(true);
  const [sort, setSort] = useState<{ k: "state" | "name" | "value"; dir: 1 | -1 }>({ k: "state", dir: 1 });
  const [openQuote, setOpenQuote] = useState<string | null>(null);

  const vals = Object.values(byState);
  const breaks = useMemo(() => {
    const s = [...new Set(vals)].sort((a, b) => a - b);
    if (s.length <= RAMP.length) return s;
    return [1, 2, 3, 4].map((i) => s[Math.floor((i * s.length) / RAMP.length)]!);
  }, [vals]);
  const colorOf = (v: number | undefined) => {
    if (v === undefined) return "var(--surface-muted)";
    if (breaks.length <= RAMP.length && vals.length && new Set(vals).size <= RAMP.length) {
      const i = breaks.indexOf(v);
      return RAMP[Math.round((i / Math.max(1, breaks.length - 1)) * (RAMP.length - 1))]!;
    }
    let i = 0;
    while (i < breaks.length && v >= breaks[i]!) i++;
    return RAMP[i]!;
  };

  const shown = useMemo(() => {
    const xs = rows.filter(
      (r) => (!state || r.state === state) && (!level || r.level === level) && (!ownOnly || r.basis === "own" || r.basis === "issuer")
    );
    return xs.sort((a, b) => {
      const x = sort.k === "value" ? a.value - b.value : String(a[sort.k] ?? "").localeCompare(String(b[sort.k] ?? ""));
      return (x || a.name.localeCompare(b.name)) * sort.dir;
    });
  }, [rows, state, level, ownOnly, sort]);

  const levels = [...new Set(rows.map((r) => r.level))];
  const csv = useMemo(() => {
    const esc = (s: unknown) => {
      const t = s == null ? "" : String(s);
      return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
    };
    const head = ["jurisdiction", "state", "level", "basis", "value", "unit", "qualifier", "check", "page", "quote", "atlas_url"];
    const lines = shown.map((r) => [r.name, r.state, r.level, r.basis, r.value, unit, r.qualifier, r.check, r.page, r.quote, `https://www.stormwateratlas.com/${r.slug}/`].map(esc).join(","));
    return "data:text/csv;charset=utf-8," + encodeURIComponent([head.join(","), ...lines].join("\n"));
  }, [shown, unit]);

  const th = (k: "state" | "name" | "value", label: string, right = false) => (
    <th className={right ? "text-right" : undefined} aria-sort={sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => setSort((s) => ({ k, dir: s.k === k ? ((-s.dir) as 1 | -1) : 1 }))} className="font-semibold hover:text-water-link">
        {label}
        {sort.k === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <div className="space-y-6">
      <figure className="space-y-2">
        <ComposableMap projection="geoAlbersUsa" width={960} height={520} className="h-auto w-full max-w-3xl" aria-label="Map of the typical value in each state">
          <Geographies geography="/geo/states-10m.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = FIPS_TO_STATE_CODE[String(geo.id).padStart(2, "0")];
                const v = code ? byState[code] : undefined;
                const sel = state && code === state;
                const name = code ? STATE_CODE_TO_NAME[code] : geo.properties.name;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={code && v !== undefined ? 0 : -1}
                    role={code && v !== undefined ? "button" : undefined}
                    aria-label={code ? `${name}: ${v === undefined ? "no value" : `${fmt(v, unit)} ${unit === "ratio" || unit === "%" ? "" : unit}`}${v !== undefined ? ". Press to filter the table" : ""}` : undefined}
                    aria-pressed={code && v !== undefined ? !!sel : undefined}
                    onClick={() => code && v !== undefined && setState(sel ? null : code)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && code && v !== undefined) {
                        e.preventDefault();
                        setState(sel ? null : code);
                      }
                    }}
                    style={{
                      default: { fill: colorOf(v), stroke: sel ? "var(--foreground)" : "var(--surface)", strokeWidth: sel ? 2 : 0.75, outline: "none", cursor: v !== undefined ? "pointer" : "default" },
                      hover: { fill: colorOf(v), stroke: "var(--foreground)", strokeWidth: v !== undefined ? 1.5 : 0.75, outline: "none" },
                      pressed: { fill: colorOf(v), stroke: "var(--foreground)", strokeWidth: 2, outline: "none" },
                    }}
                  >
                    <title>{`${name}: ${v === undefined ? "no value" : fmt(v, unit)}`}</title>
                  </Geography>
                );
              })
            }
          </Geographies>
        </ComposableMap>
        <figcaption className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-muted">
          <span>Typical value per state (median of its manuals). Select a state to filter the table.</span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm border border-edge" style={{ background: "var(--surface-muted)" }} /> no value
          </span>
          {(new Set(vals).size <= RAMP.length ? [...new Set(vals)].sort((a, b) => a - b) : [Math.min(...vals), ...breaks]).map((b, i, arr) => (
            <span key={i} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-sm" style={{ background: colorOf(b) }} />
              <span className="num">{new Set(vals).size <= RAMP.length ? fmt(b, unit) : i === arr.length - 1 ? `≥ ${fmt(b, unit)}` : `${fmt(b, unit)}–`}</span>
            </span>
          ))}
        </figcaption>
      </figure>

      <div className="flex flex-wrap items-end gap-3 text-sm" data-no-print>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">State</span>
          <select value={state ?? ""} onChange={(e) => setState(e.target.value || null)} className="rounded-md border border-edge-strong bg-surface px-2 py-1.5">
            <option value="">All states</option>
            {Object.keys(byState)
              .sort()
              .map((s) => (
                <option key={s} value={s}>{STATE_CODE_TO_NAME[s] ?? s}</option>
              ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Level</span>
          <select value={level} onChange={(e) => setLevel(e.target.value)} className="rounded-md border border-edge-strong bg-surface px-2 py-1.5">
            <option value="">All levels</option>
            {levels.map((l) => (
              <option key={l} value={l}>{LEVEL[l] ?? l}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2">
          <input type="checkbox" checked={!ownOnly} onChange={(e) => setOwnOnly(!e.target.checked)} />
          <span>Include jurisdictions that use another manual</span>
        </label>
        <span className="pb-2 text-fg-muted" aria-live="polite">{shown.length} values</span>
        <a href={csv} download={`${criterionKey}${state ? `-${state}` : ""}.csv`} className="ml-auto pb-2 font-medium text-water-link hover:underline">
          Download these rows (CSV)
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead className="sticky top-14 bg-background">
            <tr>
              {th("state", "State")}
              {th("name", "Jurisdiction")}
              <th>Level</th>
              {th("value", `Value${unit === "ratio" ? "" : ` (${unit})`}`, true)}
              <th>Source</th>
              <th>Check</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => {
              const id = `${r.slug}`;
              const isOpen = openQuote === id;
              const pageNum = typeof r.page === "number" ? r.page : Number(String(r.page ?? "").match(/\d+/)?.[0]);
              return (
                <tr key={id} className="align-top">
                  <td className="whitespace-nowrap">{r.state ?? "—"}</td>
                  <td className="min-w-[11rem]">
                    <Link href={`/${r.slug}/`} className="font-medium text-water-link hover:underline">{r.name}</Link>
                    {r.basis !== "own" && r.basis !== "issuer" ? <div className="text-xs text-fg-muted">{BASIS[r.basis] ?? r.basis}</div> : null}
                  </td>
                  <td className="whitespace-nowrap text-fg-secondary">{LEVEL[r.level] ?? r.level}</td>
                  <td className="whitespace-nowrap text-right">
                    <span className="num font-medium text-foreground">{fmt(r.value, unit)}</span>
                    {r.qualifier && r.qualifier !== "design" ? <span className="ml-1 text-xs text-fg-muted">{r.qualifier === "min" ? "min" : r.qualifier === "max" ? "max" : r.qualifier}</span> : null}
                    {r.basisNote === "runoff" ? <div className="text-xs text-fg-muted">of runoff</div> : null}
                  </td>
                  <td className="min-w-[16rem] max-w-xl">
                    {r.quote ? (
                      <button type="button" onClick={() => setOpenQuote(isOpen ? null : id)} aria-expanded={isOpen} className="text-left text-sm text-fg-secondary hover:text-foreground">
                        <span className={isOpen ? "" : "line-clamp-1"}>“{r.quote}”</span>
                      </button>
                    ) : (
                      <span className="text-sm text-fg-faint">No quote</span>
                    )}
                    {r.pdf && Number.isFinite(pageNum) ? (
                      <a href={`${r.pdf}#page=${pageNum}`} target="_blank" rel="noreferrer" className="mt-0.5 block text-xs font-medium text-water-link hover:underline">
                        PDF p. {pageNum} ↗
                      </a>
                    ) : null}
                  </td>
                  <td className="whitespace-nowrap">
                    <span className={`status-chip ${CHECK[r.check]?.cls ?? "status-neutral"}`}>{CHECK[r.check]?.label ?? r.check}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
