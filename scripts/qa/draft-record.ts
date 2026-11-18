/**
 * Draft an atlas record from a manual's page text, for review — without an
 * LLM. Every value comes with a verbatim quote copied from the source.
 *
 *   npx tsx scripts/qa/draft-record.ts <slug> > /tmp/<slug>.draft.json
 *
 * Needs data/corpus/<slug>/pages.json (pipeline:corpus) and ideally
 * pages-alt.json (qa:alt-text). Prints a JSON draft with
 * document_metadata placeholders (marked "TODO") to fill in by hand.
 * Review it, then save it as data/documents/<slug>.json and run
 * qa:evidence. It finds what manuals state plainly; it does not interpret.
 */
import { SourceIndex, matchExcerpt, isNumberToken } from "../../lib/qa/evidenceMatch";
import { postingsOf, readPageSources, sentencesOf, type Sentence } from "../../lib/qa/sentences";

const slug = process.argv[2];
if (!slug) {
  console.error("usage: draft-record.ts <slug>");
  process.exit(1);
}
const sources = readPageSources(slug);
if (!sources.length) {
  console.error(`no corpus for ${slug}`);
  process.exit(1);
}
const sentences = sources.flatMap((p) => sentencesOf(p)).filter((s) => s.tokens.length <= 70);
const postings = postingsOf(sentences);
const indexes = sources.map((p) => new SourceIndex(p));
const TOC = /\.{5,}|(\. ){4,}|…{2,}/;
const verified = (s: Sentence) =>
  !TOC.test(s.text) && indexes.some((ix) => ["exact", "fuzzy"].includes(matchExcerpt(ix, s.text).status));

type Ev = { field: string; excerpt: string; page_or_section: string };
const evidence: Ev[] = [];
const cite = (field: string, s: Sentence) => {
  if (!evidence.some((e) => e.field === field && e.excerpt === s.text))
    evidence.push({ field, excerpt: s.text, page_or_section: `PDF p. ${s.page}` });
};

// --- design storms -------------------------------------------------------
const STORM = /(storm|event|frequency|return|recurrence|design|flood|peak)/i;
const stormCount = new Map<number, Sentence[]>();
for (const s of sentences) {
  if (!STORM.test(s.text) || TOC.test(s.text)) continue;
  const yrs = new Set<number>();
  for (const m of s.text.matchAll(/\b(1|2|3|5|10|25|50|100|500)(?:\s?[-–]\s?|\s)(?:year|yr)\b/gi)) yrs.add(Number(m[1]));
  for (const m of s.text.matchAll(/((?:\b\d{1,3}\s?-\s?,?\s?(?:and\s|or\s)?)+)\d{1,3}\s?-\s?(?:year|yr)/gi))
    for (const n of m[1]!.matchAll(/\d{1,3}/g)) yrs.add(Number(n[0]));
  for (const y of yrs) if ([1, 2, 3, 5, 10, 25, 50, 100, 500].includes(y)) stormCount.set(y, [...(stormCount.get(y) ?? []), s]);
}
const storms = [...stormCount.entries()].filter(([, ss]) => ss.length >= 2).map(([y]) => y).sort((a, b) => a - b);
for (const y of storms) {
  const s = stormCount.get(y)!.filter(verified).sort((a, b) => a.tokens.length - b.tokens.length)[0];
  if (s) cite("design_criteria.design_storm_return_periods_years", s);
}

