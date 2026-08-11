/**
 * Write atlas-derived criteria-shaped guidance_tables + citation_registry
 * into national draft JSON.
 *
 *   npx tsx scripts/national/build-guidance-tables.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clearManualsCache, getAllManuals } from "../../lib/data";
import { clearNationalCache } from "../../lib/national";
import { getTierASlugSet } from "../../lib/national/tierA";
import { DRAFT_DIR, OUTLINE_PATH } from "../../lib/pipeline/paths";
import {
  draftSectionSchema,
  nationalOutlineSchema,
  type DraftSection,
  type GuidanceTable,
} from "../../lib/pipeline/types";
import {
  buildGuidanceTablesForSection,
  computeAtlasStats,
} from "../lib/atlasStats";
import {
  buildCitationRegistry,
  mergeFieldCitations,
  type FieldCitation,
} from "../lib/fieldCitations";

/** Sections that receive criteria / checklist tables (intro has none). */
const WITH_TABLES = new Set([
  "applicability",
  "hydrology",
  "hydrology.design-storms",
  "hydrology.methods",
  "hydrology.software",
  "water-quality",
  "water-quality.sizing",
  "channel-flood",
  "channel-flood.release",
  "bmps",
  "bmps.selection",
  "bmps.sizing",
  "bmps.manufactured",
  "construction-esc",
  "om",
  "regional",
  "submittals",
]);

/** Also build registry-only for intro (no tables). */
const ALL_REGISTRY = new Set([...WITH_TABLES, "intro"]);

clearManualsCache();
clearNationalCache();

const outline = nationalOutlineSchema.parse(
  JSON.parse(readFileSync(OUTLINE_PATH, "utf-8"))
);
const manuals = getAllManuals();
const tierA = getTierASlugSet();
const atlas = computeAtlasStats({ manuals, tierASlugs: tierA });
const stateBySlug = new Map(
  manuals.map((m) => [m.slug, m.data.document_metadata.state_code] as const)
);

let updated = 0;
for (const section of outline.sections) {
  if (!ALL_REGISTRY.has(section.id)) continue;
  const filePath = path.join(DRAFT_DIR, `${section.id}.json`);
  if (!existsSync(filePath)) {
    console.warn(`missing ${section.id}`);
    continue;
  }
  const raw = draftSectionSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8"))
  );

  let tables: GuidanceTable[] = [];
  let rowEvidence: FieldCitation[][][] = [];

  if (WITH_TABLES.has(section.id)) {
    const stats = atlas.forSection(section);
    const built = buildGuidanceTablesForSection(section.id, stats, {
      manuals,
      tierASlugs: tierA,
    });
    tables = built.tables;
    rowEvidence = built.rowEvidence;
  }

  const flatField = mergeFieldCitations(rowEvidence.flat(), 60);
  const { registry, keysForCitations } = buildCitationRegistry({
    fieldVerified: flatField,
    corpusCitations: raw.citations,
    stateBySlug,
    maxCorpus: 14,
  });

  const tablesWithKeys: GuidanceTable[] = tables.map((table, ti) => {
    const evidenceRows = rowEvidence[ti] ?? [];
    const row_citations = table.rows.map((_, ri) =>
      keysForCitations(evidenceRows[ri] ?? [])
    );
    const hasAny = row_citations.some((k) => k.length > 0);
    return {
      ...table,
      row_citations: hasAny ? row_citations : undefined,
    };
  });

  const next: DraftSection = {
    ...raw,
    generated_at: new Date().toISOString(),
    guidance_tables: tablesWithKeys.length ? tablesWithKeys : undefined,
    citation_registry: registry.length ? registry : undefined,
  };

  writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  const citedRows = tablesWithKeys.reduce(
    (n, t) => n + (t.row_citations?.filter((r) => r.length > 0).length ?? 0),
    0
  );
  console.log(
    `${section.id}: ${tablesWithKeys.length} table(s), ${registry.length} registry, ${citedRows} cited rows`
  );
  updated += 1;
}

console.log(`Updated ${updated} draft sections`);
