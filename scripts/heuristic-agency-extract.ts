/**
 * Heuristic extract for prepared agency manuals (no Cursor SDK).
 * Reads samples/queue/<id>.txt + manifest metadata → data/documents/<id>.json
 *
 *   npx tsx scripts/heuristic-agency-extract.ts fl-fdot-drainage ...
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stormwaterSchema } from "../lib/schema";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "data/queue/manifest.json");
const PROGRESS = path.join(ROOT, "data/queue/progress.json");
const DOCS = path.join(ROOT, "data/documents");

interface Job {
  id: string;
  jurisdictionHint: string;
  levelHint?: string | null;
  agencyHint?: string | null;
  scopeHint?: string | null;
  pdfUrl: string | null;
  landingPageUrl: string | null;
  notes?: string;
}

const META: Record<
  string,
  {
    jurisdiction_name: string;
    state_code: string;
    document_title: string;
    version_or_edition: string | null;
    category: "dot" | "dep_deq";
  }
> = {
  "fl-fdot-drainage": {
    jurisdiction_name: "Florida Department of Transportation (FDOT)",
    state_code: "FL",
    document_title: "FDOT Drainage Manual",
    version_or_edition: "January 2025",
    category: "dot",
  },
  "pa-penndot-drainage": {
    jurisdiction_name: "Pennsylvania Department of Transportation (PennDOT)",
    state_code: "PA",
    document_title: "PennDOT Drainage Manual (Publication 584)",
    version_or_edition: "March 2015 Edition, Change No. 1 (June 2022)",
    category: "dot",
  },
  "nc-ncdot-drainage": {
    jurisdiction_name: "North Carolina Department of Transportation (NCDOT)",
    state_code: "NC",
    document_title:
      "Guidelines for Drainage Studies and Hydraulic Design",
    version_or_edition: "2022",
    category: "dot",
  },
  "az-adot-drainage": {
    jurisdiction_name: "Arizona Department of Transportation (ADOT)",
    state_code: "AZ",
    document_title: "Highway Drainage Design Manual — Hydrology (Volume 2)",
    version_or_edition: "Second Edition, 2014",
    category: "dot",
  },
  "oh-odot-drainage": {
    jurisdiction_name: "Ohio Department of Transportation (ODOT)",
    state_code: "OH",
    document_title: "Location & Design Manual, Volume 2 — Drainage Design",
    version_or_edition: "July 2022",
    category: "dot",
  },
  "ca-caltrans-project-planning": {
    jurisdiction_name: "California Department of Transportation (Caltrans)",
    state_code: "CA",
    document_title:
      "Stormwater Quality Handbooks — Project Planning and Design Guide",
    version_or_edition: "June 2023",
    category: "dot",
  },
  "va-vdot-drainage": {
    jurisdiction_name: "Virginia Department of Transportation (VDOT)",
    state_code: "VA",
    document_title: "VDOT Drainage Manual — Chapter 11 Stormwater Management",
    version_or_edition: "July 2026",
    category: "dot",
  },
  "il-iepa-stormwater": {
    jurisdiction_name:
      "Illinois EPA / Association of Illinois Soil and Water Conservation Districts",
    state_code: "IL",
    document_title: "Illinois Urban Manual",
    version_or_edition: "June 2013",
    category: "dep_deq",
  },
  "wa-wsdot-hr": {
    jurisdiction_name: "Washington State Department of Transportation (WSDOT)",
    state_code: "WA",
    document_title:
      "Highway Runoff Manual M 31-16 — Chapter 3 Minimum Requirements",
    version_or_edition: "April 2014 (M 31-16.04)",
    category: "dot",
  },
};

function findReturnPeriods(text: string): number[] {
  const found = new Set<number>();
  const re =
    /\b(2|5|10|25|50|100|500)[\s-]*(?:year|yr)(?:\s*(?:\/|,|or|and)\s*(2|5|10|25|50|100|500)[\s-]*(?:year|yr))*/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    for (const g of m.slice(1)) {
      if (g) found.add(Number(g));
    }
  }
  // also "Q10", "10-yr"
  const re2 = /\b(?:Q|ARI\s*)?(2|5|10|25|50|100|500)[\s-]*yr\b/gi;
  while ((m = re2.exec(text)) !== null) {
    found.add(Number(m[1]));
  }
  return [...found].sort((a, b) => a - b).slice(0, 8);
}

