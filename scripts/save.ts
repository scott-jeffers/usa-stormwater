/**
 * Validate an agent-written extraction JSON and write data/documents/<slug>.json.
 *
 *   npm run save -- path/to/extraction.json --slug=portland-or "--url=..." "--landing-page=..."
 */
import path from "node:path";
import { existsSync } from "node:fs";
import { saveDocumentFromFile } from "./lib/saveDocument";

function printUsage(): never {
  console.error(`Usage:
  npm run save -- <extraction.json> [--slug <id>] [--url <pdf-url>] [--landing-page <url>]
`);
  process.exit(1);
}

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  let slug: string | null = null;
  let documentUrl: string | null = null;
  let landingPageUrl: string | null = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--slug" || arg.startsWith("--slug=")) {
      slug = arg.startsWith("--slug=")
        ? arg.slice("--slug=".length)
        : (argv[++i] ?? null);
    } else if (arg === "--url" || arg.startsWith("--url=")) {
      documentUrl = arg.startsWith("--url=")
        ? arg.slice("--url=".length)
        : (argv[++i] ?? null);
    } else if (arg === "--landing-page" || arg.startsWith("--landing-page=")) {
      landingPageUrl = arg.startsWith("--landing-page=")
        ? arg.slice("--landing-page=".length)
        : (argv[++i] ?? null);
    } else if (arg.startsWith("--")) {
      console.error(`Unknown option: ${arg}`);
      printUsage();
    } else {
      positional.push(arg);
    }
  }

  if (positional.length !== 1) printUsage();
  return {
    jsonPath: path.resolve(process.cwd(), positional[0]),
    slug,
    documentUrl,
    landingPageUrl,
  };
}

async function main() {
  const { jsonPath, slug, documentUrl, landingPageUrl } = parseArgs(
    process.argv.slice(2)
  );
  if (!existsSync(jsonPath)) {
    console.error(`File not found: ${jsonPath}`);
    process.exit(1);
  }

  const result = await saveDocumentFromFile(jsonPath, {
    preferredSlug: slug,
    documentUrl,
    landingPageUrl,
  });

  console.log(`Saved: ${path.relative(process.cwd(), result.outPath)}`);
  console.log(
    `  ${result.data.document_metadata.jurisdiction_name} (${result.data.document_metadata.jurisdiction_level})`
  );
}

main().catch((e) => {
  console.error("Save failed:", e);
  process.exit(1);
});
