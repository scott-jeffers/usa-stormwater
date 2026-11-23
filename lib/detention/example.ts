/**
 * The worked example in Appendix C of the model manual, as data, so the test
 * suite and the calculator's "load example" button use the same numbers the
 * manual prints.
 */
import {
  hydrograph,
  prismStorage,
  rating,
  route,
  centroidLag,
  interp,
  type Barrel,
  type Device,
  type Distribution,
  type Watershed,
} from "./engine";

export const WORKED_EXAMPLE = {
  pre: { areaAc: 10, cn: 71, tcHours: 0.4 } as Watershed,
  post: { areaAc: 10, cn: 85, tcHours: 0.15 } as Watershed,
  dist: "II" as Distribution,
  rain: [
    { years: 1, depth: 2.6 },
    { years: 2, depth: 3.2 },
    { years: 10, depth: 4.9 },
    { years: 100, depth: 7.6 },
  ],
  basin: { length: 120, width: 60, sideSlope: 3 },
  topOfBerm: 8.5,
  devices: [
    { kind: "orifice", label: "Channel-protection orifice (2.25 in)", invert: 0, diameter: 2.25 / 12 },
    { kind: "weir", label: "10-year weir notch in riser wall (3.5 ft)", crest: 3.8, length: 3.5 },
    { kind: "riser", label: "Riser top (48 in)", crest: 5.3, diameter: 4 },
    { kind: "spillway", label: "Emergency spillway (20 ft)", crest: 6.0, width: 20 },
  ] as Device[],
  barrel: { diameter: 3, length: 60, outletInvert: -1.6, n: 0.013, Ke: 0.5 } as Barrel,
  dtHours: 1 / 60,
};

export function runWorkedExample(ex = WORKED_EXAMPLE) {
  const stages = Array.from({ length: Math.round(ex.topOfBerm / 0.05) + 1 }, (_, i) => Math.round(i * 5) / 100);
  const stor = stages.map((h) => prismStorage(h, ex.basin.length, ex.basin.width, ex.basin.sideSlope));
  const rt = rating(stages, ex.devices, ex.barrel);
  const disch = rt.map((r) => r.total);
  const storms = ex.rain.map(({ years, depth }) => {
    const pre = hydrograph(ex.pre, depth, ex.dist, ex.dtHours, 60);
    const post = hydrograph(ex.post, depth, ex.dist, ex.dtHours, 60);
    const r = route(post.q, ex.dtHours, stages, stor, disch);
    return { years, depth, prePeak: Math.max(...pre.q), postPeak: r.peakIn, routedPeak: r.peakOut, maxStage: r.maxStage, maxStorage: r.maxStorage, runoffIn: post.runoffIn };
  });
  const one = hydrograph(ex.post, ex.rain[0]!.depth, ex.dist, ex.dtHours, 120);
  const r1 = route(one.q, ex.dtHours, stages, stor, disch);
  const comLagHours = centroidLag(one.q, r1.outflow, ex.dtHours);
  // 100-year with every primary outlet blocked and the basin full to the spillway crest
  const spill = ex.devices.find((d) => d.kind === "spillway") as Extract<Device, { kind: "spillway" }>;
  const blockedDisch = rating(stages, ex.devices, ex.barrel, true).map((r) => r.total);
  const h100 = hydrograph(ex.post, ex.rain[ex.rain.length - 1]!.depth, ex.dist, ex.dtHours, 60);
  const blocked100 = route(h100.q, ex.dtHours, stages, stor, blockedDisch, spill.crest);
  const barrelControls = rt.some((r) => r.barrelControls && r.stage <= storms[storms.length - 1]!.maxStage);
  return { stages, stor, rating: rt, storms, comLagHours, blocked100, barrelControls, storageAt: (h: number) => interp(h, stages, stor) };
}
