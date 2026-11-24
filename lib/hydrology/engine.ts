/**
 * Design hydrology: time of concentration by the segment (velocity) method,
 * rational-method peak flow from an intensity-duration table, NRCS curve-number
 * runoff and unit-hydrograph peaks, with impervious and pervious areas computed
 * separately or by a weighted curve number.
 *
 * Pure functions, US customary units. Equations: NRCS TR-55 (1986) chapter 3
 * and NEH 630 ch. 15 (time of concentration), HEC-22 4th ed. chapter 4 and
 * HDS-2 (rational method, NRCS unit hydrograph). The NRCS hydrograph itself
 * is the tested detention engine (lib/detention/engine.ts). Checked against
 * HEC-22 Examples 4.1-4.4 and TR-55 examples in tests/hydrology.test.ts.
 */
import { hydrograph, runoffDepth, type Distribution } from "../detention/engine";

export { runoffDepth };

// ------------------------------------------------- time of concentration

/** TR-55 Table 3-1 sheet-flow roughness (Manning's n). */
export const SHEET_N: Record<string, number> = {
  "Smooth surfaces (concrete, asphalt, gravel, bare soil)": 0.011,
  "Fallow (no residue)": 0.05,
  "Cultivated, residue cover 20% or less": 0.06,
  "Cultivated, residue cover over 20%": 0.17,
  "Grass, short-grass prairie": 0.15,
  "Grass, dense": 0.24,
  "Grass, Bermuda": 0.41,
  "Range (natural)": 0.13,
  "Woods, light underbrush": 0.4,
  "Woods, dense underbrush": 0.8,
};

/** Shallow concentrated flow: V = K S^0.5 (ft/s) - TR-55 paved and unpaved, HDS-2 Table 4.3 (K = 3.28 k x 10) for the rest. */
export const SHALLOW_K: Record<string, number> = {
  "Paved": 20.3282,
  "Unpaved": 16.1345,
  "Grassed waterway": 3.28 * 0.457 * 10,
  "Short grass pasture": 3.28 * 0.213 * 10,
  "Woodland, minimum tillage": 3.28 * 0.152 * 10,
  "Forest with heavy litter, hay meadow": 3.28 * 0.076 * 10,
};

export type Segment =
  | { kind: "sheet"; L: number; S: number; n: number }
  | { kind: "shallow"; L: number; S: number; surface: string }
  | { kind: "channel"; L: number; V: number };

export interface SegmentResult { kind: Segment["kind"]; L: number; V: number; minutes: number }

/** Sheet-flow travel time, minutes: TR-55 eq. 3-3, Tt = 0.007 (nL)^0.8 / (P2^0.5 S^0.4) hours. */
export function sheetFlowMinutes(n: number, L: number, P2: number, S: number): number {
  return (60 * 0.007 * Math.pow(n * L, 0.8)) / (Math.sqrt(P2) * Math.pow(S, 0.4));
}

export function shallowVelocity(surface: string, S: number): number {
  return (SHALLOW_K[surface] ?? SHALLOW_K.Unpaved!) * Math.sqrt(S);
}

/** Time of concentration as the sum of segment travel times (minutes); P2 is the 2-year, 24-hour depth (in). */
export function timeOfConcentration(segments: Segment[], P2: number): { tc: number; segments: SegmentResult[] } {
  const out = segments.map((s): SegmentResult => {
    if (s.kind === "sheet") {
      const minutes = sheetFlowMinutes(s.n, s.L, P2, s.S);
      return { kind: s.kind, L: s.L, V: s.L / (minutes * 60), minutes };
    }
    const V = s.kind === "shallow" ? shallowVelocity(s.surface, s.S) : s.V;
    return { kind: s.kind, L: s.L, V, minutes: s.L / V / 60 };
  });
  return { tc: out.reduce((a, b) => a + b.minutes, 0), segments: out };
}

// ---------------------------------------------------------- rational method

/** Rational-method frequency factor Cf (HDS-2; HEC-22): 1.0 up to 10 years, 1.1 for 25, 1.2 for 50, 1.25 for 100. */
export function frequencyFactor(years: number): number {
  return years >= 100 ? 1.25 : years >= 50 ? 1.2 : years >= 25 ? 1.1 : 1.0;
}

/** Area-weighted runoff coefficient (HEC-22 eq. 4.2). */
export function weightedC(rows: Array<{ area: number; C: number }>): number {
  const A = rows.reduce((a, r) => a + r.area, 0);
  return A > 0 ? rows.reduce((a, r) => a + r.area * r.C, 0) / A : 0;
}

