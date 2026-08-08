/** Approximate geographic centers for map zoom / markers [lon, lat]. */

export const STATE_CENTERS: Record<string, [number, number]> = {
  AL: [-86.9, 32.8],
  AK: [-152.0, 64.0],
  AZ: [-111.6, 34.3],
  AR: [-92.4, 34.9],
  CA: [-119.4, 37.2],
  CO: [-105.5, 39.0],
  CT: [-72.7, 41.6],
  DE: [-75.5, 39.0],
  DC: [-77.0, 38.9],
  FL: [-81.7, 27.8],
  GA: [-83.4, 32.7],
  HI: [-157.5, 20.8],
  ID: [-114.5, 44.4],
  IL: [-89.2, 40.0],
  IN: [-86.3, 39.8],
  IA: [-93.5, 42.0],
  KS: [-98.3, 38.5],
  KY: [-85.3, 37.8],
  LA: [-91.8, 31.0],
  ME: [-69.2, 45.3],
  MD: [-76.7, 39.0],
  MA: [-71.8, 42.3],
  MI: [-84.6, 44.3],
  MN: [-94.6, 46.3],
  MS: [-89.7, 32.7],
  MO: [-92.5, 38.4],
  MT: [-110.0, 47.0],
  NE: [-99.8, 41.5],
  NV: [-116.6, 39.3],
  NH: [-71.6, 43.7],
  NJ: [-74.5, 40.2],
  NM: [-106.2, 34.4],
  NY: [-75.5, 43.0],
  NC: [-79.4, 35.6],
  ND: [-100.5, 47.4],
  OH: [-82.8, 40.3],
  OK: [-97.5, 35.5],
  OR: [-120.5, 44.0],
  PA: [-77.2, 40.9],
  RI: [-71.5, 41.7],
  SC: [-81.0, 33.9],
  SD: [-100.2, 44.4],
  TN: [-86.3, 35.8],
  TX: [-99.3, 31.5],
  UT: [-111.7, 39.4],
  VT: [-72.7, 44.0],
  VA: [-78.8, 37.5],
  WA: [-120.7, 47.4],
  WV: [-80.6, 38.6],
  WI: [-89.8, 44.6],
  WY: [-107.3, 43.0],
  PR: [-66.5, 18.2],
};

/** Known municipality centroids used for map markers. */
import { GENERATED_CITY_CENTERS } from "./cityCoords.generated";

export const CITY_CENTERS: Record<string, [number, number]> = {
  ...GENERATED_CITY_CENTERS,
};

export function cityCenterKey(slug: string, name: string, stateCode: string | null): string {
  const fromSlug = slug.toLowerCase();
  if (CITY_CENTERS[fromSlug]) return fromSlug;
  const fromName = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}${stateCode ? `-${stateCode.toLowerCase()}` : ""}`;
  if (CITY_CENTERS[fromName]) return fromName;
  const bare = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (CITY_CENTERS[bare]) return bare;
  return fromName;
}

export function lookupCityCoordinates(
  slug: string,
  name: string,
  stateCode: string | null
): [number, number] | null {
  const key = cityCenterKey(slug, name, stateCode);
  return CITY_CENTERS[key] ?? CITY_CENTERS[slug.toLowerCase()] ?? null;
}
