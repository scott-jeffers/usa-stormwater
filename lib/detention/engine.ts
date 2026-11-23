/**
 * Detention design engine: NRCS runoff and unit hydrograph, stage-storage,
 * outlet hydraulics and level-pool (storage-indication) routing.
 *
 * Pure functions with no browser or Node dependencies, so the calculator page
 * and the tests use the same code. US customary units throughout: feet, cfs,
 * acres, inches of rain, hours.
 *
 * Checked against an HEC-1 run published in the Knoxville BMP Manual (ST-12):
 * see tests/detention.test.ts.
 */

export const G = 32.2;

/** NRCS Type II 24-hour distribution, cumulative fraction at 0.1-hour steps (TR-20 table). */
export const TYPE_II: number[] = [0.0,0.001,0.002,0.003,0.004,0.005,0.006,0.007,0.008,0.009,0.01,0.012,0.013,0.014,0.015,0.016,0.017,0.018,0.02,0.021,0.022,0.023,0.024,0.026,0.027,0.028,0.029,0.031,0.032,0.033,0.034,0.036,0.037,0.038,0.04,0.041,0.042,0.044,0.045,0.047,0.048,0.049,0.051,0.052,0.054,0.055,0.057,0.058,0.06,0.061,0.063,0.065,0.066,0.068,0.07,0.071,0.073,0.075,0.076,0.078,0.08,0.082,0.084,0.085,0.087,0.089,0.091,0.093,0.095,0.097,0.099,0.101,0.103,0.105,0.107,0.109,0.111,0.113,0.116,0.118,0.12,0.122,0.125,0.127,0.13,0.132,0.135,0.138,0.141,0.144,0.147,0.15,0.153,0.157,0.16,0.163,0.166,0.17,0.173,0.177,0.181,0.185,0.189,0.194,0.199,0.204,0.209,0.215,0.221,0.228,0.235,0.243,0.251,0.261,0.271,0.283,0.307,0.354,0.431,0.568,0.663,0.682,0.699,0.713,0.725,0.735,0.743,0.751,0.759,0.766,0.772,0.778,0.784,0.789,0.794,0.799,0.804,0.808,0.812,0.816,0.82,0.824,0.827,0.831,0.834,0.838,0.841,0.844,0.847,0.85,0.854,0.856,0.859,0.862,0.865,0.868,0.87,0.873,0.875,0.878,0.88,0.882,0.885,0.887,0.889,0.891,0.893,0.895,0.898,0.9,0.902,0.904,0.906,0.908,0.91,0.912,0.914,0.915,0.917,0.919,0.921,0.923,0.925,0.926,0.928,0.93,0.931,0.933,0.935,0.936,0.938,0.939,0.941,0.942,0.944,0.945,0.947,0.948,0.949,0.951,0.952,0.953,0.955,0.956,0.957,0.958,0.96,0.961,0.962,0.964,0.965,0.966,0.967,0.968,0.97,0.971,0.972,0.973,0.975,0.976,0.977,0.978,0.979,0.981,0.982,0.983,0.984,0.985,0.986,0.988,0.989,0.99,0.991,0.992,0.993,0.994,0.996,0.997,0.998,0.999,1.0];

/** NRCS Type III 24-hour distribution at the published TR-55 break points (hours, fraction). Interpolated between points. */
export const TYPE_III_POINTS: Array<[number, number]> = [
  [0, 0], [2, 0.02], [4, 0.043], [6, 0.072], [7, 0.089], [8, 0.115], [8.5, 0.13], [9, 0.148], [9.5, 0.167], [9.75, 0.178],
  [10, 0.189], [10.5, 0.216], [11, 0.25], [11.5, 0.298], [11.75, 0.339], [12, 0.5], [12.5, 0.702], [13, 0.751], [13.5, 0.785],
  [14, 0.811], [16, 0.886], [20, 0.957], [24, 1],
];

