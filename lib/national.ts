import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import {
  draftSectionSchema,
  nationalOutlineSchema,
  type DraftSection,
  type NationalOutline,
} from "./pipeline/types";

const NATIONAL_DIR = path.resolve(process.cwd(), "data/national");
const OUTLINE_PATH = path.join(NATIONAL_DIR, "outline.json");
const DRAFT_DIR = path.join(NATIONAL_DIR, "draft");

export type NationalDraftRecord = DraftSection;

export type NationalReaderSection = {
  id: string;
  title: string;
  level: number;
  parent_id: string | null;
  prevalence: number | null;
  summary: string | null;
  source_manual_count: number | null;
  has_draft: boolean;
  editorial_status: "draft" | "reviewed" | null;
  citation_count: number;
  draft: NationalDraftRecord | null;
};

export type NationalReaderIndex = {
  outline: NationalOutline | null;
  sections: NationalReaderSection[];
};

let cachedOutline: NationalOutline | null | undefined;
let cachedDrafts: NationalDraftRecord[] | undefined;
let cachedDraftMap: Map<string, NationalDraftRecord> | undefined;
let cachedReaderIndex: NationalReaderIndex | undefined;
let cachedStamp = -1;

function nationalStamp(): number {
  let stamp = 0;
  try {
    if (existsSync(OUTLINE_PATH)) {
      stamp = Math.max(stamp, statSync(OUTLINE_PATH).mtimeMs);
    }
  } catch {
    /* ignore */
  }
  try {
    if (existsSync(DRAFT_DIR)) {
      for (const f of readdirSync(DRAFT_DIR)) {
        if (!f.endsWith(".json")) continue;
        stamp = Math.max(stamp, statSync(path.join(DRAFT_DIR, f)).mtimeMs);
      }
    }
  } catch {
    /* ignore */
  }
  return stamp;
}

function ensureFreshCache(): void {
  const stamp = nationalStamp();
  if (stamp !== cachedStamp) {
    cachedOutline = undefined;
    cachedDrafts = undefined;
    cachedDraftMap = undefined;
    cachedReaderIndex = undefined;
    cachedStamp = stamp;
  }
}

/** Clear module cache (tests / after mutating data/national). */
export function clearNationalCache(): void {
  cachedOutline = undefined;
  cachedDrafts = undefined;
  cachedDraftMap = undefined;
  cachedReaderIndex = undefined;
  cachedStamp = -1;
}

export function getNationalOutline(): NationalOutline | null {
  ensureFreshCache();
  if (cachedOutline !== undefined) return cachedOutline;
  if (!existsSync(OUTLINE_PATH)) {
    cachedOutline = null;
    return null;
  }
  try {
    cachedOutline = nationalOutlineSchema.parse(
      JSON.parse(readFileSync(OUTLINE_PATH, "utf-8"))
    );
    return cachedOutline;
  } catch (error) {
    console.warn(
      `[lib/national] outline parse failed: ${(error as Error).message}`
    );
    cachedOutline = null;
    return null;
  }
}

export function getAllDraftSections(): NationalDraftRecord[] {
  ensureFreshCache();
  if (cachedDrafts !== undefined) return cachedDrafts;
  if (!existsSync(DRAFT_DIR)) {
    cachedDrafts = [];
    cachedDraftMap = new Map();
    return cachedDrafts;
  }
  const files = readdirSync(DRAFT_DIR).filter((f) => f.endsWith(".json"));
  const out: NationalDraftRecord[] = [];
  for (const file of files) {
    try {
      const raw = JSON.parse(
        readFileSync(path.join(DRAFT_DIR, file), "utf-8")
      );
      const parsed = draftSectionSchema.safeParse(raw);
      if (!parsed.success) {
        console.warn(`[lib/national] skip ${file}: schema`);
        continue;
      }
      out.push(parsed.data);
    } catch (error) {
      console.warn(`[lib/national] skip ${file}: ${(error as Error).message}`);
    }
  }
  cachedDrafts = out;
  cachedDraftMap = new Map(out.map((d) => [d.section_id, d]));
  return out;
}

function getDraftMap(): Map<string, NationalDraftRecord> {
  if (cachedDraftMap) return cachedDraftMap;
  getAllDraftSections();
  return cachedDraftMap!;
}

export function getDraftSection(sectionId: string): NationalDraftRecord | null {
  ensureFreshCache();
  const fromCache = getDraftMap().get(sectionId);
  if (fromCache) return fromCache;

  const filePath = path.join(DRAFT_DIR, `${sectionId}.json`);
  if (!existsSync(filePath)) return null;
  try {
    return draftSectionSchema.parse(
      JSON.parse(readFileSync(filePath, "utf-8"))
    );
  } catch {
    return null;
  }
}

/** Outline sections joined with draft when present, outline order preserved. */
export function getNationalReaderIndex(): NationalReaderIndex {
  ensureFreshCache();
  if (cachedReaderIndex) return cachedReaderIndex;

  const outline = getNationalOutline();
  const drafts = getDraftMap();

  if (!outline) {
    cachedReaderIndex = {
      outline: null,
      sections: [...drafts.values()].map((d) => ({
        id: d.section_id,
        title: d.title,
        level: 1,
        parent_id: null,
        prevalence: null,
        summary: null,
        source_manual_count: null,
        has_draft: true,
        editorial_status: d.editorial_status ?? null,
        citation_count: d.citations.length,
        draft: d,
      })),
    };
    return cachedReaderIndex;
  }

  cachedReaderIndex = {
    outline,
    sections: outline.sections.map((s) => {
      const draft = drafts.get(s.id) ?? null;
      return {
        id: s.id,
        title: s.title,
        level: s.level,
        parent_id: s.parent_id,
        prevalence: s.prevalence,
        summary: s.summary,
        source_manual_count: s.source_manual_count,
        has_draft: Boolean(draft),
        editorial_status: draft?.editorial_status ?? null,
        citation_count: draft?.citations.length ?? 0,
        draft,
      };
    }),
  };
  return cachedReaderIndex;
}
