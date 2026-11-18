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

test("shared-manual groups: complete, consistent, one group per record", async () => {
  const { loadSharedManuals } = await import("../lib/sharedManuals");
  const shared = loadSharedManuals()!;
  const docs = new Map(
    files.map((f) => [f.slice(0, -5), JSON.parse(readFileSync(path.join(DIR, f), "utf-8"))])
  );
  const seen = new Map<string, string>();
  for (const g of shared.groups) {
    assert.ok(g.members.some((m) => m.slug === g.representative), `${g.id}: representative not a member`);
    for (const m of g.members) {
      assert.ok(docs.has(m.slug), `${g.id}: unknown slug ${m.slug}`);
      assert.ok(!seen.has(m.slug), `${m.slug} is in ${seen.get(m.slug)} and ${g.id}`);
      seen.set(m.slug, g.id);
      const url = docs.get(m.slug).source.document_url;
      assert.ok(g.document_urls.includes(url), `${m.slug}: its document_url is not listed in ${g.id}`);
    }
  }
  for (const r of shared.records) {
    assert.ok(docs.has(r.slug), `records: unknown slug ${r.slug}`);
    assert.ok(!seen.has(r.slug), `${r.slug} is listed both as a record and in ${seen.get(r.slug)}`);
  }
  // every PDF used by 2+ records must be covered by a group
  const byUrl = new Map<string, string[]>();
  for (const [slug, d] of docs) {
    const u = d.source.document_url;
    if (u) byUrl.set(u, [...(byUrl.get(u) ?? []), slug]);
  }
  const missing = [...byUrl.values()].filter((ss) => ss.length > 1 && ss.some((s) => !seen.has(s)));
  assert.deepEqual(missing, [], "records share a PDF but are not in data/coverage/shared-manuals.json");
});

test("every slug referenced by national drafts and practices is a real document", () => {
  const slugs = new Set(files.map((f) => f.slice(0, -5)));
  const bad: string[] = [];
  const walk = (o: unknown, file: string, key = ""): void => {
    if (Array.isArray(o)) o.forEach((v) => walk(v, file, key));
    else if (o && typeof o === "object")
      for (const [k, v] of Object.entries(o)) walk(v, file, k);
    else if (typeof o === "string" && /slug/.test(key) && !slugs.has(o)) bad.push(`${file}:${key}=${o}`);
  };
  const dir = path.resolve("data/national");
  const list = (d: string): string[] =>
    readdirSync(d, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? list(path.join(d, e.name)) : e.name.endsWith(".json") ? [path.join(d, e.name)] : []
    );
  for (const f of list(dir)) walk(JSON.parse(readFileSync(f, "utf-8")), path.relative(dir, f));
  assert.deepEqual(bad, []);
});

test("compare rows: shared-manual members carry the representative's design values", async () => {
  const { getCompareRows } = await import("../lib/compare");
  const { loadSharedManuals } = await import("../lib/sharedManuals");
  const rows = getCompareRows();
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  assert.equal(rows.length, readdirSync(path.resolve("data/documents")).filter((f) => f.endsWith(".json")).length);
  for (const g of loadSharedManuals()?.groups ?? []) {
    const rep = bySlug.get(g.representative);
    if (!rep) continue;
    for (const { slug: m } of g.members) {
      const row = bySlug.get(m);
      if (!row || m === g.representative) continue;
      assert.equal(row.design_from, g.representative, m);
      assert.deepEqual(row.storms, rep.storms, m);
      assert.deepEqual(row.params, rep.params, m);
    }
  }
});

test("freshness: ignores weak/strong ETag flips and per-request dates, catches real changes", async () => {
  const { hasChanged } = await import("../scripts/qa/check-freshness");
  const base = { url: "u", slugs: ["x"], status: 200, etag: 'W/"abc"', last_modified: "Fri, 06 Apr 2018 18:50:36 GMT", length: "100", checked_at: "2026-11-18T15:00:00Z" };
  assert.equal(hasChanged(base, { ...base, etag: '"abc"', checked_at: "2026-11-18T15:05:00Z" }), false);
  assert.equal(hasChanged(
    { ...base, etag: null, last_modified: "Wed, 18 Nov 2026 15:02:08 GMT" },
    { ...base, etag: null, last_modified: "Wed, 18 Nov 2026 15:07:00 GMT", checked_at: "2026-11-18T15:07:00Z" }
  ), false);
  assert.equal(hasChanged(base, { ...base, length: null }), false);
  assert.equal(hasChanged(base, { ...base, etag: '"def"' }), true);
  assert.equal(hasChanged(base, { ...base, length: "200" }), true);
  assert.equal(hasChanged(base, { ...base, etag: null, last_modified: "Mon, 01 Jun 2026 00:00:00 GMT" }), true);
});
