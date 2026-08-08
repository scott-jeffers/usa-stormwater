/**
 * Local-only ingestion CLI. Never runs in a browser or on a server.
 *
 * Usage:
 *   npm run ingest -- path/to/manual.pdf
 *   npm run ingest -- path/to/manual.pdf "--url=https://example.gov/manual.pdf"
 */
import { existsSync } from "node:fs";
import path from "node:path";
import { ingestOnePdf } from "./lib/ingestOne";

function printUsage(): never {
  console.error(`Usage:
  npm run ingest -- <path-to-pdf> [--url <document-url>] [--landing-page <url>]

Options:
  --url             Public URL of the PDF (or primary document). Shown in the dashboard.
  --landing-page    Official agency page for the manual (more durable than a direct PDF link).
`);
  process.exit(1);
}

function parseArgs(argv: string[]): {
  pdfPath: string;
  documentUrl: string | null;
  landingPageUrl: string | null;
} {
  const positional: string[] = [];
  let documentUrl: string | null = null;
  let landingPageUrl: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--url" || arg.startsWith("--url=")) {
      documentUrl = arg.startsWith("--url=")
        ? arg.slice("--url=".length)
        : (argv[++i] ?? null);
      if (!documentUrl) printUsage();
    } else if (arg === "--landing-page" || arg.startsWith("--landing-page=")) {
      landingPageUrl = arg.startsWith("--landing-page=")
        ? arg.slice("--landing-page=".length)
        : (argv[++i] ?? null);
      if (!landingPageUrl) printUsage();
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) printUsage();
  return {
    pdfPath: path.resolve(process.cwd(), positional[0]),
    documentUrl,
    landingPageUrl,
  };
}

async function main() {
  const { pdfPath, documentUrl, landingPageUrl } = parseArgs(
    process.argv.slice(2)
  );

  if (!existsSync(pdfPath)) {
    console.error(`File not found: ${pdfPath}`);
    process.exit(1);
  }

  if (!process.env.GEMINI_API_KEY) {
    console.error(
      "GEMINI_API_KEY is not set. Copy .env.example to .env.local and add your free key from https://aistudio.google.com/app/apikey"
    );
    process.exit(1);
  }

  if (!documentUrl && !landingPageUrl) {
    console.warn(
      "Tip: pass --url and/or --landing-page so the dashboard can link back to the official document."
    );
  }

  await ingestOnePdf({ pdfPath, documentUrl, landingPageUrl });
  console.log("Run `npm run dev` and open the dashboard to review this entry.");
}

main().catch((error) => {
  console.error("Ingestion failed:", error);
  process.exit(1);
});
