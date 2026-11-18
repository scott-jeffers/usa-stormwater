/**
 * Source freshness check: has an agency replaced, moved or removed a manual?
 *
 *   npm run qa:freshness              # every distinct source PDF
 *   npm run qa:freshness -- --limit=20
 *
 * Sends a HEAD request (falls back to a 1-byte ranged GET) for each
 * document_url and compares status, Last-Modified, ETag and size with the
 * previous run. Writes data/qa/freshness.json (committed baseline) and
 * data/qa/FRESHNESS.md listing broken links and changed files.
 * Run it from your own machine: many agency sites block cloud servers.
 * A changed file usually means a new edition — re-run prepare/corpus/
 * extract for that record, then qa:evidence.
 */
import { appendFileSync, existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const DOCS = path.resolve(process.cwd(), "data/documents");
const OUT = path.resolve(process.cwd(), "data/qa/freshness.json");
const MD = path.resolve(process.cwd(), "data/qa/FRESHNESS.md");
const limitArg = process.argv.find((a) => a.startsWith("--limit="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const NOTES = path.resolve(process.cwd(), "data/qa/freshness-notes.json");
const refusesChecks: Record<string, string> = existsSync(NOTES)
  ? JSON.parse(readFileSync(NOTES, "utf-8")).refuses_automated_checks ?? {}
  : {};
const UA = "Mozilla/5.0 (compatible; StormwaterAtlas-freshness/1.0; +https://stormwateratlas.com/about/)";

interface Probe {
  url: string;
  slugs: string[];
  status: number | null;
  last_modified: string | null;
  etag: string | null;
  length: string | null;
  checked_at: string;
  error?: string;
}

async function probe(url: string): Promise<Omit<Probe, "slugs" | "url" | "checked_at">> {
  const attempt = async (method: "HEAD" | "GET") => {
    const res = await fetch(url, {
      method,
      redirect: "follow",
      headers: { "User-Agent": UA, ...(method === "GET" ? { Range: "bytes=0-0" } : {}) },
      signal: AbortSignal.timeout(30_000),
    });
    if (method === "GET") await res.body?.cancel();
    return res;
  };
  try {
    let res = await attempt("HEAD");
    // many CMSs (CivicPlus DocumentCenter, Azure functions) refuse HEAD with 403/404/405
    if (res.status >= 400) res = await attempt("GET");
    const range = res.headers.get("content-range");
    return {
      status: res.status,
      last_modified: res.headers.get("last-modified"),
      etag: res.headers.get("etag"),
      // a ranged GET's own Content-Length is the 1-byte slice, not the file
      length: range?.split("/")[1] ?? (res.status === 206 ? null : res.headers.get("content-length")),
    };
  } catch (error) {
    return { status: null, last_modified: null, etag: null, length: null, error: (error as Error).message };
  }
}

/** ETags compare without the weak-validator prefix (servers flip W/ on and off). */
const etagOf = (e: string | null) => (e ? e.replace(/^W\//, "") : null);

/** A Last-Modified within 2 days of the check is generated per request (CMS document links), not a file date. */
function stableDate(lm: string | null, checkedAt: string): number | null {
  if (!lm) return null;
  const t = Date.parse(lm);
  if (!Number.isFinite(t)) return null;
  return Math.abs(Date.parse(checkedAt) - t) < 2 * 86_400_000 ? null : t;
}

export function hasChanged(before: Probe, now: Probe): boolean {
  // Size is the most reliable signal (CDNs give each node its own ETag); a
  // new edition with exactly the same byte count is vanishingly rare.
  const ok = (l: string | null) => (l && Number(l) > 1 ? l : null);
  const l1 = ok(before.length), l2 = ok(now.length);
  if (l1 && l2) return l1 !== l2;
  const e1 = etagOf(before.etag), e2 = etagOf(now.etag);
  if (e1 && e2 && e1 !== e2) return true;
  const d1 = stableDate(before.last_modified, before.checked_at);
  const d2 = stableDate(now.last_modified, now.checked_at);
  return d1 != null && d2 != null && d1 !== d2;
}

async function main() {
  const byUrl = new Map<string, string[]>();
  for (const f of readdirSync(DOCS).filter((x) => x.endsWith(".json"))) {
    const u = JSON.parse(readFileSync(path.join(DOCS, f), "utf-8")).source?.document_url;
    if (u) byUrl.set(u, [...(byUrl.get(u) ?? []), f.slice(0, -5)]);
  }
  const previous: Record<string, Probe> = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf-8")).urls ?? {} : {};
  // keep earlier results only for URLs still cited (e.g. skipped by --limit)
  const results: Record<string, Probe> = Object.fromEntries(
    Object.entries(previous).filter(([u]) => byUrl.has(u))
  );
  const changed: Probe[] = [];
  const broken: Probe[] = [];
  const blocked: Probe[] = [];
  let n = 0;
  for (const [url, slugs] of byUrl) {
    if (n++ >= limit) break;
    const p: Probe = { url, slugs, checked_at: new Date().toISOString(), ...(await probe(url)) };
    const before = previous[url];
    const host = (() => { try { return new URL(url).host; } catch { return ""; } })();
    if ((p.status == null || p.status >= 400) && refusesChecks[host]) blocked.push(p);
    else if (p.status == null || p.status >= 400) broken.push(p);
    else if (before && before.status != null && before.status < 400 && hasChanged(before, p)) changed.push(p);
    results[url] = p;
    process.stdout.write(`${p.status ?? "ERR"} ${url.slice(0, 90)}\n`);
  }
  writeFileSync(OUT, JSON.stringify({ version: 1, generated_at: new Date().toISOString(), urls: results }, null, 1) + "\n");
  const line = (p: Probe) => `- ${p.slugs.map((s) => `\`${s}\``).join(", ")}: ${p.status ?? p.error} — ${p.url}`;
  writeFileSync(
    MD,
    `# Source freshness\n\nGenerated ${new Date().toISOString()} by \`npm run qa:freshness\` (${n} source URL(s) checked).\n\n` +
      `## Broken or blocked (${broken.length})\n\n${broken.map(line).join("\n") || "_none_"}\n\n` +
      `## Known to refuse automated checks (${blocked.length}) — PDF opens in a browser; see data/qa/freshness-notes.json\n\n${blocked.map(line).join("\n") || "_none_"}\n\n` +
      `## Changed since last run (${changed.length}) — likely a new edition\n\n${changed.map(line).join("\n") || "_none_"}\n`
  );
  console.log(`\n${broken.length} broken/blocked, ${changed.length} changed. Wrote data/qa/FRESHNESS.md`);
  // for the scheduled GitHub workflow
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `broken=${broken.length}\nchanged=${changed.length}\nchecked=${n}\n`);
  }
}

if (process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/qa/check-freshness.ts")) main();
