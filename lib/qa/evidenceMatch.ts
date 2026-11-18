/**
 * Strict evidence matching: does a cited excerpt really appear in the source
 * manual, and does the extracted value really appear in the excerpt?
 *
 * Replaces the old "70% of words appear anywhere in the corpus" soft match,
 * which accepted invented sentences and wrong numbers.
 *
 * Rules
 * - Text is normalized (Unicode NFKC, case, quotes/dashes, line-break
 *   hyphenation) and tokenized into words and numbers.
 * - An excerpt may contain ellipses ("...", "…"); each segment between them
 *   must match on its own.
 * - A segment matches EXACTLY when its token sequence occurs in the source.
 * - Otherwise it matches FUZZILY when an in-order alignment inside a short
 *   window covers >= FUZZY_MIN_SCORE of its tokens AND every number in the
 *   segment is part of that alignment (PDF extraction noise is tolerated,
 *   different numbers are not).
 * - Anything else FAILS.
 */

export const FUZZY_MIN_SCORE = 0.85;
/** Segments shorter than this (in tokens) must match exactly. */
export const MIN_FUZZY_TOKENS = 6;
const MAX_ANCHOR_CANDIDATES = 80;

/**
 * exact        verbatim in the source
 * fuzzy        close in-order match, every number identical
 * unverifiable words match but the source text has no number where the
 *              excerpt has one (PDF text layer dropped digits) — can't prove
 *              either way; needs a look at the PDF itself
 * fail         not in the source, or the source shows a different number
 */
export type MatchStatus = "exact" | "fuzzy" | "unverifiable" | "fail";

export interface SegmentResult {
  text: string;
  status: MatchStatus;
  score: number;
  page: number | null;
  missingNumbers: string[];
  /** Numbers in the source at the excerpt's number positions, when different. */
  contradictingNumbers?: string[];
}

export interface ExcerptResult {
  status: MatchStatus;
  /** Lowest segment score (1 for exact). */
  score: number;
  /** 1-based PDF page index where the first segment matched. */
  page: number | null;
  segments: SegmentResult[];
}

export interface SourcePage {
  /** 1-based physical page index in the PDF. */
  page: number;
  text: string;
}

const NUMBER_RE = /^\d/;

/** Canonical form for a numeric token: "1,000" → "1000", ".50" → "0.5". */
export function canonicalNumber(raw: string): string {
  if (raw.includes("/")) return raw;
  const noCommas = raw.replace(/,/g, "");
  const withLead = noCommas.startsWith(".") ? `0${noCommas}` : noCommas;
  if (!/^\d+(\.\d+)?$/.test(withLead)) return withLead;
  const n = Number(withLead);
  return Number.isFinite(n) ? String(n) : withLead;
}

export function normalizeText(text: string): string {
  return (
    text
      .normalize("NFKC")
      .replace(/­/g, "")
      // NFKC turns "½" into "1⁄2" (fraction slash): read it as "1/2"
      .replace(/\u2044/g, "/")
      // join words hyphenated across a line break: "infil-\ntration"
      .replace(/([A-Za-z])-[ \t]*\r?\n[ \t]*([a-z])/g, "$1$2")
      .toLowerCase()
      .replace(/[‘’‚′]/g, "'")
      .replace(/[“”„″]/g, '"')
      .replace(/[‐-―−]/g, "-")
  );
}

/** Words and numbers, in order. Numbers are canonicalized. */
export function tokenize(text: string): string[] {
  const out: string[] = [];
  const re = /\.?\d+(?:,\d{3})*(?:\.\d+)?(?:\/\d+)?|[a-z]+/g;
  for (const m of normalizeText(text).matchAll(re)) {
    const tok = m[0];
    out.push(NUMBER_RE.test(tok) || tok.startsWith(".") ? canonicalNumber(tok) : tok);
  }
  return out;
}

