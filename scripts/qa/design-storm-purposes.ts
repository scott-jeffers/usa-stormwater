/**
 * Record what each design storm is used for.
 *
 * For every record's design_criteria.design_storm_return_periods_years, find the
 * requirement sentences (shall / must / criteria ..., not tables) in the
 * manual's own page text that name a storm. Each purpose word in a sentence is
 * credited to the storm mentioned nearest to it. A storm keeps its most frequent
 * purpose (channel protection and water quality count double, being more
 * specific) plus any with at least a third as many; the quote is the
 * shortest sentence for its main purpose. No purpose sentence -> ["other"].
 * purposes[0] is the main purpose.
 *
 * Writes design_parameters.design_storms and data/qa/design-storms.json (summary).
 *
 *   npx tsx scripts/qa/design-storm-purposes.ts [--check]
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { readPageSources, sentencesOf } from "../../lib/qa/sentences";
import type { StormPurpose } from "../../lib/schema";

const ROOT = process.cwd();
const DOCS = path.join(ROOT, "data/documents");

export const PURPOSE_WORDS: Record<Exclude<StormPurpose, "other">, RegExp> = {
  water_quality: /\b(water[- ]quality (volume|storm|event|design storm)|wqv|wqcv|first flush|treatment volume)\b/i,
  channel_protection: /\b(channel[- ]protection|stream ?bank|channel erosion|extended detention|cpv|bankfull|bank[- ]full|erosive)\b/i,
  peak_control: /\b(peak (discharge|flow|rate|runoff)s?|release rate|pre-?development|post-?development|pre-?developed|post-?developed|existing conditions?|detention (basin|pond|facilit|requirement)|discharge rates?|attenuat)/i,
  conveyance: /\b(intakes?|convey\b|conveys|culverts?|storm (sewer|drain)s?|inlets?|gutters?|pipe systems?|pipes|conveyance|ditch(es)?|street flow|spread|minor (system|drainage|storm)|swale capacity|open channels?|bridge)\b/i,
  flood: /\b(flood(ing|plain|way)?|freeboard|emergency spillway|overflow|finished floor|safely (pass|convey)|major (system|storm|drainage)|overtopp|inundat|ponding limits?|building)\b/i,
};

const STORM = /(?<![\d.])(\d+(?:\.\d+)?)[- ]?(?:year|yr)\b(?![- ]?(?:cycle|period|record|old|life|span|average|plan|maintenance|warranty))/gi;
const REQUIREMENT = /\b(shall|must|should|required?|requirements?|criteri(a|on)|standards?|designed? (for|to)|sized? (for|to)|provide)\b/i;

/**
 * Purposes in a sentence, each credited to the storm mentioned closest to its
 * purpose word, so "extended detention of the 1-year storm and peak control of
 * the 25-year storm" gives 1 -> channel_protection and 25 -> peak_control.
 */
export function purposesBySentence(sentence: string): Map<number, Set<StormPurpose>> {
  const storms = [...sentence.matchAll(STORM)].map((m) => ({ years: Number(m[1]), at: m.index! }));
  const out = new Map<number, Set<StormPurpose>>();
  if (!storms.length) return out;
  for (const [purpose, re] of Object.entries(PURPOSE_WORDS) as Array<[StormPurpose, RegExp]>) {
    const g = new RegExp(re.source, "gi");
    for (const m of sentence.matchAll(g)) {
      const near = storms.reduce((a, b) => (Math.abs(b.at - m.index!) < Math.abs(a.at - m.index!) ? b : a));
      if (!out.has(near.years)) out.set(near.years, new Set());
      out.get(near.years)!.add(purpose);
    }
  }
  return out;
}

const isTable = (t: string) => (t.match(/\d+(\.\d+)?/g)?.length ?? 0) > 10;

type Storm = { years: number; purposes: StormPurpose[]; quote: string | null; page: number | null };

function main() {
  const check = process.argv.includes("--check");
  const summary: Record<string, Record<string, number>> = {};
  const records: Array<{ slug: string; level: string; state: string | null; storms: Storm[] }> = [];
  let changed = 0;
  for (const f of readdirSync(DOCS).filter((x) => x.endsWith(".json")).sort()) {
    const slug = f.slice(0, -5);
    const file = path.join(DOCS, f);
    const before = readFileSync(file, "utf-8");
    const doc = JSON.parse(before);
    const years: number[] = doc.design_criteria?.design_storm_return_periods_years ?? [];
    if (!years.length || !doc.design_parameters) continue;
    const pages = readPageSources(slug)[0];
    if (!pages) continue;
    const sents = sentencesOf(pages).filter((x) => REQUIREMENT.test(x.text) && !isTable(x.text));
    const tally = new Map<number, Map<StormPurpose, { n: number; best: { text: string; page: number } }>>();
    for (const x of sents) {
      for (const [y, ps] of purposesBySentence(x.text)) {
        if (!tally.has(y)) tally.set(y, new Map());
        for (const p of ps) {
          const t = tally.get(y)!.get(p);
          if (!t) tally.get(y)!.set(p, { n: 1, best: { text: x.text, page: x.page } });
          else {
            t.n++;
            if (x.text.length < t.best.text.length && x.text.length > 40) t.best = { text: x.text, page: x.page };
          }
        }
      }
    }
    const storms: Storm[] = [];
    for (const y of [...new Set(years)].sort((a, b) => a - b)) {
      const t = tally.get(y);
      // specific purposes (channel protection, water quality) outrank the generic ones
      const w = (p: StormPurpose, n: number) => (p === "channel_protection" || p === "water_quality" ? 2 * n : n);
      const ranked = t ? [...t.entries()].sort((a, b) => w(b[0], b[1].n) - w(a[0], a[1].n)) : [];
      // keep purposes with at least a third of the top count (and the top one)
      const kept = ranked.filter(([p, v], i) => i === 0 || w(p, v.n) >= Math.max(2, w(ranked[0]![0], ranked[0]![1].n) / 3));
      const purposes: StormPurpose[] = kept.length ? kept.map(([p]) => p) : ["other"];
      storms.push({ years: y, purposes, quote: kept[0]?.[1].best.text.slice(0, 300) ?? null, page: kept[0]?.[1].best.page ?? null });
      for (const p of purposes) {
        summary[String(y)] ??= {};
        summary[String(y)]![p] = (summary[String(y)]![p] ?? 0) + 1;
      }
    }
    doc.design_parameters.design_storms = storms;
    records.push({ slug, level: doc.document_metadata?.jurisdiction_level, state: doc.document_metadata?.state_code ?? null, storms });
    const after = JSON.stringify(doc, null, 2) + "\n";
    if (after !== before) {
      changed++;
      if (!check) writeFileSync(file, after);
    }
  }
  if (!check)
    writeFileSync(
      path.join(ROOT, "data/qa/design-storms.json"),
      JSON.stringify(
        {
          generated_at: new Date().toISOString().slice(0, 10),
          method:
            "Each named design storm was matched to the sentences in the manual's own text that mention it, and those sentences were classified by purpose words (water quality, channel protection, peak control, conveyance, flood). A storm can have several purposes. Automated. Spot check of 30 storms: 21 got a purpose, 16 of those right, 2 partly, 3 wrong; 9 had no purpose sentence (other).",
          by_storm: summary,
          records,
        },
        null,
        1
      ) + "\n"
    );
  console.log(`${check ? "would change" : "changed"} ${changed} document(s); ${records.length} records with storms`);
  if (check && changed) process.exit(1);
}

if (existsSync(DOCS) && process.argv[1]?.replace(/\\/g, "/").endsWith("design-storm-purposes.ts")) main();
