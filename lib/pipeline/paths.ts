import path from "node:path";

export const PIPELINE_DIR = path.resolve(process.cwd(), "data/pipeline");
export const PROGRESS_PATH = path.join(PIPELINE_DIR, "progress.json");
export const RUN_LOG_PATH = path.join(PIPELINE_DIR, "run-log.jsonl");
export const STATUS_PATH = path.join(PIPELINE_DIR, "STATUS.md");
export const VERIFY_PATH = path.join(PIPELINE_DIR, "VERIFY.md");

export const CORPUS_DIR = path.resolve(process.cwd(), "data/corpus");
export const NATIONAL_DIR = path.resolve(process.cwd(), "data/national");
export const OUTLINE_PATH = path.join(NATIONAL_DIR, "outline.json");
export const DRAFT_DIR = path.join(NATIONAL_DIR, "draft");
export const PRACTICES_DIR = path.join(NATIONAL_DIR, "practices");
export const ENRICH_PROGRESS_PATH = path.join(
  PIPELINE_DIR,
  "enrich-parameters-progress.json"
);

export function practiceMatrixPath(practiceKey: string): string {
  return path.join(PRACTICES_DIR, `${practiceKey}.matrix.json`);
}

export function practiceSynthesisPath(practiceKey: string): string {
  return path.join(PRACTICES_DIR, `${practiceKey}.json`);
}

export const QUEUE_DIR = path.resolve(process.cwd(), "data/queue");
export const MANIFEST_PATH = path.join(QUEUE_DIR, "manifest.json");
export const QUEUE_PROGRESS_PATH = path.join(QUEUE_DIR, "progress.json");
export const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");

export function corpusDirFor(slug: string): string {
  return path.join(CORPUS_DIR, slug);
}

export function corpusPagesPath(slug: string): string {
  return path.join(corpusDirFor(slug), "pages.json");
}

export function corpusStructurePath(slug: string): string {
  return path.join(corpusDirFor(slug), "structure.json");
}

export function corpusChunksPath(slug: string): string {
  return path.join(corpusDirFor(slug), "chunks.jsonl");
}

export function corpusManifestPath(slug: string): string {
  return path.join(corpusDirFor(slug), "manifest.json");
}

export function draftSectionPath(sectionId: string): string {
  return path.join(DRAFT_DIR, `${sectionId}.json`);
}
