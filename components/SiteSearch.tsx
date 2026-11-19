"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/** A Pagefind result, flattened for display. */
export type Hit = { url: string; title: string; excerpt: string; type: string };

type PagefindResult = { data: () => Promise<{ url: string; excerpt: string; meta: Record<string, string>; filters?: Record<string, string[]> }> };
type Pagefind = { search: (q: string, o?: object) => Promise<{ results: PagefindResult[] }>; options?: (o: object) => Promise<void> };

let pf: Promise<Pagefind | null> | null = null;
/** Load the static search index built by Pagefind at /pagefind/ (absent in `next dev`). */
export function loadPagefind(): Promise<Pagefind | null> {
  if (!pf) {
    const url = "/pagefind/pagefind.js";
    pf = import(/* webpackIgnore: true */ url)
      .then(async (m: Pagefind) => {
        await m.options?.({ excerptLength: 22 });
        return m;
      })
      .catch(() => null);
  }
  return pf;
}

export async function runSearch(q: string, limit = 8): Promise<Hit[] | null> {
  const p = await loadPagefind();
  if (!p) return null;
  const r = await p.search(q);
  const data = await Promise.all(r.results.slice(0, limit).map((x) => x.data()));
  return data.map((d) => ({
    url: d.url.replace(/\.html$/, "").replace(/\/index$/, "/"),
    title: d.meta.title ?? d.url,
    excerpt: d.excerpt,
    type: d.meta.type ?? d.filters?.type?.[0] ?? "Page",
  }));
}

/** Pagefind excerpts mark matches with <mark>; render them safely. */
export function Excerpt({ html }: { html: string }) {
  const parts = html.split(/(<mark>.*?<\/mark>)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("<mark>") ? (
          <mark key={i} className="rounded-sm bg-[var(--st-open-bg)] px-0.5 text-foreground">
            {decode(p.slice(6, -7))}
          </mark>
        ) : (
          <span key={i}>{decode(p)}</span>
        )
      )}
    </>
  );
}
const decode = (s: string) =>
  s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export function SiteSearch({ variant = "header", autoFocus = false }: { variant?: "header" | "hero"; autoFocus?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [unavailable, setUnavailable] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const seq = useRef(0);

  useEffect(() => {
    if (variant !== "header") return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key === "/" && !/input|textarea|select/i.test(t.tagName)) {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [variant]);

  const search = useCallback(async (value: string) => {
    const n = ++seq.current;
    if (value.trim().length < 2) {
      setHits(null);
      return;
    }
    const r = await runSearch(value);
    if (n !== seq.current) return;
    if (r === null) setUnavailable(true);
    setHits(r ?? []);
    setActive(-1);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void search(q), 120);
    return () => clearTimeout(t);
  }, [q, search]);

  const go = (url: string) => {
    setOpen(false);
    router.push(url);
  };
  const submit = () => {
    if (active >= 0 && hits?.[active]) go(hits[active]!.url);
    else if (q.trim()) go(`/search/?q=${encodeURIComponent(q.trim())}`);
  };

  const hero = variant === "hero";
  return (
    <div className={`relative ${hero ? "w-full" : "w-full max-w-md"}`} role="search" aria-label={hero ? "Search the atlas" : "Site search"}>
      <label htmlFor={`${listId}-input`} className="sr-only">
        Search requirements, manuals and the model manual
      </label>
      <input
        id={`${listId}-input`}
        ref={input}
        type="search"
        value={q}
        autoFocus={autoFocus}
        autoComplete="off"
        placeholder={hero ? "Search requirements, places, clauses" : "Search  ( / )"}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
          void loadPagefind();
        }}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min((hits?.length ?? 0) - 1, a + 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(-1, a - 1));
          } else if (e.key === "Enter") {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") setOpen(false);
        }}
        role="combobox"
        aria-expanded={open && !!hits?.length}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className={
          hero
            ? "w-full rounded-md border border-edge-strong bg-surface px-4 py-3.5 text-base text-foreground placeholder:text-fg-faint focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30"
            : "w-full rounded-md border border-edge bg-surface-muted px-3 py-1.5 text-sm text-foreground placeholder:text-fg-faint focus:border-water-link focus:bg-surface focus:outline-none focus:ring-2 focus:ring-water-link/30"
        }
      />
      {open && q.trim().length >= 2 && hits && (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-[70vh] overflow-auto rounded-md border border-edge-strong bg-surface py-1 text-sm"
        >
          {unavailable ? (
            <li className="px-3 py-2 text-fg-muted">Search is available on the published site.</li>
          ) : hits.length === 0 ? (
            <li className="px-3 py-2 text-fg-muted">No matches. Try fewer words, or browse Requirements.</li>
          ) : (
            hits.map((h, i) => (
              <li
                key={h.url + i}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(h.url);
                }}
                className={`cursor-pointer px-3 py-2 ${i === active ? "bg-surface-muted" : ""}`}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium text-foreground">{h.title}</span>
                  <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-fg-faint">{h.type}</span>
                </div>
                <div className="mt-0.5 line-clamp-2 text-xs text-fg-muted">
                  <Excerpt html={h.excerpt} />
                </div>
              </li>
            ))
          )}
          {hits.length > 0 && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                go(`/search/?q=${encodeURIComponent(q.trim())}`);
              }}
              className="cursor-pointer border-t border-edge px-3 py-2 text-xs font-medium text-water-link"
            >
              All results for “{q.trim()}” →
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

/** Marks a page's type for the search index (Requirement, Jurisdiction, Model manual, ...). */
export function SearchMeta({ type }: { type: string }) {
  return <span hidden data-pagefind-meta={`type:${type}`} data-pagefind-filter={`type:${type}`} />;
}
