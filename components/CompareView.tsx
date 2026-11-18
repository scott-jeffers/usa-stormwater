"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { CappedList, CompareRow } from "@/lib/compare";

const MAX = 4;
const CONTROL =
  "h-9 w-full rounded-md border border-edge-strong bg-surface px-3 text-sm text-foreground focus:border-water focus:outline-none focus:ring-2 focus:ring-water/20";

const BASIS: Record<string, string> = {
  own: "Own manual",
  issuer: "Issuing agency",
  state_manual: "Uses state manual",
  regional_manual: "Uses regional manual",
  stand_in: "Stand-in (not its own rules)",
};

const CHECK: Record<string, { mark: string; text: string; cls: string }> = {
  verified: { mark: "✓", text: "Found in source", cls: "text-emerald-700 dark:text-emerald-300" },
  value_not_stated: { mark: "⚠", text: "Quote doesn't state this value", cls: "text-amber-700 dark:text-amber-300" },
  unverifiable: { mark: "?", text: "PDF text unreadable here", cls: "text-amber-700 dark:text-amber-300" },
  not_found: { mark: "✗", text: "Quote not found in source", cls: "text-rose-700 dark:text-rose-300" },
  no_quote: { mark: "–", text: "No supporting quote", cls: "text-fg-subtle" },
  unchecked: { mark: "–", text: "Not checked", cls: "text-fg-subtle" },
};

function fmt(v: number | string, unit: string) {
  if (typeof v === "string") return v;
  const n = Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  return unit === ":1" ? `${n}:1` : `${n} ${unit}`;
}

function List({ list, slug }: { list: CappedList; slug: string }) {
  if (!list.total) return <span className="italic text-fg-subtle">Not found</span>;
  return (
    <ul className="list-disc space-y-0.5 pl-4">
      {list.items.map((x) => (
        <li key={x}>{x}</li>
      ))}
      {list.total > list.items.length && (
        <li className="list-none text-xs">
          <Link href={`/${slug}/`} className="text-fg-subtle underline hover:text-water-link">
            +{list.total - list.items.length} more
          </Link>
        </li>
      )}
    </ul>
  );
}