function findPeakMethods(text: string): string[] {
  const methods: string[] = [];
  const checks: Array<[RegExp, string]> = [
    [/\bRational\s+Method\b/i, "Rational Method"],
    [/\bNRCS\b|\bSCS\s+Curve\s+Number\b|\bTR-55\b/i, "NRCS / SCS Curve Number (TR-55)"],
    [/\bTR-20\b/i, "TR-20"],
    [/\bHEC-HMS\b/i, "HEC-HMS"],
    [/\bHEC-RAS\b/i, "HEC-RAS"],
    [/\bModified\s+Rational\b/i, "Modified Rational Method"],
    [/\bUSGS\s+regression\b/i, "USGS regression equations"],
  ];
  for (const [re, label] of checks) {
    if (re.test(text)) methods.push(label);
  }
  return methods.slice(0, 6);
}

function findSoftware(text: string): string[] {
  const out: string[] = [];
  const checks: Array<[RegExp, string]> = [
    [/\bHydroCAD\b/i, "HydroCAD"],
    [/\bHEC-HMS\b/i, "HEC-HMS"],
    [/\bHEC-RAS\b/i, "HEC-RAS"],
    [/\bSWMM\b/i, "EPA SWMM"],
    [/\bHY-8\b/i, "HY-8"],
    [/\bStormCAD\b/i, "StormCAD"],
    [/\bPondPack\b/i, "PondPack"],
  ];
  for (const [re, label] of checks) {
    if (re.test(text)) out.push(label);
  }
  return out.slice(0, 6);
}

function findBmps(text: string): string[] {
  const cats = [
    "Bioretention",
    "Infiltration Basin",
    "Infiltration Trench",
    "Wet Pond",
    "Dry Pond",
    "Extended Detention",
    "Sand Filter",
    "Vegetated Swale",
    "Filter Strip",
    "Permeable Pavement",
    "Constructed Wetland",
    "Oil/Grit Separator",
    "Detention Basin",
    "Retention Basin",
  ];
  return cats.filter((c) => new RegExp(c.replace("/", "[/ ]"), "i").test(text)).slice(0, 10);
}

function findWqvSnippet(text: string): string | null {
  const patterns = [
    /water\s+quality\s+volume[^.…]{0,200}/i,
    /WQV\s*[=:][^.…]{0,200}/i,
    /first\s+(?:one[- ]half|0\.5|½|half)\s+(?:inch|in\.)[^.…]{0,120}/i,
    /85th\s+percentile[^.…]{0,160}/i,
    /water\s+quality\s+design\s+storm[^.…]{0,160}/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m) return m[0].replace(/\s+/g, " ").trim().slice(0, 280);
  }
  return null;
}

function excerptAround(text: string, needle: RegExp, max = 180): string | null {
  const m = needle.exec(text);
  if (!m || m.index == null) return null;
  const start = Math.max(0, m.index - 40);
  const end = Math.min(text.length, m.index + m[0].length + 80);
  return text.slice(start, end).replace(/\s+/g, " ").trim().slice(0, max);
}

function metaFor(job: Job): {
  jurisdiction_name: string;
  state_code: string;
  document_title: string;
  version_or_edition: string | null;
  category: "dot" | "dep_deq" | null;
  jurisdiction_level: "state" | "special_district" | "municipality";
} {
  if (META[job.id]) {
    return { ...META[job.id]!, jurisdiction_level: "state" };
  }
  const parts = job.id.split("-");
  const state_code = (parts[0] ?? "XX").toUpperCase();
  const category: "dot" | "dep_deq" | null =
    job.agencyHint === "dep_deq" || job.agencyHint === "dot"
      ? job.agencyHint
      : null;
  const titleFromNotes =
    job.notes?.split("—")[0]?.split("(")[0]?.trim() ||
    job.notes?.slice(0, 120) ||
    job.id;
  const jurisdiction_level =
    job.levelHint === "special_district"
      ? "special_district"
      : job.levelHint === "municipality"
        ? "municipality"
        : "state";
  return {
    jurisdiction_name: job.jurisdictionHint,
    state_code,
    document_title: titleFromNotes,
    version_or_edition: null,
    category,
    jurisdiction_level,
  };
}

