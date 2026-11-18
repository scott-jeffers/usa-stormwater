/**
 * QA/QC: strictly re-check every evidence excerpt against the source manual's
 * page text, and check that extracted values actually appear in their excerpts.
 *
 *   npm run qa:evidence                 # all records with a local corpus
 *   npm run qa:evidence -- ga-state     # selected slugs
 *
 * Needs data/corpus/<slug>/pages.json (gitignored; built by pipeline:corpus).
 * Also uses pages-alt.json (npm run qa:alt-text) when present.
 * Writes the committed results the website reads:
 *   data/qa/evidence.json   per-record, per-excerpt results
 *   data/qa/EVIDENCE.md     human-readable summary
 * Records without a local corpus keep their previous results.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { stormwaterSchema, type StormwaterData } from "../../lib/schema";
import {
  SourceIndex,
  matchExcerpt,
  valueAppearsIn,
  type SourcePage,
} from "../../lib/qa/evidenceMatch";
import {
  QA_DIR,
  QA_EVIDENCE_PATH,
  evidenceQaFileSchema,
  type EvidenceQaFile,
  type EvidenceQaRecord,
  type QaWarning,
} from "../../lib/qa/types";

const DOCS = path.resolve(process.cwd(), "data/documents");
const CORPUS = path.resolve(process.cwd(), "data/corpus");

function readPagesFile(p: string): SourcePage[] | null {
  if (!existsSync(p)) return null;
  const raw = JSON.parse(readFileSync(p, "utf-8")) as {
    pages: Array<{ page: string | number; text: string }>;
  };
  return raw.pages.map((pg, i) => ({
    page: Number.isFinite(Number(pg.page)) ? Number(pg.page) : i + 1,
    text: pg.text ?? "",
  }));
}

/**
 * Page text from every available extractor: the pipeline's pages.json and,
 * when built (npm run qa:alt-text), pdftotext's pages-alt.json.
 */
function loadPageSources(slug: string): SourcePage[][] {
  return ["pages.json", "pages-alt.json"]
    .map((f) => readPagesFile(path.join(CORPUS, slug, f)))
    .filter((p): p is SourcePage[] => p != null && p.length > 0);
}

const NUMERIC_PARAM_SKIP = new Set(["enrich_schema_version"]);

function valueWarnings(doc: StormwaterData): QaWarning[] {
  const out: QaWarning[] = [];
  const byField = new Map<string, string[]>();
  for (const e of doc.evidence) {
    const list = byField.get(e.field) ?? [];
    list.push(e.excerpt);
    byField.set(e.field, list);
  }
  const excerptsFor = (field: string) =>
    [...byField.entries()]
      .filter(([f]) => f === field || f.startsWith(`${field}.`) || f.startsWith(`${field}[`))
      .flatMap(([, ex]) => ex);

  // design_criteria: populated → needs evidence
  const dc = doc.design_criteria;
  const populated: Array<[string, boolean]> = [
    ["design_criteria.design_storm_return_periods_years", dc.design_storm_return_periods_years.length > 0],
    ["design_criteria.water_quality_volume_method", !!dc.water_quality_volume_method],
    ["design_criteria.peak_flow_calculation_method", dc.peak_flow_calculation_method.length > 0],
    ["design_criteria.required_hydrologic_hydraulic_software", dc.required_hydrologic_hydraulic_software.length > 0],
    ["design_criteria.approved_bmp_categories", dc.approved_bmp_categories.length > 0],
  ];
  for (const [field, has] of populated) {
    if (has && excerptsFor(field).length === 0) {
      out.push({ field, kind: "no_evidence", detail: "Value shown but no supporting excerpt" });
    }
  }

  // return periods: each year should be mentioned in the field's excerpts
  const storms = dc.design_storm_return_periods_years;
  const stormEx = excerptsFor("design_criteria.design_storm_return_periods_years");
  if (storms.length && stormEx.length) {
    const missing = storms.filter((y) => !valueAppearsIn(y, "years", stormEx));
    if (missing.length) {
      out.push({
        field: "design_criteria.design_storm_return_periods_years",
        kind: "value_not_in_excerpt",
        detail: `Not mentioned in excerpts: ${missing.join(", ")}-yr`,
      });
    }
  }

  // numeric design parameters: value must be stated in its excerpt
  const dp = doc.design_parameters as Record<string, unknown> | undefined;
  if (dp) {
    for (const [k, v] of Object.entries(dp)) {
      if (typeof v !== "number" || NUMERIC_PARAM_SKIP.has(k)) continue;
      const field = `design_parameters.${k}`;
      const ex = excerptsFor(field);
      if (ex.length === 0) {
        out.push({ field, kind: "no_evidence", detail: `${v} has no supporting excerpt` });
      } else if (!valueAppearsIn(v, k, ex)) {
        out.push({
          field,
          kind: "value_not_in_excerpt",
          detail: `${v} is not stated in its excerpt (derived or misread?)`,
        });
      }
    }
  }
  return out;
}