/** NRCS dimensionless unit hydrograph (NEH 630 ch. 16, table 16-1): t/Tp, q/qp. */
export const DUH: Array<[number, number]> = [
  [0, 0], [0.1, 0.03], [0.2, 0.1], [0.3, 0.19], [0.4, 0.31], [0.5, 0.47], [0.6, 0.66], [0.7, 0.82], [0.8, 0.93], [0.9, 0.99],
  [1, 1], [1.1, 0.99], [1.2, 0.93], [1.3, 0.86], [1.4, 0.78], [1.5, 0.68], [1.6, 0.56], [1.7, 0.46], [1.8, 0.39], [1.9, 0.33],
  [2, 0.28], [2.2, 0.207], [2.4, 0.147], [2.6, 0.107], [2.8, 0.077], [3, 0.055], [3.2, 0.04], [3.4, 0.029], [3.6, 0.021],
  [3.8, 0.015], [4, 0.011], [4.5, 0.005], [5, 0],
];

export type Distribution = "II" | "III" | { custom: Array<[number, number]> };

/** Linear interpolation in sorted xs; clamps at the ends. */
export function interp(x: number, xs: number[], ys: number[]): number {
  const n = xs.length;
  if (x <= xs[0]!) return ys[0]!;
  if (x >= xs[n - 1]!) return ys[n - 1]!;
  let lo = 0, hi = n - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (xs[m]! <= x) lo = m;
    else hi = m;
  }
  const t = (x - xs[lo]!) / (xs[hi]! - xs[lo]!);
  return ys[lo]! + t * (ys[hi]! - ys[lo]!);
}

/** Cumulative fraction of the 24-hour depth at time t (hours). */
export function cumulativeFraction(t: number, dist: Distribution): number {
  if (dist === "II") {
    const i = Math.min(Math.max(t, 0), 24) / 0.1;
    const k = Math.floor(i);
    if (k >= 240) return 1;
    return TYPE_II[k]! + (i - k) * (TYPE_II[k + 1]! - TYPE_II[k]!);
  }
  const pts = dist === "III" ? TYPE_III_POINTS : dist.custom;
  return interp(t, pts.map((p) => p[0]), pts.map((p) => p[1]));
}

/** NRCS curve-number runoff depth (in) for rainfall P (in), Ia = 0.2 S. */
export function runoffDepth(P: number, cn: number): number {
  const S = 1000 / cn - 10, Ia = 0.2 * S;
  return P > Ia ? (P - Ia) ** 2 / (P - Ia + S) : 0;
}

export type Watershed = { areaAc: number; cn: number; tcHours: number };

/**
 * Runoff hydrograph (cfs at every dt) for a 24-hour design storm, by the NRCS
 * dimensionless unit hydrograph (peak rate factor 484, lag = 0.6 Tc).
 */
export function hydrograph(w: Watershed, P: number, dist: Distribution, dtH: number, hours = 36): { q: number[]; runoffIn: number } {
  const n = Math.round(hours / dtH);
  const cum = Array.from({ length: n + 1 }, (_, i) => runoffDepth(P * cumulativeFraction(Math.min(i * dtH, 24), dist), w.cn));
  const lag = 0.6 * w.tcHours;
  const Tp = dtH / 2 + lag;
  const qp = (484 * (w.areaAc / 640)) / Tp; // cfs per inch of runoff
  const xs = DUH.map((d) => d[0]), ys = DUH.map((d) => d[1]);
  const m = Math.floor((5 * Tp) / dtH) + 2;
  const uh = Array.from({ length: m }, (_, j) => qp * interp(((j + 1) * dtH) / Tp, xs, ys));
  const q = new Array<number>(n + m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const e = cum[i]! - cum[i - 1]!;
    if (e <= 0) continue;
    for (let j = 0; j < m; j++) q[i - 1 + j + 1]! += e * uh[j]!;
  }
  return { q, runoffIn: cum[n]! };
}

/* ---------- Stage-storage ---------- */

/** Storage (cf) in a rectangular basin with side slopes z:1 at depth h (prismoidal formula). */
export function prismStorage(h: number, L: number, W: number, z: number): number {
  return L * W * h + (L + W) * z * h * h + (4 / 3) * z * z * h ** 3;
}

/** Storage from a stage-area table by the average-end-area method. Stages in ft, areas in sf. */
export function storageFromAreas(stages: number[], areas: number[]): number[] {
  const out = [0];
  for (let i = 1; i < stages.length; i++) out.push(out[i - 1]! + ((areas[i - 1]! + areas[i]!) / 2) * (stages[i]! - stages[i - 1]!));
  return out;
}

/* ---------- Outlet hydraulics (HEC-22, 4th ed., ch. 10) ---------- */

