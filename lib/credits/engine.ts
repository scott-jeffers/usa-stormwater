/**
 * Volume accounting for the model manual's retention standard (3.1, 3.8, 3.9):
 * water-quality volume by drainage area, retention credited for each practice
 * and site-design measure, and the remainder that must be treated (3.3).
 *
 * Credits come from model manual 3.9. Storage-based credits apply to the
 * storage a practice provides; flow-through credits apply to the WQv runoff
 * from the area draining to the measure. US units: square feet, cubic feet.
 */

export type Hsg = "A" | "B" | "C" | "D";

export type MeasureKind =
  | "infiltrating"      // bioretention, permeable pavement, trench, dry well without underdrain
  | "underdrained"      // same with an underdrain; sump below the underdrain credited separately
  | "greenRoof"
  | "harvesting"
  | "grassChannel"
  | "disconnection"     // rooftop or pavement disconnection meeting 3.8.3
  | "conservation"      // sheet flow to a protected natural area
  | "treatmentOnly";    // wet pond, wetland, lined filter: no retention credit

export const MEASURE_LABEL: Record<MeasureKind, string> = {
  infiltrating: "Infiltrating practice (no underdrain)",
  underdrained: "Underdrained practice",
  greenRoof: "Green roof",
  harvesting: "Rainwater harvesting",
  grassChannel: "Grass channel",
  disconnection: "Disconnection to pervious area",
  conservation: "Sheet flow to conservation area",
  treatmentOnly: "Treatment only (pond, wetland, lined filter)",
};

/** Whether a measure's credit applies to storage it provides (true) or to the runoff draining to it (false). */
export const STORAGE_BASED: Record<MeasureKind, boolean> = {
  infiltrating: true, underdrained: true, greenRoof: true, harvesting: true,
  grassChannel: false, disconnection: false, conservation: false, treatmentOnly: false,
};

const sandy = (h: Hsg) => h === "A" || h === "B";

/** Retention credit (fraction) for a measure, model manual 3.9 table. */
export function creditFraction(kind: MeasureKind, hsg: Hsg = "C", amended = false): number {
  const ab = sandy(hsg) || amended;
  switch (kind) {
    case "infiltrating": return 1.0;
    case "underdrained": return 0.4;
    case "greenRoof": return 1.0;
    case "harvesting": return 1.0;
    case "grassChannel": return ab ? 0.2 : 0.1;
    case "disconnection": return ab ? 0.5 : 0.25;
    case "conservation": return ab ? 0.75 : 0.5;
    case "treatmentOnly": return 0;
  }
}

/** Volumetric runoff coefficient (model manual 4.2). */
export const rv = (impPct: number) => 0.05 + 0.009 * impPct;

/** WQv in cubic feet for an area (sq ft) at impervious share (0-100) and rainfall depth (in). */
export function wqv(areaSf: number, impPct: number, P: number): number {
  return (P / 12) * rv(impPct) * areaSf;
}

export interface Measure {
  label: string;
  kind: MeasureKind;
  /** Area draining to the measure (sq ft) and its impervious share (%). */
  areaSf: number;
  impPct: number;
  hsg: Hsg;
  amended?: boolean;
  /** Storage provided (cf) for storage-based measures; for underdrained practices, the storage above the underdrain. */
  storageCf?: number;
  /** Underdrained practices: storage in a stone sump below the underdrain invert (cf), credited at 100%. */
  sumpCf?: number;
  /** Rainwater harvesting: volume demonstrably used between storms (cf) (6.10.1). */
  usedCf?: number;
}

export interface MeasureResult {
  label: string;
  kind: MeasureKind;
  wqvIn: number; // WQv of the area draining to the measure, cf
  credit: number; // fraction applied
  basis: number; // volume the credit is applied to, cf
  retained: number; // cf, never more than wqvIn
  capped: boolean;
}

export function creditMeasure(m: Measure, P: number): MeasureResult {
  const w = wqv(m.areaSf, m.impPct, P);
  const f = creditFraction(m.kind, m.hsg, m.amended);
  let basis: number, raw: number;
  if (m.kind === "underdrained") {
    basis = (m.storageCf ?? 0) + (m.sumpCf ?? 0);
    raw = f * (m.storageCf ?? 0) + (m.sumpCf ?? 0);
  } else if (m.kind === "harvesting") {
    basis = Math.min(m.storageCf ?? 0, m.usedCf ?? m.storageCf ?? 0);
    raw = f * basis;
  } else if (STORAGE_BASED[m.kind]) {
    basis = m.storageCf ?? 0;
    raw = f * basis;
  } else {
    basis = w;
    raw = f * w;
  }
  const retained = Math.min(raw, w);
  return { label: m.label, kind: m.kind, wqvIn: w, credit: f, basis, retained, capped: raw > w + 1e-9 };
}

export interface SiteResult {
  siteWqv: number;
  measures: MeasureResult[];
  retained: number;
  remainder: number; // WQv still to be treated under 3.3
  retainedShare: number;
  untreatedArea: number; // sq ft of the site not draining to any measure
  treeOffsetSf: number;
  effImpPct: number;
}

/** Impervious area offset by trees (3.8.5): 100 sq ft per tree, at most 25% of the impervious area. */
export const TREE_CREDIT_SF = 100;
export const TREE_CAP = 0.25;
export function treeOffsetSf(trees: number, impSf: number): number {
  return Math.max(0, Math.min(trees * TREE_CREDIT_SF, TREE_CAP * impSf));
}

/**
 * Account for a whole site. The site WQv is computed from the total area and impervious share;
 * each measure's retention is capped at the WQv of its own drainage area (credits cannot be
 * moved between drainage areas).
 */
export function accountSite(siteAreaSf: number, siteImpPct: number, P: number, measures: Measure[], trees = 0): SiteResult {
  const impSf = (siteImpPct / 100) * siteAreaSf;
  const offset = treeOffsetSf(trees, impSf);
  const effImpPct = siteAreaSf > 0 ? ((impSf - offset) / siteAreaSf) * 100 : 0;
  const siteWqv = wqv(siteAreaSf, effImpPct, P);
  const res = measures.map((m) => creditMeasure(m, P));
  const retained = Math.min(res.reduce((a, r) => a + r.retained, 0), siteWqv);
  const drained = measures.reduce((a, m) => a + m.areaSf, 0);
  return { siteWqv, measures: res, retained, remainder: Math.max(siteWqv - retained, 0), retainedShare: siteWqv > 0 ? retained / siteWqv : 0, untreatedArea: Math.max(siteAreaSf - drained, 0), treeOffsetSf: offset, effImpPct };
}