export function isNumberToken(tok: string): boolean {
  return /^\d/.test(tok);
}

/**
 * True when `part` looks like a garbled copy of `whole` from a broken PDF
 * text layer: its digits are a sub-multiset of `whole`'s digits
 * ("8" from "48", "0.1" from "100", "0.36" from "3,600").
 */
export function isDigitFragment(part: string, whole: string): boolean {
  const pd = part.replace(/\D/g, "");
  const wd = whole.replace(/\D/g, "");
  if (!pd || pd.length >= wd.length) return false;
  const counts = new Map<string, number>();
  for (const ch of wd) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  for (const ch of pd) {
    const n = counts.get(ch) ?? 0;
    if (n === 0) return false;
    counts.set(ch, n - 1);
  }
  return true;
}

/** Numbers mentioned in a piece of text (canonical form). */
export function numbersIn(text: string): string[] {
  return tokenize(text).filter(isNumberToken);
}

/** Split an excerpt on ellipses into independently-checked segments. */
export function splitSegments(excerpt: string): string[] {
  return excerpt
    // "--- page 12 ---" markers copied from prepared text also act as breaks
    .split(/-{2,}\s*page\s*\d+\s*-{2,}|\[\s*\.\.\.\s*\]|\.{3,}|…/i)
    .map((s) => s.trim())
    .filter((s) => tokenize(s).length > 0);
}

/** Pre-tokenized source document with a token → page map. */
export class SourceIndex {
  readonly tokens: string[];
  readonly pageOf: Int32Array;
  private readonly positions = new Map<string, number[]>();
  private readonly joined: string;
  private readonly charToToken: Int32Array;

  constructor(pages: SourcePage[]) {
    const tokens: string[] = [];
    const pageOf: number[] = [];
    for (const p of pages) {
      for (const t of tokenize(p.text)) {
        tokens.push(t);
        pageOf.push(p.page);
      }
    }
    this.tokens = tokens;
    this.pageOf = Int32Array.from(pageOf);
    tokens.forEach((t, i) => {
      const arr = this.positions.get(t);
      if (arr) arr.push(i);
      else this.positions.set(t, [i]);
    });
    // " tok tok tok " string for fast exact sequence search
    const parts: string[] = [" "];
    const map: number[] = [0];
    tokens.forEach((t, i) => {
      for (let c = 0; c < t.length + 1; c++) map.push(i);
      parts.push(t, " ");
    });
    this.joined = parts.join("");
    this.charToToken = Int32Array.from(map);
  }

  frequency(tok: string): number {
    return this.positions.get(tok)?.length ?? 0;
  }

  positionsOf(tok: string): number[] {
    return this.positions.get(tok) ?? [];
  }

  /** Token index where `seq` occurs contiguously, or -1. */
  findExact(seq: string[]): number {
    if (seq.length === 0) return -1;
    const idx = this.joined.indexOf(` ${seq.join(" ")} `);
    if (idx < 0) return -1;
    return this.charToToken[idx + 1] ?? -1;
  }
}

/** LCS alignment: for each index of `a`, the matched index in `b` (or -1). */
function lcsAlign(a: string[], b: string[]): number[] {
  const n = a.length;
  const m = b.length;
  const dp: Uint16Array[] = [];
  for (let i = 0; i <= n; i++) dp.push(new Uint16Array(m + 1));
  for (let i = 1; i <= n; i++) {
    const row = dp[i]!;
    const prev = dp[i - 1]!;
    const ai = a[i - 1];
    for (let j = 1; j <= m; j++) {
      row[j] = ai === b[j - 1] ? prev[j - 1]! + 1 : Math.max(prev[j]!, row[j - 1]!);
    }
  }
  const matched = new Array<number>(n).fill(-1);
  let i = n;
  let j = m;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matched[i - 1] = j - 1;
      i--;
      j--;
    } else if (dp[i - 1]![j]! >= dp[i]![j - 1]!) i--;
    else j--;
  }
  return matched;
}

