/**
 * Coverage gap detection — compare ingested manuals + queue manifest
 * against target jurisdictions (top cities, capitals, MS4 permittees).
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { getAllManuals, type ManualRecord } from "./data";

export type CoverageTier = "queue" | "p1" | "p2" | "p3";
export type GapReason =
  | "not_in_manifest"
  | "manifest_pending"
  | "no_document"
  | "skipped"
  | "state_only";

export type TargetSourceTag =
  | "top50"
  | "top100"
  | "capital"
  | "ms4_phase1"
  | "ms4_phase2"
  | "queue";

export interface ManifestJob {
  id: string;
  jurisdictionHint: string;
  levelHint: string;
  pdfUrl: string | null;
  landingPageUrl: string | null;
  cityCoords: [number, number] | null;
  notes?: string;
  agencyHint?: "dot" | "dep_deq" | null;
  scopeHint?: string | null;
}

export interface ProgressEntry {
  status: string;
  updatedAt?: string;
  error?: string | null;
  slug?: string | null;
}

export type ProgressMap = Record<string, ProgressEntry>;

export interface CoverageTarget {
  name: string;
  state_code: string;
  sources: TargetSourceTag[];
  population?: number | null;
  rank?: number | null;
  phase?: "I" | "II" | null;
  /** Optional queue job id when this target comes from the manifest */
  manifestId?: string | null;
}

export interface CoverageHit {
  key: string;
  slugs: string[];
  levels: string[];
  manifestIds: string[];
  names: string[];
  hasLocalityDoc: boolean;
  hasStateOnly: boolean;
  hasManifest: boolean;
}

export type CoverageIndex = Map<string, CoverageHit>;

export interface CoverageGap {
  jurisdiction: string;
  state_code: string;
  tier: CoverageTier;
  reason: GapReason;
  sources: TargetSourceTag[];
  suggestedSlug: string;
  notes: string;
  population?: number | null;
  rank?: number | null;
  manifestId?: string | null;
  matchingStateSlugs?: string[];
}

export interface QueueGap {
  id: string;
  jurisdictionHint: string;
  levelHint: string;
  status: string;
  reason: GapReason;
  notes: string;
  hasDocument: boolean;
}

export interface CoverageReport {
  generatedAt: string;
  summary: {
    targets: number;
    covered: number;
    gaps: number;
    byTier: Record<CoverageTier, number>;
    queueGaps: number;
  };
  gaps: CoverageGap[];
  queueGaps: QueueGap[];
  covered: Array<{
    jurisdiction: string;
    state_code: string;
    sources: TargetSourceTag[];
    slugs: string[];
  }>;
}

const COVERAGE_DIR = path.resolve(process.cwd(), "data/coverage");
const QUEUE_DIR = path.resolve(process.cwd(), "data/queue");
const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");

const PREFIX_RE =
  /^(city and county of|city of|town of|village of|borough of|municipality of|county of|parish of|the\s+)/i;

