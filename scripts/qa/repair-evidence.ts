/**
 * Repair evidence quotes that the strict check could not find in the source.
 *
 *   npm run qa:repair -- --dry-run       # report only
 *   npm run qa:repair                    # write documents + data/qa/REPAIR.md
 *   npm run qa:repair -- ga-state        # selected slugs
 *
 * For each quote that FAILED (data/qa/evidence.json):
 * - segments of it that are in the source are kept as they are;
 * - each failing segment is replaced by the closest real sentence in the
 *   manual's page text, but only when that sentence matches the quote's
 *   wording well enough AND (for numeric fields) states the extracted value;
 * - otherwise the segment is dropped, and a quote left with nothing is
 *   removed. The field's value stays; the page then shows it has no quote,
 *   and the record is flagged for review.
 * Replacement text is copied verbatim from the source (whitespace collapsed)
 * and must pass the strict check before it is written. Every change is
 * listed in data/qa/REPAIR.md for audit. Run qa:evidence afterwards.
 *
 * Never invents text: it only ever copies from the source or deletes.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  SourceIndex,
  matchExcerpt,
  splitSegments,
  tokenize,
  valueAppearsIn,
  isNumberToken,
} from "../../lib/qa/evidenceMatch";
import { QA_EVIDENCE_PATH, evidenceQaFileSchema } from "../../lib/qa/types";
import { lcs, postingsOf, readPageSources as readPages, sentencesOf, type Sentence } from "../../lib/qa/sentences";

const DOCS = path.resolve(process.cwd(), "data/documents");
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const only = args.filter((a) => !a.startsWith("-"));
const TODAY = new Date().toISOString().slice(0, 10);

type FieldKind = "numeric" | "storms" | "criteria_text" | "metadata" | "other";

function kindOf(field: string): FieldKind {
  if (field.startsWith("design_parameters.") && !/practice_mentions|enrich_notes|mtd_verification/.test(field))
    return "numeric";
  if (field === "design_criteria.design_storm_return_periods_years") return "storms";
  if (field.startsWith("design_criteria.")) return "criteria_text";
  if (field.startsWith("document_metadata.")) return "metadata";
  return "other";
}

const MIN_SCORE: Record<FieldKind, number> = {
  // numeric fields additionally require the replacement to state the value
  // and every number of the original quote, so wording can differ more
  numeric: 0.4,
  storms: 0.6,
  criteria_text: 0.7,
  // cover pages and tables of contents extract badly: never substitute a
  // "close" sentence for a title/date/edition — trim or remove instead
  metadata: 2,
  other: 0.7,
};

interface Ctx {
  sentences: Sentence[];
  postings: Map<string, number[]>;
  indexes: SourceIndex[];
  value: unknown;
  field: string;
}

function inSource(ctx: Ctx, text: string): { ok: boolean; page: number | null } {
  for (const ix of ctx.indexes) {
    const r = matchExcerpt(ix, text);
    if (r.status === "exact" || r.status === "fuzzy") return { ok: true, page: r.page };
  }
  return { ok: false, page: null };
}

/** Closest verbatim sentence for a failing segment, or null. */
function findReplacement(ctx: Ctx, segment: string): Sentence | null {
  const seg = tokenize(segment);
  if (seg.length < 4) return null;
  const kind = kindOf(ctx.field);
  // candidates: sentences sharing the segment's rarer tokens
  const freq = (t: string) => ctx.postings.get(t)?.length ?? 0;
  const anchors = [...new Set(seg)].filter((t) => freq(t) > 0 && t.length > 2).sort((a, b) => freq(a) - freq(b)).slice(0, 6);
  const hits = new Map<number, number>();
  for (const a of anchors) for (const id of ctx.postings.get(a) ?? []) hits.set(id, (hits.get(id) ?? 0) + 1);
  const cands = [...hits.entries()].filter(([, n]) => n >= Math.min(2, anchors.length)).map(([id]) => id);

  let best: { s: Sentence; score: number } | null = null;
  for (const id of cands) {
    const s = ctx.sentences[id]!;
    if (s.tokens.length > seg.length * 3 + 12) continue;
    const common = lcs(seg, s.tokens);
    const recall = common / seg.length;
    const precision = common / s.tokens.length;
    if (precision < 0.3) continue;
    const score = recall * 0.8 + precision * 0.2;
    if (!best || score > best.score) best = { s, score };
  }
  if (!best || best.score < MIN_SCORE[kind]) return null;

  // Never trade one number for another: every number in the original
  // segment must appear in the replacement (garbled source text, partial
  // table rows and stitched lists fail here and get removed instead).
  const have = new Set(best.s.tokens.filter(isNumberToken));
  if (seg.filter(isNumberToken).some((n) => !have.has(n))) return null;

  // value must be stated where the field is numeric / storms
  const v = ctx.value;
  if (kind === "numeric" && typeof v === "number") {
    if (!valueAppearsIn(v, ctx.field.split(".").pop()!, [best.s.text])) return null;
  }
  if (kind === "storms") {
    const segYears = seg.filter(isNumberToken);
    const srcNums = new Set(best.s.tokens.filter(isNumberToken));
    if (!segYears.some((y) => srcNums.has(y))) return null;
  }
  return best.s;
}

interface Change {
  slug: string;
  field: string;
  action: "replaced" | "trimmed" | "removed";
  before: string;
  after: string | null;
  page: number | null;
}