/** Circular orifice, invert z, diameter D (ft). Partial flow below the crown uses the wetted segment with head to its mid-depth. */
export function circularOrifice(h: number, z: number, D: number, C = 0.6): number {
  const y = h - z;
  if (y <= 0 || D <= 0) return 0;
  const r = D / 2;
  if (y >= D) return C * Math.PI * r * r * Math.sqrt(2 * G * (h - z - r));
  const A = r * r * Math.acos((r - y) / r) - (r - y) * Math.sqrt(2 * r * y - y * y);
  return C * A * Math.sqrt(2 * G * (y / 2));
}

/** Rectangular orifice (window) w wide, ht high, invert z. */
export function rectOrifice(h: number, z: number, w: number, ht: number, C = 0.6): number {
  const y = h - z;
  if (y <= 0) return 0;
  if (y >= ht) return C * w * ht * Math.sqrt(2 * G * (h - z - ht / 2));
  return C * w * y * Math.sqrt(2 * G * (y / 2));
}

/** Sharp-crested rectangular weir, US form Q = C (L - 0.1 n h) h^1.5; C = 3.33 (HEC-22 Cw 0.415). */
export function rectWeir(h: number, z: number, L: number, C = 3.33, endContractions = 0): number {
  const y = h - z;
  if (y <= 0) return 0;
  return C * Math.max(L - 0.1 * endContractions * y, 0) * y ** 1.5;
}

/** V-notch weir, angle in degrees; HEC-22 Cw 0.31 gives C = 2.49 in US units. */
export function vNotchWeir(h: number, z: number, angleDeg: number, C = 2.49): number {
  const y = h - z;
  if (y <= 0) return 0;
  return C * Math.tan(((angleDeg / 2) * Math.PI) / 180) * y ** 2.5;
}

/** Broad-crested weir (emergency spillway), US C between 2.6 and 3.1; 2.6 is the conservative default. */
export function broadCrestedWeir(h: number, z: number, L: number, C = 2.6): number {
  const y = h - z;
  if (y <= 0) return 0;
  return C * L * y ** 1.5;
}

/** Open-top riser of diameter D (ft), crest z: weir over the rim until orifice flow through the top controls (HEC-22 ex. 10.11). */
export function riserTop(h: number, z: number, D: number, Cw = 3.33, Co = 0.6): number {
  const y = h - z;
  if (y <= 0) return 0;
  return Math.min(Cw * Math.PI * D * y ** 1.5, Co * ((Math.PI * D * D) / 4) * Math.sqrt(2 * G * y));
}

/**
 * Full-flow (outlet-control) capacity of a circular barrel from the riser, free outfall.
 * Head is from the water surface to the outlet invert plus D/2 (HDS-5 simplified).
 */
export function barrelCapacity(h: number, outletInvert: number, D: number, length: number, n = 0.013, Ke = 0.5): number {
  const H = h - (outletInvert + D / 2);
  if (H <= 0) return 0;
  const A = (Math.PI * D * D) / 4, R = D / 4;
  const Kf = (29 * n * n * length) / R ** (4 / 3);
  return A * Math.sqrt((2 * G * H) / (1 + Ke + Kf));
}

export type Device =
  | { kind: "orifice"; label?: string; invert: number; diameter: number; C?: number }
  | { kind: "rectOrifice"; label?: string; invert: number; width: number; height: number; C?: number }
  | { kind: "weir"; label?: string; crest: number; length: number; C?: number; contractions?: number }
  | { kind: "vnotch"; label?: string; crest: number; angle: number; C?: number }
  | { kind: "riser"; label?: string; crest: number; diameter: number }
  | { kind: "spillway"; label?: string; crest: number; width: number; C?: number };

export function deviceFlow(d: Device, h: number): number {
  switch (d.kind) {
    case "orifice": return circularOrifice(h, d.invert, d.diameter, d.C);
    case "rectOrifice": return rectOrifice(h, d.invert, d.width, d.height, d.C);
    case "weir": return rectWeir(h, d.crest, d.length, d.C, d.contractions);
    case "vnotch": return vNotchWeir(h, d.crest, d.angle, d.C);
    case "riser": return riserTop(h, d.crest, d.diameter);
    case "spillway": return broadCrestedWeir(h, d.crest, d.width, d.C);
  }
}

export type Barrel = { diameter: number; length: number; outletInvert: number; n?: number; Ke?: number };

