/**
 * Timing smoke for navigation hot paths.
 *
 *   npm run perf:smoke
 *
 * Manual QA checklist (dev):
 * - npm run dev → click /national/intro/, /national/hydrology.design-storms/, /pa-state/
 * - “Rendering…” should be sub-second after first warm load
 *
 * Manual QA checklist (prod):
 * - npm run build → confirm out/national/intro/index.html exists
 */
import { getAllManuals, getManualBySlug, getManualSlugMap } from "../../lib/data";
import {
  getDraftSection,
  getNationalReaderIndex,
} from "../../lib/national";
import {
  getJurisdictionVerifyStatus,
  getVerifyStatusMap,
} from "../../lib/pipeline/verifyReport";

function ms(label: string, fn: () => void): number {
  const t0 = performance.now();
  fn();
  const elapsed = performance.now() - t0;
  console.log(`${label}: ${elapsed.toFixed(1)}ms`);
  return elapsed;
}

// Cold load
const coldAll = ms("cold getAllManuals", () => {
  getAllManuals();
});

const warmAll = ms("warm getAllManuals (×5)", () => {
  for (let i = 0; i < 5; i++) getAllManuals();
});

const slugLookups = ms("getManualBySlug ×50", () => {
  const manuals = getAllManuals();
  for (let i = 0; i < 50; i++) {
    const slug = manuals[i % manuals.length]?.slug;
    if (slug) getManualBySlug(slug);
  }
});

const verifyWarm = ms("getVerifyStatusMap + 50 lookups", () => {
  const map = getVerifyStatusMap();
  const manuals = getAllManuals();
  for (let i = 0; i < 50; i++) {
    const slug = manuals[i % manuals.length]?.slug;
    if (slug) {
      map.get(slug);
      getJurisdictionVerifyStatus(slug);
    }
  }
});

const sectionAssemble = ms("national section enrich (intro)", () => {
  const draft = getDraftSection("intro");
  const manualMap = getManualSlugMap();
  const verifyMap = getVerifyStatusMap();
  if (!draft) throw new Error("missing intro draft");
  for (const c of draft.citations) {
    manualMap.get(c.slug);
    verifyMap.get(c.slug);
  }
  getNationalReaderIndex();
});

let failed = 0;
if (coldAll > 15000) {
  console.error("FAIL: cold getAllManuals > 15s");
  failed += 1;
}
if (warmAll > 50) {
  console.error("FAIL: warm getAllManuals should be near-instant");
  failed += 1;
}
if (slugLookups > 100) {
  console.error("FAIL: 50 slug lookups > 100ms");
  failed += 1;
}
if (verifyWarm > 500) {
  console.error("FAIL: verify map + lookups > 500ms");
  failed += 1;
}
if (sectionAssemble > 200) {
  console.error("FAIL: section enrich > 200ms");
  failed += 1;
}

if (failed > 0) {
  console.error(`perf smoke FAILED (${failed})`);
  process.exit(1);
}
console.log("perf smoke OK");
