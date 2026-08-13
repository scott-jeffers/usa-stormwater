/**
 * Build a cross-state numeric matrix for one practice (no LLM).
 *
 *   npx tsx scripts/national/build-practice-matrix.ts --practice bioretention
 *   npx tsx scripts/national/build-practice-matrix.ts --practice bioretention --all
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getAllManuals, clearManualsCache } from "../../lib/data";
import { getTierASlugSet, isChapterProxy } from "../../lib/national/tierA";
import {
  getPracticeLabel,
  isKnownPracticeKey,
  listCanonicalPracticeKeys,
} from "../../lib/ontology/bmp";
import {
  PRACTICES_DIR,
  practiceMatrixPath,
} from "../../lib/pipeline/paths";
import {
  manualMentionsPractice,
  medianOf,
  modeOf,
  numericParamValue,
} from "../../lib/practices/params";
import { fieldsForPractice } from "../../lib/practices/fields";
import {
  practiceMatrixSchema,
  type PracticeMatrixCell,
  type PracticeNumericStat,
} from "../../lib/practices/types";
import type { StormwaterData } from "../../lib/schema";

function parseArgs(argv: string[]) {
  let practice = "bioretention";
  let tierAOnly = true;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if ((a === "--practice" || a === "-p") && argv[i + 1]) {
      practice = argv[++i]!;
    } else if (a.startsWith("--practice=")) {
      practice = a.slice("--practice=".length);
    } else if (a === "--all") {
      tierAOnly = false;
    } else if (a === "--tier-a") {
      tierAOnly = true;
    }
  }
  return { practice, tierAOnly };
}

function excerptForField(
  data: StormwaterData,
  field: string
): string | null {
  const hit = data.evidence.find(
    (e) => e.field === `design_parameters.${field}`
  );
  return hit?.excerpt ?? null;
}

function buildStat(
  field: { field: string; label: string; unit: string },
  cells: PracticeMatrixCell[],
  missingCount: number
): PracticeNumericStat {
  const values = cells
    .map((c) => c.value)
    .filter((v): v is number => v != null);
  return {
    field: String(field.field),
    label: field.label,
    unit: field.unit,
    values,
    min: values.length ? Math.min(...values) : null,
    max: values.length ? Math.max(...values) : null,
    mode: modeOf(values),
    median: medianOf(values),
    count: values.length,
    missing_count: missingCount,
    cells,
  };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!isKnownPracticeKey(opts.practice)) {
    console.error(
      `Unknown practice "${opts.practice}". Known: ${listCanonicalPracticeKeys().join(", ")}`
    );
    process.exit(1);
  }

  clearManualsCache();
  const tierA = getTierASlugSet();
  const manuals = getAllManuals().filter((m) =>
    opts.tierAOnly ? tierA.has(m.slug) : true
  );

  const mentioning = manuals.filter((m) =>
    manualMentionsPractice(m.data, opts.practice)
  );

  const notes: string[] = [];
  if (opts.tierAOnly) {
    notes.push("Scoped to Tier A manuals only.");
  }
  notes.push(
    `${mentioning.length} of ${manuals.length} manuals mention practice_key=${opts.practice} (design_parameters.practice_mentions or BMP text).`
  );
  notes.push(
    "Numeric consensus uses mode/range of extracted values — not an adopted national standard."
  );
  notes.push(
    "Site-wide fields (WQv, drawdown, SHWT) are jurisdiction sizing context, not practice facility specs."
  );

  const numeric_fields: PracticeNumericStat[] = [];
  const fields = fieldsForPractice(opts.practice);

  for (const field of fields) {
    const pool = field.practiceScoped ? mentioning : manuals;
    const cells: PracticeMatrixCell[] = [];
    let missing = 0;

    for (const m of pool) {
      const value = numericParamValue(m.data.design_parameters, field.field);
      if (value == null) {
        missing += 1;
        cells.push({
          slug: m.slug,
          state_code: m.data.document_metadata.state_code,
          jurisdiction_name: m.data.document_metadata.jurisdiction_name,
          value: null,
          chapter_proxy: isChapterProxy(m.slug),
          excerpt: null,
        });
        continue;
      }
      cells.push({
        slug: m.slug,
        state_code: m.data.document_metadata.state_code,
        jurisdiction_name: m.data.document_metadata.jurisdiction_name,
        value,
        chapter_proxy: isChapterProxy(m.slug),
        excerpt: excerptForField(m.data, field.field),
      });
    }

    // Prefer non-proxy values for stats
    const scoredCells = cells.filter((c) => c.value != null);
    const nonProxy = scoredCells.filter((c) => !c.chapter_proxy);
    const forStats = nonProxy.length ? nonProxy : scoredCells;
    const stat = buildStat(field, cells, missing);
    // Recompute mode/median/min/max from preferred cells
    const preferredValues = forStats
      .map((c) => c.value)
      .filter((v): v is number => v != null);
    stat.values = preferredValues;
    stat.min = preferredValues.length ? Math.min(...preferredValues) : null;
    stat.max = preferredValues.length ? Math.max(...preferredValues) : null;
    stat.mode = modeOf(preferredValues);
    stat.median = medianOf(preferredValues);
    stat.count = preferredValues.length;
    numeric_fields.push(stat);

    notes.push(
      `${field.field}${field.siteWide ? " [site-wide]" : ""}: n=${stat.count} mode=${stat.mode ?? "n/a"} range=${
        stat.min != null && stat.max != null ? `${stat.min}–${stat.max}` : "n/a"
      } (missing=${missing} in pool of ${pool.length})`
    );
  }

  const matrix = practiceMatrixSchema.parse({
    version: 1,
    practice_key: opts.practice,
    practice_label: getPracticeLabel(opts.practice),
    generated_at: new Date().toISOString(),
    tier_a_only: opts.tierAOnly,
    manuals_with_practice: mentioning.length,
    manuals_scanned: manuals.length,
    numeric_fields,
    mentioning_slugs: mentioning.map((m) => m.slug).sort(),
    notes,
  });

  await mkdir(PRACTICES_DIR, { recursive: true });
  const outPath = practiceMatrixPath(opts.practice);
  await writeFile(outPath, JSON.stringify(matrix, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${outPath}`);
  for (const n of notes) console.log(`  - ${n}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
