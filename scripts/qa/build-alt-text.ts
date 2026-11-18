/**
 * Build a second, independent page-text extraction of each manual with
 * poppler's `pdftotext`, so the citation check doesn't depend on one PDF
 * text extractor. Some PDFs (e.g. Ohio's Rainwater and Land Development)
 * lose digits in the pipeline's extractor; pdftotext usually reads them.
 *
 *   npm run qa:alt-text              # every corpus with a local PDF
 *   npm run qa:alt-text -- ohio-rainwater --force
 *
 * Reads samples/queue/<queue_id>.pdf, writes data/corpus/<slug>/pages-alt.json
 * (gitignored, like the rest of the corpus). Requires `pdftotext` on PATH
 * (poppler-utils on Linux/WSL; `brew install poppler`; poppler for Windows).
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const CORPUS = path.resolve(process.cwd(), "data/corpus");
const QUEUE = path.resolve(process.cwd(), "samples/queue");

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("-"));

try {
  execFileSync("pdftotext", ["-v"], { stdio: "ignore" });
} catch {
  // optional step: the check still runs on the pipeline's own text
  console.warn("qa:alt-text skipped — pdftotext not found on PATH (install poppler-utils for a second PDF reading).");
  process.exit(0);
}

let built = 0;
let skipped = 0;
for (const slug of readdirSync(CORPUS).sort()) {
  if (only.length && !only.includes(slug)) continue;
  const dir = path.join(CORPUS, slug);
  const manifestPath = path.join(dir, "manifest.json");
  if (!existsSync(manifestPath)) continue;
  const out = path.join(dir, "pages-alt.json");
  if (existsSync(out) && !force) {
    skipped += 1;
    continue;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8")) as { queue_id?: string };
  const pdf = path.join(QUEUE, `${manifest.queue_id ?? slug}.pdf`);
  if (!existsSync(pdf)) {
    console.warn(`${slug}: no local PDF at ${path.relative(process.cwd(), pdf)}`);
    continue;
  }
  try {
    const text = execFileSync("pdftotext", ["-enc", "UTF-8", pdf, "-"], {
      maxBuffer: 1024 * 1024 * 1024,
    }).toString("utf-8");
    const parts = text.split("\f");
    if (parts.length > 1 && parts[parts.length - 1]!.trim() === "") parts.pop();
    writeFileSync(
      out,
      JSON.stringify({
        slug,
        source: "pdftotext",
        total_pages: parts.length,
        pages: parts.map((t, i) => ({ page: i + 1, text: t })),
      }) + "\n"
    );
    built += 1;
    console.log(`${slug}: ${parts.length} pages`);
  } catch (error) {
    console.warn(`${slug}: pdftotext failed — ${(error as Error).message.split("\n")[0]}`);
  }
}
console.log(`Built ${built}, kept ${skipped} existing.`);
