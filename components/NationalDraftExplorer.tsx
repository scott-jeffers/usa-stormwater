"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { NationalPipelineProgress } from "@/components/NationalPipelineProgress";
import type { PipelineStatusSummary } from "@/lib/pipeline/statusSummary";

export interface NationalSectionIndexItem {
  id: string;
  title: string;
  level: number;
  parent_id: string | null;
  prevalence: number | null;
  summary: string | null;
  has_draft: boolean;
  editorial_status: "draft" | "reviewed" | null;
  citation_count: number;
  searchText: string;
}

export function NationalDraftExplorer({
  outlineTitle: _outlineTitle,
  generatedAt,
  model: _model,
  sections,
  pipelineStatus,
}: {
  outlineTitle: string;
  generatedAt: string | null;
  model: string | null;
  sections: NationalSectionIndexItem[];
  pipelineStatus: PipelineStatusSummary | null;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        (s.summary ?? "").toLowerCase().includes(q) ||
        s.searchText.includes(q)
    );
  }, [query, sections]);

  const reviewedCount = sections.filter(
    (s) => s.editorial_status === "reviewed"
  ).length;

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <p className="text-sm font-medium text-water">
          <Link href="/" className="hover:underline">
            ← Back to atlas
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          U.S. Stormwater Practice Synthesis
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-slate-600">
          A research synthesis of common U.S. post-construction stormwater
          criteria from this atlas — not a design manual, and not adopted
          regulation or local code.
        </p>
        <p className="text-sm text-slate-500">
          {sections.filter((s) => s.has_draft).length} chapters
          {reviewedCount > 0 ? ` · ${reviewedCount} editorially reviewed` : ""}
          {generatedAt
            ? ` · ${new Date(generatedAt).toLocaleDateString()}`
            : ""}
        </p>
      </header>

      <details className="rounded-xl border border-slate-200/80 bg-white shadow-sm open:shadow">
        <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium text-ink marker:content-none sm:px-6">
          <span className="inline-flex items-center gap-2">
            <span className="text-slate-400">▸</span>
            How this draft was built
          </span>
        </summary>
        <div className="border-t border-slate-100 px-1 pb-1 sm:px-2">
          <NationalPipelineProgress status={pipelineStatus} />
        </div>
      </details>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
        Practice notes describe what manuals commonly contain. Guidance clauses
        are provisional synthesis for discussion — not adopted criteria. Verify
        every citation against the linked jurisdiction manual before design use.
      </div>

      <div className="sticky top-0 z-10 -mx-1 space-y-3 bg-mist/90 px-1 py-3 backdrop-blur-sm">
        <label className="sr-only" htmlFor="national-search">
          Search draft sections
        </label>
        <input
          id="national-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, surveys, recommendations…"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-ink shadow-sm outline-none ring-water/30 placeholder:text-slate-400 focus:ring-2"
        />
        {!query && (
          <nav
            aria-label="Section contents"
            className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500"
          >
            {sections
              .filter((s) => s.level === 1)
              .map((s) => (
                <a
                  key={s.id}
                  href={`#toc-${s.id}`}
                  className="hover:text-water-deep hover:underline"
                >
                  {s.title}
                </a>
              ))}
          </nav>
        )}
      </div>

      <ol className="space-y-2">
        {filtered.map((section) => (
          <li key={section.id} id={`toc-${section.id}`}>
            <Link
              href={`/national/${section.id}/`}
              className="block rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition hover:border-water/40 hover:bg-mist/40"
              style={{
                marginLeft: `${Math.max(0, section.level - 1) * 1.25}rem`,
              }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
                  {section.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {section.editorial_status === "reviewed" ? (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-700/15">
                      Reviewed
                    </span>
                  ) : section.has_draft ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15">
                      Draft
                    </span>
                  ) : (
                    <span className="text-slate-400">Outline only</span>
                  )}
                  {section.citation_count > 0 && (
                    <span className="text-slate-500">
                      {section.citation_count} citations
                    </span>
                  )}
                </div>
              </div>
              {section.prevalence != null && (
                <div className="mt-2 flex items-center gap-2">
                  <div
                    className="h-1.5 flex-1 max-w-[12rem] overflow-hidden rounded-full bg-slate-100"
                    role="img"
                    aria-label={`Topic prevalence ${(section.prevalence * 100).toFixed(0)} percent`}
                  >
                    <span
                      className="block h-full bg-water/70"
                      style={{ width: `${Math.round(section.prevalence * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">
                    {(section.prevalence * 100).toFixed(0)}% tagged
                  </span>
                </div>
              )}
              {section.summary && (
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {section.summary}
                </p>
              )}
              <p className="mt-1 font-mono text-[11px] text-slate-400">
                {section.id}
              </p>
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-4 py-8 text-center text-sm text-slate-500">
            No sections match “{query}”.
          </li>
        )}
      </ol>
    </div>
  );
}
