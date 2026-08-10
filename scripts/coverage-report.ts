/**
 * Generate coverage gap report.
 *
 *   npm run coverage:report
 *   npm run coverage:report -- --tier p1
 *   npm run coverage:report -- --json
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  buildCoverageReport,
  renderCoverageMarkdown,
  type CoverageTier,
} from "../lib/coverage";

const COVERAGE_DIR = path.resolve(process.cwd(), "data/coverage");

function parseArgs(argv: string[]) {
  let tier: CoverageTier | "all" = "all";
  let jsonOnly = false;
  for (const a of argv) {
    if (a === "--json") jsonOnly = true;
    else if (a.startsWith("--tier=")) {
      const v = a.slice("--tier=".length).toLowerCase();
      if (v === "p1" || v === "p2" || v === "p3" || v === "queue") {
        tier = v;
      } else if (v === "all") {
        tier = "all";
      } else {
        console.warn(`Unknown tier "${v}", using all`);
      }
    } else if (a === "--tier") {
      // handled with next — support `--tier p1`
    }
  }
  const tierIdx = argv.indexOf("--tier");
  if (tierIdx >= 0 && argv[tierIdx + 1] && !argv[tierIdx + 1]!.startsWith("-")) {
    const v = argv[tierIdx + 1]!.toLowerCase();
    if (v === "p1" || v === "p2" || v === "p3" || v === "queue" || v === "all") {
      tier = v as CoverageTier | "all";
    }
  }
  return { tier, jsonOnly };
}

async function main() {
  const { tier, jsonOnly } = parseArgs(process.argv.slice(2));
  await mkdir(COVERAGE_DIR, { recursive: true });

  const report = buildCoverageReport({ tierFilter: tier });

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
    return;
  }

  const md = renderCoverageMarkdown(report);
  const reportPath = path.join(COVERAGE_DIR, "REPORT.md");
  const gapsPath = path.join(COVERAGE_DIR, "gaps.json");

  await writeFile(reportPath, md, "utf-8");
  await writeFile(
    gapsPath,
    JSON.stringify(
      {
        generatedAt: report.generatedAt,
        summary: report.summary,
        gaps: report.gaps,
        queueGaps: report.queueGaps,
      },
      null,
      2
    ) + "\n",
    "utf-8"
  );

  console.log("Coverage report");
  console.log(`  Targets: ${report.summary.targets}`);
  console.log(`  Covered: ${report.summary.covered}`);
  console.log(`  Gaps:    ${report.summary.gaps}`);
  console.log(
    `  P1/P2/P3: ${report.summary.byTier.p1} / ${report.summary.byTier.p2} / ${report.summary.byTier.p3}`
  );
  console.log(`  Queue:   ${report.summary.queueGaps}`);
  console.log(`  Wrote ${path.relative(process.cwd(), reportPath)}`);
  console.log(`  Wrote ${path.relative(process.cwd(), gapsPath)}`);

  const sf = report.gaps.find(
    (g) =>
      g.jurisdiction.toLowerCase() === "san francisco" &&
      g.state_code === "CA"
  );
  if (sf) {
    console.log(
      `\nSan Francisco gap: tier=${sf.tier} reason=${sf.reason} slug=${sf.suggestedSlug}`
    );
  } else if (
    report.covered.some(
      (c) =>
        c.jurisdiction.toLowerCase() === "san francisco" &&
        c.state_code === "CA"
    )
  ) {
    console.log("\nSan Francisco is covered.");
  } else {
    console.log("\nWarning: San Francisco not found in gaps or covered list.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
