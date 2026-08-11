/**
 * Agency manual gap detection — compare statewide DOT/DEP registry
 * against queue manifest + ingested documents.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getAllManuals } from "./data";
import {
  inferAgencyCategory,
  type AgencyCategory,
} from "./agencyTypes";
import type { ManifestJob, ProgressEntry, ProgressMap } from "./coverage";

export type AgencyGapReason =
  | "missing"
  | "manifest_only"
  | "partial"
  | "skipped"
  | "superseded"
  | "unavailable"
  | "covered";

export type ManualScope =
  | "full_manual"
  | "drainage"
  | "construction_esc"
  | "post_construction";

export interface ExpectedManual {
  id: string;
  title: string;
  scope: ManualScope;
  landing_page_url: string | null;
  search_queries: string[];
  known_slugs: string[];
  /** True when known_slugs are chapter/partial proxies, not full manuals */
  partial?: boolean;
  /** Treat partial known_slug as covered (best available public PDF). */
  accept_partial?: boolean;
  /** No public statewide design-manual PDF; not an actionable gap. */
  unavailable?: boolean;
  unavailable_reason?: string | null;
}

export interface AgencyRegistryEntry {
  state_code: string;
  agency_category: "dot" | "dep_deq";
  agency_name: string;
  agency_abbrev: string;
  domains: string[];
  expected_manuals: ExpectedManual[];
  notes: string | null;
}

export interface AgencyRegistryFile {
  version: number;
  generated_at?: string;
  title?: string;
  agencies: AgencyRegistryEntry[];
}

export interface AgencyGap {
  state_code: string;
  agency_category: "dot" | "dep_deq";
  agency_name: string;
  agency_abbrev: string;
  expected_id: string;
  expected_title: string;
  scope: ManualScope;
  reason: AgencyGapReason;
  matching_slugs: string[];
  matching_manifest_ids: string[];
  landing_page_url: string | null;
  search_queries: string[];
  suggested_manifest_id: string;
  notes: string;
  domains: string[];
}

export interface ReferencedButNotCataloged {
  state_code: string | null;
  agency_category: AgencyCategory | null;
  citing_slug: string;
  citation_text: string;
  field: string;
}

export interface AgencyCoverageReport {
  generatedAt: string;
  summary: {
    expected: number;
    covered: number;
    partial: number;
    gaps: number;
    byCategory: { dot: number; dep_deq: number };
    byReason: Record<AgencyGapReason, number>;
    referenced_but_not_cataloged: number;
  };
  rows: AgencyGap[];
  referenced_but_not_cataloged: ReferencedButNotCataloged[];
}

const AGENCY_DIR = path.resolve(process.cwd(), "data/agency-targets");
const QUEUE_DIR = path.resolve(process.cwd(), "data/queue");
const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");

function loadJsonFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

export function loadAgencyRegistry(): AgencyRegistryFile {
  return loadJsonFile<AgencyRegistryFile>(
    path.join(AGENCY_DIR, "registry.json"),
    { version: 1, agencies: [] }
  );
}

function loadManifest(): ManifestJob[] {
  return loadJsonFile<ManifestJob[]>(path.join(QUEUE_DIR, "manifest.json"), []);
}

function loadProgress(): ProgressMap {
  return loadJsonFile<ProgressMap>(path.join(QUEUE_DIR, "progress.json"), {});
}

function documentSlugsOnDisk(): Set<string> {
  try {
    return new Set(
      readdirSync(DOCUMENTS_DIR)
        .filter((f) => f.endsWith(".json"))
        .map((f) => f.replace(/\.json$/, ""))
    );
  } catch {
    return new Set();
  }
}

function suggestedManifestId(
  stateCode: string,
  category: "dot" | "dep_deq",
  expectedId: string
): string {
  if (expectedId.includes("-")) return expectedId;
  const prefix = stateCode.toLowerCase();
  return category === "dot"
    ? `${prefix}-dot-${expectedId}`
    : `${prefix}-state-${expectedId}`;
}

function classifyExpected(
  expected: ExpectedManual,
  stateCode: string,
  category: "dot" | "dep_deq",
  docs: Set<string>,
  manifestById: Map<string, ManifestJob>,
  progress: ProgressMap
): Omit<
  AgencyGap,
  | "state_code"
  | "agency_category"
  | "agency_name"
  | "agency_abbrev"
  | "landing_page_url"
  | "search_queries"
  | "domains"
