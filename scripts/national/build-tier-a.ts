/**
 * Propose Tier A national evidence anchors from atlas documents.
 * Writes data/national/tier-a-slugs.json (overwrite with --write).
 *
 * Usage:
 *   npx tsx scripts/national/build-tier-a.ts
 *   npx tsx scripts/national/build-tier-a.ts --write
 */
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { getAllManuals } from "../../lib/data";
import {
  CHAPTER_PROXY_SLUGS,
  type TierAEntry,
  type TierAFile,
  type TierARationale,
} from "../../lib/national/tierA";

const NATIONAL_DIR = path.resolve(process.cwd(), "data/national");
const OUT_PATH = path.join(NATIONAL_DIR, "tier-a-slugs.json");

/** High-value metro / regional anchors (must exist in atlas). */
const P1_METRO_SLUGS = [
  "los-angeles-ca",
  "chicago-il",
  "houston-tx",
  "philadelphia-pa",
  "san-diego-ca",
  "dallas-tx",
  "austin-tx-ecm",
  "seattle-wa",
  "denver-co",
  "boston-ma",
  "portland-or",
  "detroit-mi",
  "baltimore-md",
  "minneapolis-mn",
  "miami-fl",
  "raleigh-nc",
  "charlotte-nc",
  "nashville-tn-vol4",
  "columbus-oh",
  "san-antonio-tx",
  "san-francisco-ca",
  "dc-guidebook",
  "mesa-az",
  "tucson-az",
  "maricopa-county-az",
  "king-county-wa",
  "fairfax-county-va",
  "harris-county-tx",
  "orange-county-ca",
  "cook-county-il",
  "prince-georges-county-md",
  "kansas-city-marc-bmp",
  "bellevue-wa",
  "boise-id",
  "flagstaff-az",
  "anchorage-ak",
  "honolulu-hi",
  "albuquerque-nm-gsi",
  "milwaukee-wi",
  "louisville-ky",
  "memphis-tn",
  "tampa-fl",
  "orlando-fl",
  "jacksonville-fl",
  "salt-lake-city-ut",
  "omaha-ne",
  "fort-worth-tx",
  "las-vegas-nv",
  "richmond-va",
  "norfolk-va",
  "chesapeake-va",
  "arkansas-manual",
  "oregon-manual",
];

function propose(): TierAFile {
  const manuals = getAllManuals();
  const bySlug = new Map(manuals.map((m) => [m.slug, m]));
  const entries = new Map<string, TierAEntry>();

  const add = (
    slug: string,
    rationale: TierARationale,
    notes?: string
  ): void => {
    const m = bySlug.get(slug);
    if (!m) return;
    const existing = entries.get(slug);
    const state_code = m.data.document_metadata.state_code ?? "XX";
    const proxy = CHAPTER_PROXY_SLUGS.has(slug);
    const entry: TierAEntry = {
      slug,
      state_code,
      rationale: existing?.rationale === "state_manual" ? "state_manual" : rationale,
      needs_human_review: m.data.extraction_quality.needs_human_review,
      chapter_proxy: proxy || undefined,
      notes:
        notes ??
        existing?.notes ??
        (proxy
          ? "Chapter-only or partial PDF — do not use as sole national default."
          : undefined),
    };
    entries.set(slug, entry);
  };

  for (const m of manuals) {
    if (m.data.document_metadata.jurisdiction_level === "state") {
      add(m.slug, "state_manual");
    }
  }

  for (const slug of P1_METRO_SLUGS) {
    add(slug, "p1_metro");
  }

  // Prefer clean extractions manuals as regional anchors when not already in
  for (const m of manuals) {
    if (m.data.extraction_quality.needs_human_review) continue;
    if (entries.has(m.slug)) continue;
    const level = m.data.document_metadata.jurisdiction_level;
    if (level === "municipality" || level === "county" || level === "special_district") {
      add(m.slug, "regional_anchor", "Clean extraction; regional diversity anchor.");
    }
  }

  // Prefer: all state manuals, then clean p1 metros, then review p1 for state gaps, then anchors
  const list = [...entries.values()];
  const states = list.filter((e) => e.rationale === "state_manual");
  const p1Clean = list.filter(
    (e) => e.rationale === "p1_metro" && !e.needs_human_review
  );
  const p1Review = list.filter(
    (e) => e.rationale === "p1_metro" && e.needs_human_review
  );
  const anchors = list
    .filter((e) => e.rationale === "regional_anchor")
    .sort((a, b) => a.state_code.localeCompare(b.state_code) || a.slug.localeCompare(b.slug));

  const targetMax = 78;
  const selectedMap = new Map<string, TierAEntry>();
  for (const e of states) selectedMap.set(e.slug, e);
  for (const e of p1Clean) {
    if (selectedMap.size >= targetMax) break;
    selectedMap.set(e.slug, e);
  }
  // Fill geographic gaps with review-flagged P1 metros
  const coveredStates = new Set([...selectedMap.values()].map((e) => e.state_code));
  for (const e of p1Review) {
    if (selectedMap.size >= targetMax) break;
    if (coveredStates.has(e.state_code) && selectedMap.size > targetMax - 8) continue;
    selectedMap.set(e.slug, e);
    coveredStates.add(e.state_code);
  }
  for (const e of anchors) {
    if (selectedMap.size >= targetMax) break;
    if (coveredStates.has(e.state_code)) continue;
    selectedMap.set(e.slug, e);
    coveredStates.add(e.state_code);
  }

  const selected = [...selectedMap.values()].sort(
    (a, b) => a.state_code.localeCompare(b.state_code) || a.slug.localeCompare(b.slug)
  );

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    title: "Tier A national evidence anchors",
    policy:
      "National draft citations prefer these ~60–80 manuals. Chapter proxies are included for coverage but must not alone set national defaults. Tempe AZ and Atlanta GA are excluded (no standalone city design manuals).",
    excluded: [
      {
        id: "tempe-az",
        reason:
          "No Tempe drainage/stormwater design manual located; civic PDF 88295 is Historic Preservation / DBP memo. City publishes SWMP/MS4 reports only.",
      },
      {
        id: "atlanta-ga",
        reason:
          "Pipeline skipped — no standalone city design-manual PDF; Atlanta adopts GSMM (ga-state). Use ga-state for Georgia practice.",
      },
    ],
    entries: selected,
  };
}

const write = process.argv.includes("--write");
const file = propose();
console.log(
  `Tier A proposal: ${file.entries.length} entries ` +
    `(state=${file.entries.filter((e) => e.rationale === "state_manual").length}, ` +
    `p1=${file.entries.filter((e) => e.rationale === "p1_metro").length}, ` +
    `anchor=${file.entries.filter((e) => e.rationale === "regional_anchor").length}, ` +
    `proxy=${file.entries.filter((e) => e.chapter_proxy).length})`
);

if (write) {
  mkdirSync(NATIONAL_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(file, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${OUT_PATH}`);
} else {
  console.log("(dry-run — pass --write to save)");
  console.log(file.entries.map((e) => `${e.slug}\t${e.rationale}\t${e.state_code}`).join("\n"));
}