const RANK = { exact: 0, fuzzy: 1, unverifiable: 2, fail: 3 } as const;

function checkRecord(slug: string, doc: StormwaterData, sources: SourcePage[][]): EvidenceQaRecord {
  const indexes = sources.map((p) => new SourceIndex(p));
  const excerpts = doc.evidence.map((e) => {
    // Best result across extractors: a quote counts as found if any
    // independent reading of the PDF contains it.
    const r = indexes
      .map((ix) => matchExcerpt(ix, e.excerpt))
      .reduce((a, b) => (RANK[b.status] < RANK[a.status] || (RANK[b.status] === RANK[a.status] && b.score > a.score) ? b : a));
    return {
      field: e.field,
      status: r.status,
      score: Math.round(r.score * 100) / 100,
      page: r.page,
      missing_numbers: [...new Set(r.segments.flatMap((s) => s.missingNumbers))],
      ...(r.segments.some((s) => s.contradictingNumbers?.length)
        ? { source_numbers: [...new Set(r.segments.flatMap((s) => s.contradictingNumbers ?? []))] }
        : {}),
    };
  });
  const counts = { exact: 0, fuzzy: 0, unverifiable: 0, fail: 0 };
  for (const x of excerpts) counts[x.status] += 1;
  const warnings = valueWarnings(doc);
  return {
    slug,
    checked_at: new Date().toISOString(),
    corpus_pages: sources[0]!.length,
    text_sources: sources.length,
    counts,
    excerpts,
    warnings,
    // unverifiable excerpts can't be proven from the text layer → warnings
    status:
      counts.fail > 0
        ? "failed"
        : warnings.length > 0 || counts.unverifiable > 0
          ? "warnings"
          : "passed",
  };
}

function loadExisting(): EvidenceQaFile | null {
  if (!existsSync(QA_EVIDENCE_PATH)) return null;
  const parsed = evidenceQaFileSchema.safeParse(JSON.parse(readFileSync(QA_EVIDENCE_PATH, "utf-8")));
  return parsed.success ? parsed.data : null;
}

