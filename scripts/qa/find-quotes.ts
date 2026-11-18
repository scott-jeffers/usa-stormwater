/**
 * Find verbatim supporting quotes for values that have none (or whose quote
 * doesn't state the value), using data/qa/evidence.json warnings.
 *
 *   npm run qa:find-quotes -- --dry-run
 *   npm run qa:find-quotes
 *   npm run qa:find-quotes -- ga-state
 *
 * Only ever adds sentences copied from the manual's page text, and only when
 * the sentence clearly states the value:
 * - numbers (design_parameters): the value (or a unit-equivalent spelling)
 *   next to a matching unit, plus words that identify the parameter
 *   ("water table" for SHWT separation, "drain"/"drawdown" for drawdown…);
 * - design storms: sentences naming each "N-year" storm in a storm context;
 * - methods, software and BMP categories: sentences that name them;
 * - water-quality method: the sentence that best matches the summary and
 *   contains all its numbers.
 * Every added quote must pass the strict check. Values are never changed.
 * Writes data/qa/FIND-QUOTES.md. Run qa:evidence afterwards.
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  SourceIndex,
  isNumberToken,
  matchExcerpt,
  numbersIn,
  tokenize,
  valueSpellings,
} from "../../lib/qa/evidenceMatch";
import { QA_EVIDENCE_PATH, evidenceQaFileSchema } from "../../lib/qa/types";
import { lcs, postingsOf, readPageSources, sentencesOf, type Sentence } from "../../lib/qa/sentences";

const DOCS = path.resolve(process.cwd(), "data/documents");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.filter((a) => !a.startsWith("-"));
const MAX_TOKENS = 70;

/** Words that identify each numeric parameter, and the unit it must sit next to. */
const PARAM_CUES: Record<string, { words: RegExp }> = {
  wqv_depth_inches: { words: /water quality|wqv|first flush|treat(ment)?|capture|rainfall depth|percentile/i },
  max_drawdown_hours: { words: /drain|drawdown|draw down|dewater|empt(y|ied)|recover/i },
  shwt_separation_inches: { words: /water table|groundwater|ground water|seasonal(ly)?[ -]high|shwt|shgwt|bedrock/i },
  bioretention_media_depth_min_inches: { words: /(media|soil mix|planting soil|filter bed|soil media)[^.]{0,40}(depth|deep|thick)|(depth|deep|thick)[^.]{0,30}(media|planting soil|soil mix|filter bed)/i },
  bioretention_ponding_depth_inches: { words: /ponding depth|depth of ponding|ponded depth|ponding[^.]{0,25}(depth|not exceed|maximum|max)/i },
  permeable_pavement_storage_depth_inches: { words: /(reservoir|stone|aggregate|storage|base)( layer| course| bed)?[^.]{0,30}(depth|thick)|(depth|thick)[^.]{0,30}(reservoir|stone|aggregate)/i },
  design_infiltration_rate_in_per_hr: { words: /infiltrat|permeab|percolat/i },
  permanent_pool_depth_inches: { words: /permanent pool[^.]{0,40}(depth|deep)|(depth|deep)[^.]{0,30}permanent pool/i },
  ed_drain_time_hours: { words: /extended detention|drawdown|draw down|drain/i },
  length_to_width_ratio: { words: /length[^.]{0,30}width|flow ?path|length[- ]to[- ]width/i },
  wetland_detention_hours: { words: /wetland[^.]{0,60}(detention|residence|drain)/i },
  swale_bottom_width_inches: { words: /bottom width/i },
  swale_longitudinal_slope_percent: { words: /longitudinal slope|swale[^.]{0,40}slope|slope[^.]{0,40}swale/i },
  green_roof_media_depth_inches: { words: /(green roof|vegetated roof|eco-?roof|growing (media|medium))[^.]{0,60}(depth|deep|thick|inch)|(depth|thick)[^.]{0,40}(growing|green roof)/i },
  green_roof_slope_percent: { words: /roof[^.]{0,40}slope|slope[^.]{0,40}roof/i },
};

