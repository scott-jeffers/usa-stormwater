import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { stormwaterSchema, type StormwaterData } from "./schema";

export interface ManualRecord {
  slug: string;
  data: StormwaterData;
  processedAt: string;
}

const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");

function listManualFiles(): string[] {
  try {
    return readdirSync(DOCUMENTS_DIR).filter((file) => file.endsWith(".json"));
  } catch {
    return [];
  }
}

export function getAllManuals(): ManualRecord[] {
  const files = listManualFiles();
  const records: ManualRecord[] = [];

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const filePath = path.join(DOCUMENTS_DIR, file);

    try {
      const raw = readFileSync(filePath, "utf-8");
      const json = JSON.parse(raw);
      const result = stormwaterSchema.safeParse(json);

      if (!result.success) {
        console.warn(
          `[lib/data] Skipping ${file}: failed schema validation (${result.error.issues
            .map((i) => i.path.join("."))
            .join(", ")})`
        );
        continue;
      }

      const stats = statSync(filePath);
      records.push({
        slug,
        data: result.data,
        processedAt: stats.mtime.toISOString(),
      });
    } catch (error) {
      console.warn(`[lib/data] Skipping ${file}: ${(error as Error).message}`);
    }
  }

  return records.sort((a, b) =>
    a.data.document_metadata.jurisdiction_name.localeCompare(
      b.data.document_metadata.jurisdiction_name
    )
  );
}

export function getManualBySlug(slug: string): ManualRecord | null {
  return getAllManuals().find((record) => record.slug === slug) ?? null;
}
