/**
 * Canonical BMP / practice key mapping from data/ontology/bmp-aliases.json.
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";

const ALIASES_PATH = path.resolve(
  process.cwd(),
  "data/ontology/bmp-aliases.json"
);

const practiceEntrySchema = z.object({
  label: z.string(),
  aliases: z.array(z.string()),
});

const aliasesFileSchema = z.object({
  version: z.number().int(),
  title: z.string(),
  description: z.string().optional(),
  practices: z.record(z.string(), practiceEntrySchema),
});

export type BmpAliasesFile = z.infer<typeof aliasesFileSchema>;

let cached: BmpAliasesFile | null | undefined;
let aliasIndex: Map<string, string> | undefined;

function normalizeAlias(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function getBmpAliasesFile(): BmpAliasesFile | null {
  if (cached !== undefined) return cached;
  if (!existsSync(ALIASES_PATH)) {
    cached = null;
    return null;
  }
  try {
    cached = aliasesFileSchema.parse(
      JSON.parse(readFileSync(ALIASES_PATH, "utf-8"))
    );
    return cached;
  } catch (error) {
    console.warn(`[bmp-aliases] parse failed: ${(error as Error).message}`);
    cached = null;
    return null;
  }
}

export function clearBmpAliasCache(): void {
  cached = undefined;
  aliasIndex = undefined;
}

function getAliasIndex(): Map<string, string> {
  if (aliasIndex) return aliasIndex;
  const file = getBmpAliasesFile();
  const map = new Map<string, string>();
  if (!file) {
    aliasIndex = map;
    return map;
  }
  for (const [key, entry] of Object.entries(file.practices)) {
    map.set(normalizeAlias(key), key);
    map.set(normalizeAlias(entry.label), key);
    for (const alias of entry.aliases) {
      map.set(normalizeAlias(alias), key);
    }
  }
  aliasIndex = map;
  return map;
}

/** Resolve a free-text practice name to a canonical key, or null. */
export function canonicalizePracticeName(raw: string): string | null {
  const n = normalizeAlias(raw);
  if (!n) return null;
  const index = getAliasIndex();
  if (index.has(n)) return index.get(n)!;

  // Prefer longer alias matches inside the string
  let best: { key: string; len: number } | null = null;
  for (const [alias, key] of index) {
    if (alias.length < 4) continue;
    if (n === alias || n.includes(alias) || alias.includes(n)) {
      if (!best || alias.length > best.len) best = { key, len: alias.length };
    }
  }
  return best?.key ?? null;
}

/** Scan free text / category lists for canonical practice keys. */
export function detectPracticeMentions(
  texts: Array<string | null | undefined>
): string[] {
  const blob = texts.filter(Boolean).join(" \n ").toLowerCase();
  if (!blob) return [];
  const file = getBmpAliasesFile();
  if (!file) return [];
  const found = new Set<string>();
  for (const [key, entry] of Object.entries(file.practices)) {
    const candidates = [key, entry.label, ...entry.aliases];
    for (const c of candidates) {
      const n = normalizeAlias(c);
      if (n.length < 4) continue;
      if (blob.includes(n)) {
        found.add(key);
        break;
      }
    }
  }
  return [...found].sort();
}

export function getPracticeLabel(key: string): string {
  const file = getBmpAliasesFile();
  return file?.practices[key]?.label ?? key;
}

export function listCanonicalPracticeKeys(): string[] {
  const file = getBmpAliasesFile();
  return file ? Object.keys(file.practices).sort() : [];
}

export function isKnownPracticeKey(key: string): boolean {
  return Boolean(getBmpAliasesFile()?.practices[key]);
}
