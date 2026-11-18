import { pageMeta } from "@/lib/site";
import { reportErrorHref } from "@/lib/reportError";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllManuals, getManualBySlug, revisionDateFromMetadata } from "@/lib/data";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";
import {
  ConfidenceBadge,
  LevelBadge,
  LEVEL_LABELS,
  NeedsReviewBadge,
  StateBadge,
  VerifyBadge,
  AgencyBadge,
} from "@/components/Badge";
import { FieldWithEvidence } from "@/components/FieldWithEvidence";
import { getEvidenceQa } from "@/lib/qa/load";
import { getSharedInfo, BASIS_LABELS } from "@/lib/sharedManuals";
import { NUMERIC_PARAM_FIELDS } from "@/lib/practices/fields";
import { inferAgencyCategory, normalizeAgencyCategory } from "@/lib/agencyTypes";

const PLACEHOLDER_SLUG = "_placeholder";

const FIELD_LABELS: Record<string, string> = {
  jurisdiction_level: "jurisdiction level",
  state_code: "state",
  version_or_edition: "version / edition",
  adoption_or_effective_date: "adoption date",
  last_revised_date: "last revised date",
  relationship_to_state_manual: "relationship to state manual",
  design_storm_return_periods_years: "design storms",
  water_quality_volume_method: "water quality volume method",
  peak_flow_calculation_method: "peak flow method",
  required_hydrologic_hydraulic_software: "H&H software",
  approved_bmp_categories: "BMP categories",
};

