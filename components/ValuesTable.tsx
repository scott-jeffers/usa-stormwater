"use client";

import { useEffect, useMemo, useState } from "react";

type Row = { slug: string; state: string; level: string; basis: string; field: string; value: number; quote: string; check: string };
type Key = "state" | "slug" | "value" | "check";

/** Parse RFC 4180 CSV (quoted cells, doubled quotes, newlines in quotes). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n") { row.push(cell); rows.push(row); row = []; cell = ""; }
    else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

const CHECK_LABEL: Record<string, string> = { exact: "Exact", fuzzy: "Close", unverifiable: "Unreadable PDF", fail: "Failed", no_quote: "No quote", unchecked: "Unchecked" };

export function ValuesTable({ fields }: { fields: Array<{ key: string; label: string; unit: string }> }) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [field, setField] = useState(fields[0]?.key ?? "");
  const [state, setState] = useState("");
  const [ownOnly, setOwnOnly] = useState(true);
  const [sort, setSort] = useState<{ k: Key; dir: 1 | -1 }>({ k: "value", dir: 1 });

  useEffect(() => {
    let live = true;
    fetch("/data/values.csv")
      .then((r) => r.text())
      .then((t) => {
        if (!live) return;
        const [head, ...body] = parseCsv(t);
        const ix = (n: string) => head!.indexOf(n);
        setRows(
          body
            .filter((r) => r.length > 4 && r[ix("value")] !== "" && !Number.isNaN(Number(r[ix("value")])))
            .map((r) => ({
              slug: r[ix("slug")]!, state: r[ix("state")]!, level: r[ix("level")]!, basis: r[ix("coverage_basis")]!,
              field: r[ix("field")]!, value: Number(r[ix("value")]), quote: r[ix("quote")]!, check: r[ix("check")]!,
            }))
        );
      })
      .catch(() => live && setRows([]));
    return () => { live = false; };
  }, []);

  const unit = fields.find((f) => f.key === field)?.unit ?? "";
  const states = useMemo(() => [...new Set((rows ?? []).map((r) => r.state).filter(Boolean))].sort(), [rows]);
  const shown = useMemo(() => {
    const xs = (rows ?? []).filter((r) => r.field === field && (!state || r.state === state) && (!ownOnly || r.basis !== "stand_in"));
    return xs.sort((a, b) => {
      const x = a[sort.k], y = b[sort.k];
      return (typeof x === "number" ? (x as number) - (y as number) : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [rows, field, state, ownOnly, sort]);

  const th = (k: Key, label: string, right = false) => (
    <th className={right ? "text-right" : undefined} aria-sort={sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => setSort((s) => ({ k, dir: s.k === k ? ((-s.dir) as 1 | -1) : 1 }))} className="font-semibold hover:text-water-link">
        {label}{sort.k === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Field</span>
          <select value={field} onChange={(e) => setField(e.target.value)} className="rounded-md border border-edge-strong bg-surface px-2 py-1.5">
            {fields.map((f) => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">State</span>
          <select value={state} onChange={(e) => setState(e.target.value)} className="rounded-md border border-edge-strong bg-surface px-2 py-1.5">
            <option value="">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-1.5">
          <input type="checkbox" checked={ownOnly} onChange={(e) => setOwnOnly(e.target.checked)} />
          <span>Hide stand-ins</span>
        </label>
        <span className="pb-1.5 text-fg-muted" aria-live="polite">{rows ? `${shown.length} values` : "Loading…"}</span>
      </div>
      <div className="max-h-[32rem] overflow-auto rounded-lg border border-edge bg-surface px-3">
        <table className="data-table">
          <thead className="sticky top-0 bg-surface">
            <tr>
              {th("state", "State")}
              {th("slug", "Manual")}
              {th("value", `Value${unit ? ` (${unit})` : ""}`, true)}
              {th("check", "Quote check")}
              <th>Quote</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r, i) => (
              <tr key={`${r.slug}-${i}`}>
                <td>{r.state || "—"}</td>
                <td><a href={`/${r.slug}/`} className="text-water-link hover:underline">{r.slug}</a></td>
                <td className="text-right tabular-nums">{r.value}</td>
                <td className="whitespace-nowrap">{CHECK_LABEL[r.check] ?? r.check}</td>
                <td className="max-w-md text-xs text-fg-muted [overflow-wrap:anywhere]">{r.quote.length > 220 ? `${r.quote.slice(0, 220)}…` : r.quote}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
