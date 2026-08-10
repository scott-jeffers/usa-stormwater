import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllManuals, getManualBySlug } from "@/lib/data";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";
import {
  ConfidenceBadge,
  LevelBadge,
  NeedsReviewBadge,
  StateBadge,
} from "@/components/Badge";
import { FieldWithEvidence } from "@/components/FieldWithEvidence";

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
        <nav className="text-sm text-slate-500">
          <Link href="/" className="font-medium text-water-link hover:text-water-deep hover:underline">
            &larr; Back to dashboard
          </Link>
        </nav>
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          No manuals ingested yet. Run{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5">
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
        (m) => m.slug !== slug && m.data.document_metadata.state_code === meta.state_code
      )
    : [];

  const fieldsNotFound = quality.fields_not_found;
  const primarySourceUrl = source.document_url ?? source.landing_page_url;

  return (
    <main className="space-y-6">
      <nav className="text-sm text-slate-500">
        <Link href="/" className="font-medium text-water-link hover:text-water-deep hover:underline">
          &larr; Back to dashboard
        </Link>
      </nav>

      <header className="overflow-hidden rounded-xl border border-slate-200/80 border-t-4 border-t-water bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              {meta.jurisdiction_name}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{meta.document_title}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <LevelBadge level={meta.jurisdiction_level} />
              <StateBadge stateCode={meta.state_code} showName />
              <ConfidenceBadge confidence={quality.confidence} />
              <NeedsReviewBadge needsReview={quality.needs_human_review} />
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
              <p className="mt-3 text-xs text-slate-400">
                No source URL recorded. Re-ingest with{" "}
                <code className="rounded bg-slate-100 px-1">--url</code> and/or{" "}
                <code className="rounded bg-slate-100 px-1">--landing-page</code>.
              </p>
            )}
          </div>
        </div>

        {quality.needs_human_review && (
          <div className="mt-4 rounded-md border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
            <p className="font-medium">This extraction needs human review.</p>
            {quality.review_notes && (
              <p className="mt-1">{quality.review_notes}</p>
            )}
          </div>
        )}

        {fieldsNotFound.length > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-600">Fields not found in document: </span>
            {fieldsNotFound.join(", ")}
          </div>
        )}

        {relatedInState.length > 0 && (
          <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span className="font-medium text-slate-600">
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

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
        <h2 className="font-display text-lg font-semibold text-ink">Document Metadata</h2>
        <div className="mt-2">
          <FieldWithEvidence
            label="Jurisdiction level"
            fieldPath="document_metadata.jurisdiction_level"
            value={<span className="capitalize">{meta.jurisdiction_level.replace("_", " ")}</span>}
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

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 shadow-sm">
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
