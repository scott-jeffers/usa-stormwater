/**
 * Conveyance hydraulics: Manning flow in pipes, boxes and open channels,
 * gutter flow and spread, inlet interception on grade and in sags, culvert
 * inlet and outlet control, and the hydraulic and energy grade line through a
 * storm drain with the FHWA access-hole method.
 *
 * Pure functions with no browser or Node dependencies, so the calculator page
 * and the tests run the same code. US customary units throughout: feet, cfs,
 * ft/s, ft/ft.
 *
 * Sources (equation numbers are the source's):
 * - FHWA HEC-22, Urban Drainage Design Manual, 4th edition (2024): gutters
 *   (5.2-5.8), inlets (7.1-7.21), storm drains (9.1-9.31).
 * - FHWA HDS-5, Hydraulic Design of Highway Culverts, 3rd edition (2012):
 *   inlet-control equations and coefficients (Appendix A, Table C.1) and the
 *   outlet-control energy equation.
 * - FHWA HDS-4, Introduction to Highway Hydraulics: Manning and critical depth.
 * Checked against their worked examples in tests/hydraulics.test.ts.
 */

export const G = 32.2;
/** Manning unit constant for US customary units. */
export const KM = 1.486;

// ---------------------------------------------------------------- sections

export type Section =
  /** Circular pipe of diameter d (ft). */
  | { kind: "circle"; d: number }
  /** Closed rectangular box, span b and rise h (ft). */
  | { kind: "box"; b: number; h: number }
  /** Open trapezoidal channel: bottom width b (ft), side slopes z1, z2 (horizontal per 1 vertical). b = 0 is a V; z = 0 a rectangle. */
  | { kind: "trap"; b: number; z1: number; z2: number };

export interface Geometry {
  A: number; // flow area, ft2
  P: number; // wetted perimeter, ft
  T: number; // top width, ft
  R: number; // hydraulic radius, ft
}

/** Section rise: pipe diameter or box height; open channels have none. */
export function rise(s: Section): number {
  return s.kind === "circle" ? s.d : s.kind === "box" ? s.h : Infinity;
}

export function geometry(s: Section, y: number): Geometry {
  if (s.kind === "circle") {
    const r = s.d / 2;
    const yy = Math.min(Math.max(y, 0), s.d);
    if (yy >= s.d) return { A: Math.PI * r * r, P: Math.PI * s.d, T: 0, R: r / 2 };
    const th = 2 * Math.acos(1 - yy / r); // central angle
    const A = (r * r * (th - Math.sin(th))) / 2;
    const P = r * th;
    return { A, P, T: 2 * Math.sqrt(Math.max(yy * (s.d - yy), 0)), R: P > 0 ? A / P : 0 };
  }
  if (s.kind === "box") {
    const yy = Math.min(Math.max(y, 0), s.h);
    const full = yy >= s.h;
    const A = s.b * yy;
    const P = full ? 2 * (s.b + s.h) : s.b + 2 * yy;
    return { A, P, T: full ? 0 : s.b, R: P > 0 ? A / P : 0 };
  }
  const yy = Math.max(y, 0);
  const A = yy * (s.b + 0.5 * (s.z1 + s.z2) * yy);
  const P = s.b + yy * (Math.sqrt(1 + s.z1 * s.z1) + Math.sqrt(1 + s.z2 * s.z2));
  return { A, P, T: s.b + (s.z1 + s.z2) * yy, R: P > 0 ? A / P : 0 };
}

/** Manning discharge at depth y (cfs). */
export function manningQ(s: Section, y: number, n: number, S: number): number {
  const g = geometry(s, y);
  return (KM / n) * g.A * Math.pow(g.R, 2 / 3) * Math.sqrt(S);
}

/** Root of f on [lo, hi] by bisection (f(lo) and f(hi) of opposite sign). */
function bisect(f: (x: number) => number, lo: number, hi: number, tol = 1e-7): number {
  let flo = f(lo);
  for (let i = 0; i < 200 && hi - lo > tol; i++) {
    const m = (lo + hi) / 2, fm = f(m);
    if ((fm > 0) === (flo > 0)) { lo = m; flo = fm; } else hi = m;
  }
  return (lo + hi) / 2;
}

