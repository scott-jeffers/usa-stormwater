import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { stormwaterSchema } from "../lib/schema";
import { normalizeIsoishDate } from "../lib/schema";
import { normalizeEvidenceField } from "../lib/practices/params";
import { evidenceQaFileSchema } from "../lib/qa/types";

const DIR = path.resolve("data/documents");
const files = readdirSync(DIR).filter((f) => f.endsWith(".json"));

test("every document passes the schema", () => {
  const bad: string[] = [];
  for (const f of files) {
    const r = stormwaterSchema.safeParse(JSON.parse(readFileSync(path.join(DIR, f), "utf-8")));
    if (!r.success) bad.push(`${f}: ${r.error.issues.map((i) => i.path.join(".")).join(", ")}`);
  }
  assert.deepEqual(bad, []);
});

test("slugs are lowercase kebab-case file names", () => {
  const bad = files.filter((f) => !/^[a-z0-9]+(-[a-z0-9]+)*\.json$/.test(f));
  assert.deepEqual(bad, []);
});

test("evidence field names are canonical", () => {
  const bad: string[] = [];
  for (const f of files) {
    const d = JSON.parse(readFileSync(path.join(DIR, f), "utf-8"));
    for (const e of d.evidence) if (normalizeEvidenceField(e.field) !== e.field) bad.push(`${f}: ${e.field}`);
  }
  assert.deepEqual(bad, []);
});

test("QA results file is valid and covers only existing documents", () => {
  const qa = evidenceQaFileSchema.parse(JSON.parse(readFileSync("data/qa/evidence.json", "utf-8")));
  const slugs = new Set(files.map((f) => f.slice(0, -5)));
  assert.deepEqual(Object.keys(qa.records).filter((s) => !slugs.has(s)), []);
});

test("date normalization", () => {
  assert.equal(normalizeIsoishDate("November 2025"), "2025-11");
  assert.equal(normalizeIsoishDate("July 1, 2024"), "2024-07-01");
  assert.equal(normalizeIsoishDate("1/3/2017"), "2017-01-03");
  assert.equal(normalizeIsoishDate("2016"), "2016");
});

test("evidence field normalization", () => {
  assert.equal(normalizeEvidenceField("max_drawdown_hours"), "design_parameters.max_drawdown_hours");
  assert.equal(normalizeEvidenceField("enrich_notes (drawdown time unspecified)"), "design_parameters.enrich_notes");
  assert.equal(normalizeEvidenceField("design_criteria.approved_bmp_categories"), "design_criteria.approved_bmp_categories");
});
