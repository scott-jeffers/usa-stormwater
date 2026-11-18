/**
 * Quotes checked by eye against the rendered PDF page, for text layers that
 * drop digits (data/qa/visual-checks.json). The automatic matcher still
 * reports them as "unverifiable"; this records that a person (or reviewer)
 * looked at the page and the quote is exact.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const VISUAL_CHECKS_PATH = path.resolve(process.cwd(), "data/qa/visual-checks.json");

const fileSchema = z.object({
  version: z.literal(1),
  note: z.string().optional(),
  checks: z.array(
    z.object({
      slugs: z.array(z.string()).min(1),
      page: z.number().int(),
      excerpt: z.string().min(1),
      checked_at: z.string(),
    })
  ),
});

let cache: z.infer<typeof fileSchema>["checks"] | null = null;

export function loadVisualChecks() {
  if (cache) return cache;
  cache = existsSync(VISUAL_CHECKS_PATH)
    ? fileSchema.parse(JSON.parse(readFileSync(VISUAL_CHECKS_PATH, "utf-8"))).checks
    : [];
  return cache;
}

/** Date the quote was checked by eye, or null. */
export function visualCheckFor(slug: string, excerpt: string): string | null {
  const t = excerpt.trim();
  return loadVisualChecks().find((c) => c.slugs.includes(slug) && c.excerpt.trim() === t)?.checked_at ?? null;
}
