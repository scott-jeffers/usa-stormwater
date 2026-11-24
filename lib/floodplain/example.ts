/**
 * The model manual's floodplain, bridge and tidal-outfall worked example
 * (Appendix I). The floodplain calculator's "Load worked example" and the tests
 * use these inputs. Elevations in feet, NAVD88.
 */
import { bridgeFreeboard, compensatoryStorage, designSlr, floorFreeboard, tidalTailwater, type Band } from "./engine";

export const WORKED_FLOODPLAIN = {
  bfe: 9.0,
  floorFreeboardReq: 2,
  lowestFloor: 11.0,
  ratio: 1,
  bands: [
    { lo: 5, hi: 6, fillCf: 1200, cutCf: 1300 },
    { lo: 6, hi: 7, fillCf: 1800, cutCf: 1900 },
    { lo: 7, hi: 8, fillCf: 1900, cutCf: 2000 },
    { lo: 8, hi: 9, fillCf: 1200, cutCf: 1300 },
  ] as Band[],
  riseFt: 0.04,
  allowedRiseFt: 1.0,
  bridge: { designWse: 9.8, lowChord: 12.1, V: 6, fb: 2 },
  tide: { mhhw: 2.1, startYear: 2025, life: 50, table: [[2025, 0.5], [2050, 1.3], [2075, 2.45], [2100, 3.9]] as Array<[number, number]>, riverineTw: 3.6 },
};

export function runFloodplainExample(W = WORKED_FLOODPLAIN) {
  const comp = compensatoryStorage(W.bands, W.ratio);
  const floor = floorFreeboard(W.lowestFloor, W.bfe, W.floorFreeboardReq);
  const bridge = bridgeFreeboard(W.bridge.lowChord, W.bridge.designWse, W.bridge.V, W.bridge.fb);
  const slr = designSlr(W.tide.startYear, W.tide.life, W.tide.table);
  const tw = tidalTailwater(W.tide.mhhw, slr, W.tide.riverineTw);
  return { comp, floor, bridge, slr, tw, riseOk: W.riseFt <= W.allowedRiseFt };
}
