/**
 * Print the paginated model manual (/manual/print/) to PDF.
 *
 *   npm run build && npm run manual:pdf
 *
 * Serves out/ locally, lets Paged.js lay out the pages, and prints them with
 * Chrome (set CHROME_PATH if it is not at /usr/bin/google-chrome). Writes
 * public/downloads/model-manual.pdf and a small JSON record of the version it
 * was made from; tests/manual.test.ts fails when the manual's version moves on
 * without a new PDF.
 */
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import { loadManual } from "../lib/manual/parse";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "out");
const TYPES: Record<string, string> = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain" };

async function main() {
  if (!existsSync(path.join(OUT, "manual/print/index.html"))) throw new Error("Run `npm run build` first (out/manual/print/ is missing).");
  const server = createServer((req, res) => {
    let p = decodeURIComponent((req.url ?? "/").split("?")[0]!);
    let f = path.join(OUT, p);
    if (existsSync(f) && statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!existsSync(f)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { "content-type": TYPES[path.extname(f)] ?? "application/octet-stream" }).end(readFileSync(f));
  }).listen(0);
  const port = (server.address() as { port: number }).port;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH ?? "/usr/bin/google-chrome", args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    page.on("pageerror", (e) => console.error("page error:", e.message));
    await page.goto(`http://localhost:${port}/manual/print/`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => (window as unknown as { __PAGED_DONE?: number }).__PAGED_DONE, null, { timeout: 120_000 });
    const pages = await page.evaluate(() => (window as unknown as { __PAGED_DONE: number }).__PAGED_DONE);
    await page.emulateMedia({ media: "print" });
    const manual = loadManual();
    const dir = path.join(ROOT, "public/downloads");
    mkdirSync(dir, { recursive: true });
    const file = path.join(dir, "model-manual.pdf");
    await page.pdf({ path: file, pageRanges: `1-${pages}`, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
    writeFileSync(
      path.join(dir, "model-manual.json"),
      JSON.stringify({ title: manual.title, version: manual.version, date: manual.date, pages, bytes: statSync(file).size, file: "/downloads/model-manual.pdf" }, null, 1) + "\n"
    );
    mkdirSync(path.join(OUT, "downloads"), { recursive: true });
    copyFileSync(file, path.join(OUT, "downloads/model-manual.pdf"));
    console.log(`model-manual.pdf: ${pages} pages, ${(statSync(file).size / 1024).toFixed(0)} KB (${manual.version})`);
  } finally {
    await browser.close();
    server.close();
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
