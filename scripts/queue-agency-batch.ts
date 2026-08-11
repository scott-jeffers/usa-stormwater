/**
 * Append verified agency manual jobs to the queue manifest and update registry/aliases.
 * Run: npx tsx scripts/queue-agency-batch.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "data/queue/manifest.json");
const REGISTRY = path.join(ROOT, "data/agency-targets/registry.json");
const ALIASES = path.join(ROOT, "data/agency-targets/aliases.json");

interface Job {
  id: string;
  jurisdictionHint: string;
  levelHint: string;
  agencyHint: "dot" | "dep_deq";
  scopeHint: string;
  pdfUrl: string;
  landingPageUrl: string;
  cityCoords: null;
  notes: string;
  /** When true, registry known_slugs stay partial */
  partial?: boolean;
  /** Registry expected_manual id to attach known_slugs to */
  registryExpectedId: string;
  stateCode: string;
  category: "dot" | "dep_deq";
}

const NEW_JOBS: Job[] = [
  {
    id: "fl-fdot-drainage",
    jurisdictionHint: "Florida",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://fdotwww.blob.core.windows.net/sitefinity/docs/default-source/roadway/drainage/files/drainagemanual2025.pdf",
    landingPageUrl: "https://www.fdot.gov/roadway/drainage/drainage-history",
    cityCoords: null,
    notes: "FDOT Drainage Manual January 2025",
    registryExpectedId: "fl-fdot-drainage",
    stateCode: "FL",
    category: "dot",
  },
  {
    id: "pa-penndot-drainage",
    jurisdictionHint: "Pennsylvania",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.pa.gov/content/dam/copapwp-pagov/en/penndot/documents/public/pubsforms/publications/pub-584/june%202022-change%201.pdf",
    landingPageUrl:
      "https://www.pa.gov/agencies/penndot/programs-and-doing-business/environment/hydrology-and-hydraulics",
    cityCoords: null,
    notes: "PennDOT Drainage Manual Pub 584 (March 2015 Edition, Change No. 1 June 2022)",
    registryExpectedId: "pa-penndot-drainage",
    stateCode: "PA",
    category: "dot",
  },
  {
    id: "nc-ncdot-drainage",
    jurisdictionHint: "North Carolina",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://connect.ncdot.gov/resources/hydro/DrainageStudiesGuidelines/2022%20Guidelines%20for%20Drainage%20Studies%20and%20Hydraulic%20Design.pdf",
    landingPageUrl:
      "https://connect.ncdot.gov/resources/hydro/Pages/DrainageStudiesGuidelines.aspx",
    cityCoords: null,
    notes:
      "NCDOT Guidelines for Drainage Studies and Hydraulic Design (2022 archived PDF; live guidance is web-based)",
    registryExpectedId: "nc-ncdot-drainage",
    stateCode: "NC",
    category: "dot",
  },
  {
    id: "az-adot-drainage",
    jurisdictionHint: "Arizona",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://azdot.gov/sites/default/files/2019/07/2014_adot_hydrology_manual.pdf",
    landingPageUrl:
      "https://azdot.gov/business/engineering-and-construction/roadway-engineering/drainage-design/manuals-drainage-design",
    cityCoords: null,
    notes:
      "ADOT Highway Drainage Design Manual Vol 2 Hydrology (2014). Companion Hydraulics volume also available.",
    registryExpectedId: "az-adot-drainage",
    stateCode: "AZ",
    category: "dot",
  },
  {
    id: "oh-odot-drainage",
    jurisdictionHint: "Ohio",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://dam.assets.ohio.gov/image/upload/transportation.ohio.gov/hydraulic/ld2/archive/2022-07-LD2.pdf",
    landingPageUrl:
      "https://www.transportation.ohio.gov/working/publications/location-design-vol-2-jump",
    cityCoords: null,
    notes:
      "ODOT Location & Design Manual Volume 2 Drainage Design (July 2022 archive PDF; live manual is web)",
    registryExpectedId: "oh-odot-drainage",
    stateCode: "OH",
    category: "dot",
  },
  {
    id: "ca-caltrans-project-planning",
    jurisdictionHint: "California",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "post_construction",
    pdfUrl:
      "https://dot.ca.gov/-/media/dot-media/programs/design/documents/ppdg_final-ada-a11y.pdf",
    landingPageUrl:
      "https://dot.ca.gov/programs/design/manual-project-planning-design-guide",
    cityCoords: null,
    notes: "Caltrans Stormwater Quality Handbooks — Project Planning and Design Guide (June 2023)",
    registryExpectedId: "ca-caltrans-project-planning",
    stateCode: "CA",
    category: "dot",
  },
  {
    id: "va-vdot-drainage",
    jurisdictionHint: "Virginia",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.vdot.virginia.gov/media/vdotvirginiagov/doing-business/technical-guidance-and-support/technical-guidance-documents/location-and-design/migrated/drainagemanual/Drain-Manual-Chapter-11_acc07072026.pdf",
    landingPageUrl:
      "https://www.vdot.virginia.gov/doing-business/technical-guidance-and-support/technical-guidance-documents/drainage-manual/",
    cityCoords: null,
    notes:
      "VDOT Drainage Manual Chapter 11 Stormwater Management (July 2026). Full combined PDF ~161MB deferred.",
    partial: true,
    registryExpectedId: "va-vdot-drainage",
    stateCode: "VA",
    category: "dot",
  },
  {
    id: "il-iepa-stormwater",
    jurisdictionHint: "Illinois",
    levelHint: "state",
    agencyHint: "dep_deq",
    scopeHint: "full_manual",
    pdfUrl: "http://www.aiswcd.org/wp-content/uploads/2013/06/IUM_June20131.pdf",
    landingPageUrl: "https://aiswcd.org/illinois-urban-manual/",
    cityCoords: null,
    notes:
      "Illinois Urban Manual (June 2013 PDF compilation via AISWCD; IEPA/partner statewide BMP reference)",
    partial: true,
    registryExpectedId: "il-iepa-stormwater",
    stateCode: "IL",
    category: "dep_deq",
  },
  {
    id: "wa-wsdot-hr",
    jurisdictionHint: "Washington",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.wsdot.wa.gov/publications/fulltext/hydraulics/hrm/chap3_2014.pdf",
    landingPageUrl:
      "https://wsdot.wa.gov/engineering-standards/all-manuals-and-standards/manuals/highway-runoff-manual",
    cityCoords: null,
    notes:
      "WSDOT Highway Runoff Manual Ch3 Minimum Requirements (2014). Full HRM PDF ~240MB deferred.",
    partial: true,
    registryExpectedId: "wa-wsdot-hr",
    stateCode: "WA",
    category: "dot",
  },
];