function loadJsonFile<T>(filePath: string, fallback: T): T {
  if (!existsSync(filePath)) return fallback;
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

/** Normalize a jurisdiction name for matching. */
export function normalizeName(name: string): string {
  let n = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['']/g, "")
    .replace(/&/g, " and ")
    .trim();

  // Strip common prefixes repeatedly
  let prev = "";
  while (n !== prev) {
    prev = n;
    n = n.replace(PREFIX_RE, "").trim();
  }

  n = n
    .replace(/\bst\b\.?/g, "st.")
    .replace(/\bft\b\.?/g, "fort")
    .replace(/[^a-z0-9.\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return n;
}

/** Canonical coverage key: `normalized-name|ST`. */
export function normalizeJurisdictionKey(
  name: string,
  stateCode: string | null | undefined
): string {
  const state = (stateCode ?? "").toUpperCase().trim() || "??";
  return `${normalizeName(name)}|${state}`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function suggestSlug(name: string, stateCode: string): string {
  const base = slugify(name) || "jurisdiction";
  return `${base}-${stateCode.toLowerCase()}`;
}

function applyAlias(
  key: string,
  aliases: Record<string, string>
): string {
  const aliased = aliases[key];
  if (!aliased) return key;
  // Alias values are already `name|ST`
  const [namePart, statePart] = aliased.split("|");
  if (!namePart || !statePart) return key;
  return normalizeJurisdictionKey(namePart, statePart);
}

function ensureHit(index: CoverageIndex, key: string): CoverageHit {
  let hit = index.get(key);
  if (!hit) {
    hit = {
      key,
      slugs: [],
      levels: [],
      manifestIds: [],
      names: [],
      hasLocalityDoc: false,
      hasStateOnly: false,
      hasManifest: false,
    };
    index.set(key, hit);
  }
  return hit;
}

function addNameVariant(
  index: CoverageIndex,
  name: string,
  stateCode: string | null,
  aliases: Record<string, string>,
  mutator: (hit: CoverageHit) => void
): void {
  if (!name) return;
  const rawKey = normalizeJurisdictionKey(name, stateCode);
  const key = applyAlias(rawKey, aliases);
  const hit = ensureHit(index, key);
  if (!hit.names.includes(name)) hit.names.push(name);
  mutator(hit);

  // Also index the pre-alias key so lookups from either side work
  if (key !== rawKey) {
    const aliasHit = ensureHit(index, rawKey);
    // Point alias entry at same coverage by merging refs
    for (const s of hit.slugs) {
      if (!aliasHit.slugs.includes(s)) aliasHit.slugs.push(s);
    }
    for (const l of hit.levels) {
      if (!aliasHit.levels.includes(l)) aliasHit.levels.push(l);
    }
    for (const id of hit.manifestIds) {
      if (!aliasHit.manifestIds.includes(id)) aliasHit.manifestIds.push(id);
    }
    aliasHit.hasLocalityDoc ||= hit.hasLocalityDoc;
    aliasHit.hasStateOnly ||= hit.hasStateOnly;
    aliasHit.hasManifest ||= hit.hasManifest;
  }
}

const LOCALITY_LEVELS = new Set([
  "municipality",
  "county",
  "special_district",
  "tribal",
  "other",
]);

export function buildCoverageIndex(opts: {
  manifest?: ManifestJob[];
  documents?: ManualRecord[];
  progress?: ProgressMap;
  aliases?: Record<string, string>;
}): CoverageIndex {
  const manifest =
    opts.manifest ??
    loadJsonFile<ManifestJob[]>(path.join(QUEUE_DIR, "manifest.json"), []);
  const documents = opts.documents ?? getAllManuals();
  const aliases =
    opts.aliases ??
    loadJsonFile<{ aliases: Record<string, string> }>(
      path.join(COVERAGE_DIR, "aliases.json"),
      { aliases: {} }
    ).aliases;

  const index: CoverageIndex = new Map();

  for (const doc of documents) {
    const { jurisdiction_name, jurisdiction_level, state_code } =
      doc.data.document_metadata;
    addNameVariant(index, jurisdiction_name, state_code, aliases, (hit) => {
      if (!hit.slugs.includes(doc.slug)) hit.slugs.push(doc.slug);
      if (!hit.levels.includes(jurisdiction_level)) {
        hit.levels.push(jurisdiction_level);
      }
      if (jurisdiction_level === "state") {
        hit.hasStateOnly = true;
      } else if (LOCALITY_LEVELS.has(jurisdiction_level)) {
        hit.hasLocalityDoc = true;
      }
    });
  }

  for (const job of manifest) {
    // Infer state from id suffix when possible (e.g. san-diego-ca, portland-or)
    const stateFromId = job.id.match(/-([a-z]{2})(?:-\d+)?$/i)?.[1]?.toUpperCase();
    const stateGuess =
      job.levelHint === "state"
        ? guessStateCode(job.jurisdictionHint) ?? stateFromId ?? null
        : stateFromId ?? guessStateCode(job.jurisdictionHint) ?? null;

    addNameVariant(
      index,
      job.jurisdictionHint,
      stateGuess,
      aliases,
      (hit) => {
        if (!hit.manifestIds.includes(job.id)) hit.manifestIds.push(job.id);
        hit.hasManifest = true;
        if (!hit.levels.includes(job.levelHint)) {
          hit.levels.push(job.levelHint);
        }
        if (job.levelHint === "state") {
          hit.hasStateOnly = true;
        } else if (LOCALITY_LEVELS.has(job.levelHint)) {
          // Manifest locality counts as "in pipeline" even without a doc yet
          // for matching purposes — coverage still requires a document for
          // "covered", but hasManifest lets us classify gap reason.
        }
      }
    );

    // Also index by slug-like id stem without state suffix
    const stem = job.id.replace(/-[a-z]{2}(?:-\d+)?$/i, "").replace(/-/g, " ");
    if (stem && stem !== normalizeName(job.jurisdictionHint)) {
      addNameVariant(index, stem, stateGuess, aliases, (hit) => {
        if (!hit.manifestIds.includes(job.id)) hit.manifestIds.push(job.id);
        hit.hasManifest = true;
      });
    }
  }

  return index;
}

const STATE_NAMES: Record<string, string> = {
  alabama: "AL",
  alaska: "AK",
  arizona: "AZ",
  arkansas: "AR",
  california: "CA",
  colorado: "CO",
  connecticut: "CT",
  delaware: "DE",
  florida: "FL",
  georgia: "GA",
  hawaii: "HI",
  idaho: "ID",
  illinois: "IL",
  indiana: "IN",
  iowa: "IA",
  kansas: "KS",
  kentucky: "KY",
  louisiana: "LA",
  maine: "ME",
  maryland: "MD",
  massachusetts: "MA",
  michigan: "MI",
  minnesota: "MN",
  mississippi: "MS",
  missouri: "MO",
  montana: "MT",
  nebraska: "NE",
  nevada: "NV",
  "new hampshire": "NH",
  "new jersey": "NJ",
  "new mexico": "NM",
  "new york": "NY",
  "north carolina": "NC",
  "north dakota": "ND",
  ohio: "OH",
  oklahoma: "OK",
  oregon: "OR",
  pennsylvania: "PA",
  "rhode island": "RI",
  "south carolina": "SC",
  "south dakota": "SD",
  tennessee: "TN",
  texas: "TX",
  utah: "UT",
  vermont: "VT",
  virginia: "VA",
  washington: "WA",
  "west virginia": "WV",
  wisconsin: "WI",
  wyoming: "WY",
  "district of columbia": "DC",
};

function guessStateCode(hint: string): string | null {
  const n = normalizeName(hint);
  return STATE_NAMES[n] ?? null;
}

export function matchTarget(
  target: CoverageTarget,
  index: CoverageIndex,
  aliases?: Record<string, string>
): CoverageHit | null {
  const aliasMap =
    aliases ??
    loadJsonFile<{ aliases: Record<string, string> }>(
      path.join(COVERAGE_DIR, "aliases.json"),
      { aliases: {} }
    ).aliases;

  const rawKey = normalizeJurisdictionKey(target.name, target.state_code);
  const key = applyAlias(rawKey, aliasMap);

  const hit = index.get(key) ?? index.get(rawKey) ?? null;
  if (hit) return hit;

  // Soft containment: e.g. "Charlotte-Mecklenburg" contains "charlotte"
  const targetNorm = normalizeName(target.name);
  const state = target.state_code.toUpperCase();
  for (const [k, h] of index) {
    if (!k.endsWith(`|${state}`)) continue;
    const namePart = k.split("|")[0] ?? "";
    if (
      namePart === targetNorm ||
      namePart.includes(targetNorm) ||
      targetNorm.includes(namePart)
    ) {
      // Avoid matching very short names (e.g. "la")
      if (Math.min(namePart.length, targetNorm.length) < 4) continue;
      return h;
    }
  }
  return null;
}

function documentExists(id: string): boolean {
  return existsSync(path.join(DOCUMENTS_DIR, `${id}.json`));
}

function listDocumentSlugs(): Set<string> {
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

export function findQueueGaps(
  manifest: ManifestJob[],
  progress: ProgressMap
): QueueGap[] {
  const gaps: QueueGap[] = [];
  const docs = listDocumentSlugs();

  for (const job of manifest) {
    const hasDocument = docs.has(job.id);
    const st = progress[job.id]?.status ?? "pending";
    const err = progress[job.id]?.error ?? null;

    if (hasDocument) {
      // Document exists — not a content gap (progress sync is separate)
      continue;
    }

    if (st === "skipped") {
      gaps.push({
        id: job.id,
        jurisdictionHint: job.jurisdictionHint,
        levelHint: job.levelHint,
        status: st,
        reason: "skipped",
        notes: err ?? job.notes ?? "skipped",
        hasDocument: false,
      });
      continue;
    }

    if (st === "pending" || st === "downloading" || st === "deferred") {
      gaps.push({
        id: job.id,
        jurisdictionHint: job.jurisdictionHint,
        levelHint: job.levelHint,
        status: st,
        reason: "manifest_pending",
        notes: `Manifest job status=${st}`,
        hasDocument: false,
      });
      continue;
    }

    if (st === "prepared") {
      gaps.push({
        id: job.id,
        jurisdictionHint: job.jurisdictionHint,
        levelHint: job.levelHint,
        status: st,
        reason: "no_document",
        notes: "Prepared text awaiting Cursor extraction",
        hasDocument: false,
      });
      continue;
    }

    if (st === "done" && !hasDocument) {
      gaps.push({
        id: job.id,
        jurisdictionHint: job.jurisdictionHint,
        levelHint: job.levelHint,
        status: st,
        reason: "no_document",
        notes: "Marked done in progress but document file missing",
        hasDocument: false,
      });
    }
  }

  return gaps;
}

function assignTier(target: CoverageTarget): CoverageTier {
  if (target.manifestId) return "queue";
  const sources = new Set(target.sources);
  if (
    sources.has("top50") ||
    sources.has("capital") ||
    sources.has("ms4_phase1")
  ) {
    return "p1";
  }
  if (sources.has("top100") || sources.has("ms4_phase2")) {
    // Phase II with pop >= 50k is P2; smaller is P3
    if (sources.has("ms4_phase2") && !sources.has("top100")) {
      const pop = target.population ?? 0;
      if (pop > 0 && pop < 50_000) return "p3";
    }
    return "p2";
  }
  return "p3";
}

export function loadTargets(opts?: {
  includeQueue?: boolean;
  manifest?: ManifestJob[];
}): CoverageTarget[] {
  const topCities = loadJsonFile<{
    cities: Array<{
      rank: number;
      name: string;
      state_code: string;
      population: number;
    }>;
  }>(path.join(COVERAGE_DIR, "top-cities.json"), { cities: [] });

  const capitals = loadJsonFile<{
    capitals: Array<{ name: string; state_code: string }>;
  }>(path.join(COVERAGE_DIR, "state-capitals.json"), { capitals: [] });

  const ms4 = loadJsonFile<{
    permittees: Array<{
      name: string;
      state_code: string;
      phase: "I" | "II";
      population: number | null;
      npdes_id: string | null;
    }>;
  }>(path.join(COVERAGE_DIR, "ms4-permittees.json"), { permittees: [] });

  const byKey = new Map<string, CoverageTarget>();

  function upsert(
    name: string,
    state: string,
    source: TargetSourceTag,
    extra?: Partial<CoverageTarget>
  ) {
    const key = normalizeJurisdictionKey(name, state);
    const existing = byKey.get(key);
    if (existing) {
      if (!existing.sources.includes(source)) existing.sources.push(source);
      if (extra?.population != null && existing.population == null) {
        existing.population = extra.population;
      }
      if (extra?.rank != null && existing.rank == null) {
        existing.rank = extra.rank;
      }
      if (extra?.phase) existing.phase = extra.phase;
      if (extra?.manifestId) existing.manifestId = extra.manifestId;
      return;
    }
    byKey.set(key, {
      name,
      state_code: state,
      sources: [source],
      population: extra?.population ?? null,
      rank: extra?.rank ?? null,
      phase: extra?.phase ?? null,
      manifestId: extra?.manifestId ?? null,
    });
  }

  for (const c of topCities.cities) {
    upsert(c.name, c.state_code, c.rank <= 50 ? "top50" : "top100", {
      population: c.population,
      rank: c.rank,
    });
  }

  for (const c of capitals.capitals) {
    upsert(c.name, c.state_code, "capital");
  }

  for (const p of ms4.permittees) {
    upsert(
      p.name,
      p.state_code,
      p.phase === "I" ? "ms4_phase1" : "ms4_phase2",
      { population: p.population, phase: p.phase }
    );
  }

  if (opts?.includeQueue) {
    const manifest =
      opts.manifest ??
      loadJsonFile<ManifestJob[]>(path.join(QUEUE_DIR, "manifest.json"), []);
    for (const job of manifest) {
      if (job.levelHint === "state") continue;
      const stateFromId = job.id
        .match(/-([a-z]{2})(?:-\d+)?$/i)?.[1]
        ?.toUpperCase();
      const state =
        stateFromId ?? guessStateCode(job.jurisdictionHint) ?? "??";
      upsert(job.jurisdictionHint, state, "queue", {
        manifestId: job.id,
      });
    }
  }

  return [...byKey.values()];
}

export function findCoverageGaps(
  targets: CoverageTarget[],
  index: CoverageIndex,
  aliases?: Record<string, string>
): { gaps: CoverageGap[]; covered: CoverageReport["covered"] } {
  const gaps: CoverageGap[] = [];
  const covered: CoverageReport["covered"] = [];

  for (const target of targets) {
    const hit = matchTarget(target, index, aliases);
    const tier = assignTier(target);

    if (hit?.hasLocalityDoc) {
      covered.push({
        jurisdiction: target.name,
        state_code: target.state_code,
        sources: target.sources,
        slugs: hit.slugs,
      });
      continue;
    }

    // Manifest locality without document → still a gap, but different reason
    if (hit?.hasManifest && !hit.hasLocalityDoc) {
      const docs = listDocumentSlugs();
      const hasAnyDoc = hit.manifestIds.some((id) => docs.has(id));
      if (hasAnyDoc) {
        // Document may be under a different slug than the locality key —
        // if any linked manifest id has a doc, treat as covered when the
        // document isn't state-level-only. Conservative: if hasLocalityDoc
        // is false but a doc exists for the job, check that job's file.
        covered.push({
          jurisdiction: target.name,
          state_code: target.state_code,
          sources: target.sources,
          slugs: hit.manifestIds.filter((id) => docs.has(id)),
        });
        continue;
      }

      gaps.push({
        jurisdiction: target.name,
        state_code: target.state_code,
        tier: tier === "queue" ? "queue" : tier,
        reason: "no_document",
        sources: target.sources,
        suggestedSlug:
          hit.manifestIds[0] ?? suggestSlug(target.name, target.state_code),
        notes: `In manifest (${hit.manifestIds.join(", ")}) but no locality document`,
        population: target.population,
        rank: target.rank,
        manifestId: hit.manifestIds[0] ?? target.manifestId ?? null,
        matchingStateSlugs: hit.hasStateOnly ? hit.slugs : [],
      });
      continue;
    }

    if (hit?.hasStateOnly && !hit.hasLocalityDoc) {
      gaps.push({
        jurisdiction: target.name,
        state_code: target.state_code,
        tier,
        reason: "state_only",
        sources: target.sources,
        suggestedSlug: suggestSlug(target.name, target.state_code),
        notes: `State-level manual(s) exist (${hit.slugs.join(", ")}) but no city/county manual`,
        population: target.population,
        rank: target.rank,
        matchingStateSlugs: hit.slugs,
      });
      continue;
    }

    gaps.push({
      jurisdiction: target.name,
      state_code: target.state_code,
      tier,
      reason: "not_in_manifest",
      sources: target.sources,
      suggestedSlug: suggestSlug(target.name, target.state_code),
      notes: "Not in manifest",
      population: target.population,
      rank: target.rank,
      manifestId: target.manifestId ?? null,
    });
  }

  const tierOrder: Record<CoverageTier, number> = {
    queue: 0,
    p1: 1,
    p2: 2,
    p3: 3,
  };
  gaps.sort(
    (a, b) =>
      tierOrder[a.tier] - tierOrder[b.tier] ||
      (b.population ?? 0) - (a.population ?? 0) ||
      a.jurisdiction.localeCompare(b.jurisdiction)
  );

  return { gaps, covered };
}

export function buildCoverageReport(opts?: {
  tierFilter?: CoverageTier | "all";
}): CoverageReport {
  const manifest = loadJsonFile<ManifestJob[]>(
    path.join(QUEUE_DIR, "manifest.json"),
    []
  );
  const progress = loadJsonFile<ProgressMap>(
    path.join(QUEUE_DIR, "progress.json"),
    {}
  );
  const aliases = loadJsonFile<{ aliases: Record<string, string> }>(
    path.join(COVERAGE_DIR, "aliases.json"),
    { aliases: {} }
  ).aliases;

  const index = buildCoverageIndex({ manifest, aliases });
  const targets = loadTargets();
  const { gaps: allGaps, covered } = findCoverageGaps(targets, index, aliases);
  const queueGaps = findQueueGaps(manifest, progress);

  const tierFilter = opts?.tierFilter ?? "all";
  const gaps =
    tierFilter === "all"
      ? allGaps
      : allGaps.filter((g) => g.tier === tierFilter);

  const byTier: Record<CoverageTier, number> = {
    queue: 0,
    p1: 0,
    p2: 0,
    p3: 0,
  };
  for (const g of allGaps) byTier[g.tier] += 1;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      targets: targets.length,
      covered: covered.length,
      gaps: allGaps.length,
      byTier,
      queueGaps: queueGaps.length,
    },
    gaps,
    queueGaps,
    covered,
  };
}

/** Top N P1 gaps for NOTES.md (jurisdiction not covered). */
export function formatP1GapLines(
  report: CoverageReport,
  limit = 10
): string[] {
  return report.gaps
    .filter((g) => g.tier === "p1")
    .slice(0, limit)
    .map(
      (g) =>
        `- **${g.jurisdiction}, ${g.state_code}** — ${g.reason} → suggested \`${g.suggestedSlug}\` (${g.sources.join(", ")})`
    );
}

export function renderCoverageMarkdown(report: CoverageReport): string {
  const lines: string[] = [];
  lines.push("# Coverage gap report");
  lines.push("");
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Metric | Count |");
  lines.push("|--------|------:|");
  lines.push(`| Targets checked | ${report.summary.targets} |`);
  lines.push(`| Covered (locality doc) | ${report.summary.covered} |`);
  lines.push(`| Gaps (all tiers) | ${report.summary.gaps} |`);
  lines.push(`| P1 gaps | ${report.summary.byTier.p1} |`);
  lines.push(`| P2 gaps | ${report.summary.byTier.p2} |`);
  lines.push(`| P3 gaps | ${report.summary.byTier.p3} |`);
  lines.push(`| Queue gaps (no document) | ${report.summary.queueGaps} |`);
  lines.push("");

  if (report.queueGaps.length) {
    lines.push("## Queue gaps");
    lines.push("");
    lines.push(
      "| ID | Jurisdiction | Status | Reason | Notes |"
    );
    lines.push("|----|--------------|--------|--------|-------|");
    for (const q of report.queueGaps) {
      lines.push(
        `| \`${q.id}\` | ${q.jurisdictionHint} | ${q.status} | ${q.reason} | ${q.notes.replace(/\|/g, "/")} |`
      );
    }
    lines.push("");
  }

  const tiers: CoverageTier[] = ["p1", "p2", "p3"];
  for (const tier of tiers) {
    const group = report.gaps.filter((g) => g.tier === tier);
    lines.push(`## ${tier.toUpperCase()} gaps (${group.length})`);
    lines.push("");
    if (!group.length) {
      lines.push("_none_");
      lines.push("");
      continue;
    }
    lines.push(
      "| Jurisdiction | State | Sources | Suggested slug | Reason | Notes |"
    );
    lines.push(
      "|--------------|-------|---------|----------------|--------|-------|"
    );
    for (const g of group) {
      lines.push(
        `| ${g.jurisdiction} | ${g.state_code} | ${g.sources.join(", ")} | \`${g.suggestedSlug}\` | ${g.reason} | ${g.notes.replace(/\|/g, "/")} |`
      );
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(
    "Next step: pick a P1 gap, add a job to `data/queue/manifest.json` with PDF + landing page URLs, then `npm run prepare:queue -- <id>`."
  );
  lines.push("");
  return lines.join("\n");
}
