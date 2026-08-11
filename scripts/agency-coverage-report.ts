/**
 * Generate agency manual coverage report (DOT + DEP/DEQ).
 *
 *   npm run agency:report
 *   npm run agency:report -- --category dot
 *   npm run agency:report -- --state VA --json
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildAgencyCoverageReport,
  renderAgencyCoverageMarkdown,
} from "../lib/agencyCoverage";

const AGENCY_DIR = path.resolve(process.cwd(), "data/agency-targets");

function parseArgs(argv: string[]) {
  let category: "dot" | "dep_deq" | "all" = "all";
  let state: string | null = null;
  let jsonOnly = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--json") jsonOnly = true;
    else if (a.startsWith("--category=")) {
      const v = a.slice("--category=".length).toLowerCase();
      if (v === "dot" || v === "dep_deq" || v === "all") category = v;
      else console.warn(`Unknown category "${v}", using all`);
    } else if (a === "--category" && argv[i + 1]) {
      const v = argv[++i]!.toLowerCase();
      if (v === "dot" || v === "dep_deq" || v === "all") category = v;
    } else if (a.startsWith("--state=")) {
      state = a.slice("--state=".length).toUpperCase();
    } else if (a === "--state" && argv[i + 1]) {
      state = argv[++i]!.toUpperCase();
    } else if (/^[A-Za-z]{2}$/.test(a) && !state) {
      state = a.toUpperCase();
    } else if (
      (a === "dot" || a === "dep_deq" || a === "all") &&
      category === "all"
    ) {
      category = a;
    }
  }
  return { category, state, jsonOnly };
}

async function main() {
  const { category, state, jsonOnly } = parseArgs(process.argv.slice(2));
  await mkdir(AGENCY_DIR, { recursive: true });

  const report = buildAgencyCoverageReport({ category, state });

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return;
  }

  const md = renderAgencyCoverageMarkdown(report);
  const reportPath = path.join(AGENCY_DIR, "REPORT.md");
  const gapsPath = path.join(AGENCY_DIR, "gaps.json");

  const gapRows = report.rows.filter(
    (r) =>
      r.reason !== "covered" &&
      r.reason !== "unavailable" &&
      r.reason !== "superseded"
  );

  await writeFile(reportPath, md, "utf-8");
  await writeFile(
    gapsPath,
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        filters: { category, state },
        summary: report.summary,
        gaps: gapRows,
        referenced_but_not_cataloged: report.referenced_but_not_cataloged,
      },
      null,
      2
    ) + "\n",
    "utf-8"
  );

  console.log("Agency coverage report");
  console.log(`  Expected: ${report.summary.expected}`);
  console.log(`  Covered:  ${report.summary.covered}`);
  console.log(`  Partial:  ${report.summary.partial}`);
  console.log(`  Gaps:     ${report.summary.gaps}`);
  console.log(`  DOT gaps: ${report.summary.byCategory.dot}`);
  console.log(`  DEP gaps: ${report.summary.byCategory.dep_deq}`);
  console.log(`  Wrote ${reportPath}`);
  console.log(`  Wrote ${gapsPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