/** Largest open-channel discharge a closed section carries (circle: at 0.938 D), with its depth. */
export function maxGravityFlow(s: Section, n: number, S: number): { Q: number; y: number } {
  if (s.kind === "trap") return { Q: Infinity, y: Infinity };
  const D = rise(s);
  let best = { Q: 0, y: 0 };
  for (let i = 1; i <= 400; i++) {
    const y = (D * i) / 400, q = manningQ(s, y, n, S);
    if (q > best.Q) best = { Q: q, y };
  }
  return best;
}

/** Normal depth (ft), or null when a closed section cannot carry Q without surcharge. */
export function normalDepth(s: Section, Q: number, n: number, S: number): number | null {
  if (Q <= 0) return 0;
  if (S <= 0) return null;
  if (s.kind === "trap") {
    let hi = 1;
    while (manningQ(s, hi, n, S) < Q) hi *= 2;
    return bisect((y) => manningQ(s, y, n, S) - Q, 0, hi);
  }
  const m = maxGravityFlow(s, n, S);
  if (Q > m.Q) return null;
  return bisect((y) => manningQ(s, y, n, S) - Q, 0, m.y);
}

/** Critical depth (ft): Q^2/g = A^3/T. Closed sections are capped at their rise. */
export function criticalDepth(s: Section, Q: number): number {
  if (Q <= 0) return 0;
  const f = (y: number) => {
    const g = geometry(s, y);
    return (g.A ** 3) / Math.max(g.T, 1e-9) - (Q * Q) / G;
  };
  if (s.kind === "trap") {
    let hi = 1;
    while (f(hi) < 0) hi *= 2;
    return bisect(f, 1e-9, hi);
  }
  const D = rise(s);
  const top = s.kind === "circle" ? D * 0.9999 : D * 0.99999;
  if (f(top) < 0) return D;
  return bisect(f, 1e-9, top);
}

export function froude(s: Section, Q: number, y: number): number {
  const g = geometry(s, y);
  if (g.T <= 0 || g.A <= 0) return 0;
  return Q / g.A / Math.sqrt((G * g.A) / g.T);
}

// ------------------------------------------------------------ pipe sizing

/** Standard round pipe sizes, inches. */
export const STANDARD_PIPE_IN = [12, 15, 18, 21, 24, 27, 30, 33, 36, 42, 48, 54, 60, 66, 72, 78, 84, 90, 96, 102, 108, 114, 120];

/** Full-flow capacity and velocity of a circular pipe (HEC-22 eq. 9.1, 9.2 with exact constants). */
export function fullPipe(d: number, n: number, S: number): { Q: number; V: number } {
  const A = (Math.PI * d * d) / 4;
  const V = (KM / n) * Math.pow(d / 4, 2 / 3) * Math.sqrt(S);
  return { Q: V * A, V };
}

/** Diameter (ft) that carries Q flowing full: HEC-22 eq. 9.2 solved for D. */
export function requiredDiameter(Q: number, n: number, S: number): number {
  const KQ = (KM * Math.PI) / 4 / Math.pow(4, 2 / 3); // 0.4632
  return Math.pow((Q * n) / (KQ * Math.sqrt(S)), 3 / 8);
}

/** Smallest standard size (in) at or above the required diameter and a minimum size. */
export function standardSize(dFt: number, minIn = 0): number {
  const need = Math.max(dFt * 12 - 1e-6, minIn);
  return STANDARD_PIPE_IN.find((s) => s >= need) ?? Math.ceil(need / 6) * 6;
}

/** Full-flow friction slope of a circular pipe (HEC-22 eq. 9.4). */
export function fullFrictionSlope(Q: number, d: number, n: number): number {
  const A = (Math.PI * d * d) / 4, R = d / 4;
  return Math.pow((Q * n) / (KM * A * Math.pow(R, 2 / 3)), 2);
}

