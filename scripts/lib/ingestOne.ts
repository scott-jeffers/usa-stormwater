/**
 * Shared PDF → Gemini → validated JSON ingest used by the CLI and overnight batch.
 */
import { GoogleGenAI } from "@google/genai";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { extractText, getDocumentProxy } from "unpdf";
import {
  extractionSchema,
  stormwaterSchema,
  type StormwaterData,
  type DocumentSource,
} from "../../lib/schema";

const MODEL = "gemini-3.5-flash";
export const DOCUMENTS_DIR = path.resolve(process.cwd(), "data/documents");
const DEBUG_DIR = path.join(DOCUMENTS_DIR, "_debug");

/** Keep Gemini under a safe text budget for free-tier / context limits. */
export const MAX_DOCUMENT_CHARS = 750_000;

const SYSTEM_PROMPT =
  "You are extracting structured data from a U.S. stormwater design manual. " +
  "Only report a value if explicitly stated. If a field is missing, leave it " +
  "null/empty and add to fields_not_found. Never infer or estimate. For every " +
  "populated field, add a corresponding entry in evidence with a verbatim " +
  "excerpt. Set needs_human_review to true if sections are ambiguous.";

export interface IngestOneInput {
  pdfPath: string;
  documentUrl?: string | null;
  landingPageUrl?: string | null;
  /** Prefer this slug if the file does not already exist. */
  preferredSlug?: string | null;
  apiKey?: string;
  quiet?: boolean;
}

export interface IngestOneResult {
  slug: string;
  outPath: string;
  data: StormwaterData;
  charCount: number;
  totalPages: number;
  truncated: boolean;
}

function log(quiet: boolean | undefined, ...args: unknown[]) {
  if (!quiet) console.log(...args);
}

function warn(quiet: boolean | undefined, ...args: unknown[]) {
  if (!quiet) console.warn(...args);
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

function buildSlugBase(data: StormwaterData): string {
  const { jurisdiction_name, jurisdiction_level, state_code } =
    data.document_metadata;
  const stateSlug = state_code ? state_code.toLowerCase() : null;

  if (jurisdiction_level === "state" && stateSlug) {
    return `${stateSlug}-state`;
  }

  const nameSlug = slugify(jurisdiction_name) || slugify(jurisdiction_level);
  if (stateSlug && jurisdiction_level !== "state") {
    return `${nameSlug}-${stateSlug}`;
  }
  return nameSlug;
}

function resolveUniqueSlug(base: string): string {
  let candidate = base;
  let counter = 2;
  while (existsSync(path.join(DOCUMENTS_DIR, `${candidate}.json`))) {
    candidate = `${base}-${counter}`;
    counter += 1;
  }
  return candidate;
}

function truncateDocumentText(text: string): string {
  if (text.length <= MAX_DOCUMENT_CHARS) return text;
  const head = text.slice(0, Math.floor(MAX_DOCUMENT_CHARS * 0.75));
  const tail = text.slice(-Math.floor(MAX_DOCUMENT_CHARS * 0.2));
  return (
    head +
    "\n\n[... DOCUMENT TEXT TRUNCATED FOR LENGTH — middle sections omitted ...]\n\n" +
    tail
  );
}

async function extractPdfText(pdfPath: string): Promise<{
  text: string;
  totalPages: number;
}> {
  const buffer = await readFile(pdfPath);
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: true });
  return { text, totalPages };
}

async function callGemini(
  ai: GoogleGenAI,
  documentText: string,
  geminiSchema: unknown,
  retryNote?: string
): Promise<string> {
  const promptParts = [
    SYSTEM_PROMPT,
    retryNote
      ? `\n\nNOTE: Your previous response failed schema validation with this error, please correct it:\n${retryNote}`
      : "",
    "\n\n---DOCUMENT TEXT---\n\n",
    documentText,
  ];

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: promptParts.join("") }],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: geminiSchema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }
  return text;
}

function buildSource(
  pdfPath: string,
  documentUrl: string | null,
  landingPageUrl: string | null
): DocumentSource {
  return {
    document_url: documentUrl,
    landing_page_url: landingPageUrl,
    retrieved_at: new Date().toISOString(),
    original_filename: path.basename(pdfPath),
  };
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

export class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes("429") ||
    lower.includes("resource_exhausted") ||
    lower.includes("quota") ||
    lower.includes("rate limit")
  );
}

