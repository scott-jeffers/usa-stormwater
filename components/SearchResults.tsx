"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Excerpt, runSearch, type Hit } from "@/components/SiteSearch";

const TYPES = ["All", "Requirement", "Jurisdiction", "Model manual", "Resource"];

export function SearchResults() {
  const params = useSearchParams();
  const router = useRouter();
  const q0 = params.get("q") ?? "";
  const [q, setQ] = useState(q0);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [type, setType] = useState("All");

  useEffect(() => {
    let live = true;
    if (q0.trim().length < 2) return;
    void runSearch(q0, 60).then((r) => live && setHits(r ?? []));
    return () => {
      live = false;
    };
  }, [q0]);

  const shown = (hits ?? []).filter((h) => type === "All" || h.type === type);
  return (
    <div className="space-y-5">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/search/?q=${encodeURIComponent(q.trim())}`);
        }}
        role="search"
        aria-label="Search page"
      >
        <label htmlFor="search-page-q" className="sr-only">Search</label>
        <input
          id="search-page-q"
          type="search"
          value={q}
          autoFocus
          onChange={(e) => setQ(e.target.value)}
          placeholder="Requirement, place, practice or clause"
          className="w-full rounded-md border border-edge-strong bg-surface px-4 py-3 text-base focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30"
        />
      </form>
      {hits && (
        <div className="flex flex-wrap gap-2 text-sm" role="group" aria-label="Filter by type">
          {TYPES.map((t) => {
            const n = t === "All" ? hits.length : hits.filter((h) => h.type === t).length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={type === t}
                disabled={n === 0}
                className={`rounded-md border px-3 py-1.5 ${type === t ? "border-water-link bg-surface font-semibold text-foreground" : "border-edge text-fg-secondary"} disabled:opacity-40`}
              >
                {t} <span className="text-fg-faint">{n}</span>
              </button>
            );
          })}
        </div>
      )}
      {q0 && hits === null && <p className="text-fg-muted">Searching…</p>}
      {hits && shown.length === 0 && (
        <p className="text-fg-muted">
          No results for “{q0}”. Try fewer words, or browse <Link href="/requirements/" className="text-water-link underline">Requirements</Link> or{" "}
          <Link href="/jurisdictions/" className="text-water-link underline">Jurisdictions</Link>.
        </p>
      )}
      <ol className="divide-y divide-edge border-y border-edge">
        {shown.map((h, i) => (
          <li key={h.url + i} className="py-3">
            <div className="flex items-baseline justify-between gap-3">
              <Link href={h.url} className="font-medium text-water-link hover:underline">{h.title}</Link>
              <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-fg-faint">{h.type}</span>
            </div>
            <p className="mt-1 text-sm text-fg-secondary"><Excerpt html={h.excerpt} /></p>
          </li>
        ))}
      </ol>
    </div>
  );
}