function markdown(file: EvidenceQaFile): string {
  const recs = Object.values(file.records);
  const tot = { exact: 0, fuzzy: 0, unverifiable: 0, fail: 0 };
  const st = { passed: 0, warnings: 0, failed: 0 };
  const kinds = new Map<string, number>();
  for (const r of recs) {
    tot.exact += r.counts.exact;
    tot.fuzzy += r.counts.fuzzy;
    tot.fail += r.counts.fail;
    tot.unverifiable += r.counts.unverifiable;
    st[r.status] += 1;
    for (const w of r.warnings) kinds.set(w.kind, (kinds.get(w.kind) ?? 0) + 1);
  }
  const worst = [...recs]
    .sort((a, b) => b.counts.fail - a.counts.fail || b.warnings.length - a.warnings.length)
    .filter((r) => r.status !== "passed")
    .slice(0, 60);
  const all = tot.exact + tot.fuzzy + tot.unverifiable + tot.fail;
  const pct = (n: number) => (all ? `${((100 * n) / all).toFixed(1)}%` : "–");
  return `# Evidence QA report

Generated: ${file.generated_at} by \`npm run qa:evidence\`

Strict check: each excerpt must appear in the source manual (exact, or a close
in-order match with **every number identical**), and each extracted number must
be stated in its own excerpt.

## Records (${recs.length})

| Status | Count |
|--------|------:|
| Passed | ${st.passed} |
| Warnings only | ${st.warnings} |
| Failed (excerpt not in source) | ${st.failed} |

## Excerpts (${all})

| Result | Count | Share |
|--------|------:|------:|
| Exact | ${tot.exact} | ${pct(tot.exact)} |
| Close match, numbers identical | ${tot.fuzzy} | ${pct(tot.fuzzy)} |
| Can't check: PDF text lost the numbers | ${tot.unverifiable} | ${pct(tot.unverifiable)} |
| Not found in source / different number | ${tot.fail} | ${pct(tot.fail)} |

## Warnings

| Kind | Count |
|------|------:|
${[...kinds.entries()].map(([k, n]) => `| ${k} | ${n} |`).join("\n") || "| _none_ | 0 |"}

## Records needing attention (worst first, top ${worst.length})

| Record | Not found | Warnings | Fields |
|--------|----------:|---------:|--------|
${worst
  .map((r) => {
    const fields = [
      ...r.excerpts.filter((x) => x.status === "fail").map((x) => x.field),
      ...r.warnings.map((w) => w.field),
    ];
    return `| \`${r.slug}\` | ${r.counts.fail} | ${r.warnings.length} | ${[...new Set(fields)].slice(0, 4).join(", ")} |`;
  })
  .join("\n")}
`;
}

function main() {
  const only = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const existing = loadExisting();
  const records: Record<string, EvidenceQaRecord> = { ...(existing?.records ?? {}) };
  const slugs = readdirSync(DOCS)
    .filter((f) => f.endsWith(".json"))
    .map((f) => f.slice(0, -5))
    .filter((s) => only.length === 0 || only.includes(s));

  // drop results for documents that no longer exist
  const docSet = new Set(readdirSync(DOCS).map((f) => f.replace(/\.json$/, "")));
  for (const s of Object.keys(records)) if (!docSet.has(s)) delete records[s];

  let checked = 0;
  let noCorpus = 0;
  for (const slug of slugs) {
    const doc = stormwaterSchema.parse(JSON.parse(readFileSync(path.join(DOCS, `${slug}.json`), "utf-8")));
    const sources = loadPageSources(slug);
    if (sources.length === 0) {
      noCorpus += 1;
      continue;
    }
    const rec = checkRecord(slug, doc, sources);
    records[slug] = rec;
    checked += 1;
    if (rec.status !== "passed") {
      console.log(`${rec.status.padEnd(8)} ${slug}  fail=${rec.counts.fail} unverifiable=${rec.counts.unverifiable} warnings=${rec.warnings.length}`);
    }
  }

  const file: EvidenceQaFile = evidenceQaFileSchema.parse({
    version: 1,
    generated_at: new Date().toISOString(),
    records: Object.fromEntries(Object.entries(records).sort(([a], [b]) => a.localeCompare(b))),
  });
  mkdirSync(QA_DIR, { recursive: true });
  writeFileSync(QA_EVIDENCE_PATH, JSON.stringify(file, null, 1) + "\n");
  writeFileSync(path.join(QA_DIR, "EVIDENCE.md"), markdown(file));
  console.log(`\nChecked ${checked} record(s); ${noCorpus} without local corpus kept previous results.`);
  console.log(`Wrote ${path.relative(process.cwd(), QA_EVIDENCE_PATH)} and data/qa/EVIDENCE.md`);
}

main();
