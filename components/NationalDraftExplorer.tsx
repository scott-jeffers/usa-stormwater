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
  practiceCount = 0,
}: {
  outlineTitle: string;
  generatedAt: string | null;
  model: string | null;
  sections: NationalSectionIndexItem[];
  pipelineStatus: PipelineStatusSummary | null;
  practiceCount?: number;
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
        <p className="max-w-2xl text-base leading-relaxed text-fg-secondary">
          A research synthesis of common U.S. post-construction stormwater
          criteria from this atlas — not a design manual, and not adopted
          regulation or local code.
        </p>
        <p className="text-sm text-fg-muted">
          {sections.filter((s) => s.has_draft).length} chapters
          {reviewedCount > 0 ? ` · ${reviewedCount} editorially reviewed` : ""}
          {practiceCount > 0
            ? ` · ${practiceCount} practice criteria`
            : ""}
          {generatedAt
            ? ` · ${new Date(generatedAt).toLocaleDateString("en-US", { timeZone: "UTC" })}`
            : ""}
        </p>
      </header>

      <details className="rounded-xl border border-edge/80 bg-surface shadow-sm open:shadow">
        <summary className="cursor-pointer list-none px-5 py-3.5 text-sm font-medium text-ink marker:content-none sm:px-6">
          <span className="inline-flex items-center gap-2">
            <span className="text-fg-subtle">▸</span>
            How this draft was built
          </span>
        </summary>
        <div className="border-t border-edge px-1 pb-1 sm:px-2">
          <NationalPipelineProgress status={pipelineStatus} />
        </div>
      </details>

      <div className="draft-note">
        Practice notes describe what manuals commonly contain. Guidance clauses
        are provisional synthesis for discussion — not adopted criteria. Verify
        every citation against the linked jurisdiction manual before design use.
      </div>

      <Link
        href="/manual/"
        className="block rounded-xl border border-water/40 bg-surface px-4 py-3 shadow-sm transition hover:border-water hover:bg-mist/40"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
            Draft national model manual
          </h2>
          <span className="status-chip status-open">Draft 0.4</span>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
          A complete draft manual a state could adopt by reference: permanent stormwater (Part A) and
          construction erosion and sediment control (Part B), every number graded by its evidence.
        </p>
      </Link>

      <Link
        href="/national/practices/"
        className="block rounded-xl border border-edge/80 bg-surface px-4 py-3 shadow-sm transition hover:border-water/40 hover:bg-mist/40"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
            Practice Criteria (SCMs / BMPs)
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-400/20">
              Draft
            </span>
            {practiceCount > 0 && (
              <span className="text-fg-muted">
                {practiceCount} practices
              </span>
            )}
          </div>
        </div>
        <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
          What state and local manuals require for bioretention, permeable
          pavement, swales, wet ponds and related practices, compared across states.
        </p>
      </Link>

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
          className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-ink shadow-sm outline-none ring-water/30 placeholder:text-fg-subtle focus:ring-2"
        />
        {!query && (
          <nav
            aria-label="Section contents"
            className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted"
          >
            <Link
              href="/national/practices/"
              className="font-medium text-water-deep hover:underline"
            >
              Practice Criteria
            </Link>
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
              className="block rounded-xl border border-edge/80 bg-surface px-4 py-3 shadow-sm transition hover:border-water/40 hover:bg-mist/40"
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
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-700/15 dark:bg-emerald-950/50 dark:text-emerald-300 dark:ring-emerald-400/20">
                      Reviewed
                    </span>
                  ) : section.has_draft ? (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-400/20">
                      Draft
                    </span>
                  ) : (
                    <span className="text-fg-subtle">Outline only</span>
                  )}
                  {section.citation_count > 0 && (
                    <span className="text-fg-muted">
                      {section.citation_count} citations
                    </span>
                  )}
                </div>
              </div>
              {section.prevalence != null && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-fg-muted">
                    Covered in {(section.prevalence * 100).toFixed(0)}% of manuals
                  </span>
                </div>
              )}
              {section.summary && (
                <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
                  {section.summary}
                </p>
              )}
            </Link>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="rounded-xl border border-dashed border-edge-strong bg-surface/60 px-4 py-8 text-center text-sm text-fg-muted">
            No sections match “{query}”.
          </li>
        )}
      </ol>
    </div>
  );
}
