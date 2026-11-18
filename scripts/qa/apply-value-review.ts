/**
 * Apply the hand review of numeric design parameters (data/qa/value-review.json)
 * to data/documents/*.json:
 *   corrected -> value replaced by corrected_value
 *   removed   -> value set to null and its evidence excerpt dropped
 *   every kept value -> design_parameters.value_qualifiers[field]
 *   wqv basis -> design_parameters.wqv_basis
 * Idempotent: re-running changes nothing.
 *
 *   npx tsx scripts/qa/apply-value-review.ts [--check]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";

type Review = { qualifier: string; verdict: "ok" | "weak" | "corrected" | "removed"; value: number; corrected_value?: number; basis?: string; note?: string };

const ROOT = process.cwd();
const review = JSON.parse(readFileSync(path.join(ROOT, "data/qa/value-review.json"), "utf-8")) as { values: Record<string, Review> };
const check = process.argv.includes("--check");
const bySlug = new Map<string, Array<[string, Review]>>();
for (const [id, r] of Object.entries(review.values)) {
  const [slug, field] = id.split("|") as [string, string];
  bySlug.set(slug, [...(bySlug.get(slug) ?? []), [field, r]]);
}
let changed = 0;
for (const [slug, items] of bySlug) {
  const f = path.join(ROOT, "data/documents", `${slug}.json`);
  if (!existsSync(f)) continue;
  const before = readFileSync(f, "utf-8");
  const doc = JSON.parse(before);
  const dp = doc.design_parameters;
  if (!dp) continue;
  const quals: Record<string, string> = { ...(dp.value_qualifiers ?? {}) };
  for (const [field, r] of items) {
    if (r.verdict === "removed") {
      dp[field] = null;
      delete quals[field];
      doc.evidence = (doc.evidence ?? []).filter((e: { field: string }) => e.field !== `design_parameters.${field}`);
      if (field === "wqv_depth_inches") dp.wqv_basis = null;
      continue;
    }
    if (r.verdict === "corrected" && r.corrected_value != null) dp[field] = r.corrected_value;
    if (dp[field] != null) quals[field] = r.qualifier;
    if (field === "wqv_depth_inches" && r.basis) dp.wqv_basis = r.basis;
  }
  dp.value_qualifiers = Object.fromEntries(Object.entries(quals).sort());
  const after = JSON.stringify(doc, null, 2) + "\n";
  if (after !== before) {
    changed++;
    if (!check) writeFileSync(f, after);
  }
}
console.log(`${check ? "would change" : "changed"} ${changed} document(s)`);
if (check && changed) process.exit(1);
