/**
 * Research downloads, built after export-data:
 *
 *   public/data/manuals.csv       one row per manual record
 *   public/data/values.csv        long format: one row per extracted value, with quote, page, check
 *   public/data/hand-checks.csv   values read by hand for the model manual
 *   public/data/dictionary.json   every field: meaning, unit, type, fill rate
 *   public/data/dataset.json      dataset version, counts, citation
 *   public/manual/model-manual.md the model manual source
 *
 *   npx tsx scripts/export-research.ts
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync } from "node:fs";
import path from "node:path";
import { DATASET_VERSION, FIELDS } from "../lib/dataset";

const ROOT = process.cwd();
const PUB = path.join(ROOT, "public/data");
const REC_DIR = path.join(PUB, "manuals");


export function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = Array.isArray(v) ? v.join("; ") : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
const row = (xs: unknown[]) => xs.map(csvCell).join(",");

type Rec = Record<string, any>;
const get = (o: Rec, p: string) => p.split(".").reduce<any>((a, k) => (a == null ? a : a[k]), o);
const present = (v: unknown) => v != null && v !== "" && !(Array.isArray(v) && v.length === 0);

function main() {
  if (!existsSync(REC_DIR)) throw new Error("run export-data first");
  const recs: Rec[] = readdirSync(REC_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => ({ slug: f.slice(0, -5), ...JSON.parse(readFileSync(path.join(REC_DIR, f), "utf-8")) }));

  const mHead = ["slug", "jurisdiction", "level", "state", "title", "agency_category", "edition", "adopted_or_effective", "last_revised", "coverage_basis", "design_from", "values_filled", "quotes_exact", "quotes_fuzzy", "quotes_unverifiable", "quotes_fail", "needs_review", "pdf_url", "landing_url", "page_url"];
  const mRows = [row(mHead)];
  const vHead = ["slug", "state", "level", "coverage_basis", "field", "label", "value", "unit", "qualifier", "basis", "hand_review", "quote", "page_or_section", "check", "check_page", "atlas_url"];
  const review = existsSync(path.join(ROOT, "data/qa/value-review.json")) ? (JSON.parse(readFileSync(path.join(ROOT, "data/qa/value-review.json"), "utf-8")).values as Record<string, Rec>) : {};
  const sRows = [row(["slug", "state", "level", "coverage_basis", "years", "main_purpose", "purposes", "quote", "page", "atlas_url"])];
  const vRows = [row(vHead)];
  const fill: Record<string, number> = Object.fromEntries(Object.keys(FIELDS).map((k) => [k, 0]));
  let own = 0;

  for (const r of recs) {
    const md = r.document_metadata ?? {};
    const cc = r.citation_check ?? {};
    const counts = cc.counts ?? {};
    const isOwn = r.coverage_basis !== "stand_in";
    if (isOwn) own++;
    let filled = 0;
    for (const [field, meta] of Object.entries(FIELDS)) {
      let v = get(r, field);
      if (!present(v)) continue;
      if (field === "design_parameters.design_storms")
        v = (v as Rec[]).map((st) => `${st.years}-yr: ${(st.purposes ?? []).join("+")}`);
      filled++;
      if (isOwn) fill[field]!++;
      const ev = (r.evidence ?? []).find((e: Rec) => e.field === field);
      const chk = (cc.excerpts ?? []).find((e: Rec) => e.field === field);
      vRows.push(
        row([r.slug, md.state_code, md.jurisdiction_level, r.coverage_basis, field, meta.label, v, meta.unit,
          field.startsWith("design_parameters.") ? r.design_parameters?.value_qualifiers?.[field.slice(18)] : undefined,
          field === "design_parameters.wqv_depth_inches" ? r.design_parameters?.wqv_basis : undefined,
          field.startsWith("design_parameters.") ? review[`${r.slug}|${field.slice(18)}`]?.verdict : undefined,
          ev?.excerpt, ev?.page_or_section, chk?.status ?? (ev ? "unchecked" : "no_quote"), chk?.page, `https://www.stormwateratlas.com/${r.slug}/`])
      );
    }
    for (const st of r.design_parameters?.design_storms ?? [])
      sRows.push(row([r.slug, md.state_code, md.jurisdiction_level, r.coverage_basis, st.years, st.purposes?.[0], st.purposes, st.quote, st.page, `https://www.stormwateratlas.com/${r.slug}/`]));
    mRows.push(
      row([r.slug, md.jurisdiction_name, md.jurisdiction_level, md.state_code, md.document_title, md.issuing_agency_category, md.version_or_edition, md.adoption_or_effective_date, md.last_revised_date, r.coverage_basis, r.design_from, filled, counts.exact, counts.fuzzy, counts.unverifiable, counts.fail, r.extraction_quality?.needs_human_review, r.source?.document_url, r.source?.landing_page_url, `https://www.stormwateratlas.com/${r.slug}/`])
    );
  }
  writeFileSync(path.join(PUB, "manuals.csv"), mRows.join("\n") + "\n");
  writeFileSync(path.join(PUB, "values.csv"), vRows.join("\n") + "\n");
  writeFileSync(path.join(PUB, "design-storms.csv"), sRows.join("\n") + "\n");

  const hcSrc = path.join(ROOT, "data/national/hand-checks.json");
  let hcN = 0;
  if (existsSync(hcSrc)) {
    const hc = JSON.parse(readFileSync(hcSrc, "utf-8")).values as Rec[];
    hcN = hc.length;
    const h = [row(["n", "criterion", "state", "slug", "value", "verdict", "source", "page", "quote", "note"])];
    for (const v of hc) h.push(row([v.n, v.param, v.state, v.slug, v.value, v.verdict, v.source ?? "record", v.page, v.quote, v.note ?? v.reason]));
    writeFileSync(path.join(PUB, "hand-checks.csv"), h.join("\n") + "\n");
  }

  const escSrc = path.join(ROOT, "data/national/esc-checks.json");
  if (existsSync(escSrc)) {
    const ev = JSON.parse(readFileSync(escSrc, "utf-8")).values as Rec[];
    const h = [row(["n", "criterion", "state", "slug", "level", "value", "verdict", "page", "quote", "note"])];
    for (const v of ev) h.push(row([v.n, v.param, v.state, v.slug, v.level, v.value, v.verdict, v.page, v.quote, v.note ?? v.reason]));
    writeFileSync(path.join(PUB, "esc-checks.csv"), h.join("\n") + "\n");
  }

  const dictionary = {
    dataset_version: DATASET_VERSION,
    note: "fill_rate is the share of records with their own rules (stand-ins excluded) that state the field.",
    records_with_own_rules: own,
    fields: Object.entries(FIELDS).map(([field, m]) => ({ field, ...m, filled: fill[field], fill_rate: own ? Math.round((fill[field]! / own) * 1000) / 1000 : 0 })),
  };
  writeFileSync(path.join(PUB, "dictionary.json"), JSON.stringify(dictionary, null, 2) + "\n");

  const dataset = {
    name: "Stormwater Atlas",
    version: DATASET_VERSION,
    generated_at: new Date().toISOString(),
    records: recs.length,
    records_with_own_rules: own,
    values: vRows.length - 1,
    hand_checked_values: hcN,
    license: "CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/) for the original structured data and the draft model manual; code is MIT. Quoted excerpts and the source manuals remain the copyright of their issuing agencies (see NOTICE).",
    license_spdx: "CC-BY-4.0",
    citation: `Stormwater Atlas (${DATASET_VERSION}). U.S. stormwater design manual database. https://www.stormwateratlas.com/data/`,
    changelog: "https://github.com/scott-jeffers/usa-stormwater/blob/main/CHANGELOG.md",
    files: ["/data/manuals.csv", "/data/values.csv", "/data/design-storms.csv", "/data/hand-checks.csv", "/data/esc-checks.csv", "/data/dictionary.json", "/data/manuals.json", "/data/schema.json"],
  };
  writeFileSync(path.join(PUB, "dataset.json"), JSON.stringify(dataset, null, 2) + "\n");

  const man = path.join(ROOT, "content/manual/model-manual.md");
  if (existsSync(man)) {
    mkdirSync(path.join(ROOT, "public/manual"), { recursive: true });
    copyFileSync(man, path.join(ROOT, "public/manual/model-manual.md"));
  }
  console.log(`research export: ${recs.length} records, ${vRows.length - 1} values, ${hcN} hand checks`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("export-research.ts")) main();