export function CompareView({ params }: { params: Array<{ key: string; label: string; unit: string }> }) {
  const [rows, setRows] = useState<CompareRow[] | null>(null);
  const [error, setError] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/data/compare.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j: { rows: CompareRow[] }) => {
        const known = new Set(j.rows.map((r) => r.slug));
        const fromUrl = new URLSearchParams(window.location.search).get("m") ?? "";
        setPicked(fromUrl.split(",").filter((s) => known.has(s)).slice(0, MAX));
        setRows(j.rows);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!rows) return;
    const url = new URL(window.location.href);
    if (picked.length) url.searchParams.set("m", picked.join(","));
    else url.searchParams.delete("m");
    window.history.replaceState(null, "", url.toString());
  }, [picked, rows]);

  const bySlug = useMemo(() => new Map((rows ?? []).map((r) => [r.slug, r])), [rows]);
  const chosen = picked.map((s) => bySlug.get(s)).filter((r): r is CompareRow => !!r);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!rows || !q) return [];
    return rows
      .filter((r) => !picked.includes(r.slug))
      .filter((r) => `${r.name} ${r.state ?? ""} ${r.title}`.toLowerCase().includes(q))
      .slice(0, 8);
  }, [rows, query, picked]);

  const add = (slug: string) => {
    setPicked((p) => (p.includes(slug) || p.length >= MAX ? p : [...p, slug]));
    setQuery("");
  };

  if (error) {
    return <p className="text-sm text-rose-700 dark:text-rose-300">Couldn&rsquo;t load the comparison data. Try reloading the page.</p>;
  }

  const shownParams = params.filter((p) => chosen.some((r) => r.params[p.key]));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-edge/80 bg-surface p-4 shadow-sm">
        <label htmlFor="compare-search" className="mb-1 block text-xs font-medium text-fg-muted">
          Add a jurisdiction ({chosen.length} of {MAX})
        </label>
        <div className="relative max-w-md">
          <input
            id="compare-search"
            type="text"
            value={query}
            disabled={!rows || chosen.length >= MAX}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && suggestions[0]) add(suggestions[0].slug);
            }}
            placeholder={!rows ? "Loading…" : chosen.length >= MAX ? "Remove one to add another" : "City, county or state…"}
            className={CONTROL}
            autoComplete="off"
            aria-controls={suggestions.length ? "compare-suggestions" : undefined}
          />
          {suggestions.length > 0 && (
            <ul
              id="compare-suggestions"
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-edge-strong bg-surface shadow-lg"
            >
              {suggestions.map((r) => (
                <li key={r.slug}>
                  <button
                    type="button"
                    onClick={() => add(r.slug)}
                    className="block w-full px-3 py-2 text-left text-sm hover:bg-mist/60 focus:bg-mist/60 focus:outline-none"
                  >
                    <span className="font-medium text-foreground">{r.name}</span>
                    {r.state && <span className="text-fg-subtle"> · {r.state}</span>}
                    <span className="block truncate text-xs text-fg-subtle">{r.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {chosen.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {chosen.map((r) => (
              <button
                key={r.slug}
                type="button"
                onClick={() => setPicked((p) => p.filter((s) => s !== r.slug))}
                className="inline-flex items-center gap-1.5 rounded-full border border-edge-strong bg-mist/40 px-3 py-1 text-xs font-medium text-fg-secondary hover:border-water"
                aria-label={`Remove ${r.name}`}
              >
                {r.name} <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {chosen.length === 0 ? (
        <div className="rounded-xl border border-dashed border-edge-strong bg-surface p-10 text-center text-sm text-fg-muted">
          {rows ? "Search above to add the first jurisdiction." : "Loading records…"}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-edge/80 bg-surface shadow-sm">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge bg-mist text-left align-top">
                <th scope="col" className="sticky left-0 z-10 w-28 bg-mist px-3 py-3 text-xs font-medium uppercase tracking-wide text-fg-subtle sm:w-44 sm:px-4">
                  Requirement
                </th>
                {chosen.map((r) => (
                  <th key={r.slug} scope="col" className="min-w-[220px] px-4 py-3">
                    <Link href={`/${r.slug}/`} className="font-semibold text-water-link hover:underline">
                      {r.name}
                    </Link>
                    {r.state && <span className="font-normal text-fg-subtle"> · {r.state}</span>}
                    <span className="mt-0.5 block text-xs font-normal text-fg-subtle">{r.title}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="align-top text-fg-secondary">
              <Row label="Manual basis" rows={chosen} render={(r) => (
                <>
                  {BASIS[r.basis] ?? r.basis}
                  {r.design_from !== r.slug && (
                    <span className="block text-xs text-fg-subtle">
                      Values from <Link href={`/${r.design_from}/`} className="underline">{bySlug.get(r.design_from)?.name ?? r.design_from}</Link>
                    </span>
                  )}
                </>
              )} />
              <Row label="Revised" rows={chosen} render={(r) => r.revised ?? <span className="italic text-fg-subtle">Unknown</span>} />
              <Row label="Design storms" rows={chosen} render={(r) =>
                r.storms.length ? r.storms.map((y) => `${y}-yr`).join(", ") : <span className="italic text-fg-subtle">Not found</span>
              } />
              <Row label="Water-quality volume" rows={chosen} render={(r) => r.wqv_method ?? <span className="italic text-fg-subtle">Not found</span>} />
              <Row label="Peak-flow methods" rows={chosen} render={(r) => <List list={r.peak_flow} slug={r.design_from} />} />
              <Row label="Software" rows={chosen} render={(r) => <List list={r.software} slug={r.design_from} />} />
              <Row label="BMP categories" rows={chosen} render={(r) => <List list={r.bmps} slug={r.design_from} />} />
              {shownParams.map((p) => (
                <Row key={p.key} label={p.label} rows={chosen} render={(r) => {
                  const v = r.params[p.key];
                  if (!v) return <span className="italic text-fg-subtle">Not found</span>;
                  const c = CHECK[v.check];
                  return (
                    <>
                      <span className="font-medium text-foreground">{fmt(v.value, p.unit)}</span>
                      <span className={`block text-xs ${c.cls}`}>
                        <span aria-hidden>{c.mark}</span> {c.text}
                      </span>
                    </>
                  );
                }} />
              ))}
              <Row label="Citation check" rows={chosen} render={(r) => {
                const c = r.citations;
                if (!c) return <span className="italic text-fg-subtle">Not checked</span>;
                const ok = c.exact + c.fuzzy;
                const all = ok + c.unverifiable + c.fail;
                return `${ok} of ${all} quotes found in source`;
              }} />
              <Row label="Source" rows={chosen} render={(r) =>
                r.pdf ? (
                  <a href={r.pdf} target="_blank" rel="noopener noreferrer" className="text-water-link hover:underline">
                    Open PDF ↗
                  </a>
                ) : (
                  <span className="italic text-fg-subtle">No PDF link</span>
                )
              } />
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({
  label,
  rows,
  render,
}: {
  label: string;
  rows: CompareRow[];
  render: (r: CompareRow) => React.ReactNode;
}) {
  return (
    <tr className="border-b border-edge last:border-b-0">
      <th scope="row" className="sticky left-0 z-10 bg-surface px-3 py-3 text-left text-[11px] font-medium uppercase tracking-wide text-fg-subtle sm:px-4 sm:text-xs">
        {label}
      </th>
      {rows.map((r) => (
        <td key={r.slug} className="px-4 py-3">
          {render(r)}
        </td>
      ))}
    </tr>
  );
}