/** Friction slope at depth y in any section (Manning). */
export function frictionSlope(s: Section, Q: number, y: number, n: number): number {
  const g = geometry(s, y);
  const K = (KM / n) * g.A * Math.pow(g.R, 2 / 3);
  return K > 0 ? (Q / K) ** 2 : Infinity;
}

// ---------------------------------------------------------------- gutters

const KU_GUTTER = 0.56;
// HEC-22 prints the gutter exponents as 1.67, 2.67 and 0.375; the worked examples use them as printed.
const E167 = 1.67, E267 = 2.67;

/** Uniform (triangular) gutter flow at spread T (HEC-22 eq. 5.2). */
export function gutterQ(T: number, Sx: number, SL: number, n: number): number {
  return (KU_GUTTER / n) * Math.pow(Sx, E167) * Math.sqrt(SL) * Math.pow(T, E267);
}

/** Uniform gutter spread for flow Q (HEC-22 eq. 5.4). */
export function gutterSpread(Q: number, Sx: number, SL: number, n: number): number {
  return Math.pow((Q * n) / (KU_GUTTER * Math.pow(Sx, E167) * Math.sqrt(SL)), 1 / E267);
}

/** Frontal-flow ratio for a uniform gutter and a grate of width W (HEC-22 eq. 7.3). */
export function eoUniform(W: number, T: number): number {
  if (T <= W) return 1;
  return 1 - Math.pow(1 - W / T, E267);
}

/** Frontal-flow ratio in a composite gutter (HEC-22 eq. 5.7). */
export function eoComposite(Sw: number, Sx: number, W: number, T: number): number {
  if (T <= W) return 1;
  const k = Sw / Sx;
  return 1 / (1 + k / (Math.pow(1 + k / (T / W - 1), E267) - 1));
}

export interface Gutter {
  Sx: number; // pavement cross slope
  SL: number; // longitudinal slope
  n: number;
  /** Depressed gutter width (ft) and depression (ft); omit or 0 for a uniform gutter. */
  W?: number;
  a?: number;
}

export interface GutterState {
  Q: number;
  T: number; // spread, ft
  d: number; // depth at curb, ft
  A: number; // flow area, ft2
  V: number; // mean velocity, ft/s
  Eo: number; // frontal flow ratio over width W (when W given)
}

function gutterState(g: Gutter, T: number, Q: number): GutterState {
  const W = g.W ?? 0, a = g.a ?? 0;
  const composite = W > 0 && a > 0;
  const Sw = composite ? g.Sx + a / W : g.Sx;
  const A = composite ? 0.5 * T * T * g.Sx + 0.5 * a * W : 0.5 * T * T * g.Sx;
  const Eo = W > 0 ? (composite ? eoComposite(Sw, g.Sx, W, T) : eoUniform(W, T)) : 0;
  return { Q, T, d: T * g.Sx + a, A, V: A > 0 ? Q / A : 0, Eo };
}

/** Gutter flow at spread T: uniform (eq. 5.2) or composite (eq. 5.6-5.7). */
export function gutterFlow(g: Gutter, T: number): GutterState {
  const W = g.W ?? 0, a = g.a ?? 0;
  if (!(W > 0 && a > 0)) return gutterState(g, T, gutterQ(T, g.Sx, g.SL, g.n));
  if (T <= W) {
    // water only in the depressed section: a triangle at slope Sw with a curb
    const Sw = g.Sx + a / W;
    return gutterState(g, T, gutterQ(T, Sw, g.SL, g.n));
  }
  const Sw = g.Sx + a / W;
  const Qs = gutterQ(T - W, g.Sx, g.SL, g.n);
  const Eo = eoComposite(Sw, g.Sx, W, T);
  return gutterState(g, T, Qs / (1 - Eo));
}

/** Gutter state for flow Q (spread solved). */
export function gutterForFlow(g: Gutter, Q: number): GutterState {
  if (Q <= 0) return gutterState(g, 0, 0);
  if (!((g.W ?? 0) > 0 && (g.a ?? 0) > 0)) return gutterState(g, gutterSpread(Q, g.Sx, g.SL, g.n), Q);
  let hi = 1;
  while (gutterFlow(g, hi).Q < Q) hi *= 2;
  const T = bisect((t) => gutterFlow(g, t).Q - Q, 1e-6, hi);
  return gutterFlow(g, T);
}

