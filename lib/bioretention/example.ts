/**
 * The model manual's bioretention worked example (Appendix G): the underdrained
 * bioretention of Appendix F, sized under 6.1.8, its underdrain and sump checked,
 * its media test results checked against 6.1.3 and 6.1.5-6.1.7, and its phosphorus
 * removal estimated for 3.10.1. The bioretention calculator's "Load worked example"
 * and the tests use it.
 */
import { wqv } from "../credits/engine";
import { checkMedia, drainHours, filterArea, inHrToFtDay, loadRemoved, mediaFlowCfs, simpleLoad, storageArea, storageDepthFt, sumpDrainHours, underdrainSize, type MediaTest } from "./engine";

export const WORKED_BIORETENTION = {
  areaSf: 26136, // 0.6 acre of parking draining to it
  impPct: 100,
  P: 1.0,
  dfFt: 2.0, // media depth (6.1.1)
  pondFt: 1.0, // 12 in maximum ponding (6.1.2)
  stoneAboveFt: 1.25, // stone from the underdrain invert to the choker course
  sumpFt: 20 / 12, // 20 in of stone below the underdrain invert (3.9.1)
  kTestInHr: 2.0, // tested media conductivity (6.1.3)
  safety: 2, // design k = tested / 2, as 5.3
  tfDays: 2,
  storeShare: 0.75,
  areaProvidedSf: 900,
  subsoilTestInHr: 0.3,
  underdrainIn: 4,
  underdrainCount: 1,
  underdrainN: 0.011,
  underdrainSlope: 0.005,
  media: { sandPct: 86, clayPct: 3, omPct: 4, pIndex: 22, kInHr: 2.0, compostOmPct: 45 } as MediaTest,
  annualIn: 42,
  tpMgL: 0.26,
  capture: 0.9,
  filterRemoval: 0.4,
};

export function runBioretentionExample(W = WORKED_BIORETENTION) {
  const v = wqv(W.areaSf, W.impPct, W.P);
  const kDesignInHr = W.kTestInHr / W.safety;
  const afDarcy = filterArea(v, W.dfFt, inHrToFtDay(kDesignInHr), W.pondFt / 2, W.tfDays);
  const depthEq = storageDepthFt(W.pondFt, W.dfFt, W.stoneAboveFt);
  const afStorage = storageArea(v, W.storeShare, depthEq);
  const afRequired = Math.max(afDarcy, afStorage);
  const A = W.areaProvidedSf;
  const storageCf = A * depthEq;
  const sumpCf = A * W.sumpFt * 0.4;
  const pondDrainH = drainHours(A * W.pondFt, A, kDesignInHr, W.dfFt, W.pondFt / 2);
  const sumpH = sumpDrainHours(W.sumpFt, W.subsoilTestInHr / W.safety);
  const qPeak = mediaFlowCfs(A, W.kTestInHr, W.dfFt, W.pondFt);
  const underdrainIn = underdrainSize(qPeak, W.underdrainCount, W.underdrainN, W.underdrainSlope);
  const retained = Math.min(0.4 * storageCf + sumpCf, v);
  const retainedShare = retained / v;
  const acres = W.areaSf / 43560;
  const loadLb = simpleLoad(W.annualIn, 0.05 + 0.009 * W.impPct, W.tpMgL, acres);
  const removedLb = loadRemoved(loadLb, W.capture, retainedShare, W.filterRemoval);
  return { wqv: v, kDesignInHr, afDarcy, depthEq, afStorage, afRequired, storageCf, sumpCf, pondDrainH, sumpH, qPeak, underdrainIn, retained, retainedShare, media: checkMedia(W.media), loadLb, removedLb, removedShare: removedLb / loadLb };
}
