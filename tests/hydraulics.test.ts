import { test } from "node:test";
import assert from "node:assert/strict";
import { runConveyanceExample } from "../lib/hydraulics/example";
import {
  gutterQ, gutterSpread, gutterFlow, gutterForFlow, grateOnGrade, curbOnGrade, grateSag, curbSag, curbSagWeirQ,
  fullPipe, requiredDiameter, standardSize, manningQ, normalDepth, criticalDepth, geometry,
  culvert, inletControlHW, CULVERT_INLETS, hglRun, type DrainRun,
} from "../lib/hydraulics/engine";

const near = (got: number, want: number, tol: number, what: string) =>
  assert.ok(Math.abs(got - want) <= tol, `${what}: got ${got.toFixed(4)}, want ${want} ± ${tol}`);

// ---- HEC-22 (4th ed.) chapter 5: gutters
test("HEC-22 Example 5.1: triangular gutter spread and flow", () => {
  near(gutterSpread(1.8, 0.02, 0.01, 0.016), 9.0, 0.05, "spread");
  near(gutterQ(8.2, 0.02, 0.01, 0.016), 1.4, 0.05, "flow");
});

test("HEC-22 Example 5.2: composite gutter flow and spread", () => {
  const g = { Sx: 0.02, SL: 0.01, n: 0.016, W: 2, a: 2 / 12 };
  near(gutterFlow(g, 8.2).Q, 2.3, 0.05, "flow at 8.2 ft spread");
  near(gutterFlow(g, 8.2).Eo, 0.70, 0.015, "Eo");
  near(gutterForFlow(g, 4.2).T, 11.1, 0.15, "spread at 4.2 cfs");
});

// ---- HEC-22 chapter 7: inlets
test("HEC-22 Example 7.1: grates on grade (Table 7.4)", () => {
  const g = { Sx: 0.025, SL: 0.04, n: 0.016 };
  const Q = gutterQ(9.84, 0.025, 0.04, 0.016);
  near(Q, 6.62, 0.03, "gutter flow");
  const a = grateOnGrade(g, Q, 2, 2, 8.2);
  near(a.Eo, 0.45, 0.01, "Eo");
  near(a.V, 5.4, 0.1, "velocity");
  near(a.Rs, 0.038, 0.002, "Rs");
  near(a.Qi, 3.15, 0.03, "P-1-7/8 2x2");
  near(grateOnGrade(g, Q, 2, 2, 4.1).Qi, 2.80, 0.05, "reticuline 2x2");
  near(grateOnGrade(g, Q, 2, 4, 8.2).Qi, 3.60, 0.03, "P-1-7/8 2x4");
});

test("HEC-22 Example 7.2: curb opening on grade, without and with a depressed gutter", () => {
  const plain = curbOnGrade({ Sx: 0.02, SL: 0.01, n: 0.016 }, 1.77, 9.84);
  near(plain.LT, 23.9, 0.2, "LT");
  near(plain.E, 0.61, 0.01, "E");
  near(plain.Qi, 1.08, 0.02, "Qi");
  const dep = curbOnGrade({ Sx: 0.02, SL: 0.01, n: 0.016, W: 2, a: 1 / 12 }, 1.77, 9.84);
  near(dep.Eo, 0.64, 0.02, "Eo");
  near(dep.LT, 14.3, 0.3, "LT depressed");
  near(dep.Qi, 1.56, 0.03, "Qi depressed");
});

test("HEC-22 Example 7.4: sweeper combination inlet on grade", () => {
  const g = { Sx: 0.02, SL: 0.01, n: 0.016, W: 2, a: 1 / 12 };
  const curb = curbOnGrade(g, 1.77, 7.84);
  near(curb.Qi, 1.35, 0.03, "curb part");
  const grate = grateOnGrade(g, curb.Qb, 2, 2, 6.0);
  near(grate.Qi, 0.41, 0.03, "grate part");
});

test("HEC-22 Example 7.5: grate in a sag, 50% clogged", () => {
  const r = grateSag(6.71, 8.0, 0.5 * 2 * 3 * 1.0);
  near(r.dWeir, 0.43, 0.01, "weir depth");
  near(r.dOrifice, 0.17, 0.01, "orifice depth");
  assert.equal(r.control, "weir");
});

