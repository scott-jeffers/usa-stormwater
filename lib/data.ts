import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stormwaterSchema, type StormwaterData } from "./schema";

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
  processedAt: string;
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

function toListItem(record: ManualRecord): ManualListItem {
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
    document_url: source.document_url,
    landing_page_url: source.landing_page_url,
    processedAt: record.processedAt,
  };
}

export function getManualListItems(): ManualListItem[] {
  if (cachedListItems) return cachedListItems;
  cachedListItems = getAllManuals().map(toListItem);
  return cachedListItems;
}