const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as Array<{
  id: string;
}>;
const existing = new Set(manifest.map((j) => j.id));
let added = 0;

for (const job of NEW_JOBS) {
  if (existing.has(job.id)) {
    console.log(`skip existing: ${job.id}`);
    continue;
  }
  const { registryExpectedId, stateCode, category, partial, ...manifestJob } =
    job;
  void registryExpectedId;
  void stateCode;
  void category;
  void partial;
  manifest.push(manifestJob);
  existing.add(job.id);
  added += 1;
  console.log(`+ ${job.id}`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

// Update registry known_slugs
const registry = JSON.parse(readFileSync(REGISTRY, "utf-8")) as {
  agencies: Array<{
    state_code: string;
    agency_category: string;
    expected_manuals: Array<{
      id: string;
      known_slugs: string[];
      partial?: boolean;
    }>;
  }>;
};

for (const job of NEW_JOBS) {
  const agency = registry.agencies.find(
    (a) =>
      a.state_code === job.stateCode && a.agency_category === job.category
  );
  if (!agency) continue;
  const expected = agency.expected_manuals.find(
    (e) => e.id === job.registryExpectedId
  );
  if (!expected) continue;
  if (!expected.known_slugs.includes(job.id)) {
    expected.known_slugs.push(job.id);
  }
  if (job.partial) expected.partial = true;
  else delete expected.partial;
}

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

// Update aliases slug_to_category
const aliases = JSON.parse(readFileSync(ALIASES, "utf-8")) as {
  slug_to_category: Record<string, string>;
};
for (const job of NEW_JOBS) {
  aliases.slug_to_category[job.id] = job.agencyHint;
}
writeFileSync(ALIASES, JSON.stringify(aliases, null, 2) + "\n", "utf-8");

console.log(`Added ${added} jobs. Manifest now ${manifest.length} entries.`);