test("HEC-22 Example 7.6: curb opening in a sag", () => {
  near(curbSagWeirQ(0.16, 8.2), 1.6, 0.05, "undepressed");
  near(curbSagWeirQ(0.16, 8.2, 2, true), 1.7, 0.06, "depressed (printed 1.7, computed 1.76)");
  const r = curbSag(1.6, 8.2, 0.43);
  assert.equal(r.control, "weir");
  near(r.d, 0.16, 0.01, "depth for 1.6 cfs");
});

// ---- HEC-22 chapter 9: storm drains
test("HEC-22 Example 9.1: pipe size and full-flow capacity", () => {
  near(requiredDiameter(17.6, 0.013, 0.015), 1.69, 0.01, "RCP diameter");
  assert.equal(standardSize(requiredDiameter(17.6, 0.013, 0.015)), 21);
  near(requiredDiameter(17.6, 0.017, 0.015), 1.87, 0.01, "CMP diameter");
  const f = fullPipe(1.75, 0.013, 0.015);
  near(f.Q, 19.3, 0.2, "RCP capacity");
  near(f.V, 8.0, 0.1, "RCP velocity");
  near(fullPipe(1.5, 0.013, 0.03).Q, 18.1, 0.2, "Example 9.2 pipe 40-41");
});

test("HEC-22 Example 9.2: HGL and EGL with the FHWA access-hole method", () => {
  // Outfall pipe 43-44 and pipe 42-43 of the example. Pipe 42-43 is given a 0.001 slope,
  // the slope the example uses for its capacity (the printed inverts drop only 0.01 ft).
  const run: DrainRun = {
    pipes: [
      { id: "42-43", d: 2, n: 0.013, L: 14.1, invUp: 344.06 + 0.0141, invDn: 344.06, Q: 6.75 },
      { id: "43-44", d: 2, n: 0.013, L: 55.8, invUp: 331.27, invDn: 330.71, Q: 6.75 },
    ],
    structures: [
      { id: "42", rim: 349.31, bench: "flat", angle: 90, surfaceQ: 1.65 },
      { id: "43", rim: 347.76, bench: "flat", angle: 180, surfaceQ: 0 },
    ],
    tailwater: 333.5,
  };
  // add the 5.1 cfs from pipe 41-42 entering structure 42 at 90 degrees, non-plunging
  run.pipes.unshift({ id: "41-42", d: 1.5, n: 0.013, L: 328, invUp: 354.07, invDn: 344.23, Q: 5.1 });
  run.structures.unshift({ id: "41", rim: 360, bench: "flat", angle: 180, surfaceQ: 1.8 });
  const r = hglRun(run);
  const p44 = r.pipes[2]!, s43 = r.structures[2]!, p43 = r.pipes[1]!, s42 = r.structures[1]!;
  assert.equal(p44.caseDn, "A");
  near(p44.EGLdn, 333.57, 0.01, "EGL outlet end of 43-44");
  near(p44.EGLup, 333.62, 0.01, "EGL upstream end of 43-44");
  near(p44.Ei, 2.35, 0.01, "Ei");
  near(s43.DI, 0.268, 0.002, "DI");
  near(s43.Eai, 2.36, 0.01, "Eai at 43");
  near(s43.EGL, 333.68, 0.05, "EGL at 43");
  near(p43.yn!, 1.56, 0.03, "yn of 42-43");
  near(p43.EGLup, 345.73, 0.03, "EGL upstream end of 42-43");
  near(s42.Ctheta, 2.40, 0.02, "C-theta at 42");
  near(s42.CP, 0.44, 0.02, "CP at 42");
  near(s42.EGL, 345.81, 0.04, "EGL at 42");
});

// ---- HDS-4: open channels
test("HDS-4 Examples 4.1, 4.2 and 4.5: trapezoidal channel normal and critical depth", () => {
  const ch41 = { kind: "trap" as const, b: 6.5, z1: 2, z2: 2 };
  const q = manningQ(ch41, 1.6, 0.02, 0.003);
  near(q / geometry(ch41, 1.6).A, 4.45, 0.03, "4.1 velocity");
  near(q, 69.06, 0.6, "4.1 discharge");
  near(normalDepth({ kind: "trap", b: 5, z1: 2, z2: 2 }, 105, 0.013, 0.002)!, 1.96, 0.02, "4.2 depth");
  const ch45 = { kind: "trap" as const, b: 20, z1: 1, z2: 1 };
  const yc = criticalDepth(ch45, 325);
  near(yc, 1.95, 0.02, "4.5 critical depth");
  near(325 / geometry(ch45, yc).A, 7.59, 0.05, "4.5 critical velocity");
});