// --- named methods, software, practices ----------------------------------
function named(list: Array<[string, RegExp]>, field: string, context?: RegExp): string[] {
  const out: string[] = [];
  for (const [name, re] of list) {
    const hits = sentences.filter((s) => re.test(s.text) && (!context || context.test(s.text)) && verified(s));
    if (hits.length) {
      out.push(name);
      cite(field, hits.sort((a, b) => a.tokens.length - b.tokens.length)[0]!);
    }
  }
  return out;
}
const METHOD_CTX = /use[ds]?|calculat|determin|comput|estimat|method|shall|may be|accept|approv|requir/i;
const methods = named(
  [
    ["Rational Method", /\brational (method|formula)\b/i],
    ["Modified Rational Method", /modified rational/i],
    ["NRCS (SCS) TR-55", /\bTR[- ]?55\b/i],
    ["NRCS (SCS) TR-20", /\bTR[- ]?20\b/i],
    ["NRCS (SCS) Curve Number method", /curve number/i],
    ["Unit hydrograph", /unit hydrograph/i],
    ["USGS regression equations", /regression equation/i],
    ["Continuous simulation", /continuous simulation/i],
  ],
  "design_criteria.peak_flow_calculation_method",
  METHOD_CTX
);
const software = named(
  [
    ["HEC-HMS", /HEC[- ]?HMS/i],
    ["HEC-RAS", /HEC[- ]?RAS/i],
    ["HEC-1", /HEC[- ]?1\b/i],
    ["EPA SWMM", /\bSWMM\b/i],
    ["HydroCAD", /HydroCAD/i],
    ["PondPack", /PondPack/i],
    ["ICPR", /\bICPR\b/i],
    ["HY-8", /\bHY[- ]?8\b/i],
    ["WinTR-55", /WinTR[- ]?55/i],
    ["WinTR-20", /WinTR[- ]?20/i],
    ["WinStorm", /WinStorm/i],
    ["StormCAD", /StormCAD/i],
  ],
  "design_criteria.required_hydrologic_hydraulic_software",
  /software|program|model|use|shall|accept|approv/i
);
const bmps = named(
  [
    ["Bioretention", /bioretention|rain garden/i],
    ["Permeable pavement", /permeable pav|porous pav|pervious (concrete|pav)/i],
    ["Green roof", /green roof|vegetated roof/i],
    ["Vegetated swale", /(vegetated|grass(ed)?|bio-?) ?swale/i],
    ["Filter strip", /filter strip/i],
    ["Infiltration trench", /infiltration trench/i],
    ["Infiltration basin", /infiltration basin/i],
    ["Wet pond / retention pond", /wet (pond|detention)|retention pond/i],
    ["Dry detention basin", /dry (detention|pond)|detention (basin|pond)/i],
    ["Extended detention", /extended detention/i],
    ["Constructed wetland", /(constructed|stormwater) wetland/i],
    ["Sand filter", /sand filter/i],
    ["Rainwater harvesting / cistern", /cistern|rainwater harvest/i],
    ["Underground detention", /underground (detention|storage)/i],
    ["Hydrodynamic separator", /hydrodynamic separator|oil.?(\/|and )?grit/i],
  ],
  "design_criteria.approved_bmp_categories",
  /shall|may|allow|approv|accept|include|use|design|require/i
);

// --- water-quality volume method ------------------------------------------
const wq = sentences
  .filter((s) => /water quality (volume|treatment|event|storm)|\bWQv\b|first flush|treatment volume|percentile/i.test(s.text) && /\d/.test(s.text) && /inch|in\.|"/i.test(s.text))
  .filter(verified)
  .sort((a, b) => a.tokens.length - b.tokens.length)[0];
if (wq) cite("design_criteria.water_quality_volume_method", wq);

const draft = {
  document_metadata: {
    jurisdiction_name: "TODO",
    jurisdiction_level: "municipality",
    state_code: "TODO",
    document_title: "TODO",
    version_or_edition: null,
    adoption_or_effective_date: null,
    last_revised_date: null,
    relationship_to_state_manual: "independent",
  },
  design_criteria: {
    design_storm_return_periods_years: storms,
    water_quality_volume_method: wq ? wq.text : null,
    peak_flow_calculation_method: methods,
    required_hydrologic_hydraulic_software: software,
    approved_bmp_categories: bmps,
  },
  evidence,
  extraction_quality: {
    confidence: "medium",
    needs_human_review: true,
    review_notes: `Drafted by scripts/qa/draft-record.ts from verbatim source text (${new Date().toISOString().slice(0, 10)}); values are what the manual states plainly. Numbers like WQv depth were not interpreted.`,
    fields_not_found: [
      ...(storms.length ? [] : ["design_criteria.design_storm_return_periods_years"]),
      ...(wq ? [] : ["design_criteria.water_quality_volume_method"]),
      ...(methods.length ? [] : ["design_criteria.peak_flow_calculation_method"]),
      ...(software.length ? [] : ["design_criteria.required_hydrologic_hydraulic_software"]),
      ...(bmps.length ? [] : ["design_criteria.approved_bmp_categories"]),
    ],
  },
};
void isNumberToken;
console.log(JSON.stringify(draft, null, 2));
