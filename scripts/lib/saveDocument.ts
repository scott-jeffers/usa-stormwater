/**
 * Validate extraction JSON and write data/documents/<slug>.json.
 * Source URLs are injected here — not invented by the model.
 */
import { writeFile, mkdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  stormwaterSchema,
  type StormwaterData,
  type DocumentSource,
  type StormwaterExtraction,
} from "../../lib/schema";

export const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildSlugBase(data: StormwaterData): string {
  const { jurisdiction_name, jurisdiction_level, state_code } =
    data.document_metadata;
  const stateSlug = state_code ? state_code.toLowerCase() : null;

  if (jurisdiction_level === "state" && stateSlug) {
    return `${stateSlug}-state`;
  }

  const nameSlug = slugify(jurisdiction_name) || slugify(jurisdiction_level);
  if (stateSlug && jurisdiction_level !== "state") {
    return `${nameSlug}-${stateSlug}`;
  }
  return nameSlug;
}

function resolveUniqueSlug(base: string): string {
  let candidate = base;
  let counter = 2;
  while (existsSync(path.join(DOCUMENTS_DIR, `${candidate}.json`))) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

export async function saveDocument(opts: {
  extraction: StormwaterExtraction | unknown;
  documentUrl?: string | null;
  landingPageUrl?: string | null;
  originalFilename?: string | null;
  preferredSlug?: string | null;
  /** When true, write preferredSlug even if the file already exists. */
  overwrite?: boolean;
}): Promise<{ slug: string; outPath: string; data: StormwaterData }> {
  const source: DocumentSource = {
    document_url: opts.documentUrl ?? null,
    landing_page_url: opts.landingPageUrl ?? null,
    retrieved_at: new Date().toISOString(),
    original_filename: opts.originalFilename ?? null,
  };

  const data = stormwaterSchema.parse({
    ...(opts.extraction as object),
    source,
  });

  await mkdir(DOCUMENTS_DIR, { recursive: true });

  let slug: string;
  if (
    opts.preferredSlug &&
    (opts.overwrite ||
      !existsSync(path.join(DOCUMENTS_DIR, `${opts.preferredSlug}.json`)))
  ) {
    slug = opts.preferredSlug;
  } else {
    slug = resolveUniqueSlug(buildSlugBase(data));
  }

  const outPath = path.join(DOCUMENTS_DIR, `${slug}.json`);
  await writeFile(outPath, JSON.stringify(data, null, 2) + "\n", "utf-8");

  if (opts.preferredSlug) {
    await markManifestProgressDone(opts.preferredSlug, slug);
  }

  return { slug, outPath, data };
}

/** When saving with --slug=<manifest-id>, mark that queue job done. */
async function markManifestProgressDone(
  preferredSlug: string,
  savedSlug: string
): Promise<void> {
  const progressPath = path.resolve(process.cwd(), "data/queue/progress.json");
  const manifestPath = path.resolve(process.cwd(), "data/queue/manifest.json");
  if (!existsSync(progressPath) || !existsSync(manifestPath)) return;

  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf-8")) as Array<{
      id: string;
    }>;
    const ids = new Set(manifest.map((j) => j.id));
    if (!ids.has(preferredSlug)) return;

    const progress = JSON.parse(await readFile(progressPath, "utf-8")) as Record<
      string,
      {
        status: string;
        updatedAt: string;
        error?: string | null;
        slug?: string | null;
      }
    >;
    progress[preferredSlug] = {
      ...(progress[preferredSlug] ?? {}),
      status: "done",
      updatedAt: new Date().toISOString(),
      error: null,
      slug: savedSlug,
    };
    await writeFile(progressPath, JSON.stringify(progress, null, 2) + "\n", "utf-8");
  } catch {
    // Progress sync is best-effort — don't fail the save.
  }
}

export async function saveDocumentFromFile(
  jsonPath: string,
  opts: {
    documentUrl?: string | null;
    landingPageUrl?: string | null;
    preferredSlug?: string | null;
  }
): Promise<{ slug: string; outPath: string; data: StormwaterData }> {
  const raw = JSON.parse(await readFile(jsonPath, "utf-8"));
  // Allow files that already include source — prefer CLI overrides when set.
  const { source: existingSource, ...extraction } = raw;
  return saveDocument({
    extraction,
    documentUrl: opts.documentUrl ?? existingSource?.document_url ?? null,
    landingPageUrl:
      opts.landingPageUrl ?? existingSource?.landing_page_url ?? null,
    originalFilename:
      existingSource?.original_filename ?? path.basename(jsonPath),
    preferredSlug: opts.preferredSlug,
  });
}
