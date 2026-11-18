import type { ReactNode } from "react";
import type { StormwaterData } from "@/lib/schema";
import type { EvidenceQaRecord, ExcerptQa } from "@/lib/qa/types";
import { findEvidence, isFieldNotFound } from "@/lib/evidence";

type Evidence = StormwaterData["evidence"][number];

interface FieldWithEvidenceProps {
  label: string;
  fieldPath: string;
  value: ReactNode;
  evidence: StormwaterData["evidence"];
  fieldsNotFound: string[];
  /** Strict QA results for this record (data/qa/evidence.json). */
  qa?: EvidenceQaRecord | null;
  /** Source PDF, for "open at page" links. */
  pdfUrl?: string | null;
  /** Record slug, for the "more excerpts" JSON link. */
  slug?: string;
}

const MAX_EXCERPTS = 3;

function matchesFor(evidence: Evidence[], fieldPath: string): Array<{ ev: Evidence; i: number }> {
  const direct = evidence
    .map((ev, i) => ({ ev, i }))
    .filter(
      ({ ev }) =>
        ev.field === fieldPath ||
        ev.field.startsWith(`${fieldPath}.`) ||
        ev.field.startsWith(`${fieldPath}[`)
    );
  if (direct.length) return direct;
  const loose = findEvidence(evidence, fieldPath);
  return loose ? [{ ev: loose, i: evidence.indexOf(loose) }] : [];
}

function pageHref(pdfUrl: string | null | undefined, page: number | null): string | null {
  if (!pdfUrl || page == null || !/\.pdf($|[?#])/i.test(pdfUrl)) return null;
  return `${pdfUrl.split("#")[0]}#page=${page}`;
}

function QaChip({ qa, pdfUrl }: { qa: ExcerptQa | undefined; pdfUrl?: string | null }) {
  if (!qa) return null;
  const href = pageHref(pdfUrl, qa.page);
  const pageLink =
    qa.page != null ? (
      href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">
          PDF p. {qa.page}
        </a>
      ) : (
        <>PDF p. {qa.page}</>
      )
    ) : null;

  const base = "mt-1.5 inline-flex flex-wrap items-center gap-1 text-[11px] font-medium not-italic";
  switch (qa.status) {
    case "exact":
      return (
        <p className={`${base} text-emerald-700 dark:text-emerald-300`}>
          <span aria-hidden>✓</span> Quote found in source{pageLink && <> · {pageLink}</>}
        </p>
      );
    case "fuzzy":
      return (
        <p className={`${base} text-emerald-700 dark:text-emerald-300`}>
          <span aria-hidden>✓</span> Close match in source, numbers identical{pageLink && <> · {pageLink}</>}
        </p>
      );
    case "unverifiable":
      return (
        <p className={`${base} text-amber-700 dark:text-amber-300`}>
          <span aria-hidden>?</span> Couldn&rsquo;t check: the PDF&rsquo;s text drops these numbers
          {pageLink && <> · check {pageLink}</>}
        </p>
      );
    default:
      return (
        <p className={`${base} text-rose-700 dark:text-rose-300`}>
          <span aria-hidden>✗</span>
          {qa.source_numbers?.length
            ? <>Source shows {qa.source_numbers.join(", ")} here, not {qa.missing_numbers.join(", ")}</>
            : <>Not found word-for-word in the source; treat as unverified</>}
        </p>
      );
  }
}

export function FieldWithEvidence({
  label,
  fieldPath,
  value,
  evidence,
  fieldsNotFound,
  qa,
  pdfUrl,
  slug,
}: FieldWithEvidenceProps) {
  const matches = matchesFor(evidence, fieldPath);
  const notFound = isFieldNotFound(fieldsNotFound, fieldPath);
  const warnings = (qa?.warnings ?? []).filter((w) => w.field === fieldPath);
  const empty = notFound || value === null || value === undefined || value === "";

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-edge py-4 last:border-b-0 sm:grid-cols-2">
      <div>
        <div className="text-xs font-medium uppercase tracking-wide text-fg-subtle">
          {label}
        </div>
        <div className="mt-1 text-sm text-foreground">
          {empty ? <span className="italic text-fg-subtle">Not found in document</span> : value}
        </div>
        {!empty &&
          warnings.map((w) => (
            <p key={w.kind} className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              <span aria-hidden>⚠</span>{" "}
              {w.kind === "value_not_in_excerpt"
                ? `Check this value: ${w.detail}.`
                : "No supporting quote was recorded for this value."}
            </p>
          ))}
      </div>
      <div className="space-y-2">
        {matches.length ? (
          matches.slice(0, MAX_EXCERPTS).map(({ ev, i }) => (
            <blockquote
              key={i}
              className="rounded-md border border-edge border-l-4 border-l-water/40 bg-mist/40 px-3 py-2 text-xs text-fg-secondary"
            >
              <p className="italic">&ldquo;{ev.excerpt}&rdquo;</p>
              {ev.page_or_section && (
                <p className="mt-1 font-medium text-fg-subtle">{ev.page_or_section}</p>
              )}
              <QaChip qa={qa?.excerpts[i]} pdfUrl={pdfUrl} />
            </blockquote>
          ))
        ) : (
          <p className="text-xs text-fg-faint">No evidence cited</p>
        )}
        {matches.length > MAX_EXCERPTS && (
          <p className="text-xs text-fg-subtle">
            +{matches.length - MAX_EXCERPTS} more excerpt{matches.length - MAX_EXCERPTS === 1 ? "" : "s"} in the{" "}
            <a href={slug ? `/data/manuals/${slug}.json` : "/data/manuals.json"} className="underline">JSON data</a>
          </p>
        )}
      </div>
    </div>
  );
}
