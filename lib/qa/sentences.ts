/**
 * Verbatim sentence-sized passages from a manual's page text, for finding or
 * repairing evidence quotes. Shared by scripts/qa/repair-evidence.ts and
 * scripts/qa/find-quotes.ts.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { tokenize, type SourcePage } from "./evidenceMatch";

export interface Sentence {
  text: string;
  page: number;
  tokens: string[];
}

const CORPUS = path.resolve(process.cwd(), "data/corpus");

/** Page text from every extractor available for a record (pages.json, pages-alt.json). */
export function readPageSources(slug: string): SourcePage[][] {
  return ["pages.json", "pages-alt.json"]
    .map((f) => path.join(CORPUS, slug, f))
    .filter((p) => existsSync(p))
    .map((p) =>
      (JSON.parse(readFileSync(p, "utf-8")).pages as Array<{ page: number | string; text: string }>).map(
        (pg, i) => ({ page: Number(pg.page) || i + 1, text: pg.text ?? "" })
      )
    )
    .filter((p) => p.length > 0);
}

/** Split page text into sentences and bullet items, whitespace collapsed. */
export function sentencesOf(pages: SourcePage[]): Sentence[] {
  const out: Sentence[] = [];
  for (const p of pages) {
    const flat = p.text
      .replace(/([A-Za-z])-[ \t]*\r?\n[ \t]*([a-z])/g, "$1$2")
      .replace(/\s+/g, " ")
      .trim();
    // sentences, plus bullet items (•, ●, ▪, ◦, "o ", symbol-font bullets)
    const parts = flat.split(
      /(?<=[.;!?])\s+(?=[A-Z(“"•\d])|\s*[•●▪◦-]\s*|\s+o\s+(?=[A-Z])|\s{2,}(?=[A-Z])/
    );
    for (let part of parts) {
      part = part.trim();
      while (part.length > 420) {
        const cut = part.lastIndexOf(" ", 400);
        const head = part.slice(0, cut > 100 ? cut : 400);
        out.push({ text: head, page: p.page, tokens: tokenize(head) });
        part = part.slice(head.length).trim();
      }
      if (part.length >= 25) out.push({ text: part, page: p.page, tokens: tokenize(part) });
    }
  }
  return out;
}

/** token → sentence ids, for fast candidate lookup. */
export function postingsOf(sentences: Sentence[]): Map<string, number[]> {
  const postings = new Map<string, number[]>();
  sentences.forEach((s, id) => {
    for (const t of new Set(s.tokens)) {
      const arr = postings.get(t);
      if (arr) arr.push(id);
      else postings.set(t, [id]);
    }
  });
  return postings;
}

/** Longest common subsequence length of two token arrays. */
export function lcs(a: string[], b: string[]): number {
  const m = b.length;
  let prev = new Uint16Array(m + 1);
  let row = new Uint16Array(m + 1);
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= m; j++) {
      row[j] = a[i - 1] === b[j - 1] ? prev[j - 1]! + 1 : Math.max(prev[j]!, row[j - 1]!);
    }
    [prev, row] = [row, prev];
  }
  return prev[m]!;
}