// ------------------------------------------------------- inlets on grade

/** Splash-over velocities (ft/s) read from HEC-22 Figure 7.8 in its own worked examples, 2 ft long grates. */
export const SPLASH_OVER_2FT: Record<string, number> = {
  "P-1-7/8 parallel bar": 8.2,
  "Curved vane": 6.0,
  "Reticuline": 4.1,
};

export interface GrateOnGrade extends GutterState {
  Rf: number;
  Rs: number;
  E: number;
  Qi: number; // intercepted
  Qb: number; // bypass
}

/**
 * Grate on grade (HEC-22 eq. 7.3-7.9). Grate width Wg and length L (ft), splash-over
 * velocity Vo (ft/s, from HEC-22 Figure 7.8 for the grate and length). In a composite
 * gutter the grate is taken to fill the depressed width.
 */
export function grateOnGrade(g: Gutter, Q: number, Wg: number, L: number, Vo: number): GrateOnGrade {
  const gw = g.W && g.a ? g : { ...g, W: Wg };
  const s = gutterForFlow(gw, Q);
  const Rf = Math.min(1, Math.max(0, 1 - 0.09 * (s.V - Vo)));
  const Rs = 1 / (1 + (0.15 * Math.pow(s.V, 1.8)) / (g.Sx * Math.pow(L, 2.3)));
  const E = Math.min(1, Rf * s.Eo + Rs * (1 - s.Eo));
  return { ...s, Rf, Rs, E, Qi: E * Q, Qb: (1 - E) * Q };
}

export interface CurbOnGrade extends GutterState {
  Se: number;
  LT: number; // length for full interception
  E: number;
  Qi: number;
  Qb: number;
}

/** Curb-opening inlet on grade, length L (ft) (HEC-22 eq. 7.10-7.13). Uses Se for a depressed gutter. */
export function curbOnGrade(g: Gutter, Q: number, L: number): CurbOnGrade {
  const s = gutterForFlow(g, Q);
  const composite = (g.W ?? 0) > 0 && (g.a ?? 0) > 0;
  const Se = composite ? g.Sx + (g.a! / g.W!) * s.Eo : g.Sx;
  const LT = 0.6 * Math.pow(Q, 0.42) * Math.pow(g.SL, 0.3) * Math.pow(1 / (g.n * Se), 0.6);
  const E = L >= LT ? 1 : 1 - Math.pow(1 - L / LT, 1.8);
  return { ...s, Se, LT, E, Qi: E * Q, Qb: (1 - E) * Q };
}

// --------------------------------------------------------- inlets in sags

const CW_GRATE = 0.37, CW_CURB = 0.37, CW_CURB_DEP = 0.29, CO = 0.67;
const SQ2G = Math.sqrt(2 * G);

export interface SagResult {
  d: number; // controlling depth, ft (at the curb, measured as the source equation defines it)
  dWeir: number;
  dOrifice: number;
  control: "weir" | "orifice" | "transition";
}

/**
 * Grate in a sag (HEC-22 eq. 7.14, 7.15): perimeter P (ft, L + 2W against a curb) and
 * clear opening area Ag (ft2), each already reduced for clogging. Depth is the larger
 * of the weir and orifice depths, as HEC-22 directs.
 */
export function grateSag(Q: number, P: number, Ag: number): SagResult {
  const dWeir = Math.pow(Q / (CW_GRATE * SQ2G * P), 2 / 3);
  const dOrifice = Math.pow(Q / (CO * Ag), 2) / (2 * G);
  return { d: Math.max(dWeir, dOrifice), dWeir, dOrifice, control: dWeir >= dOrifice ? "weir" : "orifice" };
}

