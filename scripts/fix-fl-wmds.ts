/**
 * Create FL Water Management District special_district atlas records
 * and reclassify city/county WMD proxies.
 *
 *   npx tsx scripts/fix-fl-wmds.ts
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "data/documents");
const MANIFEST = path.join(ROOT, "data/queue/manifest.json");
const ALIASES = path.join(ROOT, "data/coverage/aliases.json");

interface StormDoc {
  document_metadata: {
    jurisdiction_name: string;
    jurisdiction_level: string;
    state_code: string;
    document_title: string;
    version_or_edition: string | null;
    adoption_or_effective_date: string | null;
    last_revised_date: string | null;
    relationship_to_state_manual: string;
    issuing_agency_category?: string | null;
  };
  design_criteria: unknown;
  evidence: unknown[];
  extraction_quality: {
    confidence: string;
    needs_human_review: boolean;
    review_notes: string;
    fields_not_found: string[];
  };
  source: {
    document_url: string | null;
    landing_page_url: string | null;
    retrieved_at: string | null;
    original_filename: string | null;
  };
}

function loadDoc(slug: string): StormDoc {
  return JSON.parse(
    readFileSync(path.join(DOCS, `${slug}.json`), "utf-8")
  ) as StormDoc;
}

function writeDoc(slug: string, doc: StormDoc): void {
  writeFileSync(
    path.join(DOCS, `${slug}.json`),
    JSON.stringify(doc, null, 2) + "\n",
    "utf-8"
  );
  console.log(`wrote ${slug}`);
}

function asDistrict(
  base: StormDoc,
  opts: {
    name: string;
    title?: string;
    version?: string | null;
    url?: string;
    landing?: string;
    filename: string;
    review: string;
  }
): StormDoc {
  const doc: StormDoc = structuredClone(base);
  doc.document_metadata.jurisdiction_name = opts.name;
  doc.document_metadata.jurisdiction_level = "special_district";
  doc.document_metadata.state_code = "FL";
  if (opts.title) doc.document_metadata.document_title = opts.title;
  if (opts.version !== undefined)
    doc.document_metadata.version_or_edition = opts.version;
  doc.document_metadata.relationship_to_state_manual =
    "adopts_state_manual_directly";
  doc.extraction_quality.needs_human_review = true;
  doc.extraction_quality.review_notes = opts.review;
  if (opts.url) doc.source.document_url = opts.url;
  if (opts.landing) doc.source.landing_page_url = opts.landing;
  doc.source.original_filename = opts.filename;
  doc.source.retrieved_at = new Date().toISOString();

  // Fix evidence that claimed county/city
  if (Array.isArray(doc.evidence)) {
    for (const e of doc.evidence as Array<{
      field: string;
      excerpt: string;
      page_or_section: string | null;
    }>) {
      if (e.field === "document_metadata.jurisdiction_name") {
        e.excerpt = opts.name;
        e.page_or_section = "Title / district handbook";
      }
      if (e.field === "document_metadata.jurisdiction_level") {
        e.excerpt =
          "Florida water management district (ERP Applicant's Handbook Volume II)";
        e.page_or_section = "Chapter 62-330, F.A.C. / district handbook";
      }
    }
  }
  return doc;
}

// --- Canonical special_district records from existing WMD extractions content ---

writeDoc(
  "fl-sfwmd-erp-ah2",
  asDistrict(loadDoc("miami-fl"), {
    name: "South Florida Water Management District (SFWMD)",
    title:
      "Environmental Resource Permit Applicant's Handbook Volume II For Use Within the Geographic Limits of the South Florida Water Management District",
    filename: "fl-sfwmd-erp-ah2.pdf",
    url: "https://www.sfwmd.gov/sites/default/files/documents/swerp_applicants_handbook_vol_ii.pdf",
    landing: "https://www.sfwmd.gov/",
    review:
      "Canonical SFWMD ERP AH Vol II special_district record. City proxies (miami-fl, etc.) remain for municipal map coverage.",
  })
);

writeDoc(
  "fl-swfwmd-erp-ah2",
  asDistrict(loadDoc("tampa-fl"), {
    name: "Southwest Florida Water Management District (SWFWMD)",
    title:
      "Environmental Resource Permit Applicant's Handbook Volume II — Design Requirements for Stormwater Treatment and Management Systems: Water Quality and Water Quantity",
    filename: "fl-swfwmd-erp-ah2.pdf",
    url: "https://www.swfwmd.state.fl.us/sites/default/files/medias/documents/draftswfwmd-erpapplicanthandbook-volume-ii.pdf",
    landing: "https://www.swfwmd.state.fl.us/business/epermitting/rules",
    review:
      "Canonical SWFWMD ERP AH Vol II special_district record. City proxies (tampa-fl, lakeland-fl) remain for municipal map coverage.",
  })
);

writeDoc(
  "fl-srwmd-erp-ah2",
  asDistrict(loadDoc("gainesville-fl"), {
    name: "Suwannee River Water Management District (SRWMD)",
    title:
      "Environmental Resource Permit Applicant's Handbook Volume II (Design Requirements for Stormwater Treatment and Management Systems)",
    filename: "fl-srwmd-erp-ah2.pdf",
    url: "http://www.srwmd.state.fl.us/DocumentCenter/View/19233",
    landing: "https://www.srwmd.state.fl.us/",
    review:
      "Canonical SRWMD ERP AH Vol II special_district record. City proxy gainesville-fl remains for municipal map coverage.",
  })
);

writeDoc(
  "fl-nwfwmd-erp-ah2",
  asDistrict(loadDoc("tallahassee-fl"), {
    name: "Northwest Florida Water Management District (NWFWMD)",
    title:
      "Environmental Resource Permit Applicant's Handbook Volume II (Northwest Florida Water Management District)",
    version: "June 28, 2024",
    filename: "fl-nwfwmd-erp-ah2.pdf",
    url: "https://nwfwater.com/wp-content/uploads/2024/07/AHII-nwfwmd-FINAL-2024.pdf",
    landing: "https://nwfwater.com/",
    review:
      "Canonical NWFWMD ERP AH Vol II special_district record. City proxies tallahassee-fl / pensacola-fl remain for municipal map coverage.",
  })
);

// SJRWMD placeholder until prepare+extract fills richer criteria
if (!existsSync(path.join(DOCS, "fl-sjrwmd-erp-ah2.json"))) {
  const sj: StormDoc = {
    document_metadata: {
      jurisdiction_name: "St. Johns River Water Management District (SJRWMD)",
      jurisdiction_level: "special_district",
      state_code: "FL",
      document_title:
        "Environmental Resource Permit Applicant's Handbook Volume II (St. Johns River Water Management District)",
      version_or_edition: "June 28, 2024",
      adoption_or_effective_date: "2024-06-28",
      last_revised_date: "2024-06-28",
      relationship_to_state_manual: "adopts_state_manual_directly",
    },
    design_criteria: {
      design_storm_return_periods_years: [],
      water_quality_volume_method: null,
      peak_flow_calculation_method: [],
      required_hydrologic_hydraulic_software: [],
      approved_bmp_categories: [],
    },
    evidence: [
      {
        field: "document_metadata.jurisdiction_name",
        excerpt: "St. Johns River Water Management District",
        page_or_section: "Title",
      },
      {
        field: "document_metadata.document_title",
        excerpt: "Applicant's Handbook Volume II",
        page_or_section: "Title",
      },
      {
        field: "document_metadata.version_or_edition",
        excerpt: "6-28-24",
        page_or_section: "Filename / cover",
      },
    ],
    extraction_quality: {
      confidence: "low",
      needs_human_review: true,
      review_notes:
        "Stub pending prepare+heuristic extract from aws.sjrwmd.com AH Vol II PDF.",
      fields_not_found: [
        "design_criteria.design_storm_return_periods_years",
        "design_criteria.water_quality_volume_method",
        "design_criteria.peak_flow_calculation_method",
        "design_criteria.approved_bmp_categories",
        "design_criteria.required_hydrologic_hydraulic_software",
      ],
    },
    source: {
      document_url:
        "https://aws.sjrwmd.com/SJRWMD/permitting/SJRWMD_Applicants_Handbook_Volume_II_6-28-24.pdf",
      landing_page_url: "https://www.sjrwmd.com/",
      retrieved_at: new Date().toISOString(),
      original_filename: "SJRWMD_Applicants_Handbook_Volume_II_6-28-24.pdf",
    },
  };
  writeDoc("fl-sjrwmd-erp-ah2", sj);
}

// --- Reclassify city/county WMD proxies ---

function retargetProxy(
  slug: string,
  cityName: string,
  districtSlug: string,
  districtAbbrev: string
): void {
  const doc = loadDoc(slug);
  const wasCounty = doc.document_metadata.jurisdiction_level === "county";
  doc.document_metadata.jurisdiction_name = cityName;
  doc.document_metadata.jurisdiction_level = "municipality";
  doc.extraction_quality.review_notes = [
    `Municipal map coverage via ${districtAbbrev} ERP AH Vol II.`,
    `Canonical special_district record: ${districtSlug}.`,
    wasCounty
      ? "Previously mislabeled as county; reclassified to municipality proxy."
      : "",
    doc.extraction_quality.review_notes,
  ]
    .filter(Boolean)
    .join(" ");
  writeDoc(slug, doc);
}

retargetProxy(
  "miami-fl",
  "City of Miami / Miami-Dade (SFWMD criteria)",
  "fl-sfwmd-erp-ah2",
  "SFWMD"
);
retargetProxy(
  "tampa-fl",
  "City of Tampa (SWFWMD criteria)",
  "fl-swfwmd-erp-ah2",
  "SWFWMD"
);
retargetProxy(
  "gainesville-fl",
  "City of Gainesville (SRWMD criteria)",
  "fl-srwmd-erp-ah2",
  "SRWMD"
);
retargetProxy(
  "tallahassee-fl",
  "City of Tallahassee (NWFWMD criteria)",
  "fl-nwfwmd-erp-ah2",
  "NWFWMD"
);
retargetProxy(
  "pensacola-fl",
  "City of Pensacola (NWFWMD criteria)",
  "fl-nwfwmd-erp-ah2",
  "NWFWMD"
);

for (const slug of [
  "palm-bay-fl",
  "daytona-beach-fl",
  "melbourne-fl",
  "deltona-fl",
  "palm-coast-fl",
]) {
  if (!existsSync(path.join(DOCS, `${slug}.json`))) continue;
  const doc = loadDoc(slug);
  doc.extraction_quality.review_notes = [
    "Canonical SJRWMD special_district record: fl-sjrwmd-erp-ah2.",
    doc.extraction_quality.review_notes,
  ].join(" ");
  writeDoc(slug, doc);
}

// --- Manifest jobs for SJRWMD + NWFWMD (idempotent) ---
const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as Array<{
  id: string;
}>;
const existing = new Set(manifest.map((j) => j.id));
const newJobs = [
  {
    id: "fl-sjrwmd-erp-ah2",
    jurisdictionHint: "St. Johns River Water Management District",
    levelHint: "special_district",
    pdfUrl:
      "https://aws.sjrwmd.com/SJRWMD/permitting/SJRWMD_Applicants_Handbook_Volume_II_6-28-24.pdf",
    landingPageUrl: "https://www.sjrwmd.com/",
    cityCoords: null,
    notes: "SJRWMD ERP Applicant's Handbook Volume II (June 28, 2024)",
  },
  {
    id: "fl-nwfwmd-erp-ah2",
    jurisdictionHint: "Northwest Florida Water Management District",
    levelHint: "special_district",
    pdfUrl:
      "https://nwfwater.com/wp-content/uploads/2024/07/AHII-nwfwmd-FINAL-2024.pdf",
    landingPageUrl: "https://nwfwater.com/",
    cityCoords: null,
    notes: "NWFWMD ERP Applicant's Handbook Volume II (June 28, 2024)",
  },
  {
    id: "fl-sfwmd-erp-ah2",
    jurisdictionHint: "South Florida Water Management District",
    levelHint: "special_district",
    pdfUrl:
      "https://www.sfwmd.gov/sites/default/files/documents/swerp_applicants_handbook_vol_ii.pdf",
    landingPageUrl: "https://www.sfwmd.gov/",
    cityCoords: null,
    notes: "SFWMD ERP Applicant's Handbook Volume II (canonical district)",
  },
  {
    id: "fl-swfwmd-erp-ah2",
    jurisdictionHint: "Southwest Florida Water Management District",
    levelHint: "special_district",
    pdfUrl:
      "https://www.swfwmd.state.fl.us/sites/default/files/medias/documents/draftswfwmd-erpapplicanthandbook-volume-ii.pdf",
    landingPageUrl:
      "https://www.swfwmd.state.fl.us/business/epermitting/rules",
    cityCoords: null,
    notes: "SWFWMD ERP Applicant's Handbook Volume II (canonical district)",
  },
  {
    id: "fl-srwmd-erp-ah2",
    jurisdictionHint: "Suwannee River Water Management District",
    levelHint: "special_district",
    pdfUrl: "http://www.srwmd.state.fl.us/DocumentCenter/View/19233",
    landingPageUrl: "https://www.srwmd.state.fl.us/",
    cityCoords: null,
    notes: "SRWMD ERP Applicant's Handbook Volume II (canonical district)",
  },
];

for (const job of newJobs) {
  if (existing.has(job.id)) {
    console.log(`manifest skip ${job.id}`);
    continue;
  }
  manifest.push(job);
  console.log(`manifest + ${job.id}`);
}
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

// Coverage aliases → district slugs
const aliases = JSON.parse(readFileSync(ALIASES, "utf-8")) as {
  aliases: Record<string, string>;
};
Object.assign(aliases.aliases, {
  "sfwmd|FL": "south florida water management district|FL",
  "south florida water management district|FL":
    "south florida water management district|FL",
  "swfwmd|FL": "southwest florida water management district|FL",
  "southwest florida water management district|FL":
    "southwest florida water management district|FL",
  "srwmd|FL": "suwannee river water management district|FL",
  "suwannee river water management district|FL":
    "suwannee river water management district|FL",
  "nwfwmd|FL": "northwest florida water management district|FL",
  "northwest florida water management district|FL":
    "northwest florida water management district|FL",
  "sjrwmd|FL": "st. johns river water management district|FL",
  "st johns river water management district|FL":
    "st. johns river water management district|FL",
  "st. johns river|FL": "st. johns river water management district|FL",
  // Prefer district over old city proxies for regional names
  "south florida|FL": "south florida water management district|FL",
  "suwannee river|FL": "suwannee river water management district|FL",
  "southwest florida|FL": "southwest florida water management district|FL",
  "tampa bay|FL": "southwest florida water management district|FL",
});
writeFileSync(ALIASES, JSON.stringify(aliases, null, 2) + "\n", "utf-8");
console.log("updated coverage aliases");

void copyFileSync;
