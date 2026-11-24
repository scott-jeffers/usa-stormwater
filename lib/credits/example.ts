/**
 * The model manual's site-design worked example (Appendix F): a 2-acre
 * commercial site accounted under 3.1, 3.8 and 3.9. The compliance
 * calculator's "Load worked example" and the tests use these inputs.
 */
import { accountSite, type Measure } from "./engine";

export const WORKED_CREDITS = {
  P: 1.0,
  siteAreaSf: 87120,
  siteImpPct: 70,
  measures: [
    { label: "Roof to lawn (4 downspouts)", kind: "disconnection", areaSf: 4000, impPct: 100, hsg: "C", amended: true },
    { label: "Roof to cistern", kind: "harvesting", areaSf: 17780, impPct: 100, hsg: "C", storageCf: 2000, usedCf: 1000 },
    { label: "Parking to permeable pavement", kind: "infiltrating", areaSf: 13068, impPct: 100, hsg: "C", storageCf: 1800 },
    { label: "Parking to bioretention", kind: "underdrained", areaSf: 26136, impPct: 100, hsg: "C", storageCf: 1800, sumpCf: 600 },
  ] as Measure[],
};

export function runCreditsExample() {
  const W = WORKED_CREDITS;
  return accountSite(W.siteAreaSf, W.siteImpPct, W.P, W.measures);
}