/** Weir capacity of a curb opening in a sag at curb depth d (eq. 7.16 undepressed; 7.17 locally depressed, width W). */
export function curbSagWeirQ(d: number, L: number, W = 0, depressed = false): number {
  if (depressed && L < 12) return CW_CURB_DEP * SQ2G * (L + 1.8 * W) * Math.pow(d, 1.5);
  return CW_CURB * SQ2G * L * Math.pow(d, 1.5);
}

/**
 * Curb opening in a sag, length L and opening height h (ft), local depression a (ft)
 * over width W (ft). Vertical throat. Weir up to depth h, orifice above 1.4 h, the larger
 * depth in between (HEC-22 7.3.2). Returned depth is measured from the normal cross slope.
 */
export function curbSag(Q: number, L: number, h: number, a = 0, W = 0): SagResult {
  const depressed = a > 0 && W > 0;
  const k = depressed && L < 12 ? CW_CURB_DEP * SQ2G * (L + 1.8 * W) : CW_CURB * SQ2G * L;
  const dWeir = Math.pow(Q / k, 2 / 3);
  // orifice on the throat: Q = Co h L sqrt(2 g do), do = di - h/2, di = d + a
  const do_ = Math.pow(Q / (CO * h * L), 2) / (2 * G);
  const dOrifice = Math.max(do_ + h / 2 - a, 0);
  const di = dWeir + a;
  if (di <= h) return { d: dWeir, dWeir, dOrifice, control: "weir" };
  if (dOrifice + a >= 1.4 * h) return { d: Math.max(dOrifice, dWeir), dWeir, dOrifice, control: "orifice" };
  return { d: Math.max(dWeir, dOrifice), dWeir, dOrifice, control: "transition" };
}

// ---------------------------------------------------------------- culverts

export interface CulvertInlet {
  label: string;
  shape: "circle" | "box";
  /** HDS-5 inlet-control equation form: 1 includes Hc/D and the slope term; 2 does not. */
  form: 1 | 2;
  K: number;
  M: number;
  c: number;
  Y: number;
  /** Outlet-control entrance loss coefficient (HDS-5 Table C.2). */
  ke: number;
  /** Slope correction: -0.5 for most inlets, +0.7 for mitered. */
  Ks: number;
}

/** HDS-5 (2012) Table C.1 coefficients for common concrete and corrugated metal inlets. */
export const CULVERT_INLETS: Record<string, CulvertInlet> = {
  rcp_square_headwall: { label: "Concrete pipe, square edge with headwall", shape: "circle", form: 1, K: 0.0098, M: 2.0, c: 0.0398, Y: 0.67, ke: 0.5, Ks: -0.5 },
  rcp_groove_headwall: { label: "Concrete pipe, groove end with headwall", shape: "circle", form: 1, K: 0.0018, M: 2.0, c: 0.0292, Y: 0.74, ke: 0.2, Ks: -0.5 },
  rcp_groove_projecting: { label: "Concrete pipe, groove end projecting", shape: "circle", form: 1, K: 0.0045, M: 2.0, c: 0.0317, Y: 0.69, ke: 0.2, Ks: -0.5 },
  cmp_headwall: { label: "Corrugated metal pipe, headwall", shape: "circle", form: 1, K: 0.0078, M: 2.0, c: 0.0379, Y: 0.69, ke: 0.5, Ks: -0.5 },
  cmp_mitered: { label: "Corrugated metal pipe, mitered to slope", shape: "circle", form: 1, K: 0.021, M: 1.33, c: 0.0463, Y: 0.75, ke: 0.7, Ks: 0.7 },
  cmp_projecting: { label: "Corrugated metal pipe, projecting", shape: "circle", form: 1, K: 0.034, M: 1.5, c: 0.0553, Y: 0.54, ke: 0.9, Ks: -0.5 },
  box_wingwall_30_75: { label: "Concrete box, 30°–75° wingwalls, square edge", shape: "box", form: 1, K: 0.026, M: 1.0, c: 0.0347, Y: 0.81, ke: 0.4, Ks: -0.5 },
  box_headwall_chamfer: { label: "Concrete box, headwall with ¾-in chamfers", shape: "box", form: 2, K: 0.515, M: 0.667, c: 0.0375, Y: 0.79, ke: 0.2, Ks: -0.5 },
  box_headwall_bevel45: { label: "Concrete box, headwall with 45° bevels", shape: "box", form: 2, K: 0.495, M: 0.667, c: 0.0314, Y: 0.82, ke: 0.2, Ks: -0.5 },
};

