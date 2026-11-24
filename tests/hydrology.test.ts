import { test } from "node:test";
import assert from "node:assert/strict";
import {
  sheetFlowMinutes, shallowVelocity, timeOfConcentration, weightedC, rationalPeak, frequencyFactor, intensityAt,
  unitPeak, runoffDepth, nrcsHydrograph, weightedCN,
} from "../lib/hydrology/engine";
import { runHydrologyExample } from "../lib/hydrology/example";

const near = (got: number, want: number, tol: number, what: string) =>
  assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got.toFixed(4)}, want ${want} ± ${tol}`);

test("HEC-22 Example 4.2: sheet and shallow concentrated flow travel times", () => {
  near(sheetFlowMinutes(0.41, 223, 4.35, 0.01), 47.1, 0.2, "sheet flow, Bermuda grass");
  near(259 / shallowVelocity("Grassed waterway", 0.006) / 60, 3.7, 0.1, "grassed waterway");
  const r = timeOfConcentration([
    { kind: "sheet", L: 223, S: 0.01, n: 0.41 },
    { kind: "shallow", L: 259, S: 0.006, surface: "Grassed waterway" },
    { kind: "channel", L: 479, V: 479 / (1.4 * 60) },
  ], 4.35);
  near(r.tc, 52.2, 0.3, "time of concentration");
});

test("TR-55 velocities and runoff depth", () => {
  near(shallowVelocity("Unpaved", 0.01), 1.61, 0.01, "unpaved, 1% (TR-55 Figure 3-1)");
  near(shallowVelocity("Paved", 0.01), 2.03, 0.01, "paved, 1%");
  near(runoffDepth(5, 80), 2.89, 0.01, "Q for P = 5 in, CN 80 (TR-55 Table 2-1)");
  near(runoffDepth(1, 98), 0.79, 0.01, "Q for P = 1 in, CN 98");
});

test("HEC-22 Examples 4.1 and 4.3: weighted C and rational peaks", () => {
  near(weightedC([{ area: 22.1, C: 0.25 }, { area: 21.2, C: 0.22 }]), 0.235, 0.001, "existing C");
  const Cp = weightedC([{ area: 5.4, C: 0.9 }, { area: 1.6, C: 0.15 }, { area: 18.6, C: 0.25 }, { area: 17.7, C: 0.22 }]);
  near(Cp, 0.315, 0.001, "proposed C");
  near(rationalPeak(0.235, 1.9, 43.3).Q, 19.3, 0.05, "existing peak");
  near(rationalPeak(Cp, 2.3, 43.3).Q, 31.4, 0.05, "proposed peak");
  assert.equal(frequencyFactor(100), 1.25);
  assert.ok(rationalPeak(0.95, 5, 1, 100).capped, "C·Cf capped at 1");
});

test("HEC-22 Table 9.8 intensities interpolate log-log", () => {
  const idf: Array<[number, number]> = [[5, 7.1], [10, 5.9], [15, 5.1], [20, 4.5], [30, 3.5], [60, 2.4]];
  near(intensityAt(10, idf), 5.9, 1e-9, "table point");
  assert.ok(intensityAt(12, idf) < 5.9 && intensityAt(12, idf) > 5.1, "between points");
  assert.equal(intensityAt(3, idf), 7.1);
});

test("HEC-22 Example 4.4: NRCS unit hydrograph peak", () => {
  near(unitPeak(0.463, 1.34), 251, 1, "qp for 1 in of runoff");
});

test("separate impervious and pervious runoff exceeds a weighted CN for small storms", () => {
  const cover = [
    { label: "Impervious", area: 4, cn: 98, impervious: true },
    { label: "Lawn", area: 6, cn: 74, impervious: false },
  ];
  near(weightedCN(cover), 83.6, 0.01, "weighted CN");
  const w = nrcsHydrograph(cover, 15, 1.2, "II", "weighted");
  const s = nrcsHydrograph(cover, 15, 1.2, "II", "separate");
  assert.ok(s.runoffIn > 1.5 * w.runoffIn, `separate ${s.runoffIn} vs weighted ${w.runoffIn}`);
  near(s.runoffIn, (4 * runoffDepth(1.2, 98) + 6 * runoffDepth(1.2, 74)) / 10, 1e-6, "area-averaged depth");
});

test("worked example in the model manual (Appendix E) meets Section 4", () => {
  const r = runHydrologyExample();
  assert.ok(r.post.tc >= 5 && r.pre.tc >= 5, "minimum Tc");
  assert.ok(r.post.segments[0]!.L <= 100 && r.pre.segments[0]!.L <= 100, "sheet flow 100 ft");
  assert.ok(r.rational.post.Q > r.rational.pre.Q, "development raises the peak");
  assert.ok(r.nrcs.small.separate.runoffIn > r.nrcs.small.weighted.runoffIn, "separate method gives more runoff");
});
