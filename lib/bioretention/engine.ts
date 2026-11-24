/**
 * Bioretention and filter design checks for the model manual (3.10, 6.1, Appendix H):
 * filter area by Darcy's law, flow through the media, underdrain capacity,
 * media test results against 6.1.5-6.1.7, and annual phosphorus loads by the
 * Simple Method. US units: feet, cubic feet, days, inches per hour, acres, pounds.
 */
import { fullPipe } from "../hydraulics/engine";

/** Filter area (sq ft) by Darcy's law: Af = WQv·df / [k·(hf + df)·tf]. k in ft/day, tf in days. */
export function filterArea(wqvCf: number, dfFt: number, kFtDay: number, hfFt: number, tfDays: number): number {
  return (wqvCf * dfFt) / (kFtDay * (hfFt + dfFt) * tfDays);
}

/** Media flow (cfs) at head h above the media surface, by Darcy's law. k in in/hr. */
export function mediaFlowCfs(areaSf: number, kInHr: number, dfFt: number, hFt: number): number {
  return ((kInHr / 12) / 3600) * areaSf * ((hFt + dfFt) / dfFt);
}

/** Void ratios used for storage in 6.1.8: engineered media 0.25, clean stone 0.40. */
export const MEDIA_VOIDS = 0.25;
export const STONE_VOIDS = 0.4;

/** Equivalent water depth (ft) stored above the underdrain invert: ponding + media voids + stone voids. */
export function storageDepthFt(pondFt: number, dfFt: number, stoneAboveFt: number, nMedia = MEDIA_VOIDS, nStone = STONE_VOIDS): number {
  return pondFt + nMedia * dfFt + nStone * stoneAboveFt;
}

/** Surface area (sq ft) needed to hold `share` of the WQv above the underdrain invert. */
export function storageArea(wqvCf: number, share: number, depthEqFt: number): number {
  return depthEqFt > 0 ? (share * wqvCf) / depthEqFt : Infinity;
}

/** Hours for a stone sump below the underdrain to drain into the subsoil at design rate fIn (in/hr). */
export function sumpDrainHours(sumpFt: number, fInHr: number, nStone = STONE_VOIDS): number {
  return fInHr > 0 ? (sumpFt * nStone * 12) / fInHr : Infinity;
}

export const inHrToFtDay = (k: number) => (k * 24) / 12;

/** Time (hours) for the media to pass a volume at average head hAvg. */
export function drainHours(volCf: number, areaSf: number, kInHr: number, dfFt: number, hAvgFt: number): number {
  const q = mediaFlowCfs(areaSf, kInHr, dfFt, hAvgFt);
  return q > 0 ? volCf / q / 3600 : Infinity;
}

export const UNDERDRAIN_N: Record<string, number> = {
  "Smooth-wall PVC or HDPE (n 0.011)": 0.011,
  "Corrugated HDPE (n 0.020)": 0.02,
};

/** Full-flow capacity (cfs) of n underdrains of diameter dIn at slope S (ft/ft). */
export function underdrainCapacity(dIn: number, count: number, n: number, S: number): number {
  return count * fullPipe(dIn / 12, n, S).Q;
}

/** Smallest standard underdrain size (4, 6, 8, 10, 12 in) carrying q with `count` pipes, or null. */
export function underdrainSize(q: number, count: number, n: number, S: number, minIn = 4): number | null {
  for (const d of [4, 6, 8, 10, 12]) if (d >= minIn && underdrainCapacity(d, count, n, S) >= q) return d;
  return null;
}

/* ---------- Media test results against 6.1.5-6.1.7 ---------- */

export interface MediaTest {
  sandPct: number;
  clayPct: number;
  omPct: number; // organic matter, % by dry weight
  pIndex: number; // P-index or Mehlich-3 P, mg/kg
  kInHr: number; // tested saturated hydraulic conductivity
  compostOmPct?: number;
}

export interface Spec { key: keyof MediaTest; label: string; min?: number; max?: number; clause: string }

export const MEDIA_SPEC: Spec[] = [
  { key: "sandPct", label: "Sand", min: 70, clause: "6.1.5" },
  { key: "clayPct", label: "Clay", max: 5, clause: "6.1.5" },
  { key: "omPct", label: "Organic matter", min: 3, max: 5, clause: "6.1.5" },
  { key: "pIndex", label: "Phosphorus (P-index or Mehlich-3, mg/kg)", min: 10, max: 30, clause: "6.1.6" },
  { key: "kInHr", label: "Saturated hydraulic conductivity", min: 1, max: 12, clause: "6.1.3" },
  { key: "compostOmPct", label: "Compost organic matter", min: 35, clause: "6.1.7" },
];

export function checkMedia(t: MediaTest): Array<{ spec: Spec; value: number | undefined; ok: boolean | null }> {
  return MEDIA_SPEC.map((spec) => {
    const value = t[spec.key];
    if (value === undefined || !Number.isFinite(value)) return { spec, value, ok: null };
    const ok = (spec.min === undefined || value >= spec.min) && (spec.max === undefined || value <= spec.max);
    return { spec, value, ok };
  });
}

/* ---------- Annual loads (Simple Method) ---------- */

/** Annual load (lb/yr) by the Simple Method: L = 0.226 · P · Pj · Rv · C · A (P in in/yr, C in mg/L, A in acres). */
export function simpleLoad(annualIn: number, rvSite: number, cMgL: number, acres: number, pj = 0.9): number {
  return 0.226 * annualIn * pj * rvSite * cMgL * acres;
}

/**
 * Annual load removed by a practice: the share of annual runoff it captures, of which the
 * retained share leaves no load and the rest leaves through the media at a concentration
 * reduced by `filterRemoval`.
 */
export function loadRemoved(load: number, capture: number, retainedShare: number, filterRemoval: number): number {
  return load * capture * (retainedShare + (1 - retainedShare) * filterRemoval);
}
