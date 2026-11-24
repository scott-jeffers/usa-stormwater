import { test } from "node:test";
import assert from "node:assert/strict";
import { checkMedia, drainHours, filterArea, inHrToFtDay, loadRemoved, mediaFlowCfs, simpleLoad, underdrainCapacity, underdrainSize } from "../lib/bioretention/engine";
import { fullPipe } from "../lib/hydraulics/engine";
import { runBioretentionExample } from "../lib/bioretention/example";

const near = (got: number, want: number, tol: number, what: string) =>
  assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got.toFixed(3)}, want ${want} ± ${tol}`);

test("filter area by Darcy's law reproduces published examples", () => {
  // Rhode Island Stormwater Design Manual, Appendix D, Bio 2: 1,851.1 cf, df 2.5 ft, k 1 ft/day, hf 0.375 ft, 2 days -> 805 sq ft
  near(filterArea(1851.1, 2.5, 1, 0.375, 2), 805, 1, "RI Bio 2");
  // Rhode Island dry swale DA 4: 3,993 cf, df 2.5, k 1, hf 0.25, 2 days -> 1,815 sq ft
  near(filterArea(3993, 2.5, 1, 0.25, 2), 1815, 1, "RI dry swale");
  // Clarksville, TN: 7,495 cf, df 5 ft, k 0.5 ft/day, hf 0.25 ft, 2 days -> 7,138 sq ft
  near(filterArea(7495, 5, 0.5, 0.25, 2), 7138, 1, "Clarksville bioretention");
  // Tarrant County (iSWM) sand filter: 8,102 cf, df 1.5, k 3.5, hf 2.17, 40 h -> 567.7 sq ft
  near(filterArea(8102, 1.5, 3.5, 2.17, 40 / 24), 567.7, 0.5, "Tarrant sand filter");
});

test("media flow, drain time and underdrains are consistent", () => {
  near(inHrToFtDay(1), 2, 1e-12, "1 in/hr = 2 ft/day");
  const q = mediaFlowCfs(1000, 2, 2, 0.5);
  near(q, (2 / 12 / 3600) * 1000 * 1.25, 1e-12, "Darcy flow");
  near(drainHours(1000 * 0.5, 1000, 2, 2, 0.25), 500 / mediaFlowCfs(1000, 2, 2, 0.25) / 3600, 1e-9, "drain time");
  near(underdrainCapacity(6, 2, 0.011, 0.005), 2 * fullPipe(0.5, 0.011, 0.005).Q, 1e-12, "two 6 in pipes");
  assert.equal(underdrainSize(0.05, 1, 0.011, 0.005), 4);
  assert.equal(underdrainSize(0.5, 1, 0.011, 0.005), 8);
});

test("media checks and Simple Method", () => {
  const c = checkMedia({ sandPct: 86, clayPct: 2, omPct: 4, pIndex: 25, kInHr: 2 });
  assert.ok(c.filter((x) => x.ok === false).length === 0);
  assert.equal(c.find((x) => x.spec.key === "compostOmPct")!.ok, null);
  assert.equal(checkMedia({ sandPct: 60, clayPct: 2, omPct: 4, pIndex: 45, kInHr: 2 }).filter((x) => x.ok === false).length, 2);
  // L = 0.226 x 40 x 0.9 x 0.95 x 0.26 x 1 = 2.01 lb/yr
  near(simpleLoad(40, 0.95, 0.26, 1), 2.0096, 1e-3, "Simple Method");
  near(loadRemoved(10, 0.9, 0.4, 0.5), 10 * 0.9 * (0.4 + 0.6 * 0.5), 1e-12, "load removed");
});

test("worked example in the model manual (Appendix G)", () => {
  const r = runBioretentionExample();
  near(r.wqv, 2069, 1, "WQv");
  near(r.afDarcy, 414, 1, "Darcy area");
  near(r.afStorage, 776, 1, "storage area");
  near(r.storageCf, 1800, 1e-6, "storage above the underdrain");
  near(r.sumpCf, 600, 1e-6, "sump");
  near(r.pondDrainH, 9.6, 0.05, "ponded water drains");
  near(r.sumpH, 53.3, 0.1, "sump drains");
  assert.equal(r.underdrainIn, 4);
  near(r.retained, 1320, 1e-6, "retention credit matches Appendix F");
  near(r.loadLb, 1.266, 0.002, "annual TP load");
  near(r.removedShare, 0.705, 0.002, "TP removed");
  assert.ok(r.media.every((m) => m.ok !== false));
});
