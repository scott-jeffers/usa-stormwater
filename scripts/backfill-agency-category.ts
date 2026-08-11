/**
 * Backfill document_metadata.issuing_agency_category on existing atlas JSON.
 * Conservative: only slugs in aliases.slug_to_category, manifest agencyHint,
 * or state-level manuals with a clear name/slug inference.
 *
 *   npm run agency:backfill
 *   npm run agency:backfill -- --dry-run
 *   npm run agency:backfill -- --fix  # re-apply / clear false positives
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stormwaterSchema } from "../lib/schema";
import {
  inferAgencyCategory,
  normalizeAgencyCategory,
  type AgencyCategory,
} from "../lib/agencyTypes";

const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");
const QUEUE_DIR = path.resolve(process.cwd(), "data/queue");
const ALIASES_PATH = path.resolve(
  process.cwd(),
  "data/agency-targets/aliases.json"
);

function parseArgs(argv: string[]) {
  return {
    dryRun: argv.includes("--dry-run"),
    fix: argv.includes("--fix"),
  };
}

function loadAgencyHints(): Map<string, string> {
  const map = new Map<string, string>();
  try {
    const manifest = JSON.parse(
      readFileSync(path.join(QUEUE_DIR, "manifest.json"), "utf-8")
    ) as Array<{ id: string; agencyHint?: string | null }>;
    for (const job of manifest) {
      if (job.agencyHint) map.set(job.id, job.agencyHint);
    }
  } catch {
    /* ignore */
  }
  return map;
}

function loadSlugMap(): Record<string, string> {
  try {
    const aliases = JSON.parse(readFileSync(ALIASES_PATH, "utf-8")) as {
      slug_to_category?: Record<string, string>;
    };
    return aliases.slug_to_category ?? {};
  } catch {
    return {};
  }
}

function resolveCategory(
  slug: string,
  level: string,
  jurisdictionName: string,
  documentTitle: string,
  hints: Map<string, string>,
  slugMap: Record<string, string>
): AgencyCategory | null {
  const fromMap = normalizeAgencyCategory(slugMap[slug]);
  if (fromMap) return fromMap;

  const fromHint = normalizeAgencyCategory(hints.get(slug) ?? null);
  if (fromHint) return fromHint;

  // Only infer from name for state-level manuals (avoids city docs that cite DEQ/DOT)
  if (level !== "state") return null;

  return inferAgencyCategory({
    slug,
    jurisdictionName,
    documentTitle,
    agencyHint: hints.get(slug) ?? null,
  });
}

function main() {
  const { dryRun, fix } = parseArgs(process.argv.slice(2));
  const hints = loadAgencyHints();
  const slugMap = loadSlugMap();
  const files = readdirSync(DOCUMENTS_DIR).filter((f) => f.endsWith(".json"));

  let updated = 0;
  let cleared = 0;
  let unchanged = 0;
  let skipped = 0;

  for (const file of files) {
    const slug = file.replace(/\.json$/, "");
    const filePath = path.join(DOCUMENTS_DIR, file);
    const raw = JSON.parse(readFileSync(filePath, "utf-8"));
    const parsed = stormwaterSchema.safeParse(raw);
    if (!parsed.success) {
      console.warn(`skip invalid: ${slug}`);
      skipped += 1;
      continue;
    }

    const data = parsed.data;
    const existing = normalizeAgencyCategory(
      data.document_metadata.issuing_agency_category
    );
    const resolved = resolveCategory(
      slug,
      data.document_metadata.jurisdiction_level,
      data.document_metadata.jurisdiction_name,
      data.document_metadata.document_title,
      hints,
      slugMap
    );

    const next =
      resolved === "dep_deq" ||
      resolved === "dot" ||
      resolved === "dnr" ||
      resolved === "other"
        ? resolved
        : null;

    if (!fix) {
      if (existing) {
        unchanged += 1;
        continue;
      }
      if (!next) {
        unchanged += 1;
        continue;
      }
      data.document_metadata.issuing_agency_category = next;
      updated += 1;
      console.log(`${dryRun ? "[dry-run] " : ""}${slug} → ${next}`);
    } else {
      // --fix: set to resolved or remove false positives
      const prev = data.document_metadata.issuing_agency_category ?? null;
      if (next) {
        if (prev === next) {
          unchanged += 1;
          continue;
        }
        data.document_metadata.issuing_agency_category = next;
        updated += 1;
        console.log(`${dryRun ? "[dry-run] " : ""}${slug} → ${next}`);
      } else if (prev != null) {
        delete data.document_metadata.issuing_agency_category;
        cleared += 1;
        console.log(`${dryRun ? "[dry-run] " : ""}${slug} → (cleared)`);
      } else {
        unchanged += 1;
        continue;
      }
    }

    if (!dryRun) {
      writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
    }
  }

  console.log(
    `Backfill ${dryRun ? "(dry-run) " : ""}${fix ? "(fix) " : ""}done: updated=${updated} cleared=${cleared} unchanged=${unchanged} skipped=${skipped}`
  );
}

main();
