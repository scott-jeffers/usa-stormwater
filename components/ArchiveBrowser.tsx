"use client";

import { useEffect, useMemo, useState } from "react";

type Drawing = { id: string; slug: string; page: number; title: string; kind: string[]; practices: string[]; pdf: string | null };
type Example = { id: string; slug: string; pages: [number, number]; title: string; kind: string; practices: string[]; topic: string | null; pdf: string | null };
type Manual = { slug: string; name: string; state: string | null };

const KIND_LABEL: Record<string, string> = { worked_example: "Worked example", sample_plan: "Sample plan", checklist: "Plan checklist" };
const pageLink = (pdf: string | null, page: number) => (pdf ? `${pdf}#page=${page}` : null);

export function ArchiveBrowser({ practices, manuals, mode }: { practices: Record<string, string>; manuals: Manual[]; mode: "drawings" | "examples" }) {
  const [rows, setRows] = useState<Array<Drawing | Example> | null>(null);
  const [practice, setPractice] = useState("");
  const [state, setState] = useState("");
  const [kind, setKind] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(60);
  const bySlug = useMemo(() => new Map(manuals.map((m) => [m.slug, m])), [manuals]);

  useEffect(() => {
    let live = true;
    fetch(mode === "drawings" ? "/data/archive/drawings.json" : "/data/archive/examples.json")
      .then((r) => r.json())
      .then((j) => live && setRows(mode === "drawings" ? j.drawings : j.examples))
      .catch(() => live && setRows([]));
    return () => {
      live = false;
    };
  }, [mode]);

  const states = useMemo(() => [...new Set((rows ?? []).map((r) => bySlug.get(r.slug)?.state).filter(Boolean) as string[])].sort(), [rows, bySlug]);
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows ?? []).filter((r) => {
      if (practice === "_none" ? r.practices.length > 0 : practice && !r.practices.includes(practice)) return false;
      if (state && bySlug.get(r.slug)?.state !== state) return false;
      if (kind && (mode === "drawings" ? !(r as Drawing).kind.includes(kind) : (r as Example).kind !== kind)) return false;
      if (needle && !`${r.title} ${bySlug.get(r.slug)?.name ?? r.slug}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, practice, state, kind, q, bySlug, mode]);

  const kinds = mode === "drawings" ? ["section", "plan", "profile", "detail", "schematic"] : ["worked_example", "sample_plan", "checklist"];
  const sel = "rounded-md border border-edge-strong bg-surface px-2 py-1.5";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Practice</span>
          <select value={practice} onChange={(e) => { setPractice(e.target.value); setLimit(60); }} className={sel}>
            <option value="">All practices</option>
            {Object.entries(practices).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            {mode === "examples" && <option value="_none">Hydrology and hydraulics (no practice)</option>}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Type</span>
          <select value={kind} onChange={(e) => { setKind(e.target.value); setLimit(60); }} className={sel}>
            <option value="">All types</option>
            {kinds.map((k) => <option key={k} value={k}>{KIND_LABEL[k] ?? k[0]!.toUpperCase() + k.slice(1)}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">State</span>
          <select value={state} onChange={(e) => { setState(e.target.value); setLimit(60); }} className={sel}>
            <option value="">All states</option>
            {states.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
          <span className="text-xs font-medium text-fg-muted">Search titles</span>
          <input value={q} onChange={(e) => { setQ(e.target.value); setLimit(60); }} placeholder="e.g. outlet, planter, skimmer" className={sel} />
        </label>
        <span className="pb-1.5 text-fg-muted" aria-live="polite">{rows ? `${shown.length} found` : "Loading…"}</span>
      </div>
      <ul className="divide-y divide-edge rounded-lg border border-edge bg-surface">
        {shown.slice(0, limit).map((r) => {
          const m = bySlug.get(r.slug);
          const first = "page" in r ? r.page : r.pages[0];
          const pages = "page" in r ? `p. ${r.page}` : r.pages[0] === r.pages[1] ? `p. ${r.pages[0]}` : `pp. ${r.pages[0]}–${r.pages[1]}`;
          const href = pageLink(r.pdf, first);
          const tags = r.practices.length ? r.practices.map((p) => practices[p] ?? p) : "topic" in r && r.topic ? [r.topic] : [];
          return (
            <li key={r.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-foreground [overflow-wrap:anywhere]">{r.title}</div>
                <div className="mt-0.5 text-xs text-fg-muted">
                  <a href={`/${r.slug}/`} className="text-water-link underline underline-offset-2">{m?.name ?? r.slug}</a>
                  {m?.state ? ` · ${m.state}` : ""} · {pages} · {"page" in r ? r.kind.join(", ") : KIND_LABEL[r.kind]}
                  {tags.length ? ` · ${tags.join(", ")}` : ""}
                </div>
              </div>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" className="shrink-0 text-sm font-medium text-water-link hover:underline">
                  Open PDF page ↗
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
      {shown.length > limit && (
        <button type="button" onClick={() => setLimit((l) => l + 120)} className="rounded-md border border-edge-strong bg-surface px-3 py-1.5 text-sm font-medium text-water-link hover:bg-surface-muted">
          Show more ({shown.length - limit} left)
        </button>
      )}
    </div>
  );
}