/** Intensity (in/h) at a duration (min) from an IDF table, interpolated log-log. */
export function intensityAt(minutes: number, table: Array<[number, number]>): number {
  const t = [...table].filter((r) => r[0] > 0 && r[1] > 0).sort((a, b) => a[0] - b[0]);
  if (!t.length) return 0;
  if (minutes <= t[0]![0]) return t[0]![1];
  if (minutes >= t[t.length - 1]![0]) {
    if (t.length < 2) return t[0]![1];
    const [a, b] = [t[t.length - 2]!, t[t.length - 1]!];
    const k = Math.log(b[1] / a[1]) / Math.log(b[0] / a[0]);
    return b[1] * Math.pow(minutes / b[0], k);
  }
  for (let i = 1; i < t.length; i++) {
    const a = t[i - 1]!, b = t[i]!;
    if (minutes <= b[0]) {
      const f = Math.log(minutes / a[0]) / Math.log(b[0] / a[0]);
      return Math.exp(Math.log(a[1]) + f * (Math.log(b[1]) - Math.log(a[1])));
    }
  }
  return t[t.length - 1]![1];
}

/** Rational peak Q = Cf C i A (cfs; 1.008 conversion taken as 1), with Cf C capped at 1.0. */
export function rationalPeak(C: number, i: number, A: number, years = 10): { Q: number; CCf: number; capped: boolean } {
  const raw = C * frequencyFactor(years);
  const CCf = Math.min(raw, 1);
  return { Q: CCf * i * A, CCf, capped: raw > 1 };
}

// ------------------------------------------------------------- NRCS methods

export interface Cover { label: string; area: number; cn: number; impervious: boolean }

/** Area-weighted curve number. */
export function weightedCN(rows: Cover[]): number {
  const A = rows.reduce((a, r) => a + r.area, 0);
  return A > 0 ? rows.reduce((a, r) => a + r.area * r.cn, 0) / A : 0;
}

/** Peak of the NRCS dimensionless unit hydrograph for 1 in of runoff (HEC-22 eq. 4.10): qp = 1.5 PRF A / tc. */
export function unitPeak(areaSqMi: number, tcHours: number, prf = 484): number {
  return (1.5 * prf * areaSqMi) / tcHours;
}

export interface NrcsResult {
  method: "weighted" | "separate";
  runoffIn: number; // area-averaged runoff depth
  peak: number;
  q: number[];
  cn: number; // weighted CN (or the pervious CN for "separate")
}

/**
 * NRCS runoff hydrograph for a design storm (24-hour depth P, distribution dist).
 * "weighted": one weighted CN for the whole area. "separate": impervious and pervious
 * areas computed with their own CNs and the hydrographs added (TR-55 cautions that a
 * weighted CN underestimates runoff from small storms on mixed areas).
 */
export function nrcsHydrograph(cover: Cover[], tcMin: number, P: number, dist: Distribution, method: "weighted" | "separate", prf = 484, dtH = 1 / 60): NrcsResult {
  const A = cover.reduce((a, r) => a + r.area, 0);
  const tcH = Math.max(tcMin, 1e-3) / 60;
  if (method === "weighted" || !cover.some((c) => c.impervious) || cover.every((c) => c.impervious)) {
    const cn = weightedCN(cover);
    const h = hydrograph({ areaAc: A, cn, tcHours: tcH }, P, dist, dtH, 36, prf);
    return { method: "weighted", runoffIn: h.runoffIn, peak: Math.max(...h.q), q: h.q, cn };
  }
  const groups = [cover.filter((c) => c.impervious), cover.filter((c) => !c.impervious)];
  const parts = groups.map((g) => {
    const a = g.reduce((x, r) => x + r.area, 0);
    return { a, h: hydrograph({ areaAc: a, cn: weightedCN(g), tcHours: tcH }, P, dist, dtH, 36, prf) };
  });
  const n = Math.max(...parts.map((p) => p.h.q.length));
  const q = Array.from({ length: n }, (_, i) => parts.reduce((s, p) => s + (p.h.q[i] ?? 0), 0));
  const runoffIn = parts.reduce((s, p) => s + p.h.runoffIn * p.a, 0) / A;
  return { method: "separate", runoffIn, peak: Math.max(...q), q, cn: weightedCN(groups[1]!) };
}
