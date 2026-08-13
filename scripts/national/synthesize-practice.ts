/**
 * Synthesize Base + Regional Modifier practice draft from a matrix JSON.
 * Refuses to invent numbers — LLM (or heuristic) only phrases the matrix.
 *
 *   npx tsx scripts/national/synthesize-practice.ts --practice bioretention
 *   $env:PIPELINE_LLM='cursor'
 *   npx tsx scripts/national/synthesize-practice.ts --practice bioretention
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import {
  isKnownPracticeKey,
  listCanonicalPracticeKeys,
} from "../../lib/ontology/bmp";
import {
  PRACTICES_DIR,
  practiceMatrixPath,
  practiceSynthesisPath,
} from "../../lib/pipeline/paths";
import {
  practiceMatrixSchema,
  practiceSynthesisLlmSchema,
  practiceSynthesisSchema,
  type PracticeMatrix,
  type PracticeSynthesis,
} from "../../lib/practices/types";
import { cursorJsonPrompt, getPipelineModel } from "../lib/cursorLlm";
import { useHeuristicLlm } from "../lib/corpusHeuristic";
import { loadEnvLocal } from "../lib/loadEnv";

function parseArgs(argv: string[]) {
  let practice = "bioretention";
  let force = false;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if ((a === "--practice" || a === "-p") && argv[i + 1]) {
      practice = argv[++i]!;
    } else if (a.startsWith("--practice=")) {
      practice = a.slice("--practice=".length);
    } else if (a === "--force") {
      force = true;
    }
  }
  return { practice, force };
}

function formatMatrixForPrompt(matrix: PracticeMatrix): string {
  const siteWide = new Set([
    "wqv_depth_inches",
    "max_drawdown_hours",
    "shwt_separation_inches",
  ]);
  const lines: string[] = [
    `Practice: ${matrix.practice_label} (${matrix.practice_key})`,
    `Tier A only: ${matrix.tier_a_only}`,
    `Manuals mentioning practice: ${matrix.manuals_with_practice} / scanned ${matrix.manuals_scanned}`,
    "",
    "Numeric fields:",
  ];
  for (const f of matrix.numeric_fields) {
    const tag = siteWide.has(f.field) ? " [site-wide]" : "";
    lines.push(
      `- ${f.field} (${f.unit})${tag}: n=${f.count}, mode=${f.mode ?? "null"}, median=${f.median ?? "null"}, range=${
        f.min != null && f.max != null ? `${f.min}–${f.max}` : "null"
      }, missing=${f.missing_count}`
    );
    const withVals = f.cells.filter((c) => c.value != null).slice(0, 40);
    for (const c of withVals) {
      lines.push(
        `    ${c.state_code ?? "??"} ${c.slug}: ${c.value} ${f.unit}${
          c.chapter_proxy ? " [chapter_proxy]" : ""
        }`
      );
    }
  }
  lines.push("", "Notes:");
  for (const n of matrix.notes) lines.push(`- ${n}`);
  return lines.join("\n");
}

function heuristicSynthesis(matrix: PracticeMatrix): PracticeSynthesis {
  const siteWide = new Set([
    "wqv_depth_inches",
    "max_drawdown_hours",
    "shwt_separation_inches",
  ]);
  const practiceFields = matrix.numeric_fields.filter(
    (f) => !siteWide.has(f.field)
  );
  const siteFields = matrix.numeric_fields.filter((f) => siteWide.has(f.field));
  const anchor =
    practiceFields.find((f) => f.count > 0) ??
    siteFields.find((f) => f.count > 0);

  const baselineParts: string[] = [
    `National baseline for ${matrix.practice_label} (practice synthesis — not adopted regulation).`,
  ];

  if (practiceFields.length === 0 || practiceFields.every((f) => f.count === 0)) {
    baselineParts.push(
      `Practice-specific numeric criteria are not yet parameterized for enough manuals to state a numeric national baseline for ${matrix.practice_label}; cite local criteria.`
    );
  } else {
    for (const f of practiceFields) {
      if (f.count > 0 && f.mode != null) {
        baselineParts.push(
          `Where ${f.label.toLowerCase()} is specified (n=${f.count}), values cluster around ${f.mode} ${f.unit} (range ${f.min}–${f.max} ${f.unit}).`
        );
      }
    }
  }

  for (const f of siteFields) {
    if (f.count > 0 && f.mode != null) {
      baselineParts.push(
        `Associated ${f.label.toLowerCase()} in the same manuals (n=${f.count}) range ${f.min}–${f.max} ${f.unit} (mode ${f.mode}) — site-wide sizing context, not a ${matrix.practice_label.toLowerCase()}-only rule.`
      );
    }
  }

  baselineParts.push(
    "Use the controlling jurisdiction manual for project design. Prefer retention/runoff reduction where soils and groundwater allow."
  );

  const pickRegion = (states: string[]) => {
    const cells = anchor?.cells ?? [];
    return {
      states: [
        ...new Set(
          cells
            .filter((c) => c.value != null && states.includes(c.state_code ?? ""))
            .map((c) => c.state_code!)
        ),
      ].sort(),
      citation_slugs: [
        ...new Set(
          cells
            .filter((c) => c.value != null && states.includes(c.state_code ?? ""))
            .map((c) => c.slug)
        ),
      ].sort(),
    };
  };

  const cold = pickRegion(["MN", "WI", "MI", "ME", "NH", "VT", "AK"]);
  const coastal = pickRegion(["FL", "SC", "NC", "LA", "TX", "HI"]);
  const arid = pickRegion(["AZ", "NM", "NV", "UT", "CO", "CA"]);

  const modifiers = [
    {
      id: "cold_climate",
      title: "Cold climate / freeze-thaw",
      text: "Cold-climate manuals often adjust underdrain depth, planting, and winter maintenance for freeze-thaw. Verify frost-line and snowmelt criteria in the controlling manual.",
      ...cold,
    },
    {
      id: "coastal_high_wt",
      title: "Coastal / high water table",
      text: "Coastal and high-water-table settings may reduce infiltration credit and require underdrains or impermeable liners. Use SHWT separation values from the matrix when present; otherwise defer to local criteria.",
      ...coastal,
    },
    {
      id: "karst",
      title: "Karst / bedrock",
      text: "Karst and shallow-bedrock settings often require lined facilities or prohibit untreated infiltration. Do not assume unlined infiltration from national defaults.",
      states: [] as string[],
      citation_slugs: [] as string[],
    },
    {
      id: "arid",
      title: "Arid / semi-arid",
      text: "Arid-region manuals may use larger capture depths, different planting palettes, and tighter water budgets. Confirm media specs and irrigation constraints locally.",
      ...arid,
    },
  ];

  const thinPractice = practiceFields.some((f) => f.count > 0)
    ? practiceFields.every((f) => f.count < 5)
    : true;

  return practiceSynthesisSchema.parse({
    version: 1,
    practice_key: matrix.practice_key,
    practice_label: matrix.practice_label,
    generated_at: new Date().toISOString(),
    model: "heuristic",
    editorial_status: "draft",
    national_baseline: baselineParts.join(" "),
    regional_modifiers: modifiers,
    open_issues: thinPractice
      ? `Too few parameterized ${matrix.practice_label.toLowerCase()} values — re-run Cursor enrich-parameters, then rebuild the matrix.`
      : "Engineer review of matrix cells against source PDFs before treating numbers as guidance.",
    matrix_summary: matrix.notes.join(" "),
    supporting_slugs: [...new Set(matrix.mentioning_slugs.slice(0, 40))],
  });
}

async function llmSynthesis(matrix: PracticeMatrix): Promise<PracticeSynthesis> {
  const promptBody = formatMatrixForPrompt(matrix);
  const { data, model, runId } = await cursorJsonPrompt({
    name: `synthesize-practice-${matrix.practice_key}`,
    schema: practiceSynthesisLlmSchema,
    retries: 2,
    prompt: `You are drafting a U.S. Stormwater Practice Synthesis section for "${matrix.practice_label}".
This is research synthesis for committee discussion — NOT an adopted design manual or regulation.

CRITICAL RULES:
- Use ONLY the numeric facts in the MATRIX below. Do not invent depths, hours, or separations.
- Treat fields labeled site-wide as jurisdiction sizing context, not ${matrix.practice_label} facility specs.
- If n is low or mode is null, say the baseline is not yet established numerically.
- national_baseline: cohesive paragraph for the common case (temperate / Type II-ish assumptions).
- regional_modifiers: array of {id, title, text, states[], citation_slugs[]} for cold climate, coastal/high water table, karst, arid as applicable. Only cite states/slugs that appear in the matrix.
- open_issues: honest gaps.
- matrix_summary: one short paragraph restating the numeric consensus.

MATRIX:
${promptBody}`,
  });

  return practiceSynthesisSchema.parse({
    version: 1,
    practice_key: matrix.practice_key,
    practice_label: matrix.practice_label,
    generated_at: new Date().toISOString(),
    model: `${model}:${runId}`,
    editorial_status: "draft",
    national_baseline: data.national_baseline,
    regional_modifiers: data.regional_modifiers,
    open_issues: data.open_issues,
    matrix_summary: data.matrix_summary,
    supporting_slugs: matrix.mentioning_slugs.slice(0, 40),
  });
}

async function main() {
  loadEnvLocal();
  const opts = parseArgs(process.argv.slice(2));
  if (!isKnownPracticeKey(opts.practice)) {
    console.error(
      `Unknown practice "${opts.practice}". Known: ${listCanonicalPracticeKeys().join(", ")}`
    );
    process.exit(1);
  }

  const matrixPath = practiceMatrixPath(opts.practice);
  if (!existsSync(matrixPath)) {
    console.error(
      `Missing matrix at ${matrixPath}. Run: npx tsx scripts/national/build-practice-matrix.ts --practice ${opts.practice}`
    );
    process.exit(1);
  }

  const outPath = practiceSynthesisPath(opts.practice);
  if (existsSync(outPath) && !opts.force) {
    console.log(`Exists ${outPath} (pass --force to overwrite)`);
    return;
  }

  const matrix = practiceMatrixSchema.parse(
    JSON.parse(await readFile(matrixPath, "utf-8"))
  );

  const synthesis = useHeuristicLlm()
    ? heuristicSynthesis(matrix)
    : await llmSynthesis(matrix);

  await mkdir(PRACTICES_DIR, { recursive: true });
  await writeFile(outPath, JSON.stringify(synthesis, null, 2) + "\n", "utf-8");
  console.log(
    `Wrote ${outPath} (model=${synthesis.model ?? "n/a"}, modifiers=${synthesis.regional_modifiers.length})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
