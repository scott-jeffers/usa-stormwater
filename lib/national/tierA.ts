/**
 * Tier A national evidence anchors — preferred citation sources for
 * the national draft manual.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const TIER_A_PATH = path.resolve(
  process.cwd(),
  "data/national/tier-a-slugs.json"
);

export const tierARationaleSchema = z.enum([
  "state_manual",
  "p1_metro",
  "regional_anchor",
]);

export type TierARationale = z.infer<typeof tierARationaleSchema>;

export const tierAEntrySchema = z.object({
  slug: z.string(),
  state_code: z.string(),
  rationale: tierARationaleSchema,
  needs_human_review: z.boolean().optional(),
  /** Chapter-only / partial PDFs — deprioritize for national defaults. */
  chapter_proxy: z.boolean().optional(),
  notes: z.string().optional(),
});

export type TierAEntry = z.infer<typeof tierAEntrySchema>;

export const tierAFileSchema = z.object({
  version: z.number().int(),
  generated_at: z.string(),
  title: z.string(),
  policy: z.string(),
  excluded: z
    .array(
      z.object({
        id: z.string(),
        reason: z.string(),
      })
    )
    .optional(),
  entries: z.array(tierAEntrySchema),
});

export type TierAFile = z.infer<typeof tierAFileSchema>;

/** Known chapter-only or partial corpora — avoid as sole national default. */
export const CHAPTER_PROXY_SLUGS = new Set([
  "va-state",
  "nj-state",
  "ia-state-ch1",
  "oklahoma-odot-ch10",
  "de-wet-ponds-draft",
]);

let cached: TierAFile | null | undefined;

export function getTierAFile(): TierAFile | null {
  if (cached !== undefined) return cached;
  if (!existsSync(TIER_A_PATH)) {
    cached = null;
    return null;
  }
  try {
    cached = tierAFileSchema.parse(
      JSON.parse(readFileSync(TIER_A_PATH, "utf-8"))
    );
    return cached;
  } catch (error) {
    console.warn(
      `[tierA] parse failed: ${(error as Error).message}`
    );
    cached = null;
    return null;
  }
}

/** Clear module cache (tests / after rebuild). */
export function clearTierACache(): void {
  cached = undefined;
}

export function getTierAEntries(): TierAEntry[] {
  return getTierAFile()?.entries ?? [];
}

export function getTierASlugSet(): Set<string> {
  return new Set(getTierAEntries().map((e) => e.slug));
}

export function isTierASlug(slug: string): boolean {
  return getTierASlugSet().has(slug);
}

export function getTierAEntry(slug: string): TierAEntry | null {
  return getTierAEntries().find((e) => e.slug === slug) ?? null;
}

export function isChapterProxy(slug: string): boolean {
  const entry = getTierAEntry(slug);
  if (entry?.chapter_proxy) return true;
  return CHAPTER_PROXY_SLUGS.has(slug);
}

/** Prefer Tier A for citations; chapter proxies get lower preference. */
export function tierACitationBoost(slug: string): number {
  const entry = getTierAEntry(slug);
  if (!entry) return 0;
  if (entry.chapter_proxy || CHAPTER_PROXY_SLUGS.has(slug)) return 1;
  if (entry.rationale === "state_manual") return 4;
  if (entry.rationale === "p1_metro") return 3;
  return 2;
}
