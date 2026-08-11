/**
 * Emit data/pipeline/VERIFY.md from progress.json verify meta.
 *
 *   npm run pipeline:verify-report
 */
import { mkdir, writeFile } from "node:fs/promises";
import { PIPELINE_DIR, VERIFY_PATH } from "../../lib/pipeline/paths";
import {
  buildVerifyReportData,
  formatVerifyMarkdown,
} from "../../lib/pipeline/verifyReport";

async function main() {
  const data = buildVerifyReportData();
  const body = formatVerifyMarkdown(data);
  await mkdir(PIPELINE_DIR, { recursive: true });
  await writeFile(VERIFY_PATH, body, "utf-8");
  console.log(body);
  console.log(`\nWrote ${VERIFY_PATH}`);
  console.log(
    `Summary: passed=${data.passed} failed=${data.failed} skipped=${data.skipped}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
