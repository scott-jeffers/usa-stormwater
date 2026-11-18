/**
 * Design archive: an index of the standard drawings and the worked design
 * examples inside every atlas manual, by practice, with a link to the page.
 *
 *   npx tsx scripts/archive/build-archive.ts
 *
 * Reads the local page text (data/corpus/<slug>/pages.json) and writes
 *   data/archive/drawings.json   detail drawings: typical sections, plans, profiles, details
 *   data/archive/examples.json   worked design examples, sample plans and plan checklists
 * The drawings themselves stay with their agencies: entries link to the source PDF page.
 * Detection is automated from page text; data/archive/README.md records the spot checks.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { ESC_PRACTICES, type Practice } from "./practices";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "data/archive");

const ontology = JSON.parse(readFileSync(path.join(ROOT, "data/ontology/bmp-aliases.json"), "utf-8")).practices as Record<string, Practice>;

const PRACTICES: Record<string, Practice> = { ...ontology, ...ESC_PRACTICES };
const ALIAS_RE = Object.entries(PRACTICES).map(([k, p]) => ({
  key: k,
  re: new RegExp(`\\b(${p.aliases.map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})\\b`, "gi"),
}));

const NTS = /NOT TO SCALE|\bN\.\s?T\.\s?S\.?(?=\s|$|\))|\bNTS\b/;
const LABELS = /\b(TYPICAL (CROSS[- ])?SECTION|CROSS[- ]SECTION|PLAN VIEW|PROFILE VIEW|PROFILE|SECTION [A-Z]\s?-\s?[A-Z]'?|SECTION VIEW|ELEVATION VIEW|ISOMETRIC|STANDARD DETAIL|STANDARD DRAWING|CONSTRUCTION DETAIL|TYPICAL DETAIL|DETAIL [A-Z0-9]{1,3}\b|SCHEMATIC)\b/g;
const CAPTION = /\b(Figure|FIGURE|Fig\.|Exhibit|Detail|DETAIL|Plate|Drawing|Standard Drawing)\s+([A-Z]?[-\d.]+[A-Za-z]?)\s*[:.–—-]?\s+([^.\n]{6,110})/;
const DIMS = /\d+(\.\d+)?\s?("|”|''|'|IN\.?\b|FT\.?\b|in\.\s|ft\.\s)|\bMIN\.|\bMAX\.|\bMINIMUM\b|\bMAXIMUM\b/g;
const SKIP = /TABLE OF CONTENTS|LIST OF FIGURES|SATISFACTORY|Inspector:|Inspection Checklist|INDEX OF/;

const EXAMPLE = /\b(Design Example|DESIGN EXAMPLE|Example Problem|EXAMPLE PROBLEM|Example Calculation|Sample Calculation|SAMPLE CALCULATION|Sample Problem|Worked Example|Design Procedure Example|Sizing Example|Example\s+\d+(\.\d+)*|EXAMPLE\s+\d+(\.\d+)*)\b/;
const CALC = /=/g;
const STEP = /\bStep\s+\d+\b/gi;
const SAMPLE_PLAN = /\b(sample (stormwater management |site |grading |erosion (and|&) sediment control |e&s |swppp )?plans?( notes| sheets?)?|example (stormwater management |erosion (and|&) sediment control )plans?|sample plan sheets?)\b/i;
const CHECKLIST = /\b(plan review checklist|submittal checklist|design checklist|plan checklist|review checklist|plat review checklist|plan(s)? checklist)\b/i;
const TOC = /TABLE OF CONTENTS|LIST OF (FIGURES|TABLES)|\.{6,}/;

/** Topic for entries with no practice: what the example or drawing is about. */
export const TOPICS: Array<[string, RegExp]> = [
  ["culverts", /\bculverts?\b/i],
  ["open channels", /\bopen channels?|channel (lining|design)|riprap|turf reinforcement|shear stress|wetted perimeter|manning\b/i],
  ["storm drains and inlets", /\bstorm (drain|sewer)s?|\binlets?\b|gutter flow|spread\b/i],
  ["detention and routing", /\bdetention|routing|stage[- ]storage|hydrograph\b/i],
  ["water quality volume", /\bwater quality (volume|treatment)|\bWQ[vV]\b|runoff reduction\b/i],
  ["hydrology", /\bpeak (flow|discharge)|time of concentration|curve number|\bCN\b|NRCS|runoff depth|runoff coefficient|rational method|TR-55\b/i],
  ["erosion and sediment control", /\berosion|sediment control|stabilization\b/i],
];
export function topicOf(text: string): string | null {
  const hit = TOPICS.map(([t, re]) => ({ t, n: (text.match(new RegExp(re.source, "gi")) ?? []).length })).sort((a, b) => b.n - a.n)[0];
  return hit && hit.n > 0 ? hit.t : null;
}

export { ESC_PRACTICES };

export type DrawingEntry = { id: string; slug: string; page: number; title: string; kind: string[]; practices: string[]; signals: string[]; pdf: string | null };
export type ExampleEntry = { id: string; slug: string; pages: [number, number]; title: string; kind: "worked_example" | "sample_plan" | "checklist"; practices: string[]; topic: string | null; pdf: string | null };

function practicesIn(text: string, min = 1): string[] {
  const counts = ALIAS_RE.map(({ key, re }) => ({ key, n: (text.match(re) ?? []).length })).filter((x) => x.n >= min);
  if (!counts.length) return [];
  const top = Math.max(...counts.map((c) => c.n));
  return counts.filter((c) => c.n >= Math.max(min, top / 3)).sort((a, b) => b.n - a.n).map((c) => c.key).slice(0, 3);
}

const flat = (t: string) => t.replace(/\s+/g, " ").trim();
const tidy = (t: string) => flat(t).replace(/\s+([,.;:])/g, "$1").slice(0, 110);