export interface CulvertInput {
  section: Section; // circle or box
  inlet: CulvertInlet;
  Q: number; // per barrel
  n: number;
  L: number; // barrel length, ft
  S: number; // barrel slope, ft/ft
  TW: number; // tailwater depth above outlet invert, ft
}

export interface CulvertResult {
  HWi: number; // inlet-control headwater depth, ft
  HWo: number; // outlet-control headwater depth, ft
  HW: number; // controlling
  control: "inlet" | "outlet";
  ratio: number; // HW / D
  dc: number;
  yn: number | null;
  H: number; // outlet-control barrel losses, ft
  ho: number;
  Vout: number; // outlet velocity, ft/s
  regime: "unsubmerged" | "transition" | "submerged";
}

/** Inlet-control headwater depth (HDS-5 Appendix A equations A.1-A.3; transition interpolated between 3.5 and 4.0). */
export function inletControlHW(s: Section, inlet: CulvertInlet, Q: number, S: number): { HW: number; regime: CulvertResult["regime"] } {
  const D = rise(s);
  const A = geometry(s, D).A;
  const x = Q / (A * Math.sqrt(D));
  const unsub = (xx: number) => {
    if (inlet.form === 2) return inlet.K * Math.pow(xx, inlet.M);
    const Qx = xx * A * Math.sqrt(D);
    const dc = criticalDepth(s, Qx);
    const gc = geometry(s, dc);
    const Hc = dc + (Qx / gc.A) ** 2 / (2 * G);
    return Hc / D + inlet.K * Math.pow(xx, inlet.M) + inlet.Ks * S;
  };
  const sub = (xx: number) => inlet.c * xx * xx + inlet.Y + inlet.Ks * S;
  if (x <= 3.5) return { HW: unsub(x) * D, regime: "unsubmerged" };
  if (x >= 4.0) return { HW: sub(x) * D, regime: "submerged" };
  const u = unsub(3.5), v = sub(4.0);
  return { HW: (u + ((x - 3.5) / 0.5) * (v - u)) * D, regime: "transition" };
}

/** Culvert headwater for one barrel: the higher of inlet and outlet control (HDS-5 method). */
export function culvert(c: CulvertInput): CulvertResult {
  const D = rise(c.section);
  const full = geometry(c.section, D);
  const ic = inletControlHW(c.section, c.inlet, c.Q, c.S);
  const dc = criticalDepth(c.section, c.Q);
  const yn = normalDepth(c.section, c.Q, c.n, c.S);
  const Vf = c.Q / full.A;
  const H = (1 + c.inlet.ke + (2 * G * c.n * c.n * c.L) / (KM * KM * Math.pow(full.R, 4 / 3))) * (Vf * Vf) / (2 * G);
  const ho = Math.max(c.TW, (Math.min(dc, D) + D) / 2);
  const HWo = ho + H - c.S * c.L;
  const control = ic.HW >= HWo ? "inlet" : "outlet";
  const HW = Math.max(ic.HW, HWo);
  let yout: number;
  if (control === "inlet") yout = yn ?? D;
  else yout = c.TW < dc ? dc : c.TW < D ? c.TW : D;
  const Vout = c.Q / geometry(c.section, Math.min(yout, D)).A;
  return { HWi: ic.HW, HWo, HW, control, ratio: HW / D, dc, yn, H, ho, Vout, regime: ic.regime };
}

// ------------------------------------------------- storm drain HGL / EGL

export interface DrainPipe {
  id: string;
  d: number; // diameter, ft
  n: number;
  L: number; // length, ft
  invUp: number; // upstream invert elevation, ft
  invDn: number; // downstream invert elevation, ft
  Q: number; // design flow, cfs
}

export type Bench = "flat" | "depressed" | "half" | "full" | "improved";

