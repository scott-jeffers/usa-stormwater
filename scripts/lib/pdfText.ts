/**
 * PDF → plain text helpers (no AI). Used by prepare/download scripts and agents.
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { extractText, getDocumentProxy } from "unpdf";

export const MAX_DOCUMENT_CHARS = 750_000;

export function truncateDocumentText(text: string): string {
  if (text.length <= MAX_DOCUMENT_CHARS) return text;
  const head = text.slice(0, Math.floor(MAX_DOCUMENT_CHARS * 0.75));
  const tail = text.slice(-Math.floor(MAX_DOCUMENT_CHARS * 0.2));
  return (
    head +
    "\n\n[... DOCUMENT TEXT TRUNCATED FOR LENGTH — middle sections omitted ...]\n\n" +
    tail
  );
}

export async function extractPdfText(pdfPath: string): Promise<{
  text: string;
  totalPages: number;
}> {
  const buffer = await readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, totalPages };
}

export async function writePreparedText(
  pdfPath: string,
  outTextPath: string
): Promise<{ charCount: number; totalPages: number; truncated: boolean }> {
  const { text, totalPages } = await extractPdfText(pdfPath);
  const truncated = text.length > MAX_DOCUMENT_CHARS;
  const body = truncateDocumentText(text);
  await mkdir(path.dirname(outTextPath), { recursive: true });
  await writeFile(outTextPath, body, "utf-8");
  return { charCount: text.length, totalPages, truncated };
}

export function assertPdfLooksValid(buf: Buffer, minBytes = 5_000): void {
  if (buf.length < minBytes) {
    throw new Error(`File too small (${buf.length} bytes)`);
  }
  if (buf.subarray(0, 5).toString("utf-8") !== "%PDF-") {
    throw new Error("Not a PDF (%PDF magic missing)");
  }
}

export function samplesQueuePath(id: string, ext: "pdf" | "txt"): string {
  return path.resolve(process.cwd(), "samples/queue", `${id}.${ext}`);
}

export function pdfExists(id: string): boolean {
  return existsSync(samplesQueuePath(id, "pdf"));
}
