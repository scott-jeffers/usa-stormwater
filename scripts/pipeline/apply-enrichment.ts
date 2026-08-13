/**
 * Apply a design_parameters enrichment object onto data/documents/<slug>.json
 *
 *   npx tsx scripts/pipeline/apply-enrichment.ts --slug wa-state --file enrich.json
 *   # or stdin JSON with { slug, ...enrichment fields }
 */
import { writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { DOCUMENTS_DIR } from "../../lib/pipeline/paths";
import {
  designParametersEnrichmentSchema,
  stormwaterSchema,
  type DesignParameters,
} from "../../lib/schema";
import { listCanonicalPracticeKeys } from "../../lib/ontology/bmp";
import {
  designParametersFromEnrichment,
  mergeParameterEvidence,
} from "../../lib/practices/params";
import { z } from "zod";

const payloadSchema = designParametersEnrichmentSchema.extend({
  slug: z.string(),
});

function sanitizePracticeMentions(raw: string[]): string[] {
  const known = new Set(listCanonicalPracticeKeys());
  return [
    ...new Set(
      raw.map((s) => s.trim().toLowerCase()).filter((s) => known.has(s))
    ),
  ].sort();
}

async function main() {
  const argv = process.argv.slice(2);
  let slugArg: string | null = null;
  let fileArg: string | null = null;
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--slug") slugArg = argv[++i] ?? null;
    else if (argv[i] === "--file") fileArg = argv[++i] ?? null;
  }

  if (!fileArg) {
    throw new Error("Pass --file path/to/enrichment.json");
  }
  const rawText = await readFile(fileArg, "utf-8");

  const parsed = payloadSchema.parse(JSON.parse(rawText));
  const slug = slugArg ?? parsed.slug;
  const docPath = path.join(DOCUMENTS_DIR, `${slug}.json`);
  if (!existsSync(docPath)) {
    throw new Error(`Missing ${docPath}`);
  }

  const data = stormwaterSchema.parse(
    JSON.parse(await readFile(docPath, "utf-8"))
  );

  const design_parameters: DesignParameters = designParametersFromEnrichment(
    parsed,
    {
      model: "cursor-agent-session",
      practiceMentions: sanitizePracticeMentions(parsed.practice_mentions),
    }
  );

  const next = stormwaterSchema.parse({
    ...data,
    design_parameters,
    evidence: mergeParameterEvidence(data.evidence, parsed.evidence),
  });

  await writeFile(docPath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  console.log(`applied ${slug}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