// ---- HDS-5 culverts (examples reproduced in the MDOT and HDS-4 manuals)
test("HDS-5 inlet control: 36-in concrete pipe, 78 cfs (MDOT Drainage Manual 3.8.3)", () => {
  const s = { kind: "circle" as const, d: 3 };
  near(inletControlHW(s, CULVERT_INLETS.rcp_square_headwall!, 78, 0.01).HW / 3, 2.3, 0.03, "square edge HW/D");
  near(inletControlHW(s, CULVERT_INLETS.rcp_groove_headwall!, 78, 0.01).HW / 3, 1.92, 0.02, "groove end HW/D");
  const r = culvert({ section: s, inlet: CULVERT_INLETS.rcp_groove_headwall!, Q: 78, n: 0.012, L: 100, S: 0.01, TW: 2.27 });
  near(r.HWi, 5.76, 0.08, "inlet control");
  near(r.dc, 2.8, 0.1, "critical depth");
  near(r.H, 3.5, 0.15, "barrel losses");
  near(r.HWo, 5.4, 0.15, "outlet control");
  assert.equal(r.control, "inlet");
});

test("HDS-5 inlet control: 7 x 6 ft box, 400 cfs (HDS-5 example in the MDOT manual)", () => {
  const s = { kind: "box" as const, b: 7, h: 6 };
  near(inletControlHW(s, CULVERT_INLETS.box_headwall_bevel45!, 400, 0.05).HW / 6, 1.27, 0.02, "45° bevel HW/D");
  near(inletControlHW(s, CULVERT_INLETS.box_headwall_chamfer!, 400, 0.05).HW / 6, 1.33, 0.02, "chamfer HW/D");
  const r = culvert({ section: s, inlet: CULVERT_INLETS.box_headwall_bevel45!, Q: 400, n: 0.012, L: 300, S: 0.05, TW: 2.8 });
  near(r.HW, 7.5, 0.15, "controlling headwater (HY-8 7.49, nomograph 7.6)");
  near(r.dc, 4.7, 0.05, "critical depth");
  assert.equal(r.control, "inlet");
});

test("HDS-4 Example 9.1: 60-in groove-end projecting RCP passes 212 cfs about 3 ft below the road", () => {
  const r = culvert({ section: { kind: "circle", d: 5 }, inlet: CULVERT_INLETS.rcp_groove_projecting!, Q: 212, n: 0.012, L: 197, S: 0.01, TW: 3.28 });
  near(1968.5 + r.HW, 1978.35 - 2.95, 0.3, "headwater elevation");
  assert.equal(r.control, "inlet");
});

test("worked example in the model manual (Appendix D) meets Section 8", () => {
  const r = runConveyanceExample();
  near(r.inlet1.T, 7.8, 0.05, "spread at inlet 1");
  near(r.inlet1.Qi, 2.5, 0.01, "inlet 1 interception");
  near(r.inlet2.d / 0.02, 11.3, 0.05, "sag spread, design storm");
  assert.ok(r.inlet2check.d / 0.02 <= 14, "sag spread, 50-year, within 14 ft");
  for (const s of r.sizing) {
    assert.ok(s.Vfull >= 3 && s.Vdesign <= 15, `${s.id} velocity`);
    assert.ok(s.Qfull >= s.Q, `${s.id} capacity`);
  }
  for (const st of r.hgl.structures) assert.ok(st.clearance >= 1, `structure ${st.id} clearance ${st.clearance}`);
  near(r.hgl.structures[0]!.EGL, 101.93, 0.01, "EGL at inlet 1");
  near(r.hgl.structures[1]!.EGL, 98.66, 0.01, "EGL at inlet 2");
  near(r.hgl.structures[2]!.EGL, 97.18, 0.01, "EGL at manhole 3");
  assert.ok(r.culvert42.ratio > 1.5, "42 in culvert fails HW/D");
  assert.ok(r.culvert48.ratio <= 1.5, "48 in culvert meets HW/D");
  near(r.culvert48.HW, 5.17, 0.01, "48 in headwater");
  assert.ok(r.culvert48check.HW < 8, "100-year check below the shoulder");
  near(r.channel.y100, 2.16, 0.01, "channel 100-year depth");
});
