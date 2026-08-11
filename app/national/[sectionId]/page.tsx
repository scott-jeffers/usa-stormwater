import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerifyBadge } from "@/components/Badge";
import { getManualSlugMap, type ManualRecord } from "@/lib/data";
import {
  getDraftSection,
  getNationalOutline,
  getNationalReaderIndex,
} from "@/lib/national";
import { isChapterProxy } from "@/lib/national/tierA";
import {
  getVerifyStatusMap,
  type JurisdictionVerifyStatus,
} from "@/lib/pipeline/verifyReport";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";

const PLACEHOLDER = "_placeholder";

type RawCitation = {
  slug: string;
  chunk_id: string | null;
  page_or_section: string | null;
  excerpt: string;
};

type EnrichedCitation = RawCitation & {
  jurisdictionName: string;
  stateCode: string | null;
  verify: JurisdictionVerifyStatus;
  chapterProxy: boolean;
};

export function generateStaticParams() {
  const { sections } = getNationalReaderIndex();
  if (sections.length === 0) {
    return [{ sectionId: PLACEHOLDER }];
  }
  return sections.map((s) => ({ sectionId: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}): Promise<Metadata> {
  const { sectionId } = await params;
  if (sectionId === PLACEHOLDER) return { title: "National draft" };
  const draft = getDraftSection(sectionId);
  const outline = getNationalOutline();
  const title =
    draft?.title ??
    outline?.sections.find((s) => s.id === sectionId)?.title ??
    sectionId;
  return {
    title,
    description: `U.S. Stormwater Practice Synthesis — ${title}`,
  };
}

export default async function NationalSectionPage({
  params,
}: {
  params: Promise<{ sectionId: string }>;
}) {
  const { sectionId } = await params;

  if (sectionId === PLACEHOLDER) {
    return (
      <main className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
        No national draft sections yet.
      </main>
    );
  }

  const outline = getNationalOutline();
  const meta = outline?.sections.find((s) => s.id === sectionId);
  const draft = getDraftSection(sectionId);

  if (!meta && !draft) {
    notFound();
  }

  const title = draft?.title ?? meta?.title ?? sectionId;
  const { sections } = getNationalReaderIndex();
  const idx = sections.findIndex((s) => s.id === sectionId);
  const prev = idx > 0 ? sections[idx - 1] : null;
  const next = idx >= 0 && idx < sections.length - 1 ? sections[idx + 1] : null;
  const parent =
    meta?.parent_id != null
      ? sections.find((s) => s.id === meta.parent_id) ?? null
      : null;

  const manualMap = getManualSlugMap();
  const verifyMap = getVerifyStatusMap();
  const enriched = enrichCitations(
    draft?.citations ?? [],
    manualMap,
    verifyMap
  );
  const citationsByState = groupCitationsByState(enriched);

  return (
    <main className="space-y-8">
      <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
        <Link
          href="/national/"
          className="font-medium text-water-link hover:text-water-deep hover:underline"
        >
          Practice synthesis
        </Link>
        {parent && (
          <>
            <span aria-hidden>/</span>
            <Link
              href={`/national/${parent.id}/`}
              className="text-water-link hover:underline"
            >
              {parent.title}
            </Link>
          </>
        )}
      </nav>

      <header className="overflow-hidden rounded-xl border border-slate-200/80 border-t-4 border-t-water bg-white p-6 shadow-sm">
        <p className="font-mono text-xs text-slate-400">{sectionId}</p>
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          {title}
        </h1>
        {meta?.summary && (
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {meta.summary}
          </p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {draft?.editorial_status === "reviewed" && (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800 ring-1 ring-inset ring-emerald-700/15">
              Reviewed
            </span>
          )}
          {meta?.prevalence != null && (
            <span>Prevalence {(meta.prevalence * 100).toFixed(0)}%</span>
          )}
          {meta?.source_manual_count != null && (
            <span>~{meta.source_manual_count} manuals tagged</span>
          )}
          {draft?.citations && (
            <span>{draft.citations.length} citations</span>
          )}
          {draft?.model && <span>Model: {draft.model}</span>}
          {meta?.regional_notes?.length ? (
            <span>Regional: {meta.regional_notes.join(", ")}</span>
          ) : null}
        </div>
      </header>

      {!draft ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
          Outline entry only — no draft JSON for this section yet.
        </p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            Provisional practice synthesis for discussion — not a design manual
            or adopted regulation. Controlling state, regional, and MS4 criteria
            apply when more stringent. Verify citations against the linked
            jurisdiction manuals.
          </div>

          <SectionBlock title="Practice" tone="neutral">
            <p className="whitespace-pre-wrap leading-relaxed">
              {draft.practice_survey}
            </p>
          </SectionBlock>

          {draft.guidance_tables && draft.guidance_tables.length > 0 && (
            <div className="space-y-4">
              {draft.guidance_tables.map((table) => (
                <SectionBlock key={table.id} title={table.title} tone="neutral">
                  {table.caption && (
                    <p className="mb-3 text-xs leading-relaxed text-slate-500">
                      {table.caption}
                    </p>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[20rem] border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                          {table.columns.map((col) => (
                            <th key={col} className="px-2 py-2 font-medium">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, ri) => (
                          <tr
                            key={`${table.id}-r${ri}`}
                            className="border-b border-slate-100"
                          >
                            {row.map((cell, ci) => {
                              const isAtlasNote =
                                ci === row.length - 1 &&
                                table.columns[ci]?.toLowerCase().includes("atlas");
                              const keys = table.row_citations?.[ri];
                              return (
                                <td
                                  key={`${table.id}-r${ri}-c${ci}`}
                                  className="px-2 py-2 text-slate-700"
                                >
                                  {cell}
                                  {isAtlasNote && keys && keys.length > 0 && (
                                    <CitationSuperscripts keys={keys} />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </SectionBlock>
              ))}
            </div>
          )}

          <SectionBlock title="Guidance" tone="emphasis">
            {draft.recommendation_clauses &&
            draft.recommendation_clauses.length > 0 ? (
              <ol className="space-y-4">
                {draft.recommendation_clauses.map((clause) => (
                  <li key={clause.id} className="leading-relaxed">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span className="font-mono text-xs font-semibold text-water-deep">
                        {clause.number}
                      </span>
                      <ConfidenceBadge confidence={clause.confidence} />
                    </div>
                    <p className="mt-1">
                      {clause.text}
                      {clause.citation_keys.length > 0 && (
                        <CitationSuperscripts keys={clause.citation_keys} />
                      )}
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">
                {draft.draft_recommendation}
              </p>
            )}
          </SectionBlock>

          {draft.regional_variants && (
            <SectionBlock title="Regional notes" tone="neutral">
              <p className="whitespace-pre-wrap leading-relaxed">
                {draft.regional_variants}
              </p>
            </SectionBlock>
          )}

          {draft.open_issues && (
            <SectionBlock title="Open questions" tone="neutral">
              <p className="whitespace-pre-wrap leading-relaxed">
                {draft.open_issues}
              </p>
            </SectionBlock>
          )}

          {draft.citation_registry && draft.citation_registry.length > 0 ? (
            <SectionBlock title="References" tone="neutral">
              <p className="mb-3 text-xs text-slate-500">
                Numbered footnotes for guidance clauses and atlas notes.
                Field-verified entries come from structured atlas evidence;
                corpus-pattern entries are keyword-matched excerpts.
              </p>
              <ol className="space-y-3">
                {draft.citation_registry.map((ref) => {
                  const manual = manualMap.get(ref.slug);
                  const name =
                    manual?.data.document_metadata.jurisdiction_name ??
                    ref.slug;
                  return (
                    <li
                      key={ref.key}
                      id={`ref-${ref.key}`}
                      className="scroll-mt-24 rounded-lg border border-slate-200 border-l-4 border-l-water/40 bg-mist/40 px-3 py-2"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="font-mono font-semibold text-water-deep">
                          [{ref.key}]
                        </span>
                        <Link
                          href={`/${ref.slug}/`}
                          className="font-medium text-water-link hover:underline"
                        >
                          {name}
                        </Link>
                        {ref.state_code && (
                          <span>
                            {STATE_CODE_TO_NAME[ref.state_code] ??
                              ref.state_code}
                          </span>
                        )}
                        <ConfidenceBadge confidence={ref.confidence} />
                        {isChapterProxy(ref.slug) && (
                          <span
                            className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15"
                            title="Partial or chapter-only PDF"
                          >
                            Chapter proxy
                          </span>
                        )}
                        {ref.page_or_section && (
                          <span>{ref.page_or_section}</span>
                        )}
                      </div>
                      <blockquote className="mt-1 text-sm italic leading-relaxed text-slate-700">
                        “{ref.excerpt}”
                      </blockquote>
                    </li>
                  );
                })}
              </ol>
            </SectionBlock>
          ) : (
            <SectionBlock title="Citations" tone="neutral">
              {enriched.length === 0 ? (
                <p className="text-sm text-slate-500">No citations recorded.</p>
              ) : (
                <div className="space-y-5">
                  {citationsByState.map(({ state, label, items }, stateIdx) => (
                    <details
                      key={state}
                      open={stateIdx === 0}
                      className="group"
                    >
                      <summary className="cursor-pointer list-none text-sm font-medium text-ink marker:content-none">
                        <span className="inline-flex items-center gap-2">
                          <span className="text-slate-400 group-open:rotate-90 transition">
                            ▸
                          </span>
                          {label}
                          <span className="font-normal text-slate-400">
                            ({items.length})
                          </span>
                        </span>
                      </summary>
                      <ul className="mt-2 space-y-3">
                        {items.map((c, i) => (
                          <li
                            key={`${c.slug}-${c.chunk_id}-${i}`}
                            className="rounded-lg border border-slate-200 border-l-4 border-l-water/40 bg-mist/40 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                              <Link
                                href={`/${c.slug}/`}
                                className="font-medium text-water-link hover:underline"
                              >
                                {c.jurisdictionName}
                              </Link>
                              {c.stateCode && (
                                <span>
                                  {STATE_CODE_TO_NAME[c.stateCode] ??
                                    c.stateCode}
                                </span>
                              )}
                              <VerifyBadge
                                status={c.verify.status}
                                mismatchCount={c.verify.mismatchCount}
                              />
                              {c.chapterProxy && (
                                <span
                                  className="rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-900 ring-1 ring-inset ring-amber-700/15"
                                  title="Partial or chapter-only PDF — do not use alone as a national default"
                                >
                                  Chapter proxy
                                </span>
                              )}
                              {c.page_or_section && (
                                <span>{c.page_or_section}</span>
                              )}
                            </div>
                            <blockquote className="mt-1 text-sm italic leading-relaxed text-slate-700">
                              “{c.excerpt}”
                            </blockquote>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </SectionBlock>
          )}

          {draft.supporting_slugs.length > 0 && (
            <SectionBlock title="Supporting jurisdictions" tone="neutral">
              <p className="mb-2 text-sm text-slate-600">
                {draft.supporting_slugs.length} jurisdictions cited in this
                section
                {meta?.source_manual_count != null
                  ? ` (outline tags ~${meta.source_manual_count} manuals; full atlas has ~299).`
                  : " from the atlas evidence base."}
              </p>
              <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
                {draft.supporting_slugs.map((slug) => (
                  <Link
                    key={slug}
                    href={`/${slug}/`}
                    className="text-water-link hover:underline"
                  >
                    {slug}
                  </Link>
                ))}
              </p>
            </SectionBlock>
          )}
        </div>
      )}

      <nav className="flex flex-wrap justify-between gap-4 border-t border-slate-200 pt-6 text-sm">
        {prev ? (
          <Link
            href={`/national/${prev.id}/`}
            className="text-water-link hover:underline"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/national/${next.id}/`}
            className="text-water-link hover:underline"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}

function enrichCitations(
  citations: RawCitation[],
  manualMap: Map<string, ManualRecord>,
  verifyMap: Map<string, JurisdictionVerifyStatus>
): EnrichedCitation[] {
  return citations.map((c) => {
    const manual = manualMap.get(c.slug);
    return {
      ...c,
      jurisdictionName:
        manual?.data.document_metadata.jurisdiction_name ?? c.slug,
      stateCode: manual?.data.document_metadata.state_code ?? null,
      verify: verifyMap.get(c.slug) ?? {
        status: "unknown",
        failedFields: [],
        mismatchCount: 0,
      },
      chapterProxy: isChapterProxy(c.slug),
    };
  });
}

function groupCitationsByState(
  citations: EnrichedCitation[]
): Array<{
  state: string;
  label: string;
  items: EnrichedCitation[];
}> {
  const map = new Map<string, EnrichedCitation[]>();
  for (const c of citations) {
    const code = c.stateCode ?? "??";
    const list = map.get(code) ?? [];
    list.push(c);
    map.set(code, list);
  }
  return [...map.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([state, items]) => ({
      state,
      label:
        state === "??"
          ? "Unknown state"
          : STATE_CODE_TO_NAME[state] ?? state,
      items,
    }));
}

function CitationSuperscripts({ keys }: { keys: string[] }) {
  return (
    <sup className="ml-0.5 whitespace-nowrap text-[0.7em] font-medium text-water-deep">
      [
      {keys.map((k, i) => (
        <span key={k}>
          {i > 0 ? "," : ""}
          <a
            href={`#ref-${k}`}
            className="text-water-link hover:underline"
            title={`Jump to reference ${k}`}
          >
            {k}
          </a>
        </span>
      ))}
      ]
    </sup>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: "field_verified" | "corpus_pattern" | "editorial";
}) {
  if (confidence === "field_verified") {
    return (
      <span
        className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-800 ring-1 ring-inset ring-emerald-700/15"
        title="Backed by structured atlas field evidence"
      >
        Field-verified
      </span>
    );
  }
  if (confidence === "corpus_pattern") {
    return (
      <span
        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-600 ring-1 ring-inset ring-slate-500/15"
        title="Backed by keyword-matched corpus excerpts"
      >
        Corpus pattern
      </span>
    );
  }
  return (
    <span
      className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 ring-1 ring-inset ring-amber-700/20"
      title="Editorial synthesis — not a direct field match"
    >
      Editorial
    </span>
  );
}

function SectionBlock({
  title,
  children,
  tone,
}: {
  title: string;
  children: React.ReactNode;
  tone: "neutral" | "emphasis";
}) {
  if (tone === "emphasis") {
    return (
      <section className="rounded-xl border border-water/30 bg-gradient-to-br from-water/5 to-white p-6 shadow-sm ring-1 ring-water/10">
        <h2 className="font-display text-lg font-semibold text-water-deep">
          {title}
        </h2>
        <div className="mt-3 text-sm text-slate-800">{children}</div>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-3 text-sm text-slate-700">{children}</div>
    </section>
  );
}
