import { test } from "node:test";
import assert from "node:assert/strict";
import { avgEndVolume, bridgeFreeboard, compensatoryStorage, designSlr, floorFreeboard, slrAt, tidalTailwater, velocityHead } from "../lib/floodplain/engine";
import { runFloodplainExample } from "../lib/floodplain/example";

const near = (got: number, want: number, tol: number, what: string) =>
  assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got.toFixed(4)}, want ${want} ± ${tol}`);

test("sea-level-rise allowance reproduces TxDOT and Corpus Christi examples", () => {
  // TxDOT Hydraulic Design Manual: pavement 2020-2040, 0.8 ft (2020) to 1.7 ft (2040) -> 0.9 ft
  near(designSlr(2020, 20, [[2020, 0.8], [2040, 1.7]]), 0.9, 1e-9, "TxDOT pavement");
  // TxDOT: road 2025-2055 (2.4 - 1.0 = 1.4 ft); bridge 2025-2100 (5.2 - 1.0 = 4.2 ft)
  const tx: Array<[number, number]> = [[2025, 1.0], [2055, 2.4], [2100, 5.2]];
  near(designSlr(2025, 30, tx), 1.4, 1e-9, "TxDOT road");
  near(designSlr(2025, 75, tx), 4.2, 1e-9, "TxDOT bridge");
  // Corpus Christi / TxDOT coastal: 3.0 ft (2070) - 0.7 ft (2020) = 2.3 ft; 5.15 (2095) - 0.8 (2020) = 4.35 ft
  near(designSlr(2020, 50, [[2020, 0.7], [2070, 3.0]]), 2.3, 1e-9, "Corpus Christi 50-yr");
  near(designSlr(2020, 75, [[2020, 0.8], [2095, 5.15]]), 4.35, 1e-9, "Corpus Christi 75-yr");
  near(slrAt(2045, [[2020, 0.8], [2070, 3.0]]), 1.9, 1e-9, "interpolation");
  assert.deepEqual(tidalTailwater(3.1, 2.3, 4.0), { tw: 5.4, governs: "tide" });
});

test("compensatory storage and freeboard", () => {
  // Cook County WMO guidance: required compensatory storage = 1.1 x 36,250 cf of fill = 39,875 cf
  near(compensatoryStorage([{ lo: 0, hi: 1, fillCf: 36250, cutCf: 40000 }], 1.1).required, 39875, 1e-6, "Cook County 1.1:1");
  const c = compensatoryStorage([{ lo: 100, hi: 101, fillCf: 1000, cutCf: 1500 }, { lo: 101, hi: 102, fillCf: 800, cutCf: 500 }]);
  assert.equal(c.ok, false, "excess cut in a lower band does not offset a higher band");
  near(avgEndVolume([{ z: 100, area: 1000 }, { z: 101, area: 2000 }, { z: 102, area: 2000 }]), 3500, 1e-9, "average end area");
  near(velocityHead(10), 100 / 64.4, 1e-9, "velocity head");
  assert.equal(bridgeFreeboard(110, 108, 4).ok, true);
  assert.equal(bridgeFreeboard(110, 108, 12).governing, "velocity head");
  assert.equal(floorFreeboard(101.5, 100).ok, false);
});

test("worked example in the model manual (Appendix I)", () => {
  const r = runFloodplainExample();
  near(r.comp.fill, 6100, 1e-6, "fill");
  assert.equal(r.comp.ok, true);
  assert.equal(r.floor.ok, true);
  near(r.bridge.provided, 2.3, 1e-9, "bridge freeboard");
  assert.equal(r.bridge.ok, true);
  near(r.slr, 1.95, 0.01, "50-year sea-level-rise allowance");
  near(r.tw.tw, 4.05, 0.01, "tidal tailwater");
});
