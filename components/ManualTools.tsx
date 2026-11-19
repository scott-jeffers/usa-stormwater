"use client";

import { useMemo, useState } from "react";

export type ClauseIndex = { n: string; id: string; title: string; text: string };

/** Find a clause by number, title or words; print or save the manual as PDF. */
export function ManualTools({ clauses }: { clauses: ClauseIndex[] }) {
  const [q, setQ] = useState("");
  const hits = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (t.length < 2) return [];
    const words = t.split(/\s+/);
    return clauses
      .filter((c) => {
        if (/^\d+(\.\d+)*$/.test(t)) return c.n === t || c.n.startsWith(`${t}.`);
        const hay = `${c.n} ${c.title} ${c.text}`.toLowerCase();
        return words.every((w) => hay.includes(w));
      })
      .slice(0, 12);
  }, [q, clauses]);

  return (
    <div className="no-print mt-5 space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <label className="min-w-[14rem] flex-1">
          <span className="sr-only">Find a clause</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a clause: number (6.1) or words (drawdown)"
            className="h-10 w-full rounded-md border border-edge-strong bg-surface px-3 text-sm focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30"
          />
        </label>
        <button type="button" onClick={() => window.print()} className="h-10 rounded-md border border-edge-strong px-4 text-sm font-medium text-foreground hover:bg-surface-muted">
          Print or save as PDF
        </button>
      </div>
      {q.trim().length >= 2 && (
        <ul className="divide-y divide-edge rounded-md border border-edge bg-surface text-sm" aria-live="polite">
          {hits.length === 0 ? (
            <li className="px-3 py-2 text-fg-muted">No clause matches.</li>
          ) : (
            hits.map((c) => (
              <li key={c.n}>
                <a href={`#${c.id}`} onClick={() => setQ("")} className="block px-3 py-2 hover:bg-surface-muted">
                  <span className="num mr-2 font-semibold text-water-link">{c.n}</span>
                  <span className="font-medium text-foreground">{c.title}</span>
                  <span className="mt-0.5 line-clamp-1 block text-xs text-fg-muted">{c.text.replace(/\*\*|`|\[[^\]]*\]\([^)]*\)/g, "")}</span>
                </a>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
