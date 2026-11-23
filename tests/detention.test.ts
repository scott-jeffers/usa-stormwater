import { test } from "node:test";
import assert from "node:assert/strict";
import {
  hydrograph,
  route,
  interp,
  prismStorage,
  rating,
  circularOrifice,
  rectWeir,
  riserTop,
  broadCrestedWeir,
  centroidLag,
  tr55StorageRatio,
  orificeDiameterFor,
  cumulativeFraction,
  type Device,
} from "../lib/detention/engine";
import { WORKED_EXAMPLE, runWorkedExample } from "../lib/detention/example";

const AC_FT = 43560;

test("Type II distribution matches the TR-55 break points", () => {
  assert.equal(cumulativeFraction(12, "II"), 0.663);
  assert.equal(cumulativeFraction(11.5, "II"), 0.283);
  assert.equal(cumulativeFraction(24, "II"), 1);
  assert.equal(cumulativeFraction(12, "III"), 0.5);
});

test("reproduces the HEC-1 detention example in the Knoxville BMP Manual (ST-12)", () => {
  // 15 ac (the manual's 10x scaling), CN 90, lag 0.067 h (Tc 0.1117 h), 10-yr 4.8 in, Type II, 2-min step.
  const { q } = hydrograph({ areaAc: 15, cn: 90, tcHours: 0.067 / 0.6 }, 4.8, "II", 2 / 60, 30);
  const SV = [0, 0.0807, 0.1876, 0.323, 0.4886, 0.6869, 0.9196, 1.1887, 1.4964, 1.8448, 2.2358, 2.6717, 3.1543, 3.6859, 4.2685].map((v) => v * AC_FT);
  const SQ = [0, 0.3, 0.4, 0.5, 0.6, 0.6, 0.7, 3.0, 17.0, 27.0, 35.2, 41.5, 119.4, 208.0, 218.0];
  const SE = SV.map((_, i) => 955 + 0.5 * i);
  const r = route(q, 2 / 60, SE, SV, SQ);
  // HEC-1: inflow peak 78 cfs, routed peak 31 cfs, maximum stage 959.72
  assert.ok(Math.abs(r.peakIn - 78) < 1.5, `inflow ${r.peakIn}`);
  assert.ok(Math.abs(r.peakOut - 31) < 1, `outflow ${r.peakOut}`);
  assert.ok(Math.abs(r.maxStage - 959.72) < 0.05, `stage ${r.maxStage}`);
});

test("outlet equations match the HEC-22 worked examples", () => {
  // HEC-22 ex. 10.10: 0.49 ft orifice, head 3.06 ft to centerline -> 1.59 cfs
  assert.ok(Math.abs(circularOrifice(3.3, 0, 0.49) - 1.59) < 0.02);
  // HEC-22 ex. 10.11: 1.74 ft riser, Cw 0.41 (US 3.29): weir 18.32 h^1.5, orifice 11.44 h^0.5; at h = 0.66 orifice (9.2) controls
  assert.ok(Math.abs(riserTop(0.66, 0, 1.74, 0.41 * Math.sqrt(64.4)) - 9.2) < 0.15);
  assert.ok(Math.abs(riserTop(0.33, 0, 1.74, 0.41 * Math.sqrt(64.4)) - 3.5) < 0.15);
  assert.ok(Math.abs(rectWeir(1, 0, 10) - 33.3) < 1e-9);
  assert.ok(Math.abs(broadCrestedWeir(1, 0, 10) - 26) < 1e-9);
  // partial-flow orifice is continuous at the crown
  const D = 0.5;
  assert.ok(Math.abs(circularOrifice(D - 1e-6, 0, D) - circularOrifice(D, 0, D)) < 1e-3);
});

test("TR-55 storage ratio and orifice sizing helpers", () => {
  // HEC-22 ex. 10.2: qo/qi = 0.62 (Type II) gives Rs = 0.23
  assert.ok(Math.abs(tr55StorageRatio(0.62) - 0.23) < 0.005);
  const d = orificeDiameterFor(1.59, 3.06);
  assert.ok(Math.abs(d - 0.49) < 0.005);
});

test("routing conserves volume", () => {
  const { q } = hydrograph({ areaAc: 10, cn: 85, tcHours: 0.15 }, 3.2, "II", 1 / 60, 120);
  const stages = Array.from({ length: 161 }, (_, i) => i * 0.05);
  const stor = stages.map((h) => prismStorage(h, 120, 60, 3));
  const dev: Device[] = [{ kind: "orifice", invert: 0, diameter: 0.25 }];
  const disch = rating(stages, dev).map((r) => r.total);
  const r = route(q, 1 / 60, stages, stor, disch);
  const vin = q.reduce((a, b) => a + b, 0), vout = r.outflow.reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(vout + r.storage[r.storage.length - 1]! / 60 - vin) / vin < 0.01);
  assert.ok(centroidLag(q, r.outflow, 1 / 60) > 0);
  assert.equal(interp(0.5, [0, 1], [0, 10]), 5);
});

test("worked example in the model manual (Appendix C) meets its own criteria", () => {
  const r = runWorkedExample();
  const ex = WORKED_EXAMPLE;
  assert.ok(r.comLagHours >= 24, `centroid lag ${r.comLagHours}`);
  for (const s of r.storms.filter((s) => s.years === 2 || s.years === 10)) assert.ok(s.routedPeak <= s.prePeak, `${s.years}-yr`);
  const hundred = r.storms.find((s) => s.years === 100)!;
  assert.ok(ex.topOfBerm - hundred.maxStage >= 1);
  assert.ok(ex.topOfBerm - r.blocked100.maxStage >= 1, `blocked ${r.blocked100.maxStage}`);
  assert.ok(!r.barrelControls);
});
