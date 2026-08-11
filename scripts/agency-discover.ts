/**
 * Discover candidate PDFs for agency manual gaps.
 *
 *   npm run agency:discover
 *   npm run agency:discover -- --state TX --category dot
 *   npm run agency:discover -- --dry-run
 *
 * Never auto-adds to manifest — writes data/agency-targets/candidates.json
 * for human/agent review.
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  agencyGapsForDiscover,
  buildAgencyCoverageReport,
  type AgencyGap,
} from "../lib/agencyCoverage";
import { assertPdfLooksValid } from "./lib/pdfText";

const AGENCY_DIR = path.resolve(process.cwd(), "data/agency-targets");
const QUEUE_DIR = path.resolve(process.cwd(), "data/queue");
const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");

const USER_AGENT =
  "StormwaterAtlasAgencyDiscover/1.0 (+https://stormwateratlas.com; research)";

const FETCH_TIMEOUT_MS = 20_000;
const DELAY_MS = 800;
const MAX_CANDIDATES_PER_GAP = 8;
const MAX_SEARCH_RESULTS = 5;

export interface CandidateUrl {
  url: string;
  title_guess: string | null;
  source: "landing_page" | "search" | "reference";
  confidence: "high" | "medium" | "low";
  fetch_ok: boolean | null;
  error?: string;
}

export interface GapCandidates {
  state_code: string;
  agency_category: "dot" | "dep_deq";
  agency_abbrev: string;
  expected_id: string;
  expected_title: string;
  reason: string;
  landing_page_url: string | null;
  domains: string[];
  candidates: CandidateUrl[];
}

function parseArgs(argv: string[]) {
  let category: "dot" | "dep_deq" | "all" = "all";
  let state: string | null = null;
  let dryRun = false;
  let skipValidate = false;
  let limit = 40;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--dry-run") dryRun = true;
    else if (a === "--skip-validate") skipValidate = true;
    else if (a.startsWith("--category=")) {
      const v = a.slice("--category=".length).toLowerCase();
      if (v === "dot" || v === "dep_deq" || v === "all") category = v;
    } else if (a === "--category" && argv[i + 1]) {
      const v = argv[++i]!.toLowerCase();
      if (v === "dot" || v === "dep_deq" || v === "all") category = v;
    } else if (a.startsWith("--state=")) {
      state = a.slice("--state=".length).toUpperCase();
    } else if (a === "--state" && argv[i + 1]) {
      state = argv[++i]!.toUpperCase();
    } else if (a.startsWith("--limit=")) {
      limit = Number(a.slice("--limit=".length)) || limit;
    } else if (a === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]) || limit;
    } else if (/^[A-Za-z]{2}$/.test(a) && !state) {
      // Windows npm often strips `--flags`; allow bare state code
      state = a.toUpperCase();
    } else if (
      (a === "dot" || a === "dep_deq" || a === "all") &&
      category === "all"
    ) {
      category = a;
    } else if (/^\d+$/.test(a)) {
      limit = Number(a) || limit;
    }
  }
  return { category, state, dryRun, skipValidate, limit };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchText(
  url: string
): Promise<{ ok: boolean; status: number; text: string; contentType: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/pdf,*/*",
      },
      redirect: "follow",
    });
    const contentType = res.headers.get("content-type") ?? "";
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, contentType };
  } finally {
    clearTimeout(t);
  }
}