/** Rows of a table: more than a third of the tokens are numbers. */
function tableLike(s: Sentence): boolean {
  return s.tokens.filter(isNumberToken).length / Math.max(1, s.tokens.length) > 0.33;
}

const STORM_CONTEXT = /storm|event|frequency|return|recurrence|design|flood|peak|rainfall|precipitation/i;

interface Found {
  field: string;
  text: string;
  page: number;
}

function getValue(doc: Record<string, any>, field: string): unknown {
  return field.split(".").reduce((o: any, k) => (o == null ? o : o[k]), doc);
}

function short(s: Sentence) {
  return s.tokens.length <= MAX_TOKENS;
}

/** (number, unit) pairs that state `value` for a parameter: 24 in ↔ 2 ft, 72 h ↔ 3 days … */
function unitSpellings(param: string, value: number): Array<{ n: string; unit: RegExp }> {
  const c = (x: number) => String(Math.round(x * 1000) / 1000);
  const IN = /(inch(es)?|in\.|in\b|"|”)/i;
  const FT = /(feet|foot|ft\.?|'|’)/i;
  if (param.endsWith("_inches")) return [{ n: c(value), unit: IN }, { n: c(value / 12), unit: FT }];
  if (param.endsWith("_hours")) return [{ n: c(value), unit: /(hours?|hrs?\.?)/i }, { n: c(value / 24), unit: /days?/i }];
  if (param.endsWith("_in_per_hr"))
    return [{ n: c(value), unit: /(in\/hr|in\.\/hr|inch(es)? per hour|iph|in\/h\b)/i }, { n: c(value * 24), unit: /(in\/day|inch(es)? per day)/i }];
  if (param.endsWith("_percent")) return [{ n: c(value), unit: /(%|percent)/i }];
  if (param === "length_to_width_ratio") return [{ n: c(value), unit: /(:\s?1|to 1\b)/i }];
  return [];
}

const TOC = /\.{5,}|(\. ){4,}|…{2,}/;

function findNumeric(sentences: Sentence[], postings: Map<string, number[]>, param: string, value: number): Sentence | null {
  const cue = PARAM_CUES[param];
  if (!cue) return null;
  const pairs = unitSpellings(param, value);
  const ids = new Set(pairs.flatMap((p) => postings.get(p.n) ?? []));
  let best: { s: Sentence; score: number } | null = null;
  for (const id of ids) {
    const s = sentences[id]!;
    if (!short(s) || TOC.test(s.text) || tableLike(s) || /diameter/i.test(s.text)) continue;
    let ok = false;
    for (const p of pairs) {
      const esc = p.n.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
      const re = new RegExp(`(^|[^\\d.,/])${esc}\\s?(?:-|–)?\\s?${p.unit.source}`, "gi");
      for (const m of s.text.matchAll(re)) {
        // the parameter's own words must be close to the number
        const around = s.text.slice(Math.max(0, m.index! - 70), m.index! + m[0].length + 70);
        if (cue.words.test(around)) ok = true;
      }
    }
    if (!ok) continue;
    const score = -s.tokens.length;
    if (!best || score > best.score) best = { s, score };
  }
  return best?.s ?? null;
}

function stormMentions(text: string): Set<number> {
  const out = new Set<number>();
  for (const m of text.matchAll(/(\d{1,3})(?:\s?[-–]\s?|\s)(?:year|yr)\b/gi)) out.add(Number(m[1]));
  // "2-, 10-, and 100-year"
  for (const m of text.matchAll(/((?:\d{1,3}\s?-\s?,?\s?(?:and\s|or\s)?)+)\d{1,3}\s?-\s?(?:year|yr)/gi)) {
    for (const n of m[1]!.matchAll(/\d{1,3}/g)) out.add(Number(n[0]));
  }
  return out;
}

function findStorms(sentences: Sentence[], years: number[], already: string[]): Sentence[] {
  const covered = new Set(already.flatMap((e) => [...stormMentions(e)]));
  let need = years.filter((y) => !covered.has(y));
  const picked: Sentence[] = [];
  const cands = sentences.filter((s) => short(s) && !TOC.test(s.text) && STORM_CONTEXT.test(s.text));
  while (need.length && picked.length < 3) {
    let best: { s: Sentence; hits: number } | null = null;
    for (const s of cands) {
      const m = stormMentions(s.text);
      const hits = need.filter((y) => m.has(y)).length;
      if (hits && (!best || hits > best.hits || (hits === best.hits && s.tokens.length < best.s.tokens.length)))
        best = { s, hits };
    }
    if (!best) break;
    picked.push(best.s);
    const m = stormMentions(best.s.text);
    need = need.filter((y) => !m.has(y));
  }
  return picked;
}

/** Phrase variants for a method/software/BMP name ("NRCS TR-55" → "tr 55"). */
function nameTokens(name: string): string[] {
  return tokenize(name.replace(/\(.*?\)/g, " ")).filter((t) => !/^(the|and|of|for|method|methods|model|program|system|systems|practice|practices|bmps?)$/.test(t));
}

function containsSeq(hay: string[], needle: string[]): boolean {
  if (!needle.length || needle.length > hay.length) return false;
  outer: for (let i = 0; i + needle.length <= hay.length; i++) {
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) continue outer;
    return true;
  }
  return false;
}

const SPECIFIC = /\d|[A-Z]{2,}|rational|curve number|unit hydrograph|regression|hydrograph|continuous simulation|santa barbara|muskingum|kinematic|bioretention|wetland|swale|filter strip|permeable|porous|pond|infiltration|green roof|cistern|rain garden|sand filter|dry well|vault|hydrodynamic/i;

/** One name is enough only when it is specific (TR-55, HEC-HMS, bioretention…). */
function enoughHits(hits: Array<{ n: string }>): boolean {
  return hits.length >= 2 || (hits.length === 1 && SPECIFIC.test(hits[0]!.n) && nameTokens(hits[0]!.n).length >= 1);
}

const METHOD_CONTEXT = /use[ds]?|calculat|determin|comput|estimat|method|model|software|program|accept|approv|requir|shall|may be|procedure/i;

function findNames(
  sentences: Sentence[],
  postings: Map<string, number[]>,
  names: string[],
  opts: { minHits?: number; context?: RegExp } = {},
  maxPick = 3
): Sentence[] {
  const want = names.map((n) => ({ n, t: nameTokens(n) })).filter((x) => x.t.length > 0);
  let need = want;
  const picked: Sentence[] = [];
  while (need.length && picked.length < maxPick) {
    const ids = new Set(need.flatMap((x) => postings.get([...x.t].sort((a, b) => (postings.get(a)?.length ?? 1e9) - (postings.get(b)?.length ?? 1e9))[0]!) ?? []));
    let best: { s: Sentence; hits: number } | null = null;
    for (const id of ids) {
      const s = sentences[id]!;
      if (!short(s) || TOC.test(s.text)) continue;
      if (opts.context && !opts.context.test(s.text)) continue;
      const hitList = need.filter((x) => containsSeq(s.tokens, x.t));
      if (opts.minHits ? hitList.length < Math.min(opts.minHits, need.length) : !enoughHits(hitList)) continue;
      const hits = hitList.length;
      if (!best || hits > best.hits || (hits === best.hits && s.tokens.length < best.s.tokens.length))
        best = { s, hits };
    }
    if (!best) break;
    picked.push(best.s);
    need = need.filter((x) => !containsSeq(best!.s.tokens, x.t));
  }
  return picked;
}

function findWqMethod(sentences: Sentence[], summary: string): Sentence | null {
  const want = tokenize(summary);
  const nums = numbersIn(summary);
  let best: { s: Sentence; score: number } | null = null;
  for (const s of sentences) {
    if (!short(s) || TOC.test(s.text) || !/water quality|wqv|treat|first flush|capture volume|runoff reduction|percentile/i.test(s.text)) continue;
    const have = new Set(s.tokens.filter(isNumberToken));
    if (nums.length && !nums.some((n) => have.has(n))) continue;
    const score = lcs(want, s.tokens) / Math.max(12, Math.min(want.length, 40));
    if (!best || score > best.score) best = { s, score };
  }
  return best && best.score >= 0.45 ? best.s : null;
}

function main() {
  const qa = evidenceQaFileSchema.parse(JSON.parse(readFileSync(QA_EVIDENCE_PATH, "utf-8")));
  const found: Array<Found & { slug: string }> = [];
  const missed: Array<{ slug: string; field: string }> = [];

  for (const [slug, rec] of Object.entries(qa.records)) {
    if (only.length && !only.includes(slug)) continue;
    const todo = rec.warnings.filter((w) => w.field.startsWith("design_"));
    if (!todo.length) continue;
    const sources = readPageSources(slug);
    if (!sources.length) continue;
    // prefer the pipeline's reading; fall back to pdftotext's
    const sentences = sources.flatMap((p) => sentencesOf(p));
    const postings = postingsOf(sentences);
    const indexes = sources.map((p) => new SourceIndex(p));
    const docPath = path.join(DOCS, `${slug}.json`);
    const doc = JSON.parse(readFileSync(docPath, "utf-8"));
    const add: Found[] = [];

    for (const w of todo) {
      const value = getValue(doc, w.field);
      const key = w.field.split(".").pop()!;
      let picks: Sentence[] = [];
      if (w.field.startsWith("design_parameters.") && typeof value === "number") {
        const s = findNumeric(sentences, postings, key, value);
        if (s) picks = [s];
      } else if (key === "design_storm_return_periods_years" && Array.isArray(value)) {
        const already = doc.evidence.filter((e: any) => e.field === w.field).map((e: any) => e.excerpt);
        picks = findStorms(sentences, value as number[], already);
      } else if (key === "water_quality_volume_method" && typeof value === "string") {
        const s = findWqMethod(sentences, value);
        if (s) picks = [s];
      } else if (key === "approved_bmp_categories" && Array.isArray(value) && value.length) {
        // a list of practices: a sentence must name at least two of them
        picks = findNames(sentences, postings, value as string[], { minHits: 2 });
      } else if (Array.isArray(value) && value.length) {
        picks = findNames(sentences, postings, value as string[], { context: METHOD_CONTEXT });
      }
      const ok = picks.filter((s) =>
        indexes.some((ix) => ["exact", "fuzzy"].includes(matchExcerpt(ix, s.text).status))
      );
      if (ok.length) for (const s of ok) add.push({ field: w.field, text: s.text, page: s.page });
      else missed.push({ slug, field: w.field });
    }

    const fresh = add.filter(
      (a, i) =>
        add.findIndex((b) => b.field === a.field && b.text === a.text) === i &&
        !doc.evidence.some((e: any) => e.field === a.field && e.excerpt === a.text)
    );
    for (const a of fresh) found.push({ slug, ...a });
    if (!dryRun && fresh.length) {
      doc.evidence.push(...fresh.map((a) => ({ field: a.field, excerpt: a.text, page_or_section: `PDF p. ${a.page} · found by QA search` })));
      writeFileSync(docPath, JSON.stringify(doc, null, 2) + "\n");
    }
  }

  const md = `# Quote finder log

Generated ${new Date().toISOString()} by \`npm run qa:find-quotes\`${dryRun ? " (dry run — nothing written)" : ""}.

Verbatim sentences added as supporting quotes for values that had none, or
whose quote didn't state the value. ${found.length} added; ${missed.length}
field(s) still have no quote that clearly states the value.

## Added

${found.map((f) => `- \`${f.slug}\` ${f.field} (PDF p. ${f.page}): ${f.text}`).join("\n")}

## Still without a supporting quote

${missed.map((m) => `- \`${m.slug}\` ${m.field}`).join("\n")}
`;
  writeFileSync(path.resolve(process.cwd(), `data/qa/FIND-QUOTES${dryRun ? "-dry-run" : ""}.md`), md);
  console.log(`added=${found.length} missed=${missed.length}${dryRun ? " (dry run)" : ""}`);
}

main();