export interface DrainStructure {
  id: string;
  rim: number; // rim or grate elevation, ft
  bench: Bench;
  /** Angle between the upstream pipe and the outlet pipe, degrees (180 = straight through). */
  angle: number;
  /** Surface inflow entering at the rim (plunging), cfs. */
  surfaceQ: number;
}

/**
 * A single run of pipe from the upstream end to the outfall. pipes[i] leaves
 * structures[i]; structures[i] receives pipes[i-1] (if i > 0) and its surface flow.
 */
export interface DrainRun {
  pipes: DrainPipe[];
  structures: DrainStructure[];
  /** Tailwater water-surface elevation at the outfall, ft. */
  tailwater: number;
}

export interface PipeHydraulics {
  id: string;
  caseDn: string; // HEC-22 Table 9.6 case at the downstream end
  conditionUp: string; // HEC-22 Table 9.7 condition at the upstream end
  yn: number | null;
  yc: number;
  Qfull: number;
  Vfull: number;
  V: number; // velocity at the upstream end, ft/s
  EGLdn: number;
  HGLdn: number;
  EGLup: number;
  HGLup: number;
  Ei: number; // energy head over the upstream invert, ft
  surcharged: boolean;
}

export interface StructureHydraulics {
  id: string;
  Eai: number;
  Ha: number;
  Ea: number;
  EGL: number;
  rim: number;
  clearance: number; // rim - EGL, ft
  CB: number;
  Ctheta: number;
  CP: number;
  DI: number;
}

const CB_TABLE: Record<Bench, [number, number]> = {
  // [bench submerged (Eai/D > 2.5), bench unsubmerged (Eai/D < 1.0)] - HEC-22 Table 9.5
  flat: [-0.05, -0.05],
  depressed: [0, 0],
  half: [-0.05, -0.85],
  full: [-0.25, -0.93],
  improved: [-0.6, -0.98],
};

export function benchCoefficient(b: Bench, eaiOverD: number): number {
  const [sub, uns] = CB_TABLE[b];
  if (eaiOverD >= 2.5) return sub;
  if (eaiOverD <= 1) return uns;
  return uns + ((eaiOverD - 1) / 1.5) * (sub - uns);
}

const vh = (V: number) => (V * V) / (2 * G);

/**
 * HGL and EGL through one run, outfall upward: pipe ends by HEC-22 Tables 9.6
 * and 9.7 (gradually varied flow integrated along partly full pipes), structure
 * losses by the FHWA access-hole method (eq. 9.13-9.31).
 */