export function matchSegment(index: SourceIndex, segment: string): SegmentResult {
  const seq = tokenize(segment);
  const numbers = seq.filter(isNumberToken);
  const exactAt = index.findExact(seq);
  if (exactAt >= 0) {
    return { text: segment, status: "exact", score: 1, page: index.pageOf[exactAt] ?? null, missingNumbers: [] };
  }

  const fail = (score: number, page: number | null, missing: string[]): SegmentResult => ({
    text: segment,
    status: "fail",
    score,
    page,
    missingNumbers: missing,
  });

  const missingEverywhere = numbers.filter((n) => index.frequency(n) === 0);
  if (seq.length < MIN_FUZZY_TOKENS) return fail(0, null, missingEverywhere);

  // Anchor on the rarest tokens that exist in the source.
  const anchors = [...new Set(seq)]
    .filter((t) => index.frequency(t) > 0)
    .sort((x, y) => index.frequency(x) - index.frequency(y))
    .slice(0, 3);
  const candidates = new Set<number>();
  for (const a of anchors) {
    for (const p of index.positionsOf(a)) {
      candidates.add(p);
      if (candidates.size >= MAX_ANCHOR_CANDIDATES) break;
    }
    if (candidates.size >= MAX_ANCHOR_CANDIDATES) break;
  }

  type Best = {
    score: number;
    wordScore: number;
    page: number | null;
    missing: string[];
    contradicting: string[];
  };
  let best: Best = {
    score: 0,
    wordScore: 0,
    page: null,
    missing: missingEverywhere.length ? missingEverywhere : numbers,
    contradicting: [],
  };
  const words = seq.filter((t) => !isNumberToken(t)).length || 1;
  const span = Math.ceil(seq.length * 1.3) + 4;
  for (const pos of candidates) {
    const start = Math.max(0, pos - span);
    const end = Math.min(index.tokens.length, pos + span);
    const window = index.tokens.slice(start, end);
    const align = lcsAlign(seq, window);
    const hits = align.filter((j) => j >= 0).length;
    const score = hits / seq.length;
    const wordHits = seq.filter((t, i) => !isNumberToken(t) && align[i]! >= 0).length;
    const missing: string[] = [];
    const contradicting: string[] = [];
    seq.forEach((t, i) => {
      if (!isNumberToken(t) || align[i]! >= 0) return;
      missing.push(t);
      // What does the source have where this number should be? Look between
      // the nearest aligned neighbours.
      let lo = -1;
      for (let k = i - 1; k >= 0; k--) if (align[k]! >= 0) { lo = align[k]!; break; }
      let hi = window.length;
      for (let k = i + 1; k < seq.length; k++) if (align[k]! >= 0) { hi = align[k]!; break; }
      for (let j = lo + 1; j < hi && j - lo <= 3; j++) {
        const src = window[j]!;
        // A fragment of the excerpt's number ("8" for "48", "0.7" for
        // "0.75") is digit dropout in the PDF text, not a contradiction.
        if (isNumberToken(src) && !isDigitFragment(src, t)) contradicting.push(src);
      }
    });
    const cand: Best = {
      score,
      wordScore: wordHits / words,
      page: index.pageOf[pos] ?? null,
      missing,
      contradicting,
    };
    const better =
      cand.score > best.score ||
      (cand.score === best.score && cand.missing.length < best.missing.length);
    if (better) best = cand;
    if (score === 1 && missing.length === 0) break;
  }

  if (best.score >= FUZZY_MIN_SCORE && best.missing.length === 0) {
    return { text: segment, status: "fuzzy", score: best.score, page: best.page, missingNumbers: [] };
  }
  // Words line up but numbers are simply absent from the source text at that
  // spot (no different number there): the PDF text layer lost digits.
  if (
    best.wordScore >= 0.9 &&
    best.missing.length > 0 &&
    best.contradicting.length === 0
  ) {
    return {
      text: segment,
      status: "unverifiable",
      score: best.score,
      page: best.page,
      missingNumbers: [...new Set(best.missing)],
    };
  }
  // Only call it a contradiction for a clean one-number swap inside text
  // that otherwise matches (e.g. "48 hours" vs "72 hours"). Tables and
  // stitched-together excerpts pick up unrelated neighbouring numbers.
  const missing = [...new Set(best.missing)];
  const contra = [...new Set(best.contradicting)].filter(
    (c) => !missing.some((m) => isDigitFragment(m, c))
  );
  const cleanSwap = best.wordScore >= 0.9 && missing.length === 1 && contra.length === 1;
  return {
    ...fail(best.score, best.page, missing),
    ...(cleanSwap ? { contradictingNumbers: contra } : {}),
  };
}