> {
  const known = expected.known_slugs ?? [];
  const matching_slugs = known.filter((s) => docs.has(s));
  const matching_manifest_ids = known.filter((s) => manifestById.has(s));

  // Also match any manifest job whose id equals expected.id
  if (manifestById.has(expected.id) && !matching_manifest_ids.includes(expected.id)) {
    matching_manifest_ids.push(expected.id);
  }
  if (docs.has(expected.id) && !matching_slugs.includes(expected.id)) {
    matching_slugs.push(expected.id);
  }

  if (expected.unavailable) {
    return {
      expected_id: expected.id,
      expected_title: expected.title,
      scope: expected.scope,
      reason: "unavailable",
      matching_slugs,
      matching_manifest_ids,
      suggested_manifest_id: suggestedManifestId(
        stateCode,
        category,
        expected.id
      ),
      notes:
        expected.unavailable_reason ??
        "No public statewide design-manual PDF available",
    };
  }

  const progressEntries = matching_manifest_ids
    .map((id) => progress[id])
    .filter(Boolean) as ProgressEntry[];

  const anySkipped = progressEntries.some((p) => p.status === "skipped");
  const anyDone =
    matching_slugs.length > 0 ||
    progressEntries.some((p) => p.status === "done");
  const anyManifest = matching_manifest_ids.length > 0;
  const notesParts: string[] = [];

  // Supersession: skipped with replacement note
  for (const id of matching_manifest_ids) {
    const job = manifestById.get(id);
    const pe = progress[id];
    if (pe?.status === "skipped") {
      const err = pe.error ?? job?.notes ?? "";
      if (/supersed/i.test(err) || /replaced by/i.test(err)) {
        return {
          expected_id: expected.id,
          expected_title: expected.title,
          scope: expected.scope,
          reason: "superseded",
          matching_slugs,
          matching_manifest_ids,
          suggested_manifest_id: suggestedManifestId(
            stateCode,
            category,
            expected.id
          ),
          notes: err || `Skipped: ${id}`,
        };
      }
    }
  }

  if (anySkipped && !anyDone && matching_slugs.length === 0) {
    return {
      expected_id: expected.id,
      expected_title: expected.title,
      scope: expected.scope,
      reason: "skipped",
      matching_slugs,
      matching_manifest_ids,
      suggested_manifest_id: suggestedManifestId(
        stateCode,
        category,
        expected.id
      ),
      notes:
        progressEntries.find((p) => p.status === "skipped")?.error ??
        "Queue job skipped",
    };
  }

  if (matching_slugs.length > 0) {
    if (expected.partial && !expected.accept_partial) {
      notesParts.push("Known slug(s) are chapter/partial proxies");
      return {
        expected_id: expected.id,
        expected_title: expected.title,
        scope: expected.scope,
        reason: "partial",
        matching_slugs,
        matching_manifest_ids,
        suggested_manifest_id: suggestedManifestId(
          stateCode,
          category,
          expected.id
        ),
        notes: notesParts.join("; "),
      };
    }
    return {
      expected_id: expected.id,
      expected_title: expected.title,
      scope: expected.scope,
      reason: "covered",
      matching_slugs,
      matching_manifest_ids,
      suggested_manifest_id: matching_slugs[0]!,
      notes: expected.partial
        ? "Best-available public PDF accepted (partial scope)"
        : "Document ingested",
    };
  }

  if (anyManifest) {
    return {
      expected_id: expected.id,
      expected_title: expected.title,
      scope: expected.scope,
      reason: "manifest_only",
      matching_slugs,
      matching_manifest_ids,
      suggested_manifest_id: matching_manifest_ids[0]!,
      notes: "In queue but no atlas document yet",
    };
  }

  return {
    expected_id: expected.id,
    expected_title: expected.title,
    scope: expected.scope,
    reason: "missing",
    matching_slugs,
    matching_manifest_ids,
    suggested_manifest_id: suggestedManifestId(
      stateCode,
      category,
      expected.id
    ),
    notes: "Not in manifest or documents",
  };
}

const DOT_CITE_RE =
  /\b(VDOT|TxDOT|FDOT|GDOT|NCDOT|WSDOT|Caltrans|PennDOT|MassDOT|ODOT|NDOT|WYDOT|SDDOT|ALDOT|ADOT|INDOT|IDOT|KDOT|MDOT|MnDOT|MoDOT|TDOT|UDOT|CDOT|NJDOT|NYSDOT|SCDOT|LADOTD|DelDOT|WisDOT|Drainage Manual|Highway Runoff Manual)\b/i;

const DEP_CITE_RE =
  /\b(DEQ|DEP|DNR|DEC|EGLE|DNREC|TCEQ|MassDEP|NJDEP|NCDEQ|MPCA|MDEQ|WDNR|NYSDEC|Stormwater Design Manual|BMP Manual|BMP Clearinghouse|Stormwater Handbook)\b/i;