export function hglRun(run: DrainRun): { pipes: PipeHydraulics[]; structures: StructureHydraulics[] } {
  const N = run.pipes.length;
  const pipesOut: PipeHydraulics[] = new Array(N);
  const structsOut: StructureHydraulics[] = new Array(N);
  let downstreamEGL = run.tailwater;
  let isOutfall = true;

  for (let i = N - 1; i >= 0; i--) {
    const p = run.pipes[i]!;
    const s: Section = { kind: "circle", d: p.d };
    const S0 = (p.invUp - p.invDn) / p.L;
    const yn = normalDepth(s, p.Q, p.n, Math.max(S0, 1e-6));
    const yc = criticalDepth(s, p.Q);
    const full = fullPipe(p.d, p.n, Math.max(S0, 1e-9));
    const Af = (Math.PI * p.d * p.d) / 4;
    const Vf = p.Q / Af;
    const mild = yn === null || yn > yc;

    // ---- downstream end (Table 9.6)
    const t = downstreamEGL - p.invDn;
    let caseDn: string, hDn: number, EGLdn: number;
    const exitK = isOutfall ? 1.0 : 0.4;
    if (t >= p.d || yn === null) {
      caseDn = t >= p.d ? "A" : "A*"; // A*: pipe cannot carry Q as open-channel flow
      EGLdn = Math.max(downstreamEGL, p.invDn + p.d + vh(Vf)) + exitK * vh(Vf);
      hDn = EGLdn - vh(Vf) - p.invDn;
    } else if (t > yn) {
      caseDn = "B";
      hDn = t;
      EGLdn = p.invDn + hDn + vh(p.Q / geometry(s, hDn).A);
    } else {
      caseDn = t > yc ? "C" : t > 0 ? "D" : "E";
      hDn = yn;
      EGLdn = p.invDn + yn + vh(p.Q / geometry(s, yn).A);
    }

    // ---- along the pipe to the upstream end (Table 9.7)
    const steps = 60, dx = p.L / steps;
    let h = hDn; // piezometric head over the invert
    let jumped = false;
    for (let k = 0; k < steps; k++) {
      if (h >= p.d) {
        h += (fullFrictionSlope(p.Q, p.d, p.n) - S0) * dx;
        if (h < p.d) h = Math.max(h, yn ?? p.d);
        continue;
      }
      if (!mild && h <= yc * 1.001) { h = yn!; jumped = true; break; }
      if (mild && h <= yc * 1.001) { h = yc; break; }
      const sf = frictionSlope(s, p.Q, h, p.n);
      const fr = froude(s, p.Q, h);
      const dydx = (S0 - sf) / Math.max(1 - fr * fr, 0.05);
      h = Math.max(h - dydx * dx, 1e-6);
    }
    let conditionUp: string;
    let V: number, EGLup: number, HGLup: number;
    if (h >= p.d) {
      conditionUp = "A";
      V = Vf;
      HGLup = p.invUp + h;
      EGLup = HGLup + vh(V);
    } else {
      const y = jumped ? yn! : h;
      V = p.Q / geometry(s, y).A;
      HGLup = p.invUp + y;
      EGLup = HGLup + vh(V);
      conditionUp = jumped || y <= yc * 1.001 ? "D" : yn !== null && y > yn + 1e-3 ? "B" : "C";
    }
    pipesOut[i] = {
      id: p.id, caseDn, conditionUp, yn, yc, Qfull: full.Q, Vfull: full.V, V,
      EGLdn, HGLdn: p.invDn + hDn, EGLup, HGLup, Ei: EGLup - p.invUp, surcharged: h >= p.d || caseDn.startsWith("A"),
    };

    // ---- the structure at the upstream end of this pipe (FHWA access-hole method)
    const st = run.structures[i]!;
    const Ei = EGLup - p.invUp;
    const Hi = 0.2 * vh(V);
    const DI = p.Q / (Af * Math.sqrt(G * p.d));
    const Eai = Math.max(Ei + Hi, p.d * DI * DI, 1.6 * p.d * Math.pow(DI, 0.67));
    const CB = benchCoefficient(st.bench, Eai / p.d);
    let nonPlungeQ = 0, nonPlungeAngleQ = 0, CPsum = 0;
    const up = i > 0 ? run.pipes[i - 1]! : null;
    if (up) {
      const zk = up.invDn - p.invUp;
      if (zk < Eai) { nonPlungeQ += up.Q; nonPlungeAngleQ += up.Q * st.angle; }
      else CPsum += up.Q * ((Math.min(zk, 10 * p.d) - Eai) / p.d);
    }
    if (st.surfaceQ > 0) {
      const zk = st.rim - p.invUp;
      CPsum += st.surfaceQ * ((Math.min(zk, 10 * p.d) - Eai) / p.d);
    }
    const thetaW = nonPlungeQ > 0 ? nonPlungeAngleQ / nonPlungeQ : 180;
    const Ctheta = 4.5 * (nonPlungeQ / p.Q) * Math.cos(((thetaW / 2) * Math.PI) / 180);
    const CP = CPsum / p.Q;
    const Ha = Math.max(0, (Eai - Ei) * (CB + Ctheta + CP));
    const Ea = Math.max(Eai + Ha, Ei);
    const EGL = Ea + p.invUp;
    structsOut[i] = { id: st.id, Eai, Ha, Ea, EGL, rim: st.rim, clearance: st.rim - EGL, CB, Ctheta, CP, DI };

    downstreamEGL = EGL;
    isOutfall = false;
  }
  return { pipes: pipesOut, structures: structsOut };
}
