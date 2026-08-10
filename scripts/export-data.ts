/**
 * Export validated manuals as static JSON for tools and AIs.
 *
 *   npm run export:data
 *
 * Writes under public/data/ (served at /data/ after Next build).
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllManuals } from "../lib/data";

const PUBLIC_DATA = path.resolve(process.cwd(), "public/data");
const MANUALS_DIR = path.join(PUBLIC_DATA, "manuals");

const SITE_ORIGIN = "https://stormwateratlas.com";

const FIELD_SCHEMA = {
  description:
    "Stormwater Atlas record shape. Each manual is one JSON object with metadata, design criteria, evidence excerpts, extraction quality, and source links.",
  document_metadata: {
    jurisdiction_name: "string — agency or place name",
    jurisdiction_level:
      "enum: state | county | municipality | special_district | tribal | other",
    state_code: "string | null — 2-letter USPS code",
    document_title: "string",
    version_or_edition: "string | null",
    adoption_or_effective_date: "string | null — ISO 8601 when known",
    last_revised_date: "string | null",
    relationship_to_state_manual:
      "enum: independent | adopts_state_manual_directly | deemed_equivalent_to_state_manual | unknown",
  },
  design_criteria: {
    design_storm_return_periods_years: "number[] — e.g. [2, 10, 25, 100]",
    water_quality_volume_method: "string | null — plain-language summary",
    peak_flow_calculation_method: "string[]",
    required_hydrologic_hydraulic_software: "string[]",
    approved_bmp_categories: "string[]",
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

async function main() {
  const manuals = getAllManuals();
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

  for (const record of manuals) {
    await writeFile(
      path.join(MANUALS_DIR, `${record.slug}.json`),
      JSON.stringify(record.data, null, 2) + "\n",
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
          schema: "/data/schema.json",
          llms: "/llms.txt",
          about: "/about/",
        },
        record: FIELD_SCHEMA,
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    `export:data — wrote ${manuals.length} manuals to public/data/ (${generatedAt})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
