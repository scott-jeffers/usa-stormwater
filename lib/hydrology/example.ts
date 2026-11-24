/**
 * The model manual's hydrology worked example (Appendix E): one 25-acre site
 * before and after development, time of concentration by segments, rational
 * and NRCS peaks, and the difference between weighted and separate curve
 * numbers. The hydrology calculator's "Load worked example" and the tests use it.
 */
import { intensityAt, nrcsHydrograph, rationalPeak, timeOfConcentration, weightedC, type Cover, type Segment } from "./engine";

/** Illustrative 10-year intensities (HEC-22 Table 9.8); use NOAA Atlas 14 for the site in practice. */
export const EX_IDF_10: Array<[number, number]> = [[5, 7.1], [10, 5.9], [15, 5.1], [20, 4.5], [30, 3.5], [40, 3.0], [50, 2.6], [60, 2.4], [120, 1.4]];

export const WORKED_HYDROLOGY = {
  areaAc: 25,
  P2: 3.2,
  storms: [
    { years: 2, depth: 3.2 },
    { years: 10, depth: 4.9 },
    { years: 100, depth: 7.6 },
  ],
  smallStorm: 1.0,
  pre: {
    segments: [
      { kind: "sheet", L: 100, S: 0.02, n: 0.24 },
      { kind: "shallow", L: 900, S: 0.02, surface: "Short grass pasture" },
      { kind: "channel", L: 800, V: 2.0 },
    ] as Segment[],
    cover: [{ label: "Meadow, HSG C", area: 25, cn: 71, impervious: false }] as Cover[],
    C: [{ area: 25, C: 0.25 }],
  },
  post: {
    segments: [
      { kind: "sheet", L: 75, S: 0.02, n: 0.011 },
      { kind: "shallow", L: 400, S: 0.015, surface: "Paved" },
      { kind: "channel", L: 900, V: 5.0 },
    ] as Segment[],
    cover: [
      { label: "Impervious", area: 10, cn: 98, impervious: true },
      { label: "Lawn, good, HSG C", area: 15, cn: 74, impervious: false },
    ] as Cover[],
    C: [{ area: 10, C: 0.9 }, { area: 15, C: 0.22 }],
  },
};

export function runHydrologyExample() {
  const W = WORKED_HYDROLOGY;
  const pre = timeOfConcentration(W.pre.segments, W.P2);
  const post = timeOfConcentration(W.post.segments, W.P2);
  const tcPre = Math.max(pre.tc, 5), tcPost = Math.max(post.tc, 5);
  const Cpre = weightedC(W.pre.C), Cpost = weightedC(W.post.C);
  const iPre = intensityAt(tcPre, EX_IDF_10), iPost = intensityAt(tcPost, EX_IDF_10);
  const rational = { pre: { C: Cpre, i: iPre, ...rationalPeak(Cpre, iPre, W.areaAc, 10) }, post: { C: Cpost, i: iPost, ...rationalPeak(Cpost, iPost, W.areaAc, 10) } };
  const storms = W.storms.map((s) => ({
    ...s,
    pre: nrcsHydrograph(W.pre.cover, tcPre, s.depth, "II", "weighted"),
    weighted: nrcsHydrograph(W.post.cover, tcPost, s.depth, "II", "weighted"),
    separate: nrcsHydrograph(W.post.cover, tcPost, s.depth, "II", "separate"),
  }));
  const small = {
    weighted: nrcsHydrograph(W.post.cover, tcPost, W.smallStorm, "II", "weighted"),
    separate: nrcsHydrograph(W.post.cover, tcPost, W.smallStorm, "II", "separate"),
  };
  return { pre, post, tcPre, tcPost, rational, nrcs: { storms, small } };
}
