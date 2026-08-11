/**
 * Infer / normalize issuing agency category (DOT vs DEP/DEQ/DNR).
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

export type AgencyCategory = "dot" | "dep_deq" | "dnr" | "other";

export type AgencyCategoryFilter = AgencyCategory | "all";

const ALIASES_PATH = path.resolve(
  process.cwd(),
  "data/agency-targets/aliases.json"
);

interface AgencyAliases {
  slug_to_category?: Record<string, AgencyCategory | "dep_deq">;
  name_patterns?: {
    dot?: string[];
    dep_deq?: string[];
  };
  slug_patterns?: {
    dot?: string[];
    dep_deq?: string[];
  };
}

let cachedAliases: AgencyAliases | null = null;

function loadAliases(): AgencyAliases {
  if (cachedAliases) return cachedAliases;
  if (!existsSync(ALIASES_PATH)) {
    cachedAliases = {};
    return cachedAliases;
  }
  cachedAliases = JSON.parse(readFileSync(ALIASES_PATH, "utf-8")) as AgencyAliases;
  return cachedAliases;
}

/** Map schema/storage values to UI badge categories (dnr folds into dep_deq). */
export function normalizeAgencyCategory(
  value: string | null | undefined
): AgencyCategory | null {
  if (!value) return null;
  if (value === "dot") return "dot";
  if (value === "dep_deq" || value === "dnr") return "dep_deq";
  if (value === "other") return "other";
  return null;
}

function matchesAny(haystack: string, needles: string[] | undefined): boolean {
  if (!needles?.length) return false;
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

/**
 * Infer agency category from slug and/or jurisdiction/document name.
 * Prefer explicit schema field when present (caller should check first).
 */
export function inferAgencyCategory(opts: {
  slug?: string | null;
  jurisdictionName?: string | null;
  documentTitle?: string | null;
  agencyHint?: string | null;
}): AgencyCategory | null {
  const hint = normalizeAgencyCategory(opts.agencyHint);
  if (hint) return hint;

  const aliases = loadAliases();
  const slug = opts.slug?.toLowerCase() ?? "";

  if (slug && aliases.slug_to_category?.[slug]) {
    return normalizeAgencyCategory(aliases.slug_to_category[slug]);
  }

  if (slug && matchesAny(slug, aliases.slug_patterns?.dot)) {
    return "dot";
  }

  const nameBlob = [opts.jurisdictionName, opts.documentTitle]
    .filter(Boolean)
    .join(" ");

  if (nameBlob && matchesAny(nameBlob, aliases.name_patterns?.dot)) {
    return "dot";
  }

  // Explicit DOT slug cues even without aliases file
  if (
    slug &&
    (/-dot-/.test(slug) ||
      /-odot-/.test(slug) ||
      /-ndot-/.test(slug) ||
      /-wydot-/.test(slug) ||
      slug.includes("caltrans") ||
      slug === "kentucky-bmp")
  ) {
    return "dot";
  }

  if (nameBlob && matchesAny(nameBlob, aliases.name_patterns?.dep_deq)) {
    return "dep_deq";
  }

  if (slug && aliases.slug_to_category) {
    // already checked exact slug
  }

  return null;
}

export function agencyCategoryLabel(cat: AgencyCategory): string {
  switch (cat) {
    case "dot":
      return "DOT";
    case "dep_deq":
      return "DEP / DEQ";
    case "dnr":
      return "DNR";
    case "other":
      return "Other agency";
  }
}
