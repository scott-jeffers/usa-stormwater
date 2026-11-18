/**
 * Records that share one source document (curated in
 * data/coverage/shared-manuals.json). One representative record's extracted
 * values are shown for the whole group, so the same PDF can't show
 * different answers on different city pages.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

export const SHARED_MANUALS_PATH = path.resolve(
  process.cwd(),
  "data/coverage/shared-manuals.json"
);

export const coverageBasisSchema = z.enum([
  "issuer",
  "state_manual",
  "regional_manual",
  "stand_in",
]);
export type CoverageBasis = z.infer<typeof coverageBasisSchema>;

export const sharedManualsFileSchema = z.object({
  version: z.literal(1),
  policy: z.string(),
  bases: z.record(z.string(), z.string()),
  groups: z.array(
    z.object({
      id: z.string(),
      issuer: z.string(),
      representative: z.string(),
      document_urls: z.array(z.string()).min(1),
      members: z
        .array(
          z.object({
            slug: z.string(),
            basis: coverageBasisSchema,
            note: z.string().optional(),
          })
        )
        .min(2),
    })
  ),
  /** Single records whose source is a state/regional manual or placeholder. */
  records: z
    .array(
      z.object({
        slug: z.string(),
        basis: coverageBasisSchema.exclude(["issuer"]),
        issuer: z.string(),
        note: z.string().optional(),
      })
    )
    .default([]),
});
export type SharedManualsFile = z.infer<typeof sharedManualsFileSchema>;
export type SharedGroup = SharedManualsFile["groups"][number];

export interface SharedInfo {
  /** For single records, a one-member pseudo-group (no representative page). */
  group: SharedGroup;
  basis: CoverageBasis;
  note: string | null;
  isRepresentative: boolean;
  representative: string;
  /** Other members of the group (excluding this record). */
  others: Array<{ slug: string; basis: CoverageBasis }>;
}

let cached: Map<string, SharedInfo> | undefined;
let cachedFile: SharedManualsFile | null | undefined;

export function loadSharedManuals(): SharedManualsFile | null {
  if (cachedFile !== undefined) return cachedFile;
  if (!existsSync(SHARED_MANUALS_PATH)) return (cachedFile = null);
  cachedFile = sharedManualsFileSchema.parse(
    JSON.parse(readFileSync(SHARED_MANUALS_PATH, "utf-8"))
  );
  return cachedFile;
}

function buildMap(): Map<string, SharedInfo> {
  const map = new Map<string, SharedInfo>();
  for (const group of loadSharedManuals()?.groups ?? []) {
    for (const m of group.members) {
      map.set(m.slug, {
        group,
        basis: m.basis,
        note: m.note ?? null,
        isRepresentative: m.slug === group.representative,
        representative: group.representative,
        others: group.members
          .filter((o) => o.slug !== m.slug)
          .map((o) => ({ slug: o.slug, basis: o.basis })),
      });
    }
  }
  for (const r of loadSharedManuals()?.records ?? []) {
    if (map.has(r.slug)) continue;
    map.set(r.slug, {
      group: {
        id: `record:${r.slug}`,
        issuer: r.issuer,
        representative: r.slug,
        document_urls: [],
        members: [{ slug: r.slug, basis: r.basis }],
      },
      basis: r.basis,
      note: r.note ?? null,
      isRepresentative: false,
      representative: r.slug,
      others: [],
    });
  }
  return map;
}

export function getSharedInfo(slug: string): SharedInfo | null {
  cached ??= buildMap();
  return cached.get(slug) ?? null;
}

/** How this record's jurisdiction is covered. Unshared records are "own". */
export function coverageBasisFor(slug: string): CoverageBasis | "own" {
  const info = getSharedInfo(slug);
  if (!info) return "own";
  return info.basis;
}

export const BASIS_LABELS: Record<CoverageBasis | "own", string> = {
  own: "Own manual",
  issuer: "Own manual",
  state_manual: "Uses state manual",
  regional_manual: "Uses regional manual",
  stand_in: "Stand-in manual",
};

export function clearSharedManualsCache(): void {
  cached = undefined;
  cachedFile = undefined;
}
