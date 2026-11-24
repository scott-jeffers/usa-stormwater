import { test } from "node:test";
import assert from "node:assert/strict";
import { accountSite, creditFraction, creditMeasure, rv, treeOffsetSf, wqv } from "../lib/credits/engine";
import { runCreditsExample } from "../lib/credits/example";

const near = (got: number, want: number, tol: number, what: string) =>
  assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got.toFixed(3)}, want ${want} ± ${tol}`);

test("WQv by the unified formula (model manual 4.2)", () => {
  near(rv(100), 0.95, 1e-9, "Rv for impervious");
  near(wqv(43560, 100, 1), 3448.5, 0.1, "1 acre impervious, 1 in");
});

test("credits follow the 3.9 table", () => {
  assert.equal(creditFraction("infiltrating"), 1);
  assert.equal(creditFraction("underdrained"), 0.4);
  assert.equal(creditFraction("disconnection", "C"), 0.25);
  assert.equal(creditFraction("disconnection", "C", true), 0.5);
  assert.equal(creditFraction("conservation", "B"), 0.75);
  assert.equal(creditFraction("treatmentOnly"), 0);
  const u = creditMeasure({ label: "", kind: "underdrained", areaSf: 43560, impPct: 100, hsg: "C", storageCf: 2000, sumpCf: 500 }, 1);
  near(u.retained, 0.4 * 2000 + 500, 1e-9, "underdrained with sump");
  const big = creditMeasure({ label: "", kind: "infiltrating", areaSf: 1000, impPct: 100, hsg: "C", storageCf: 5000 }, 1);
  assert.ok(big.capped && Math.abs(big.retained - big.wqvIn) < 1e-9, "credit capped at the drainage area's WQv");
});

test("worked example in the model manual (Appendix F)", () => {
  const r = runCreditsExample();
  near(r.siteWqv, 4937, 1, "site WQv");
  near(r.measures[0]!.retained, 158.3, 0.1, "disconnection");
  near(r.measures[1]!.retained, 1000, 1e-6, "harvesting, used volume");
  near(r.measures[2]!.retained, 1034.5, 0.1, "permeable pavement, capped");
  near(r.measures[3]!.retained, 1320, 1e-6, "bioretention");
  near(r.retained, 3512.8, 0.5, "total retained");
  near(r.remainder, 1424, 1, "remainder to treat");
  assert.ok(accountSite(1000, 100, 1, []).remainder > 0);
});

test("tree credit offsets impervious area, capped at 25% (3.8.5)", () => {
  assert.equal(treeOffsetSf(10, 10000), 1000);
  assert.equal(treeOffsetSf(40, 10000), 2500);
  const r = accountSite(43560, 50, 1, [], 10);
  near(r.effImpPct, 50 - (1000 / 43560) * 100, 1e-9, "effective impervious share");
  assert.ok(r.siteWqv < wqv(43560, 50, 1));
});