async function validatePdfUrl(
  url: string
): Promise<{ ok: boolean; error?: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    // Prefer Range request for magic bytes
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Range: "bytes=0-8191",
      },
      redirect: "follow",
    });
    if (!res.ok && res.status !== 206) {
      return { ok: false, error: `HTTP ${res.status}` };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    try {
      assertPdfLooksValid(buf, 100);
      return { ok: true };
    } catch (e) {
      // Some servers ignore Range and return HTML; try content-type
      const ct = res.headers.get("content-type") ?? "";
      if (ct.includes("pdf")) return { ok: true };
      return {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    clearTimeout(t);
  }
}

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function extractPdfLinks(html: string, baseUrl: string): Array<{
  url: string;
  title_guess: string | null;
}> {
  const out: Array<{ url: string; title_guess: string | null }> = [];
  const seen = new Set<string>();

  // href="...pdf" or DocumentCenter / download patterns
  const hrefRe =
    /href\s*=\s*["']([^"']+\.pdf[^"']*|[^"']*\/(?:download|DocumentCenter\/View|files\/)[^"']*)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = hrefRe.exec(html)) !== null) {
    const abs = absolutize(m[1]!, baseUrl);
    if (!abs || seen.has(abs)) continue;
    seen.add(abs);
    // nearby title from link text is hard without DOM; use filename
    let title: string | null = null;
    try {
      const u = new URL(abs);
      title = decodeURIComponent(u.pathname.split("/").pop() ?? "") || null;
    } catch {
      /* ignore */
    }
    out.push({ url: abs, title_guess: title });
  }

  // Prefer .pdf links first
  out.sort((a, b) => {
    const ap = a.url.toLowerCase().includes(".pdf") ? 0 : 1;
    const bp = b.url.toLowerCase().includes(".pdf") ? 0 : 1;
    return ap - bp;
  });

  return out.slice(0, 20);
}

function scoreCandidate(
  url: string,
  title: string | null,
  gap: AgencyGap,
  source: CandidateUrl["source"]
): "high" | "medium" | "low" {
  const blob = `${url} ${title ?? ""}`.toLowerCase();
  const keys = [
    gap.agency_abbrev.toLowerCase(),
    ...gap.expected_title.toLowerCase().split(/\s+/).filter((w) => w.length > 4),
  ];
  let hits = 0;
  for (const k of keys.slice(0, 6)) {
    if (blob.includes(k)) hits += 1;
  }
  if (source === "landing_page" && blob.includes(".pdf") && hits >= 1)
    return "high";
  if (hits >= 2 && blob.includes(".pdf")) return "high";
  if (hits >= 1 || source === "landing_page") return "medium";
  return "low";
}

/** DuckDuckGo HTML lite search — no API key. Best-effort; may be blocked. */
async function searchDuckDuckGo(
  query: string
): Promise<Array<{ url: string; title: string }>> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
  try {
    const { ok, text } = await fetchText(url);
    if (!ok) return [];
    const results: Array<{ url: string; title: string }> = [];
    const re =
      /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null && results.length < MAX_SEARCH_RESULTS) {
      let href = m[1]!;
      // DDG sometimes wraps redirects
      const uddg = href.match(/uddg=([^&]+)/);
      if (uddg) {
        try {
          href = decodeURIComponent(uddg[1]!);
        } catch {
          /* keep */
        }
      }
      const title = m[2]!.replace(/<[^>]+>/g, "").trim();
      if (href.startsWith("http")) {
        results.push({ url: href, title });
      }
    }
    return results;
  } catch {
    return [];
  }
}

