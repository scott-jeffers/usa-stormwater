/**
 * Floodplain, bridge and tidal-outfall checks for the model manual (8.8-8.10,
 * Appendix I): compensatory storage by elevation band, freeboard checks for
 * buildings and bridges, allowable rise, and sea-level-rise allowances for tidal
 * tailwater. US units: feet, cubic feet, years.
 */
import { G } from "../hydraulics/engine";

/* ---------- Compensatory storage (8.8.3) ---------- */

export interface Band { lo: number; hi: number; fillCf: number; cutCf: number }

export interface BandResult extends Band { required: number; ok: boolean }

/**
 * Check compensatory storage band by band: the cut in each elevation band shall be at least
 * `ratio` times the fill placed in the same band (hydraulically equivalent storage). Cut placed
 * in a higher band than the fill it replaces does not count for the lower band.
 */
export function compensatoryStorage(bands: Band[], ratio = 1): { bands: BandResult[]; fill: number; cut: number; required: number; ok: boolean } {
  const res = bands.map((b) => {
    const required = ratio * b.fillCf;
    return { ...b, required, ok: b.cutCf + 1e-9 >= required };
  });
  const fill = bands.reduce((a, b) => a + b.fillCf, 0);
  const cut = bands.reduce((a, b) => a + b.cutCf, 0);
  return { bands: res, fill, cut, required: ratio * fill, ok: res.every((b) => b.ok) };
}

/** Volume (cf) between successive elevations from plan areas (sq ft), by the average-end-area method. */
export function avgEndVolume(stages: Array<{ z: number; area: number }>): number {
  let v = 0;
  for (let i = 1; i < stages.length; i++) v += ((stages[i]!.area + stages[i - 1]!.area) / 2) * (stages[i]!.z - stages[i - 1]!.z);
  return v;
}

/* ---------- Freeboard (8.8.1, 8.8.2, 8.9.1) ---------- */

export const velocityHead = (V: number) => (V * V) / (2 * G);

export interface Freeboard { required: number; provided: number; ok: boolean; governing: string }

export function floorFreeboard(lowestFloor: number, bfe: number, req = 2): Freeboard {
  const provided = lowestFloor - bfe;
  return { required: req, provided, ok: provided + 1e-9 >= req, governing: "base flood elevation" };
}

/** Bridge low chord above the design water surface: the larger of `fb` and the velocity head (Maricopa County's rule). */
export function bridgeFreeboard(lowChord: number, designWse: number, V = 0, fb = 2): Freeboard {
  const hv = velocityHead(V);
  const required = Math.max(fb, hv);
  const provided = lowChord - designWse;
  return { required, provided, ok: provided + 1e-9 >= required, governing: hv > fb ? "velocity head" : "freeboard" };
}

/* ---------- Sea-level rise and tidal tailwater (8.10) ---------- */

/** Linear interpolation in a projection table of [year, rise in ft] pairs (sorted by year); extrapolates at the ends. */
export function slrAt(year: number, table: Array<[number, number]>): number {
  const t = [...table].sort((a, b) => a[0] - b[0]);
  if (t.length === 0) return 0;
  if (t.length === 1) return t[0]![1];
  let i = t.findIndex((p) => p[0] >= year);
  if (i <= 0) i = i === 0 ? 1 : t.length - 1;
  const [x0, y0] = t[i - 1]!, [x1, y1] = t[i]!;
  return y0 + ((y1 - y0) * (year - x0)) / (x1 - x0);
}

/** Sea-level rise to design for over a service life: projected rise at the end of life minus rise at the start. */
export function designSlr(startYear: number, lifeYears: number, table: Array<[number, number]>): number {
  return slrAt(startYear + lifeYears, table) - slrAt(startYear, table);
}

/** Tidal design tailwater: the higher of MHHW plus the sea-level-rise allowance and any other tailwater (e.g. a coincident riverine stage). */
export function tidalTailwater(mhhw: number, slr: number, other = -Infinity): { tw: number; governs: "tide" | "other" } {
  const tide = mhhw + slr;
  return tide >= other ? { tw: tide, governs: "tide" } : { tw: other, governs: "other" };
}

/** Service lives (years) this draft uses for the sea-level-rise allowance (8.10.2). */
export const SERVICE_LIFE: Record<string, number> = {
  "Storm drain or culvert": 50,
  "Bridge": 75,
  "Pavement": 20,
  "Building": 50,
};