/**
 * A segment that fails as a whole may still be verbatim sentence by sentence
 * (a quote that runs across a page break, footer or column). Each sentence of
 * 5+ tokens must then match on its own, like ellipsis segments.
 */
function matchBySentence(index: SourceIndex, segment: string, whole: SegmentResult): SegmentResult {
  if (whole.status !== "fail") return whole;
  const parts = segment
    .split(/(?<=[.;!?])\s+(?=[A-Z(“"])/)
    .map((p) => p.trim())
    .filter((p) => tokenize(p).length >= 5);
  if (parts.length < 2) return whole;
  const results = parts.map((p) => matchSegment(index, p));
  if (results.every((r) => r.status === "exact" || r.status === "fuzzy")) {
    return {
      text: segment,
      status: "fuzzy",
      score: Math.min(...results.map((r) => r.score)),
      page: results[0]!.page,
      missingNumbers: [],
    };
  }
  return whole;
}

export function matchExcerpt(index: SourceIndex, excerpt: string): ExcerptResult {
  const segments = splitSegments(excerpt).map((s) => matchBySentence(index, s, matchSegment(index, s)));
  if (segments.length === 0) {
    return { status: "fail", score: 0, page: null, segments: [] };
  }
  const rank: Record<MatchStatus, number> = { exact: 0, fuzzy: 1, unverifiable: 2, fail: 3 };
  const status = segments.reduce<MatchStatus>(
    (worst, s) => (rank[s.status] > rank[worst] ? s.status : worst),
    "exact"
  );
  return {
    status,
    score: Math.min(...segments.map((s) => s.score)),
    page: segments.find((s) => s.page != null)?.page ?? null,
    segments,
  };
}

/**
 * Equivalent spellings of a numeric value in source text, for unit-aware
 * "is the value actually in the excerpt?" checks.
 */
export function valueSpellings(value: number, field: string): string[] {
  const out = new Set<string>([canonicalNumber(String(value))]);
  const add = (n: number) => {
    if (Number.isFinite(n) && n > 0) out.add(canonicalNumber(String(Math.round(n * 1000) / 1000)));
  };
  if (field.endsWith("_hours")) add(value / 24); // "3 days"
  if (field.endsWith("_inches")) add(value / 12); // "2 feet"
  if (field.endsWith("_in_per_hr")) add(value * 24); // "in/day"
  // fractions commonly written in manuals
  const fractions: Record<string, string> = {
    "0.125": "1/8", "0.25": "1/4", "0.375": "3/8", "0.5": "1/2",
    "0.625": "5/8", "0.75": "3/4", "0.875": "7/8",
  };
  for (const v of [...out]) if (fractions[v]) out.add(fractions[v]!);
  return [...out];
}

/** True when any spelling of `value` appears among the excerpt numbers. */
export function valueAppearsIn(value: number, field: string, excerpts: string[]): boolean {
  const nums = new Set(excerpts.flatMap((e) => numbersIn(e)));
  return valueSpellings(value, field).some((s) => nums.has(s));
}
