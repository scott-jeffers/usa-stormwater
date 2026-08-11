/**
 * Smoke-check national manual reader data (no server).
 */
import { getDraftSection, getNationalReaderIndex } from "../../lib/national";
import { getTierAFile } from "../../lib/national/tierA";
import { getPipelineStatusSummary } from "../../lib/pipeline/statusSummary";

const STRUCTURED = new Set([
  "hydrology",
  "hydrology.design-storms",
  "hydrology.methods",
  "hydrology.software",
  "water-quality",
  "water-quality.sizing",
  "bmps",
  "bmps.selection",
  "bmps.sizing",
  "bmps.manufactured",
  "channel-flood",
  "channel-flood.release",
]);

const idx = getNationalReaderIndex();
const status = getPipelineStatusSummary();
const tierA = getTierAFile();

let errors = 0;
if (idx.sections.length !== 18) {
  console.error(`expected 18 sections, got ${idx.sections.length}`);
  errors += 1;
}
const reviewed = idx.sections.filter((s) => s.editorial_status === "reviewed");
if (reviewed.length !== 18) {
  console.error(`expected 18 reviewed, got ${reviewed.length}`);
  errors += 1;
}
if (!tierA || tierA.entries.length < 50) {
  console.error(`Tier A missing or too small: ${tierA?.entries.length}`);
  errors += 1;
}

for (const s of idx.sections) {
  const d = getDraftSection(s.id);
  if (!d) {
    console.error(`missing draft ${s.id}`);
    errors += 1;
    continue;
  }
  if (/\[DRAFT RECOMMENDATION/i.test(d.draft_recommendation)) {
    console.error(`stale DRAFT RECOMMENDATION banner: ${s.id}`);
    errors += 1;
  }
  if (d.draft_recommendation.trim().length < 80) {
    console.error(`thin guidance prose: ${s.id}`);
    errors += 1;
  }
  if (d.practice_survey.trim().length < 80) {
    console.error(`thin practice prose: ${s.id}`);
    errors += 1;
  }
  if (d.editorial_status !== "reviewed") {
    console.error(`not reviewed: ${s.id}`);
    errors += 1;
  }
  if (d.citations.length < 4) {
    console.error(`few citations ${s.id}: ${d.citations.length}`);
    errors += 1;
  }
  const tables = d.guidance_tables?.length ?? 0;
  if (s.id !== "intro" && tables < 1) {
    console.error(`missing guidance_tables: ${s.id}`);
    errors += 1;
  }

  const registry = d.citation_registry ?? [];
  if (registry.length < 1) {
    console.error(`missing citation_registry: ${s.id}`);
    errors += 1;
  }
  const registryKeys = new Set(registry.map((r) => r.key));
  for (const r of registry) {
    if (!r.excerpt.trim()) {
      console.error(`empty registry excerpt ${s.id} key=${r.key}`);
      errors += 1;
    }
  }

  if (STRUCTURED.has(s.id)) {
    const clauses = d.recommendation_clauses ?? [];
    if (clauses.length < 3) {
      console.error(
        `structured section needs ≥3 clauses: ${s.id} got ${clauses.length}`
      );
      errors += 1;
    }
    for (const c of clauses) {
      if (c.citation_keys.length < 1) {
        console.error(`clause missing citation_keys: ${s.id}.${c.id}`);
        errors += 1;
      }
      for (const k of c.citation_keys) {
        if (!registryKeys.has(k)) {
          console.error(
            `dangling citation_key ${k} in ${s.id}.${c.id}`
          );
          errors += 1;
        }
      }
    }
  }

  for (const t of d.guidance_tables ?? []) {
    for (const keys of t.row_citations ?? []) {
      for (const k of keys) {
        if (!registryKeys.has(k)) {
          console.error(
            `dangling table citation_key ${k} in ${s.id}/${t.id}`
          );
          errors += 1;
        }
      }
    }
  }

  console.log(
    `OK /national/${s.id}/ citations=${d.citations.length} tables=${tables} registry=${registry.length} clauses=${d.recommendation_clauses?.length ?? 0}`
  );
}

console.log(
  `tierA=${tierA?.entries.length} verifyPassed=${status?.stages.verify.done} tierAVerify=${status?.tierAVerify.done}/${status?.tierAVerify.total}`
);

if (errors > 0) {
  console.error(`SMOKE FAILED (${errors} errors)`);
  process.exit(1);
}
console.log("SMOKE OK — 18 national section routes ready");