async function mineReferences(
  gap: AgencyGap
): Promise<Array<{ url: string; title: string | null }>> {
  const out: Array<{ url: string; title: string | null }> = [];
  const seen = new Set<string>();

  // Manifest URLs for same state that look agency-related
  try {
    const manifest = JSON.parse(
      await readFile(path.join(QUEUE_DIR, "manifest.json"), "utf-8")
    ) as Array<{
      id: string;
      pdfUrl: string | null;
      landingPageUrl: string | null;
      notes?: string;
      jurisdictionHint?: string;
    }>;
    for (const job of manifest) {
      const blob = `${job.id} ${job.notes ?? ""} ${job.jurisdictionHint ?? ""}`;
      const stateHint = gap.state_code.toLowerCase();
      if (
        !blob.toLowerCase().includes(stateHint) &&
        !job.id.endsWith(`-${stateHint}`) &&
        !job.id.startsWith(`${stateHint}-`)
      ) {
        continue;
      }
      for (const u of [job.pdfUrl, job.landingPageUrl]) {
        if (!u || seen.has(u)) continue;
        const host = (() => {
          try {
            return new URL(u).hostname;
          } catch {
            return "";
          }
        })();
        const domainHit = gap.domains.some((d) => host.includes(d));
        const catHit =
          gap.agency_category === "dot"
            ? /dot|transport/i.test(u + blob)
            : /dep|deq|dnr|dec|epa|ecology|environmental/i.test(u + blob);
        if (domainHit || catHit) {
          seen.add(u);
          out.push({ url: u, title: job.id });
        }
      }
    }
  } catch {
    /* ignore */
  }

  // Document source URLs + evidence excerpts mentioning agency
  try {
    const { readdirSync } = await import("node:fs");
    const files = readdirSync(DOCUMENTS_DIR).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      const raw = JSON.parse(
        await readFile(path.join(DOCUMENTS_DIR, file), "utf-8")
      ) as {
        document_metadata?: { state_code?: string | null };
        source?: {
          document_url?: string | null;
          landing_page_url?: string | null;
        };
        evidence?: Array<{ excerpt?: string }>;
      };
      if (raw.document_metadata?.state_code !== gap.state_code) continue;
      for (const u of [
        raw.source?.document_url,
        raw.source?.landing_page_url,
      ]) {
        if (!u || seen.has(u)) continue;
        try {
          const host = new URL(u).hostname;
          if (gap.domains.some((d) => host.includes(d))) {
            seen.add(u);
            out.push({ url: u, title: file.replace(/\.json$/, "") });
          }
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }

  return out;
}

async function discoverForGap(
  gap: AgencyGap,
  opts: { dryRun: boolean; skipValidate: boolean }
): Promise<GapCandidates> {
  const candidates: CandidateUrl[] = [];
  const seen = new Set<string>();

  const push = async (
    url: string,
    title: string | null,
    source: CandidateUrl["source"]
  ) => {
    if (seen.has(url) || candidates.length >= MAX_CANDIDATES_PER_GAP) return;
    seen.add(url);
    const confidence = scoreCandidate(url, title, gap, source);
    let fetch_ok: boolean | null = null;
    let error: string | undefined;
    if (!opts.dryRun && !opts.skipValidate && /\.pdf(\?|$)/i.test(url)) {
      await sleep(DELAY_MS);
      const v = await validatePdfUrl(url);
      fetch_ok = v.ok;
      error = v.error;
    }
    candidates.push({
      url,
      title_guess: title,
      source,
      confidence,
      fetch_ok,
      error,
    });
  };

  // 1. Landing page PDF extraction
  if (gap.landing_page_url && !opts.dryRun) {
    try {
      await sleep(DELAY_MS);
      const { ok, text, contentType } = await fetchText(gap.landing_page_url);
      if (ok && contentType.includes("html")) {
        const links = extractPdfLinks(text, gap.landing_page_url);
        for (const link of links) {
          await push(link.url, link.title_guess, "landing_page");
        }
      } else if (ok && (contentType.includes("pdf") || gap.landing_page_url.toLowerCase().includes(".pdf"))) {
        await push(gap.landing_page_url, gap.expected_title, "landing_page");
      }
    } catch (e) {
      console.warn(
        `  landing page fetch failed (${gap.expected_id}): ${
          e instanceof Error ? e.message : e
        }`
      );
    }
  } else if (gap.landing_page_url && opts.dryRun) {
    candidates.push({
      url: gap.landing_page_url,
      title_guess: "landing page (dry-run, not fetched)",
      source: "landing_page",
      confidence: "medium",
      fetch_ok: null,
    });
  }

  // 2. Site-restricted / general search
  if (!opts.dryRun) {
    const queries = [
      ...(gap.search_queries ?? []),
      ...gap.domains.map(
        (d) => `site:${d} ${gap.expected_title} filetype:pdf`
      ),
    ].slice(0, 3);

    for (const q of queries) {
      await sleep(DELAY_MS);
      const results = await searchDuckDuckGo(q);
      for (const r of results) {
        await push(r.url, r.title, "search");
      }
    }
  }

  // 3. Reference mining
  const refs = await mineReferences(gap);
  for (const r of refs) {
    await push(r.url, r.title, "reference");
  }

  return {
    state_code: gap.state_code,
    agency_category: gap.agency_category,
    agency_abbrev: gap.agency_abbrev,
    expected_id: gap.expected_id,
    expected_title: gap.expected_title,
    reason: gap.reason,
    landing_page_url: gap.landing_page_url,
    domains: gap.domains,
    candidates,
  };
}

async function main() {
  const { category, state, dryRun, skipValidate, limit } = parseArgs(
    process.argv.slice(2)
  );
  await mkdir(AGENCY_DIR, { recursive: true });

  // Prefer existing gaps.json if present and filters match loosely; else rebuild
  let gaps: AgencyGap[];
  const gapsPath = path.join(AGENCY_DIR, "gaps.json");
  if (existsSync(gapsPath) && !state && category === "all") {
    const raw = JSON.parse(await readFile(gapsPath, "utf-8")) as {
      gaps: AgencyGap[];
    };
    gaps = raw.gaps ?? [];
  } else {
    const report = buildAgencyCoverageReport({ category, state });
    gaps = agencyGapsForDiscover(report, { category, state });
  }

  // Prioritize missing > partial > others; DOT first when mixed
  gaps.sort((a, b) => {
    const order = (r: string) =>
      r === "missing" ? 0 : r === "partial" ? 1 : r === "manifest_only" ? 2 : 3;
    return (
      order(a.reason) - order(b.reason) ||
      a.agency_category.localeCompare(b.agency_category) ||
      a.state_code.localeCompare(b.state_code)
    );
  });

  const selected = gaps.slice(0, limit);
  console.log(
    `Agency discover: ${selected.length} gaps (of ${gaps.length})` +
      (dryRun ? " [dry-run]" : "")
  );

  const results: GapCandidates[] = [];
  for (const gap of selected) {
    console.log(
      `  ${gap.state_code} ${gap.agency_category} — ${gap.expected_title} (${gap.reason})`
    );
    const row = await discoverForGap(gap, { dryRun, skipValidate });
    console.log(`    → ${row.candidates.length} candidate(s)`);
    results.push(row);
  }

  const outPath = path.join(AGENCY_DIR, "candidates.json");
  const payload = {
    generatedAt: new Date().toISOString(),
    filters: { category, state, dryRun, skipValidate, limit },
    count: results.length,
    results,
  };
  await writeFile(outPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
  console.log(`Wrote ${outPath}`);
  console.log(
    "Review candidates, then add approved PDFs to data/queue/manifest.json (do not auto-ingest)."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
