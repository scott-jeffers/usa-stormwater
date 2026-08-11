import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stormwaterSchema, type StormwaterData } from "./schema";
import {
  inferAgencyCategory,
  normalizeAgencyCategory,
  type AgencyCategory,
} from "./agencyTypes";

export interface ManualRecord {
  slug: string;
  data: StormwaterData;
  processedAt: string;
}

/** Slim list row for homepage explorer (no evidence / design_criteria). */
export interface ManualListItem {
  slug: string;
  jurisdiction_name: string;
  jurisdiction_level: StormwaterData["document_metadata"]["jurisdiction_level"];
  state_code: string | null;
  document_title: string;
  confidence: StormwaterData["extraction_quality"]["confidence"];
  needs_human_review: boolean;
  document_url: string | null;
  landing_page_url: string | null;
  /** File mtime when the JSON was last written (ingest/process time). */
  processedAt: string;
  /**
   * Manual revision / effective date for display.
   * Prefers last_revised_date, then adoption_or_effective_date.
   */
  revisedAt: string | null;
  /** Resolved agency category (schema field or inferred). */
  issuing_agency_category: AgencyCategory | null;
}

const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");

let cachedManuals: ManualRecord[] | undefined;
let cachedSlugMap: Map<string, ManualRecord> | undefined;
let cachedListItems: ManualListItem[] | undefined;

function listManualFiles(): string[] {
  try {
    return readdirSync(DOCUMENTS_DIR).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
}

function loadManualFromPath(filePath: string, slug: string): ManualRecord | null {
  try {
    const raw = readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw);
    const result = stormwaterSchema.safeParse(json);

    if (!result.success) {
      console.warn(
        `[lib/data] Skipping ${path.basename(filePath)}: failed schema validation (${result.error.issues
          .map((i) => i.path.join("."))
          .join(", ")})`
      );
      return null;
    }

    const stats = statSync(filePath);
    return {
      slug,
      data: result.data,
      processedAt: stats.mtime.toISOString(),
    };
  } catch (error) {
    console.warn(
      `[lib/data] Skipping ${path.basename(filePath)}: ${(error as Error).message}`
    );
    return null;
  }
}

function ensureManualsCache(): void {
  if (cachedManuals !== undefined && cachedSlugMap !== undefined) return;

  const files = listManualFiles();
  const records: ManualRecord[] = [];

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const filePath = path.join(DOCUMENTS_DIR, file);
    const record = loadManualFromPath(filePath, slug);
    if (record) records.push(record);
  }

  records.sort((a, b) =>
    a.data.document_metadata.jurisdiction_name.localeCompare(
      b.data.document_metadata.jurisdiction_name
    )
  );

  cachedManuals = records;
  cachedSlugMap = new Map(records.map((r) => [r.slug, r]));
  cachedListItems = undefined;
}

/** Clear module cache (tests / after mutating data/documents). */
export function clearManualsCache(): void {
  cachedManuals = undefined;
  cachedSlugMap = undefined;
  cachedListItems = undefined;
}

export function getAllManuals(): ManualRecord[] {
  ensureManualsCache();
  return cachedManuals!;
}

export function getManualSlugMap(): Map<string, ManualRecord> {
  ensureManualsCache();
  return cachedSlugMap!;
}

export function getManualBySlug(slug: string): ManualRecord | null {
  return getManualSlugMap().get(slug) ?? null;
}

/** Read a single document JSON without loading the full atlas (cold path). */
export function readManualFile(slug: string): ManualRecord | null {
  const map = getManualSlugMap();
  const hit = map.get(slug);
  if (hit) return hit;

  const filePath = path.join(DOCUMENTS_DIR, `${slug}.json`);
  if (!existsSync(filePath)) return null;
  return loadManualFromPath(filePath, slug);
}

/**
 * Best available revision/effective date for list display.
 * Prefers explicit date fields; falls back to a date/year parsed from
 * version_or_edition (e.g. "Second Edition, 2014").
 */
export function revisionDateFromMetadata(
  meta: StormwaterData["document_metadata"]
): string | null {
  const explicit =
    meta.last_revised_date?.trim() ||
    meta.adoption_or_effective_date?.trim() ||
    null;
  if (explicit) return explicit;
  return parseDateFromEdition(meta.version_or_edition);
}

/** Pull YYYY-MM-DD, YYYY-MM, or YYYY from a free-text edition string. */
function parseDateFromEdition(edition: string | null | undefined): string | null {
  if (!edition?.trim()) return null;
  const text = edition.trim();

  // ISO-ish already
  if (/^\d{4}-\d{2}(-\d{2})?$/.test(text)) return text;

  // "Revised: 1-3-2017" / "1/3/2017" / "July 1, 2024"
  const mdy = text.match(
    /\b(?:Revised:\s*)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/i
  );
  if (mdy) {
    const month = Number(mdy[1]);
    const day = Number(mdy[2]);
    const year = Number(mdy[3]);
    // Prefer M/D/Y when first number <= 12
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }

  const months =
    "January|February|March|April|May|June|July|August|September|October|November|December";
  const monthDayYear = text.match(
    new RegExp(
      `\\b(${months})\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`,
      "i"
    )
  );
  if (monthDayYear) {
    const monthIndex =
      months.split("|").findIndex(
        (m) => m.toLowerCase() === monthDayYear[1]!.toLowerCase()
      ) + 1;
    const day = Number(monthDayYear[2]);
    const year = Number(monthDayYear[3]);
    return `${year}-${String(monthIndex).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  const monthYear = text.match(
    new RegExp(`\\b(${months})\\s+,?\\s*(\\d{4})\\b`, "i")
  );
  if (monthYear) {
    const monthIndex =
      months.split("|").findIndex(
        (m) => m.toLowerCase() === monthYear[1]!.toLowerCase()
      ) + 1;
    return `${monthYear[2]}-${String(monthIndex).padStart(2, "0")}`;
  }

  // "2024 Edition", "Second Edition, 2014", "Version 1.0, DRAFT March 2015" —
  // prefer the last 4-digit year in 19xx/20xx range
  const years = [...text.matchAll(/\b((?:19|20)\d{2})\b/g)].map((m) => m[1]!);
  if (years.length) return years[years.length - 1]!;

  return null;
}

function toListItem(record: ManualRecord): ManualListItem {
  const meta = record.data.document_metadata;
  const quality = record.data.extraction_quality;
  const source = record.data.source;
  const fromSchema = normalizeAgencyCategory(meta.issuing_agency_category);
  const issuing_agency_category =
    fromSchema ??
    inferAgencyCategory({
      slug: record.slug,
      jurisdictionName: meta.jurisdiction_name,
      documentTitle: meta.document_title,
    });
  const revisedAt = revisionDateFromMetadata(meta);
  return {
    slug: record.slug,
    jurisdiction_name: meta.jurisdiction_name,
    jurisdiction_level: meta.jurisdiction_level,
    state_code: meta.state_code,
    document_title: meta.document_title,
    confidence: quality.confidence,
    needs_human_review: quality.needs_human_review,
    document_url: source.document_url,
    landing_page_url: source.landing_page_url,
    processedAt: record.processedAt,
    revisedAt,
    issuing_agency_category,
  };
}

export function getManualListItems(): ManualListItem[] {
  if (cachedListItems) return cachedListItems;
  cachedListItems = getAllManuals().map(toListItem);
  return cachedListItems;
}
