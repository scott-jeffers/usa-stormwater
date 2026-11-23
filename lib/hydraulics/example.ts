/**
 * The model manual's conveyance worked example (Appendix D): a street inlet on
 * grade and one in a sag, a three-pipe storm drain to an outfall channel, the
 * HGL by the FHWA access-hole method, a road culvert and the outfall channel.
 * The calculator's "Load worked example" buttons and the tests use these inputs.
 */
import {
  curbOnGrade, curbSag, requiredDiameter, standardSize, fullPipe, normalDepth, criticalDepth, geometry, manningQ,
  hglRun, culvert, CULVERT_INLETS, type DrainRun, type Gutter, type Section,
} from "./engine";

export const EX_GUTTER: Gutter = { Sx: 0.02, SL: 0.02, n: 0.016, W: 2, a: 2 / 12 };

export const WORKED_CONVEYANCE = {
  gutter: EX_GUTTER,
  inlet1: { Q: 3.0, L: 10 }, // curb opening on grade, 10-year gutter flow
  inlet2: { Qown: 2.9, L: 10, h: 0.5, Q50own: 3.9 }, // curb opening in the sag
  allowableSpreadFt: 14, // 8 ft parking lane plus half of a 12 ft travel lane
  run: {
    pipes: [
      { id: "1-2", d: 1.25, n: 0.013, L: 260, invUp: 100.75, invDn: 97.63, Q: 0 },
      { id: "2-3", d: 1.5, n: 0.013, L: 180, invUp: 97.16, invDn: 95.77, Q: 0 },
      { id: "3-O", d: 1.5, n: 0.013, L: 60, invUp: 95.69, invDn: 95.12, Q: 0 },
    ],
    structures: [
      { id: "1", rim: 104.0, bench: "flat", angle: 180, surfaceQ: 0 },
      { id: "2", rim: 101.5, bench: "half", angle: 180, surfaceQ: 0 },
      { id: "3", rim: 100.8, bench: "full", angle: 180, surfaceQ: 0 },
    ],
    tailwater: 96.3,
  } as DrainRun,
  culvert: { Q25: 110, Q100: 150, L: 90, S: 0.012, n: 0.012, TW25: 2.6, TW100: 3.1, allowableHW: 8.0 },
  channel: { section: { kind: "trap", b: 4, z1: 3, z2: 3 } as Section, n: 0.035, S: 0.005, Q10: 45, Q100: 80 },
};

export function runConveyanceExample() {
  const W = WORKED_CONVEYANCE;
  const inlet1 = curbOnGrade(W.gutter, W.inlet1.Q, W.inlet1.L);
  const sagQ = W.inlet2.Qown + inlet1.Qb;
  const inlet2 = curbSag(sagQ, W.inlet2.L, W.inlet2.h, W.gutter.a, W.gutter.W);
  const inlet2check = curbSag(W.inlet2.Q50own + inlet1.Qb, W.inlet2.L, W.inlet2.h, W.gutter.a, W.gutter.W);

  // pipe flows: inlet 1 interception, then everything reaching the sag
  const flows = [inlet1.Qi, inlet1.Qi + sagQ, inlet1.Qi + sagQ];
  const run: DrainRun = {
    ...W.run,
    pipes: W.run.pipes.map((p, i) => ({ ...p, Q: Math.round(flows[i]! * 100) / 100 })),
    structures: W.run.structures.map((s, i) => ({ ...s, surfaceQ: i === 0 ? inlet1.Qi : i === 1 ? sagQ : 0, angle: s.angle })),
  };
  const sizing = run.pipes.map((p) => {
    const S = (p.invUp - p.invDn) / p.L;
    const dReq = requiredDiameter(p.Q, p.n, S);
    const std = standardSize(dReq, 15);
    const full = fullPipe(p.d, p.n, S);
    const yn = normalDepth({ kind: "circle", d: p.d }, p.Q, p.n, S);
    const Vn = yn === null ? p.Q / ((Math.PI * p.d * p.d) / 4) : p.Q / geometry({ kind: "circle", d: p.d }, yn).A;
    return { id: p.id, Q: p.Q, S, dReqIn: dReq * 12, stdIn: std, Qfull: full.Q, Vfull: full.V, yn, Vdesign: Vn };
  });
  const hgl = hglRun(run);

  const c = W.culvert;
  const culv = (d: number, Q: number, TW: number) =>
    culvert({ section: { kind: "circle", d }, inlet: CULVERT_INLETS.rcp_groove_headwall!, Q, n: c.n, L: c.L, S: c.S, TW });
  const culvert42 = culv(3.5, c.Q25, c.TW25);
  const culvert48 = culv(4, c.Q25, c.TW25);
  const culvert48check = culv(4, c.Q100, c.TW100);

  const ch = W.channel;
  const y10 = normalDepth(ch.section, ch.Q10, ch.n, ch.S)!;
  const y100 = normalDepth(ch.section, ch.Q100, ch.n, ch.S)!;
  const g10 = geometry(ch.section, y10), g100 = geometry(ch.section, y100);
  const channel = {
    y10, V10: ch.Q10 / g10.A, fr10: ch.Q10 / g10.A / Math.sqrt((32.2 * g10.A) / g10.T),
    yc10: criticalDepth(ch.section, ch.Q10),
    shear10: 62.4 * y10 * ch.S,
    y100, V100: ch.Q100 / g100.A, shear100: 62.4 * y100 * ch.S,
    depthNeeded: y100 + 1,
    capacityAtDepth: (d: number) => manningQ(ch.section, d, ch.n, ch.S),
  };
  return { inlet1, sagQ, inlet2, inlet2check, run, sizing, hgl, culvert42, culvert48, culvert48check, channel };
}