/** Short document title for disambiguating same-name records. */
function shortTitle(title: string): string {
  const t = title.replace(/\s*[—–(:].*$/, "").trim();
  return t.length > 40 ? `${t.slice(0, 38).trimEnd()}…` : t;
}

/** "design_criteria.water_quality_volume_method" → "water quality volume method" */
function humanizeField(path: string): string {
  const last = path.split(".").pop() ?? path;
  return FIELD_LABELS[last] ?? last.replace(/_/g, " ");
}

export function generateStaticParams() {
  const manuals = getAllManuals();
  // `output: 'export'` requires at least one generated param for a dynamic
  // route. Before the first manual is ingested, emit a placeholder route
  // that renders an empty-state message instead of failing the build.
  if (manuals.length === 0) {
    return [{ slug: PLACEHOLDER_SLUG }];
  }
  return manuals.map((manual) => ({ slug: manual.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const manual = slug === PLACEHOLDER_SLUG ? undefined : getManualBySlug(slug);

  if (!manual) {
    return { title: "Manual" };
  }

  const { jurisdiction_name, document_title } = manual.data.document_metadata;
  return pageMeta(`/${slug}/`, jurisdiction_name, `${document_title}: design storms, water-quality volume, peak-flow methods and BMPs, each with the quote from the manual.`);
}

export default async function ManualDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (slug === PLACEHOLDER_SLUG) {
    return (
      <main className="space-y-6">
        <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
          <Link href="/" className="font-medium text-water-link hover:text-water-deep hover:underline">
            &larr; Back to dashboard
          </Link>
        </nav>
        <div className="rounded-xl border border-dashed border-edge-strong bg-surface p-10 text-center text-fg-muted">
          No manuals ingested yet. Run{" "}
          <code className="rounded bg-surface-muted px-1.5 py-0.5">
            npm run ingest -- path/to/manual.pdf
          </code>{" "}
          to add the first one.
        </div>
      </main>
    );
  }

  const manual = getManualBySlug(slug);

  if (!manual) {
    notFound();
  }

  const { data } = manual;
  const {
    document_metadata: meta,
    evidence,
    extraction_quality: quality,
    source,
  } = data;

  const relatedInState = meta.state_code
    ? getAllManuals().filter(
        (m) =>
          m.slug !== slug &&
          m.data.document_metadata.state_code === meta.state_code
      )
    : [];
  const relatedFederal =
    meta.jurisdiction_level === "federal"
      ? getAllManuals().filter(
          (m) =>
            m.slug !== slug &&
            m.data.document_metadata.jurisdiction_level === "federal"
        )
      : [];
  // getAllManuals is cached; related list is a cheap in-memory filter.

  const fieldsNotFound = quality.fields_not_found;
  const primarySourceUrl = source.document_url ?? source.landing_page_url;
  const qa = getEvidenceQa(slug);
  const ev = {
    evidence,
    fieldsNotFound,
    qa,
    pdfUrl: source.document_url,
    slug,
  };
  // Records sharing one source PDF show the representative's values, so
  // the same manual can't give different answers on different pages.
  const shared = getSharedInfo(slug);
  const repManual =
    shared && !shared.isRepresentative && shared.representative !== slug
      ? getManualBySlug(shared.representative)
      : null;
  const designData = repManual?.data ?? data;
  const edition = revisionDateFromMetadata(designData.document_metadata);
  const editionYear = edition ? Number(String(edition).slice(0, 4)) || null : null;
  const designSlug = repManual?.slug ?? slug;
  const designQa = repManual ? getEvidenceQa(designSlug) : qa;
  const designEv = {
    evidence: designData.evidence,
    fieldsNotFound: designData.extraction_quality.fields_not_found,
    qa: designQa,
    pdfUrl: designData.source.document_url,
    slug: designSlug,
  };
  const criteria = designData.design_criteria;
  const ownFails = (qa?.excerpts ?? []).filter(
    (x) => x.status === "fail" && (!repManual || x.field.startsWith("document_metadata."))
  );
  const designFails = repManual
    ? (designQa?.excerpts ?? []).filter(
        (x) => x.status === "fail" && !x.field.startsWith("document_metadata.")
      )
    : [];
  const failedQa = [...ownFails, ...designFails];
  const shownStatus =
    failedQa.length > 0
      ? "failed"
      : qa?.status === "warnings" || designQa?.status === "warnings"
        ? "warnings"
        : (designQa ?? qa)?.status ?? "unknown";
  const dp = designData.design_parameters as Record<string, unknown> | undefined;
  const paramRows = NUMERIC_PARAM_FIELDS.filter(
    (f) => typeof dp?.[f.field] === "number"
  );
  const agencyCategory =
    normalizeAgencyCategory(meta.issuing_agency_category) ??
    inferAgencyCategory({
      slug,
      jurisdictionName: meta.jurisdiction_name,
      documentTitle: meta.document_title,
    });

  return (
    <main className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/" className="font-medium text-water-link hover:text-water-deep hover:underline">
          &larr; Back to dashboard
        </Link>
      </nav>

      <header className="overflow-hidden rounded-xl border border-edge/80 border-t-4 border-t-water bg-surface p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {meta.jurisdiction_name}
            </h1>
            <p className="mt-1 text-sm text-fg-secondary">
              {shared?.basis === "stand_in" && repManual ? (
                <>
                  <span className="font-medium text-amber-800 dark:text-amber-200">Placeholder:</span>{" "}
                  {repManual.data.document_metadata.jurisdiction_name}&rsquo;s {meta.document_title}
                </>
              ) : (
                meta.document_title
              )}
            </p>
            <p className="mt-1 text-xs text-fg-subtle">
              {edition ? (
                <>
                  Edition: {edition}
                  {editionYear != null && editionYear < 2010 && (
                    <span className="text-amber-700 dark:text-amber-300">
                      {" "}· {new Date().getUTCFullYear() - editionYear}+ years old, check for a newer version
                    </span>
                  )}
                </>
              ) : (
                <>Edition date not stated in the document</>
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <LevelBadge level={meta.jurisdiction_level} />
              <AgencyBadge category={agencyCategory} />
              <StateBadge stateCode={meta.state_code} showName />
              <ConfidenceBadge confidence={quality.confidence} withLabel />
              <NeedsReviewBadge needsReview={quality.needs_human_review} />
              <VerifyBadge status={shownStatus} mismatchCount={failedQa.length} />
              {shared && shared.basis !== "issuer" && (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${
                    shared.basis === "stand_in"
                      ? "bg-amber-50 text-amber-900 ring-amber-700/20 dark:bg-amber-950/50 dark:text-amber-200 dark:ring-amber-400/20"
                      : "bg-surface-muted text-fg-secondary ring-edge-strong/40"
                  }`}
                >
                  {BASIS_LABELS[shared.basis]}
                </span>
              )}
            </div>
            {(source.document_url || source.landing_page_url) && (
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                {source.document_url && (
                  <a
                    href={source.document_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-water-link hover:text-water-deep hover:underline"
                  >
                    Open source PDF ↗
                  </a>
                )}
                {source.landing_page_url && (
                  <a
                    href={source.landing_page_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-water-link hover:text-water-deep hover:underline"
                  >
                    Official agency page ↗
                  </a>
                )}
                <Link
                  href={`/compare/?m=${slug}`}
                  className="font-medium text-water-link hover:text-water-deep hover:underline"
                >
                  Compare with others
                </Link>
                <a
                  href={reportErrorHref(slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-fg-subtle hover:text-water-link hover:underline"
                >
                  Report an error ↗
                </a>
              </div>
            )}
            {!primarySourceUrl && (
              <p className="mt-3 text-xs text-fg-subtle">
                No source URL recorded. Re-ingest with{" "}
                <code className="rounded bg-surface-muted px-1">--url</code> and/or{" "}
                <code className="rounded bg-surface-muted px-1">--landing-page</code>.
              </p>
            )}
          </div>
        </div>

        {shared && repManual && (
          <div
            className={`mt-4 rounded-md border p-3 text-sm ${
              shared.basis === "stand_in"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
                : "border-edge bg-mist/40 text-fg-secondary"
            }`}
          >
            {shared.basis === "stand_in" ? (
              <>
                <p className="font-medium">
                  Stand-in: no {meta.jurisdiction_name} manual has been added yet.
                </p>
                <p className="mt-1">
                  The design values below come from{" "}
                  <Link href={`/${repManual.slug}/`} className="font-medium underline">
                    {shared.group.issuer}
                  </Link>{" "}
                  and are shown only as a placeholder. They may not apply in{" "}
                  {meta.jurisdiction_name}.
                </p>
              </>
            ) : (
              <p>
                {meta.jurisdiction_name} uses the{" "}
                {shared.basis === "state_manual" ? "state" : "regional"} manual published by{" "}
                <strong>{shared.group.issuer}</strong>. The design values below come from{" "}
                <Link href={`/${repManual.slug}/`} className="font-medium underline">
                  that manual&rsquo;s record
                </Link>
                , shared with {shared.others.length} other record
                {shared.others.length === 1 ? "" : "s"}. Check for local amendments before
                relying on them.
              </p>
            )}
            {shared.note && <p className="mt-1 text-xs opacity-90">{shared.note}</p>}
          </div>
        )}
        {shared && !repManual && !shared.isRepresentative && (
          <div
            className={`mt-4 rounded-md border p-3 text-sm ${
              shared.basis === "stand_in"
                ? "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100"
                : "border-edge bg-mist/40 text-fg-secondary"
            }`}
          >
            {shared.basis === "stand_in" ? (
              <p>
                <span className="font-medium">
                  Stand-in: no {meta.jurisdiction_name} manual has been added yet.
                </span>{" "}
                This record shows a document from {shared.group.issuer} as a placeholder; it
                may not apply here.
              </p>
            ) : (
              <p>
                {meta.jurisdiction_name} is covered by a{" "}
                {shared.basis === "state_manual" ? "state" : "regional"} manual published by{" "}
                <strong>{shared.group.issuer}</strong>. Check for local amendments before relying
                on it.
              </p>
            )}
            {shared.note && <p className="mt-1 text-xs opacity-90">{shared.note}</p>}
          </div>
        )}
        {shared && shared.isRepresentative && (
          <p className="mt-4 text-xs text-fg-muted">
            This manual is also the source for:{" "}
            {shared.others.map((o, i) => {
              const other = getManualBySlug(o.slug);
              return (
                <span key={o.slug}>
                  {i > 0 && ", "}
                  <Link href={`/${o.slug}/`} className="text-water-link underline decoration-water/40 underline-offset-2">
                    {other?.data.document_metadata.jurisdiction_name ?? o.slug}
                  </Link>
                  {o.basis === "stand_in" && " (stand-in)"}
                </span>
              );
            })}
            .
          </p>
        )}

        {failedQa.length > 0 && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
            <p className="font-medium">
              {failedQa.length} cited quote{failedQa.length === 1 ? " was" : "s were"} not found
              word-for-word in the source manual.
            </p>
            <p className="mt-1 text-xs text-rose-800/90 dark:text-rose-200/90">
              Those fields are marked below. Treat their values as unverified until checked
              against the PDF.{" "}
              <Link href="/about/#verification" className="font-medium underline">
                How citations are checked
              </Link>
            </p>
          </div>
        )}

        {quality.needs_human_review && (
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-100">
            <p className="font-medium">
              This extraction is flagged for quality review.
            </p>
            <p className="mt-1 text-orange-800/90 dark:text-orange-200/90">
              Compare each cited field to the official PDF before relying on it.{" "}
              <Link href="/about/#needs-review" className="font-medium underline">
                What this means
              </Link>
            </p>
            {quality.review_notes && (
              <p className="mt-2">{quality.review_notes}</p>
            )}
          </div>
        )}

        {designEv.fieldsNotFound.length > 0 && (
          <div className="mt-3 text-xs text-fg-muted">
            <span className="font-medium text-fg-secondary">Fields not found in document: </span>
            {designEv.fieldsNotFound.map(humanizeField).join(", ")}
          </div>
        )}

        {relatedFederal.length > 0 && (
          <div className="mt-4 border-t border-edge pt-3 text-xs text-fg-muted">
            <span className="font-medium text-fg-secondary">
              Other federal manuals:{" "}
            </span>
            {relatedFederal.map((m, i) => (
              <span key={m.slug}>
                {i > 0 && ", "}
                <Link href={`/${m.slug}/`} className="text-water-link underline decoration-water/40 underline-offset-2 hover:text-water-deep">
                  {m.data.document_metadata.document_title}
                </Link>
              </span>
            ))}
          </div>
        )}
        {relatedInState.length > 0 && (
          <div className="mt-4 border-t border-edge pt-3 text-xs text-fg-muted">
            <span className="font-medium text-fg-secondary">
              Other manuals in {STATE_CODE_TO_NAME[meta.state_code!] ?? meta.state_code}:{" "}
            </span>
            {relatedInState.map((m, i) => (
              <span key={m.slug}>
                {i > 0 && ", "}
                <Link href={`/${m.slug}/`} className="text-water-link underline decoration-water/40 underline-offset-2 hover:text-water-deep">
                  {m.data.document_metadata.jurisdiction_name}
                  {relatedInState.filter(
                    (o) =>
                      o.data.document_metadata.jurisdiction_name ===
                      m.data.document_metadata.jurisdiction_name
                  ).length > 1 &&
                    ` (${shortTitle(m.data.document_metadata.document_title)})`}
                </Link>
              </span>
            ))}
          </div>
        )}
      </header>

      <section className="rounded-xl border border-edge/80 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Document Metadata</h2>
        <div className="mt-2">
          <FieldWithEvidence
            label="Jurisdiction level"
            fieldPath="document_metadata.jurisdiction_level"
            value={LEVEL_LABELS[meta.jurisdiction_level]}
            {...ev}
          />
          <FieldWithEvidence
            label="State"
            fieldPath="document_metadata.state_code"
            value={meta.state_code ? STATE_CODE_TO_NAME[meta.state_code] ?? meta.state_code : null}
            {...ev}
          />
          <FieldWithEvidence
            label="Version / edition"
            fieldPath="document_metadata.version_or_edition"
            value={meta.version_or_edition}
            {...ev}
          />
          <FieldWithEvidence
            label="Adoption / effective date"
            fieldPath="document_metadata.adoption_or_effective_date"
            value={meta.adoption_or_effective_date}
            {...ev}
          />
          <FieldWithEvidence
            label="Last revised date"
            fieldPath="document_metadata.last_revised_date"
            value={meta.last_revised_date}
            {...ev}
          />
          <FieldWithEvidence
            label="Relationship to state manual"
            fieldPath="document_metadata.relationship_to_state_manual"
            value={<span className="capitalize">{meta.relationship_to_state_manual.replace(/_/g, " ")}</span>}
            {...ev}
          />
        </div>
      </section>

      <section className="rounded-xl border border-edge/80 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Design Criteria</h2>
        {repManual && (
          <p className="mt-1 text-xs text-fg-muted">
            From the{" "}
            <Link href={`/${repManual.slug}/`} className="underline">
              {repManual.data.document_metadata.document_title}
            </Link>{" "}
            record.
          </p>
        )}
        <div className="mt-2">
          <FieldWithEvidence
            label="Design storm return periods (years)"
            fieldPath="design_criteria.design_storm_return_periods_years"
            value={
              criteria.design_storm_return_periods_years.length
                ? criteria.design_storm_return_periods_years
                    .map((y) => `${y}-year`)
                    .join(", ")
                : null
            }
            {...designEv}
          />
          <FieldWithEvidence
            label="Water quality volume method"
            fieldPath="design_criteria.water_quality_volume_method"
            value={criteria.water_quality_volume_method}
            {...designEv}
          />
          <FieldWithEvidence
            label="Peak flow calculation method(s)"
            fieldPath="design_criteria.peak_flow_calculation_method"
            value={
              criteria.peak_flow_calculation_method.length
                ? criteria.peak_flow_calculation_method.join(", ")
                : null
            }
            {...designEv}
          />
          <FieldWithEvidence
            label="Hydrologic/hydraulic software"
            fieldPath="design_criteria.required_hydrologic_hydraulic_software"
            value={
              criteria.required_hydrologic_hydraulic_software.length
                ? criteria.required_hydrologic_hydraulic_software.join(", ")
                : null
            }
            {...designEv}
          />
          <FieldWithEvidence
            label="Approved BMP categories"
            fieldPath="design_criteria.approved_bmp_categories"
            value={
              criteria.approved_bmp_categories.length
                ? criteria.approved_bmp_categories.join(", ")
                : null
            }
            {...designEv}
          />
        </div>
      </section>

      {paramRows.length > 0 && (
        <section className="rounded-xl border border-edge/80 bg-surface p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-ink">Design Parameters</h2>
          <p className="mt-1 text-xs text-fg-muted">
            Numeric values extracted from the manual. Site-wide values (water-quality depth,
            drawdown, groundwater separation) size the whole site, not one practice.
          </p>
          <div className="mt-2">
            {paramRows.map((f) => (
              <FieldWithEvidence
                key={f.field}
                label={f.label}
                fieldPath={`design_parameters.${f.field}`}
                value={`${dp![f.field] as number} ${f.unit}`}
                {...designEv}
                fieldsNotFound={[]}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