export function findReferencedButNotCataloged(
  catalogedSlugs: Set<string>,
  catalogedNames: Set<string>
): ReferencedButNotCataloged[] {
  const out: ReferencedButNotCataloged[] = [];
  const seen = new Set<string>();

  for (const manual of getAllManuals()) {
    const state = manual.data.document_metadata.state_code;
    const texts: Array<{ field: string; text: string }> = [
      {
        field: "document_title",
        text: manual.data.document_metadata.document_title,
      },
      {
        field: "review_notes",
        text: manual.data.extraction_quality.review_notes ?? "",
      },
    ];
    for (const ev of manual.data.evidence) {
      texts.push({ field: ev.field, text: ev.excerpt });
      if (ev.page_or_section) {
        texts.push({ field: `${ev.field}.page`, text: ev.page_or_section });
      }
    }

    for (const { field, text } of texts) {
      if (!text) continue;
      const isDot = DOT_CITE_RE.test(text);
      const isDep = DEP_CITE_RE.test(text);
      if (!isDot && !isDep) continue;

      // Skip self-references for state agency docs
      const ownCat = inferAgencyCategory({
        slug: manual.slug,
        jurisdictionName: manual.data.document_metadata.jurisdiction_name,
        documentTitle: manual.data.document_metadata.document_title,
      });
      if (ownCat === "dot" && isDot) continue;
      if (ownCat === "dep_deq" && isDep) continue;

      const match =
        text.match(DOT_CITE_RE)?.[0] ?? text.match(DEP_CITE_RE)?.[0] ?? "";
      const key = `${manual.slug}|${match}|${field}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // If citation looks like a known cataloged agency name, skip
      const lower = match.toLowerCase();
      let cataloged = false;
      for (const name of catalogedNames) {
        if (name.includes(lower) || lower.includes(name)) {
          cataloged = true;
          break;
        }
      }
      // Also skip if any cataloged slug in same state is that agency type
      if (!cataloged && state) {
        // keep as reference signal — agent can triage
      }

      out.push({
        state_code: state,
        agency_category: isDot ? "dot" : "dep_deq",
        citing_slug: manual.slug,
        citation_text: text.slice(0, 200),
        field,
      });
    }
  }

  // Prefer unique citation tokens per state
  return out.slice(0, 200);
}

export function buildAgencyCoverageReport(opts?: {
  category?: "dot" | "dep_deq" | "all";
  state?: string | null;
}): AgencyCoverageReport {
  const registry = loadAgencyRegistry();
  const manifest = loadManifest();
  const progress = loadProgress();
  const docs = documentSlugsOnDisk();
  const manifestById = new Map(manifest.map((j) => [j.id, j]));

  const categoryFilter = opts?.category ?? "all";
  const stateFilter = opts?.state?.toUpperCase() ?? null;

  const rows: AgencyGap[] = [];
  const catalogedNames = new Set<string>();

  for (const agency of registry.agencies) {
    if (categoryFilter !== "all" && agency.agency_category !== categoryFilter) {
      continue;
    }
    if (stateFilter && agency.state_code !== stateFilter) continue;

    for (const expected of agency.expected_manuals) {
      const classified = classifyExpected(
        expected,
        agency.state_code,
        agency.agency_category,
        docs,
        manifestById,
        progress
      );
      const noteParts = [classified.notes, agency.notes].filter(Boolean);
      rows.push({
        state_code: agency.state_code,
        agency_category: agency.agency_category,
        agency_name: agency.agency_name,
        agency_abbrev: agency.agency_abbrev,
        expected_id: classified.expected_id,
        expected_title: classified.expected_title,
        scope: classified.scope,
        reason: classified.reason,
        matching_slugs: classified.matching_slugs,
        matching_manifest_ids: classified.matching_manifest_ids,
        landing_page_url: expected.landing_page_url,
        search_queries: expected.search_queries,
        suggested_manifest_id: classified.suggested_manifest_id,
        notes: noteParts.join(" — "),
        domains: agency.domains,
      });

      for (const s of classified.matching_slugs) {
        catalogedNames.add(s.toLowerCase());
        catalogedNames.add(agency.agency_abbrev.toLowerCase());
        catalogedNames.add(agency.agency_name.toLowerCase());
      }
    }
  }

  const byReason: Record<AgencyGapReason, number> = {
    missing: 0,
    manifest_only: 0,
    partial: 0,
    skipped: 0,
    superseded: 0,
    unavailable: 0,
    covered: 0,
  };
  const byCategory = { dot: 0, dep_deq: 0 };
  for (const r of rows) {
    byReason[r.reason] += 1;
    if (r.reason !== "covered" && r.reason !== "unavailable" && r.reason !== "superseded") {
      byCategory[r.agency_category] += 1;
    }
  }

  const referenced = findReferencedButNotCataloged(docs, catalogedNames);

  const gapRows = rows.filter(
    (r) =>
      r.reason !== "covered" &&
      r.reason !== "unavailable" &&
      r.reason !== "superseded"
  );

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      expected: rows.length,
      covered: byReason.covered,
      partial: byReason.partial,
      gaps: gapRows.length,
      byCategory,
      byReason,
      referenced_but_not_cataloged: referenced.length,
    },
    rows,
    referenced_but_not_cataloged: referenced,
  };
}

export function renderAgencyCoverageMarkdown(
  report: AgencyCoverageReport
): string {
  const lines: string[] = [];
  lines.push("# Agency Manual Coverage Report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`| Metric | Count |`);
  lines.push(`|--------|------:|`);
  lines.push(`| Expected manuals | ${report.summary.expected} |`);
  lines.push(`| Covered (full) | ${report.summary.covered} |`);
  lines.push(`| Partial (chapter proxy) | ${report.summary.partial} |`);
  lines.push(`| Unavailable (no public PDF) | ${report.summary.byReason.unavailable ?? 0} |`);
  lines.push(`| Gaps (actionable) | ${report.summary.gaps} |`);
  lines.push(`| DOT gaps | ${report.summary.byCategory.dot} |`);
  lines.push(`| DEP/DEQ gaps | ${report.summary.byCategory.dep_deq} |`);
  lines.push(
    `| Referenced but not cataloged | ${report.summary.referenced_but_not_cataloged} |`
  );
  lines.push("");
  lines.push("### By reason");
  lines.push("");
  for (const [reason, count] of Object.entries(report.summary.byReason)) {
    lines.push(`- **${reason}**: ${count}`);
  }
  lines.push("");

  const gaps = report.rows.filter(
    (r) =>
      r.reason !== "covered" &&
      r.reason !== "unavailable" &&
      r.reason !== "superseded"
  );
  lines.push("## Gaps");
  lines.push("");
  lines.push(
    "| State | Category | Agency | Expected | Scope | Reason | Slugs | Suggested ID |"
  );
  lines.push(
    "|-------|----------|--------|----------|-------|--------|-------|--------------|"
  );
  for (const g of gaps) {
    lines.push(
      `| ${g.state_code} | ${g.agency_category} | ${g.agency_abbrev} | ${g.expected_title.replace(/\|/g, "/")} | ${g.scope} | ${g.reason} | ${g.matching_slugs.join(", ") || "—"} | \`${g.suggested_manifest_id}\` |`
    );
  }
  lines.push("");

  if (report.referenced_but_not_cataloged.length > 0) {
    lines.push("## Referenced but not cataloged");
    lines.push("");
    lines.push(
      "Citations in city/county manuals that mention DOT/DEP manuals which may not be ingested:"
    );
    lines.push("");
    lines.push("| State | Category | Citing slug | Field | Excerpt |");
    lines.push("|-------|----------|-------------|-------|---------|");
    for (const r of report.referenced_but_not_cataloged.slice(0, 80)) {
      const excerpt = r.citation_text.replace(/\|/g, "/").replace(/\n/g, " ");
      lines.push(
        `| ${r.state_code ?? "—"} | ${r.agency_category ?? "—"} | ${r.citing_slug} | ${r.field} | ${excerpt.slice(0, 120)} |`
      );
    }
    lines.push("");
  }

  lines.push("## Covered");
  lines.push("");
  const covered = report.rows.filter((r) => r.reason === "covered");
  for (const c of covered) {
    lines.push(
      `- **${c.state_code}** ${c.agency_abbrev}: ${c.expected_title} → \`${c.matching_slugs.join(", ")}\``
    );
  }
  lines.push("");
  return lines.join("\n");
}

/** Gap rows only (for discover script). */
export function agencyGapsForDiscover(
  report: AgencyCoverageReport,
  opts?: { category?: "dot" | "dep_deq" | "all"; state?: string | null }
): AgencyGap[] {
  const category = opts?.category ?? "all";
  const state = opts?.state?.toUpperCase() ?? null;
  return report.rows.filter((r) => {
    if (r.reason === "covered" || r.reason === "unavailable" || r.reason === "superseded")
      return false;
    if (category !== "all" && r.agency_category !== category) return false;
    if (state && r.state_code !== state) return false;
    return true;
  });
}
