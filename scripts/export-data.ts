/**
 * Export validated manuals as static JSON for tools and AIs.
 *
 *   npm run export:data
 *
 * Writes under public/data/ (served at /data/ after Next build).
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { getEvidenceQa } from "../lib/qa/load";
import { getCompareRows } from "../lib/compare";
import { SITE_URL } from "../lib/site";
import { coverageBasisFor, getSharedInfo } from "../lib/sharedManuals";
import { getAllManuals, getManualBySlug, getManualLoadErrors, revisionDateFromMetadata } from "../lib/data";

const getManualBySlugOrNull = (slug: string) => getManualBySlug(slug)?.data ?? null;
import {
  getAllDraftSections,
  getNationalOutline,
} from "../lib/national";

const PUBLIC_DATA = path.resolve(process.cwd(), "public/data");
const MANUALS_DIR = path.join(PUBLIC_DATA, "manuals");
const NATIONAL_DIR = path.join(PUBLIC_DATA, "national");
const NATIONAL_DRAFT_DIR = path.join(NATIONAL_DIR, "draft");

const SITE_ORIGIN = SITE_URL;

const FIELD_SCHEMA = {
  description:
    "Stormwater Atlas record shape. Each manual is one JSON object with metadata, design criteria, evidence excerpts, extraction quality, and source links.",
  coverage_basis:
    "own | issuer | state_manual | regional_manual | stand_in — whose rules these are. stand_in means another jurisdiction's manual is shown as a placeholder: do NOT treat its values as this jurisdiction's requirements.",
  design_from:
    "slug whose design_criteria / design_parameters apply. Differs from slug when the jurisdiction uses a shared state or regional manual; per-manual JSON then carries those values in effective_design.",
  citation_check:
    "Strict machine check of every evidence excerpt against the source PDF text: counts of exact, fuzzy (numbers identical), unverifiable (PDF text lost digits; visual_check gives the date one was checked by eye), fail. warnings list values not stated in their excerpt or with no excerpt.",
  document_metadata: {
    jurisdiction_name: "string — agency or place name",
    jurisdiction_level:
      "enum: state | county | municipality | special_district | tribal | federal | other",
    state_code: "string | null — 2-letter USPS code",
    document_title: "string",
    version_or_edition: "string | null",
    adoption_or_effective_date: "string | null — ISO 8601 when known",
    last_revised_date: "string | null",
    relationship_to_state_manual:
      "enum: independent | adopts_state_manual_directly | deemed_equivalent_to_state_manual | unknown",
    issuing_agency_category:
      "enum: dot | dep_deq | dnr | other | null — statewide agency manuals",
  },
  design_criteria: {
    design_storm_return_periods_years: "number[] — e.g. [2, 10, 25, 100]",
    water_quality_volume_method: "string | null — plain-language summary",
    peak_flow_calculation_method: "string[]",
    required_hydrologic_hydraulic_software: "string[]",
    approved_bmp_categories: "string[]",
  },
  design_parameters: {
    optional: true,
    wqv_depth_inches: "number | null — site-wide WQ depth (not practice-specific)",
    max_drawdown_hours: "number | null — site-wide drawdown",
    shwt_separation_inches: "number | null — site-wide SHWT separation",
    bioretention_media_depth_min_inches: "number | null",
    bioretention_ponding_depth_inches: "number | null",
    permeable_pavement_storage_depth_inches: "number | null",
    design_infiltration_rate_in_per_hr: "number | null",
    permanent_pool_depth_inches: "number | null",
    ed_drain_time_hours: "number | null",
    length_to_width_ratio: "number | null",
    wetland_detention_hours: "number | null",
    swale_bottom_width_inches: "number | null",
    swale_longitudinal_slope_percent: "number | null",
    green_roof_media_depth_inches: "number | null",
    green_roof_slope_percent: "number | null",
    mtd_verification_program: "string | null — TAPE, NJCAT, etc.",
    practice_mentions: "string[] — canonical keys from data/ontology/bmp-aliases.json",
    enriched_at: "string | null",
    enrich_model: "string | null",
    enrich_notes: "string | null",
    enrich_schema_version: "number — bump when parameter catalog changes",
    fields_not_found: "string[]",
  },
  evidence: [
    {
      field: "string — dot-path to the extracted field",
      excerpt: "string — short verbatim quote from the source",
      page_or_section: "string | null",
    },
  ],
  extraction_quality: {
    confidence: "enum: high | medium | low",
    needs_human_review: "boolean",
    review_notes: "string | null",
    fields_not_found: "string[]",
  },
  source: {
    document_url: "string | null — PDF or primary document URL",
    landing_page_url: "string | null — official agency page",
    retrieved_at: "string | null — ISO 8601",
    original_filename: "string | null",
  },
};

/** Compact citation-check summary for list endpoints (see /about/#verification). */
function qaSummary(slug: string) {
  const qa = getEvidenceQa(slug);
  if (!qa) return null;
  return { status: qa.status, checked_at: qa.checked_at, counts: qa.counts, warnings: qa.warnings.length };
}