export function classifyDrawing(text: string): { isDrawing: boolean; kind: string[]; signals: string[] } {
  if (SKIP.test(text)) return { isDrawing: false, kind: [], signals: [] };
  const labels = [...new Set([...text.matchAll(LABELS)].map((m) => m[1]!.replace(/\s+/g, " ")))];
  const dims = (text.match(DIMS) ?? []).length;
  const letters = text.replace(/[^A-Za-z]/g, "");
  const upper = letters ? letters.replace(/[^A-Z]/g, "").length / letters.length : 0;
  const nts = NTS.test(text);
  const signals = [...(nts ? ["not to scale"] : []), ...labels.map((l) => l.toLowerCase()), ...(dims >= 3 ? [`${dims} dimensions`] : [])];
  // a figure caption that names a drawing, on a page with little prose (the drawing itself is often an image)
  const cap = CAPTION.exec(flat(text));
  const drawingCaption = !!cap && /section|detail|plan view|profile|schematic|typical|cross|layout|isometric|configuration/i.test(cap[3]!) && text.length < 1500;
  if (drawingCaption) signals.push("drawing caption");
  const isDrawing =
    (nts ? labels.length + (dims >= 2 ? 1 : 0) >= 1 : labels.length >= 2 && (dims >= 3 || upper > 0.45) && text.length < 2500) || drawingCaption;
  const kind = [
    ...(labels.some((l) => /SECTION|ISOMETRIC/.test(l)) ? ["section"] : []),
    ...(labels.some((l) => /PLAN VIEW/.test(l)) ? ["plan"] : []),
    ...(labels.some((l) => /PROFILE|ELEVATION/.test(l)) ? ["profile"] : []),
    ...(labels.some((l) => /DETAIL|STANDARD/.test(l)) ? ["detail"] : []),
    ...(labels.some((l) => /SCHEMATIC/.test(l)) ? ["schematic"] : []),
  ];
  return { isDrawing, kind: kind.length ? kind : ["detail"], signals };
}

function main() {
  mkdirSync(OUT, { recursive: true });
  const drawings: DrawingEntry[] = [];
  const examples: ExampleEntry[] = [];
  const docs = readdirSync(path.join(ROOT, "data/documents")).filter((f) => f.endsWith(".json"));
  for (const f of docs.sort()) {
    const slug = f.slice(0, -5);
    const pf = path.join(ROOT, "data/corpus", slug, "pages.json");
    if (!existsSync(pf)) continue;
    const doc = JSON.parse(readFileSync(path.join(ROOT, "data/documents", f), "utf-8"));
    const pdf: string | null = doc.source?.document_url ?? null;
    const pages = (JSON.parse(readFileSync(pf, "utf-8")).pages as Array<{ page: number; text: string }>).map((p, i) => ({ page: Number(p.page) || i + 1, text: p.text ?? "" }));
    let open: ExampleEntry | null = null;
    for (const p of pages) {
      const text = p.text;
      const d = classifyDrawing(text);
      if (d.isDrawing && !TOC.test(text)) {
        const pr = practicesIn(text);
        if (pr.length) {
          const cap = CAPTION.exec(flat(text));
          const title = cap ? tidy(`${cap[1]} ${cap[2]} ${cap[3]}`) : tidy(`${PRACTICES[pr[0]!]!.label} ${d.kind[0]}`);
          drawings.push({ id: `${slug}-p${p.page}`, slug, page: p.page, title, kind: d.kind, practices: pr, signals: d.signals.slice(0, 6), pdf });
        }
      }
      const ex = EXAMPLE.exec(text);
      const calc = (text.match(CALC) ?? []).length >= 3 || (text.match(STEP) ?? []).length >= 2;
      const headText = flat(text).slice(0, 300);
      const kind: ExampleEntry["kind"] | null = TOC.test(text)
        ? null
        : ex && calc
          ? "worked_example"
          : SAMPLE_PLAN.test(headText)
            ? "sample_plan"
            : CHECKLIST.test(headText)
              ? "checklist"
              : null;
      const continues = open && open.kind === "worked_example" && p.page === open.pages[1] + 1 && (text.match(CALC) ?? []).length >= 3 && !ex;
      if (continues) {
        open!.pages[1] = p.page;
        continue;
      }
      if (kind && kind !== "worked_example" && open && open.kind === kind && p.page === open.pages[1] + 1) {
        open.pages[1] = p.page; // multi-page checklist or sample plan set
        continue;
      }
      if (kind) {
        const pr = practicesIn(text);
        const m = ex ? flat(text.slice(ex.index, ex.index + 140)) : flat(text).slice(0, 110);
        const entry: ExampleEntry = { id: `${slug}-p${p.page}`, slug, pages: [p.page, p.page], title: tidy(m), kind, practices: pr, topic: pr.length ? null : topicOf(text), pdf };
        examples.push(entry);
        open = entry;
      } else open = null;
    }
  }
  const meta = (what: string) => ({
    generated_at: new Date().toISOString().slice(0, 10),
    note: `${what} found automatically in the page text of each atlas manual and tagged by practice. Each entry links to the source PDF page; the drawings and examples remain the property of the issuing agencies. See data/archive/README.md for spot checks.`,
  });
  writeFileSync(path.join(OUT, "drawings.json"), JSON.stringify({ ...meta("Detail drawings"), count: drawings.length, drawings }, null, 1) + "\n");
  writeFileSync(path.join(OUT, "examples.json"), JSON.stringify({ ...meta("Worked design examples, sample plans and plan checklists"), count: examples.length, examples }, null, 1) + "\n");
  console.log(`archive: ${drawings.length} drawings, ${examples.length} examples`);
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("build-archive.ts")) main();