function extractOne(job: Job): void {
  const meta = metaFor(job);
  const txtPath = path.join(ROOT, "samples/queue", `${job.id}.txt`);
  if (!existsSync(txtPath)) {
    console.warn(`Missing text: ${job.id}`);
    return;
  }
  const text = readFileSync(txtPath, "utf-8");
  const head = text.slice(0, 80_000);
  const mid = text.slice(
    Math.floor(text.length * 0.2),
    Math.floor(text.length * 0.2) + 60_000
  );
  const scan = head + "\n" + mid;

  const periods = findReturnPeriods(scan);
  const peaks = findPeakMethods(scan);
  const software = findSoftware(scan);
  const bmps = findBmps(scan);
  const wqv = findWqvSnippet(scan);

  const evidence: Array<{
    field: string;
    excerpt: string;
    page_or_section: string | null;
  }> = [
    {
      field: "document_metadata.jurisdiction_name",
      excerpt: meta.jurisdiction_name,
      page_or_section: "Title / header",
    },
    {
      field: "document_metadata.document_title",
      excerpt: meta.document_title,
      page_or_section: "Title / header",
    },
  ];

  if (periods.length) {
    const ex =
      excerptAround(scan, /\b(10|25|50|100)[\s-]*year/i) ??
      `${periods.join(", ")}-year design storms referenced`;
    evidence.push({
      field: "design_criteria.design_storm_return_periods_years",
      excerpt: ex,
      page_or_section: null,
    });
  }
  if (peaks.length) {
    evidence.push({
      field: "design_criteria.peak_flow_calculation_method",
      excerpt:
        excerptAround(scan, new RegExp(peaks[0]!.split(" ")[0]!, "i")) ??
        peaks.join("; "),
      page_or_section: null,
    });
  }
  if (wqv) {
    evidence.push({
      field: "design_criteria.water_quality_volume_method",
      excerpt: wqv,
      page_or_section: null,
    });
  }
  if (bmps.length) {
    evidence.push({
      field: "design_criteria.approved_bmp_categories",
      excerpt: bmps.slice(0, 4).join(", "),
      page_or_section: null,
    });
  }

  const fields_not_found: string[] = [];
  if (!periods.length)
    fields_not_found.push("design_criteria.design_storm_return_periods_years");
  if (!peaks.length)
    fields_not_found.push("design_criteria.peak_flow_calculation_method");
  if (!wqv)
    fields_not_found.push("design_criteria.water_quality_volume_method");
  if (!software.length)
    fields_not_found.push(
      "design_criteria.required_hydrologic_hydraulic_software"
    );
  if (!bmps.length)
    fields_not_found.push("design_criteria.approved_bmp_categories");

  const record = {
    document_metadata: {
      jurisdiction_name: meta.jurisdiction_name,
      jurisdiction_level: meta.jurisdiction_level,
      state_code: meta.state_code,
      document_title: meta.document_title,
      version_or_edition: meta.version_or_edition,
      adoption_or_effective_date: null,
      last_revised_date: null,
      relationship_to_state_manual: "independent" as const,
      ...(meta.category ? { issuing_agency_category: meta.category } : {}),
    },
    design_criteria: {
      design_storm_return_periods_years: periods,
      water_quality_volume_method: wqv,
      peak_flow_calculation_method: peaks,
      required_hydrologic_hydraulic_software: software,
      approved_bmp_categories: bmps,
    },
    evidence,
    extraction_quality: {
      confidence: "medium" as const,
      needs_human_review: true,
      review_notes: `Heuristic agency extract from prepared text. ${job.notes ?? ""}`.trim(),
      fields_not_found,
    },
    source: {
      document_url: job.pdfUrl,
      landing_page_url: job.landingPageUrl,
      retrieved_at: new Date().toISOString(),
      original_filename: `${job.id}.pdf`,
    },
  };

  const parsed = stormwaterSchema.parse(record);
  const outPath = path.join(DOCS, `${job.id}.json`);
  writeFileSync(outPath, JSON.stringify(parsed, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${outPath} (periods=${periods.length} peaks=${peaks.length})`);
}

function main() {
  const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as Job[];
  const byId = new Map(manifest.map((j) => [j.id, j]));
  const targets =
    ids.length > 0
      ? ids
      : Object.keys(META);

  const progress = existsSync(PROGRESS)
    ? (JSON.parse(readFileSync(PROGRESS, "utf-8")) as Record<
        string,
        { status: string; slug?: string; updatedAt?: string }
      >)
    : {};

  for (const id of targets) {
    const job = byId.get(id);
    if (!job) {
      console.warn(`Not in manifest: ${id}`);
      continue;
    }
    extractOne(job);
    progress[id] = {
      status: "done",
      slug: id,
      updatedAt: new Date().toISOString(),
    };
  }
  writeFileSync(PROGRESS, JSON.stringify(progress, null, 2) + "\n", "utf-8");
}

main();