export async function ingestOnePdf(
  input: IngestOneInput
): Promise<IngestOneResult> {
  const pdfPath = path.resolve(process.cwd(), input.pdfPath);
  const documentUrl = input.documentUrl ?? null;
  const landingPageUrl = input.landingPageUrl ?? null;
  const quiet = input.quiet;

  if (!existsSync(pdfPath)) {
    throw new Error(`File not found: ${pdfPath}`);
  }

  const apiKey = input.apiKey ?? process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your free key."
    );
  }

  log(quiet, `Reading PDF: ${pdfPath}`);
  const { text: rawDocumentText, totalPages } = await extractPdfText(pdfPath);
  log(
    quiet,
    `Extracted ${rawDocumentText.length.toLocaleString()} characters from ${totalPages} pages.`
  );
  const truncated = rawDocumentText.length > MAX_DOCUMENT_CHARS;
  if (truncated) {
    warn(
      quiet,
      `Document text exceeds ${MAX_DOCUMENT_CHARS.toLocaleString()} chars; sending head+tail to Gemini (middle truncated).`
    );
  }
  const documentText = truncateDocumentText(rawDocumentText);

  const geminiSchema = z.toJSONSchema(extractionSchema, {
    target: "openapi-3.0",
  });

  const ai = new GoogleGenAI({ apiKey });

  log(quiet, `Calling Gemini (${MODEL})... this can take 1-2 minutes.`);

  let rawText: string;
  try {
    rawText = await callGemini(ai, documentText, geminiSchema);
  } catch (error) {
    if (isQuotaError(error)) {
      throw new QuotaError(
        error instanceof Error ? error.message : String(error)
      );
    }
    throw error;
  }

  let parsed = extractionSchema.safeParse(safeJsonParse(rawText));

  if (!parsed.success) {
    warn(
      quiet,
      "First response failed schema validation, retrying once with the validation error appended..."
    );
    const errorSummary = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    try {
      rawText = await callGemini(ai, documentText, geminiSchema, errorSummary);
    } catch (error) {
      if (isQuotaError(error)) {
        throw new QuotaError(
          error instanceof Error ? error.message : String(error)
        );
      }
      throw error;
    }
    parsed = extractionSchema.safeParse(safeJsonParse(rawText));
  }

  if (!parsed.success) {
    await mkdir(DEBUG_DIR, { recursive: true });
    const debugPath = path.join(DEBUG_DIR, `${Date.now()}.raw.json`);
    await writeFile(debugPath, rawText ?? "", "utf-8");
    throw new Error(
      `Extraction failed validation twice. Raw response dumped to ${debugPath}`
    );
  }

  const data = stormwaterSchema.parse({
    ...parsed.data,
    source: buildSource(pdfPath, documentUrl, landingPageUrl),
  });

  await mkdir(DOCUMENTS_DIR, { recursive: true });

  let slug: string;
  if (
    input.preferredSlug &&
    !existsSync(path.join(DOCUMENTS_DIR, `${input.preferredSlug}.json`))
  ) {
    slug = input.preferredSlug;
  } else {
    slug = resolveUniqueSlug(buildSlugBase(data));
  }

  const outPath = path.join(DOCUMENTS_DIR, `${slug}.json`);
  await writeFile(outPath, JSON.stringify(data, null, 2) + "\n", "utf-8");

  log(quiet, "");
  log(quiet, `Saved: ${path.relative(process.cwd(), outPath)}`);
  log(
    quiet,
    `  Jurisdiction:      ${data.document_metadata.jurisdiction_name}`
  );
  log(quiet, `  Level:             ${data.document_metadata.jurisdiction_level}`);
  log(quiet, `  Confidence:        ${data.extraction_quality.confidence}`);
  log(
    quiet,
    `  Needs human review: ${data.extraction_quality.needs_human_review}`
  );
  log(quiet, `  Fields with evidence: ${data.evidence.length}`);
  log(
    quiet,
    `  Fields not found:  ${data.extraction_quality.fields_not_found.length ? data.extraction_quality.fields_not_found.join(", ") : "none"}`
  );
  if (data.source.document_url) {
    log(quiet, `  Document URL:      ${data.source.document_url}`);
  }
  if (data.source.landing_page_url) {
    log(quiet, `  Landing page:      ${data.source.landing_page_url}`);
  }
  log(quiet, "");

  return {
    slug,
    outPath,
    data,
    charCount: rawDocumentText.length,
    totalPages,
    truncated,
  };
}