function getValue(doc: Record<string, any>, field: string): unknown {
  return field.split(".").reduce((o: any, k) => (o == null ? o : o[k]), doc);
}

function main() {
  const qa = evidenceQaFileSchema.parse(JSON.parse(readFileSync(QA_EVIDENCE_PATH, "utf-8")));
  const changes: Change[] = [];
  const touched = new Set<string>();

  for (const [slug, rec] of Object.entries(qa.records)) {
    if (only.length && !only.includes(slug)) continue;
    const failing = rec.excerpts.map((x, i) => (x.status === "fail" ? i : -1)).filter((i) => i >= 0);
    if (!failing.length) continue;
    const sources = readPages(slug);
    if (!sources.length) continue;

    const docPath = path.join(DOCS, `${slug}.json`);
    const doc = JSON.parse(readFileSync(docPath, "utf-8"));
    if (doc.evidence.length !== rec.excerpts.length) {
      console.warn(`${slug}: evidence changed since qa:evidence — run it again first; skipping`);
      continue;
    }
    const sentences = sources.flatMap((p) => sentencesOf(p));
    const postings = postingsOf(sentences);
    const indexes = sources.map((p) => new SourceIndex(p));

    const keep = new Array<boolean>(doc.evidence.length).fill(true);
    for (const i of failing) {
      const ev = doc.evidence[i];
      const ctx: Ctx = { sentences, postings, indexes, field: ev.field, value: getValue(doc, ev.field) };
      const segs = splitSegments(ev.excerpt);
      const out: Array<{ text: string; page: number | null; replaced: boolean }> = [];
      for (const seg of segs) {
        const here = inSource(ctx, seg);
        // a fragment this short supports nothing on its own
        if (tokenize(seg).length < 5) continue;
        if (here.ok) {
          out.push({ text: seg, page: here.page, replaced: false });
          continue;
        }
        const rep = findReplacement(ctx, seg);
        if (rep && inSource(ctx, rep.text).ok) out.push({ text: rep.text, page: rep.page, replaced: true });
      }
      const dedup = out.filter((o, k) => out.findIndex((p) => p.text === o.text) === k);
      const kind = kindOf(ev.field);
      const valueOk = (texts: string[]) =>
        !(kind === "numeric" && typeof ctx.value === "number") ||
        valueAppearsIn(ctx.value as number, ev.field.split(".").pop()!, texts);

      if (dedup.length && valueOk(dedup.map((d) => d.text))) {
        const after = dedup.map((d) => d.text).join(" … ");
        const page = dedup[0]!.page;
        changes.push({
          slug,
          field: ev.field,
          action: dedup.some((d) => d.replaced) ? "replaced" : "trimmed",
          before: ev.excerpt,
          after,
          page,
        });
        ev.excerpt = after;
        if (page != null) ev.page_or_section = `PDF p. ${page}`;
      } else {
        changes.push({ slug, field: ev.field, action: "removed", before: ev.excerpt, after: null, page: null });
        keep[i] = false;
      }
      touched.add(slug);
    }

    if (!dryRun && touched.has(slug)) {
      const mine = changes.filter((c) => c.slug === slug);
      const removed = mine.filter((c) => c.action === "removed");
      doc.evidence = doc.evidence.filter((_: unknown, k: number) => keep[k]);
      const note =
        `Citation QA ${TODAY}: ${mine.length - removed.length} quote(s) replaced with verbatim source text` +
        (removed.length
          ? `; ${removed.length} removed because no supporting text was found (${[...new Set(removed.map((r) => r.field.split(".").pop()))].join(", ")}).`
          : ".");
      const q = doc.extraction_quality;
      q.review_notes = [q.review_notes, note].filter(Boolean).join(" ");
      if (removed.length) q.needs_human_review = true;
      writeFileSync(docPath, JSON.stringify(doc, null, 2) + "\n");
    }
  }

  const by = (a: Change["action"]) => changes.filter((c) => c.action === a).length;
  const md = `# Evidence repair log

Generated ${new Date().toISOString()} by \`npm run qa:repair\`${dryRun ? " (dry run — nothing written)" : ""}.

Quotes the strict check could not find in their source manual were repaired
by copying the closest real sentence from the manual (only when it matches the
quote's wording and states the extracted value), trimmed to the parts that are
in the source, or removed. Values were never changed; a value whose quote was
removed shows "No supporting quote" on its page and the record is flagged for
review.

| Action | Count |
|--------|------:|
| Replaced with verbatim source text | ${by("replaced")} |
| Trimmed to the parts found in the source | ${by("trimmed")} |
| Removed (no supporting text found) | ${by("removed")} |

## Changes

${changes
  .map(
    (c) =>
      `### \`${c.slug}\` — ${c.field} — ${c.action}${c.page != null ? ` (PDF p. ${c.page})` : ""}\n\n` +
      `- Before: ${c.before.replace(/\s+/g, " ")}\n` +
      (c.after ? `- After: ${c.after}\n` : "")
  )
  .join("\n")}`;
  writeFileSync(path.resolve(process.cwd(), `data/qa/REPAIR${dryRun ? "-dry-run" : ""}.md`), md);
  console.log(
    `replaced=${by("replaced")} trimmed=${by("trimmed")} removed=${by("removed")} across ${touched.size} record(s)${dryRun ? " (dry run)" : ""}`
  );
}

main();
