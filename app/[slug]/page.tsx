import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllManuals, getManualBySlug } from "@/lib/data";
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
import { getJurisdictionVerifyStatus } from "@/lib/pipeline/verifyReport";
import { inferAgencyCategory, normalizeAgencyCategory } from "@/lib/agencyTypes";

const PLACEHOLDER_SLUG = "_placeholder";

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
  return {
    title: jurisdiction_name,
    description: document_title,
  };
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
        <nav className="text-sm text-fg-muted">
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
    design_criteria: criteria,
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
  const verify = getJurisdictionVerifyStatus(slug);
  const agencyCategory =
    normalizeAgencyCategory(meta.issuing_agency_category) ??
    inferAgencyCategory({
      slug,
      jurisdictionName: meta.jurisdiction_name,
      documentTitle: meta.document_title,
    });

  return (
    <main className="space-y-6">
      <nav className="text-sm text-fg-muted">
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
            <p className="mt-1 text-sm text-fg-secondary">{meta.document_title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <LevelBadge level={meta.jurisdiction_level} />
              <AgencyBadge category={agencyCategory} />
              <StateBadge stateCode={meta.state_code} showName />
              <ConfidenceBadge confidence={quality.confidence} />
              <NeedsReviewBadge needsReview={quality.needs_human_review} />
              <VerifyBadge
                status={verify.status}
                mismatchCount={verify.mismatchCount}
              />
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

        {verify.status === "failed" && verify.failedFields.length > 0 && (
          <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100">
            <p className="font-medium">
              Corpus verify found citation mismatches for{" "}
              {verify.mismatchCount} field
              {verify.mismatchCount === 1 ? "" : "s"}.
            </p>
            <p className="mt-1 text-xs text-rose-800/90 dark:text-rose-200/90">
              {verify.failedFields.join(", ")}
            </p>
          </div>
        )}

        {quality.needs_human_review && (
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800 dark:border-orange-500/30 dark:bg-orange-950/40 dark:text-orange-100">
            <p className="font-medium">This extraction needs human review.</p>
            {quality.review_notes && (
              <p className="mt-1">{quality.review_notes}</p>
            )}
          </div>
        )}

        {fieldsNotFound.length > 0 && (
          <div className="mt-3 text-xs text-fg-muted">
            <span className="font-medium text-fg-secondary">Fields not found in document: </span>
            {fieldsNotFound.join(", ")}
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
                <Link href={`/${m.slug}`} className="text-water-link hover:text-water-deep hover:underline">
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
                <Link href={`/${m.slug}`} className="text-water-link hover:text-water-deep hover:underline">
                  {m.data.document_metadata.jurisdiction_name}
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
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="State"
            fieldPath="document_metadata.state_code"
            value={meta.state_code ? STATE_CODE_TO_NAME[meta.state_code] ?? meta.state_code : null}
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Version / edition"
            fieldPath="document_metadata.version_or_edition"
            value={meta.version_or_edition}
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Adoption / effective date"
            fieldPath="document_metadata.adoption_or_effective_date"
            value={meta.adoption_or_effective_date}
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Last revised date"
            fieldPath="document_metadata.last_revised_date"
            value={meta.last_revised_date}
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Relationship to state manual"
            fieldPath="document_metadata.relationship_to_state_manual"
            value={<span className="capitalize">{meta.relationship_to_state_manual.replace(/_/g, " ")}</span>}
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
        </div>
      </section>

      <section className="rounded-xl border border-edge/80 bg-surface p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Design Criteria</h2>
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
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Water quality volume method"
            fieldPath="design_criteria.water_quality_volume_method"
            value={criteria.water_quality_volume_method}
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Peak flow calculation method(s)"
            fieldPath="design_criteria.peak_flow_calculation_method"
            value={
              criteria.peak_flow_calculation_method.length
                ? criteria.peak_flow_calculation_method.join(", ")
                : null
            }
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Hydrologic/hydraulic software"
            fieldPath="design_criteria.required_hydrologic_hydraulic_software"
            value={
              criteria.required_hydrologic_hydraulic_software.length
                ? criteria.required_hydrologic_hydraulic_software.join(", ")
                : null
            }
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
          <FieldWithEvidence
            label="Approved BMP categories"
            fieldPath="design_criteria.approved_bmp_categories"
            value={
              criteria.approved_bmp_categories.length
                ? criteria.approved_bmp_categories.join(", ")
                : null
            }
            evidence={evidence}
            fieldsNotFound={fieldsNotFound}
          />
        </div>
      </section>
    </main>
  );
}