/** Slug whose design values apply (the shared manual's representative), or the record itself. */
function effectiveFrom(slug: string): string {
  const shared = getSharedInfo(slug);
  return shared && !shared.isRepresentative && shared.representative !== slug ? shared.representative : slug;
}

async function main() {
  const manuals = getAllManuals();
  const loadErrors = getManualLoadErrors();
  if (loadErrors.length) {
    console.error(`export:data — ${loadErrors.length} document(s) failed validation:`);
    for (const e of loadErrors) console.error(`  ${e.file}: ${e.error}`);
    console.error("Fix them (npm run qa:normalize may help) — refusing to publish a partial atlas.");
    process.exit(1);
  }
  const generatedAt = new Date().toISOString();

  await rm(PUBLIC_DATA, { recursive: true, force: true });
  await mkdir(MANUALS_DIR, { recursive: true });

  const index = manuals.map((record) => {
    const meta = record.data.document_metadata;
    const quality = record.data.extraction_quality;
    const source = record.data.source;
    return {
      slug: record.slug,
      jurisdiction_name: meta.jurisdiction_name,
      jurisdiction_level: meta.jurisdiction_level,
      state_code: meta.state_code,
      document_title: meta.document_title,
      confidence: quality.confidence,
      needs_human_review: quality.needs_human_review,
      source: {
        document_url: source.document_url,
        landing_page_url: source.landing_page_url,
      },
      processed_at: record.processedAt,
      revised_at: revisionDateFromMetadata(record.data.document_metadata),
      coverage_basis: coverageBasisFor(record.slug),
      design_from: effectiveFrom(record.slug),
      citation_check: qaSummary(record.slug),
      detail_url: `${SITE_ORIGIN}/${record.slug}/`,
      data_url: `${SITE_ORIGIN}/data/manuals/${record.slug}.json`,
    };
  });

  await writeFile(
    path.join(PUBLIC_DATA, "manuals.json"),
    JSON.stringify(
      {
        generated_at: generatedAt,
        count: index.length,
        manuals: index,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  const compareRows = getCompareRows();
  const effective = new Map(compareRows.map((r) => [r.slug, r]));
  await writeFile(
    path.join(PUBLIC_DATA, "compare.json"),
    JSON.stringify({ generated_at: generatedAt, count: compareRows.length, rows: compareRows }) + "\n",
    "utf8"
  );

  for (const record of manuals) {
    const row = effective.get(record.slug);
    const effective_design =
      row && row.design_from !== record.slug
        ? { from: row.design_from, design_criteria: getManualBySlugOrNull(row.design_from)?.design_criteria, design_parameters: getManualBySlugOrNull(row.design_from)?.design_parameters }
        : undefined;
    await writeFile(
      path.join(MANUALS_DIR, `${record.slug}.json`),
      JSON.stringify(
        { coverage_basis: coverageBasisFor(record.slug), design_from: effectiveFrom(record.slug), ...record.data, effective_design, citation_check: getEvidenceQa(record.slug) },
        null,
        2
      ) + "\n",
      "utf8"
    );
  }

  await writeFile(
    path.join(PUBLIC_DATA, "atlas.json"),
    JSON.stringify(
      {
        generated_at: generatedAt,
        count: manuals.length,
        manuals: manuals.map((record) => ({
          slug: record.slug,
          processed_at: record.processedAt,
          detail_url: `${SITE_ORIGIN}/${record.slug}/`,
          data_url: `${SITE_ORIGIN}/data/manuals/${record.slug}.json`,
          coverage_basis: coverageBasisFor(record.slug),
          design_from: effectiveFrom(record.slug),
          ...record.data,
        })),
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  await writeFile(
    path.join(PUBLIC_DATA, "schema.json"),
    JSON.stringify(
      {
        generated_at: generatedAt,
        title: "Stormwater Atlas data schema",
        base_url: SITE_ORIGIN,
        endpoints: {
          index: "/data/manuals.json",
          one: "/data/manuals/{slug}.json",
          atlas: "/data/atlas.json",
          compare: "/data/compare.json",
          schema: "/data/schema.json",
          national_outline: "/data/national/outline.json",
          national_drafts: "/data/national/drafts.json",
          national_draft_one: "/data/national/draft/{sectionId}.json",
          national_practices: "/data/national/practices.json",
          national_practice_one: "/data/national/practices/{practiceKey}.json",
          llms: "/llms.txt",
          about: "/about/",
          requirements: "/requirements/",
          requirement_page: "/requirements/{criterionKey}/",
          jurisdictions: "/jurisdictions/",
          model_manual: "/manual/",
          model_manual_evidence: "/manual/evidence/",
          dataset: "/data/dataset.json",
        },
        record: FIELD_SCHEMA,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  const outline = getNationalOutline();
  const drafts = getAllDraftSections();
  await mkdir(NATIONAL_DRAFT_DIR, { recursive: true });
  if (outline) {
    await writeFile(
      path.join(NATIONAL_DIR, "outline.json"),
      JSON.stringify(outline, null, 2) + "\n",
      "utf8"
    );
  }
  await writeFile(
    path.join(NATIONAL_DIR, "drafts.json"),
    JSON.stringify(
      {
        generated_at: generatedAt,
        count: drafts.length,
        outline_title: outline?.title ?? null,
        drafts: drafts.map((d) => ({
          section_id: d.section_id,
          title: d.title,
          data_url: `${SITE_ORIGIN}/data/national/draft/${d.section_id}.json`,
          // The LLM section drafts were retired from the site in favour of the model manual.
          page_url: `${SITE_ORIGIN}/manual/`,
        })),
      },
      null,
      2
    ) + "\n",
    "utf8"
  );
  for (const draft of drafts) {
    await writeFile(
      path.join(NATIONAL_DRAFT_DIR, `${draft.section_id}.json`),
      JSON.stringify(draft, null, 2) + "\n",
      "utf8"
    );
  }

  const practicesSrc = path.resolve(process.cwd(), "data/national/practices");
  // model-manual evidence (hand checks + classification)
  for (const f of ["criteria-classification.json", "hand-checks.json", "esc-classification.json", "esc-checks.json"]) {
    const src = path.resolve(process.cwd(), "data/national", f);
    if (existsSync(src)) await writeFile(path.join(NATIONAL_DIR, f), readFileSync(src, "utf-8"), "utf8");
  }
  const practicesOut = path.join(NATIONAL_DIR, "practices");
  let practiceCount = 0;
  if (existsSync(practicesSrc)) {
    await mkdir(practicesOut, { recursive: true });
    const practiceFiles = readdirSync(practicesSrc).filter((f) =>
      f.endsWith(".json")
    );
    for (const f of practiceFiles) {
      await writeFile(
        path.join(practicesOut, f),
        readFileSync(path.join(practicesSrc, f), "utf8"),
        "utf8"
      );
      practiceCount += 1;
    }
    const synthIndex = practiceFiles
      .filter((f) => !f.endsWith(".matrix.json"))
      .map((f) => f.replace(/\.json$/, ""));
    await writeFile(
      path.join(NATIONAL_DIR, "practices.json"),
      JSON.stringify(
        {
          generated_at: generatedAt,
          count: synthIndex.length,
          practices: synthIndex.map((id) => ({
            practice_key: id,
            data_url: `${SITE_ORIGIN}/data/national/practices/${id}.json`,
            matrix_url: `${SITE_ORIGIN}/data/national/practices/${id}.matrix.json`,
            page_url: `${SITE_ORIGIN}/requirements/`,
          })),
        },
        null,
        2
      ) + "\n",
      "utf8"
    );
  }

  const tierAPath = path.resolve(process.cwd(), "data/national/tier-a-slugs.json");
  if (existsSync(tierAPath)) {
    await writeFile(
      path.join(NATIONAL_DIR, "tier-a-slugs.json"),
      readFileSync(tierAPath, "utf8"),
      "utf8"
    );
  }

  console.log(
    `export:data — wrote ${manuals.length} manuals` +
      (outline ? `, national outline + ${drafts.length} drafts` : "") +
      (practiceCount ? `, ${practiceCount} practice files` : "") +
      ` to public/data/ (${generatedAt})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
