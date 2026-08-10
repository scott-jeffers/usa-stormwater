/**
 * Per-page PDF text extraction for the corpus pipeline (no truncation).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";
import { corpusPagesPath, corpusDirFor } from "../../lib/pipeline/paths";

export interface CorpusPage {
  page: number;
  text: string;
  char_count: number;
}

export interface CorpusPagesFile {
  slug: string;
  queue_id: string;
  source_pdf: string;
  total_pages: number;
  char_count: number;
  pages: CorpusPage[];
  generated_at: string;
}

export async function extractPdfPages(pdfPath: string): Promise<{
  pages: CorpusPage[];
  totalPages: number;
  charCount: number;
}> {
  const buffer = await readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: false });
  const pageTexts = Array.isArray(text) ? text : [text];
  const pages: CorpusPage[] = pageTexts.map((t, i) => {
    const body = (t ?? "").replace(/\r\n/g, "\n").trimEnd();
    return {
      page: i + 1,
      text: body,
      char_count: body.length,
    };
  });
  const charCount = pages.reduce((sum, p) => sum + p.char_count, 0);
  return { pages, totalPages, charCount };
}

export async function writeCorpusPages(opts: {
  slug: string;
  queueId: string;
  pdfPath: string;
}): Promise<CorpusPagesFile> {
  const { pages, totalPages, charCount } = await extractPdfPages(opts.pdfPath);
  const file: CorpusPagesFile = {
    slug: opts.slug,
    queue_id: opts.queueId,
    source_pdf: path.basename(opts.pdfPath),
    total_pages: totalPages,
    char_count: charCount,
    pages,
    generated_at: new Date().toISOString(),
  };
  await mkdir(corpusDirFor(opts.slug), { recursive: true });
  await writeFile(
    corpusPagesPath(opts.slug),
    JSON.stringify(file, null, 2) + "\n",
    "utf-8"
  );
  return file;
}

export async function loadCorpusPages(
  slug: string
): Promise<CorpusPagesFile | null> {
  try {
    const raw = await readFile(corpusPagesPath(slug), "utf-8");
    return JSON.parse(raw) as CorpusPagesFile;
  } catch {
    return null;
  }
}

export function pagesTextSlice(
  pages: CorpusPage[],
  pageStart: number,
  pageEnd: number
): string {
  return pages
    .filter((p) => p.page >= pageStart && p.page <= pageEnd)
    .map((p) => `--- page ${p.page} ---\n${p.text}`)
    .join("\n\n");
}

export function samplePagesForStructure(
  pages: CorpusPage[],
  maxChars = 80_000
): string {
  if (pages.length === 0) return "";
  const headCount = Math.min(15, pages.length);
  const midStart = Math.floor(pages.length / 2);
  const midCount = Math.min(5, Math.max(0, pages.length - headCount));
  const tailCount = Math.min(10, Math.max(0, pages.length - headCount - midCount));

  const selected = new Map<number, CorpusPage>();
  for (let i = 0; i < headCount; i++) selected.set(pages[i].page, pages[i]);
  for (let i = 0; i < midCount; i++) {
    const p = pages[midStart + i];
    if (p) selected.set(p.page, p);
  }
  for (let i = 0; i < tailCount; i++) {
    const p = pages[pages.length - 1 - i];
    if (p) selected.set(p.page, p);
  }

  const ordered = [...selected.values()].sort((a, b) => a.page - b.page);
  let out = "";
  for (const p of ordered) {
    const block = `--- page ${p.page} ---\n${p.text}\n\n`;
    if (out.length + block.length > maxChars) {
      out += block.slice(0, Math.max(0, maxChars - out.length));
      out += "\n[... truncated for structure extraction ...]\n";
      break;
    }
    out += block;
  }
  return out;
}