/**
 * Stage-discharge table. Primary devices (everything but spillways) are capped by
 * the barrel when one is given; spillways discharge on their own. blocked = all
 * primary devices clogged (spillway-only check).
 */
export function rating(stages: number[], devices: Device[], barrel?: Barrel, blocked = false) {
  return stages.map((h) => {
    const parts = devices.map((d) => (blocked && d.kind !== "spillway" ? 0 : Math.max(deviceFlow(d, h), 0)));
    let primary = devices.reduce((s, d, i) => (d.kind === "spillway" ? s : s + parts[i]!), 0);
    let barrelControls = false;
    if (barrel && primary > 0) {
      const cap = barrelCapacity(h, barrel.outletInvert, barrel.diameter, barrel.length, barrel.n, barrel.Ke);
      if (cap < primary) {
        primary = cap;
        barrelControls = true;
      }
    }
    const spill = devices.reduce((s, d, i) => (d.kind === "spillway" ? s + parts[i]! : s), 0);
    return { stage: h, parts, primary, spillway: spill, total: primary + spill, barrelControls };
  });
}

/* ---------- Routing ---------- */

export type RouteResult = { outflow: number[]; storage: number[]; peakOut: number; peakIn: number; maxStorage: number; maxStage: number; tPeakOut: number };

/** Storage-indication (modified Puls) routing. stor (cf) and disch (cfs) are indexed by stages (ft). */
export function route(inflow: number[], dtH: number, stages: number[], stor: number[], disch: number[], startStage?: number): RouteResult {
  const dt = dtH * 3600;
  const ind = stor.map((s, i) => (2 * s) / dt + disch[i]!);
  let S = startStage === undefined ? 0 : interp(startStage, stages, stor);
  let O = startStage === undefined ? 0 : interp(startStage, stages, disch);
  const outflow = [O], storage = [S];
  let maxS = S, peak = O, tPeak = 0;
  for (let i = 1; i < inflow.length; i++) {
    const rhs = inflow[i - 1]! + inflow[i]! + (2 * S) / dt - O;
    O = interp(rhs, ind, disch);
    S = Math.max(((rhs - O) * dt) / 2, 0);
    outflow.push(O);
    storage.push(S);
    if (S > maxS) maxS = S;
    if (O > peak) {
      peak = O;
      tPeak = i * dtH;
    }
  }
  return { outflow, storage, peakOut: peak, peakIn: Math.max(...inflow), maxStorage: maxS, maxStage: interp(maxS, stor, stages), tPeakOut: tPeak };
}

/** Center-of-mass detention time (hours): time between the centroids of the inflow and outflow hydrographs. */
export function centroidLag(inflow: number[], outflow: number[], dtH: number): number {
  const c = (q: number[]) => {
    let a = 0, b = 0;
    q.forEach((v, i) => {
      a += v * i;
      b += v;
    });
    return b ? a / b : 0;
  };
  return (c(outflow) - c(inflow)) * dtH;
}

/** Hours from peak storage until storage falls to frac of the peak (brim drawdown); null if it does not within the run. */
export function drawdownHours(storage: number[], dtH: number, frac = 0.1): number | null {
  let k = 0;
  storage.forEach((s, i) => {
    if (s > storage[k]!) k = i;
  });
  const target = storage[k]! * frac;
  for (let j = k; j < storage.length; j++) if (storage[j]! <= target) return (j - k) * dtH;
  return null;
}

/* ---------- Preliminary sizing helpers ---------- */

/** TR-55 ch. 6 storage estimate: Vs/Vr from qo/qi (HEC-22 table 10.1 coefficients). */
export function tr55StorageRatio(qoOverQi: number, dist: "I" | "II" | "III" = "II"): number {
  const c = dist === "I" ? [0.66, -1.76, 1.96, -0.73] : [0.682, -1.43, 1.64, -0.804];
  const r = qoOverQi;
  return c[0]! + c[1]! * r + c[2]! * r * r + c[3]! * r ** 3;
}

/** Orifice diameter (ft) that passes Q at head H above its centerline. */
export function orificeDiameterFor(Q: number, H: number, C = 0.6): number {
  return Math.sqrt((4 * Q) / (Math.PI * C * Math.sqrt(2 * G * H)));
}

/** Weir length (ft) that passes Q at head H. */
export function weirLengthFor(Q: number, H: number, C = 3.33): number {
  return Q / (C * H ** 1.5);
}
