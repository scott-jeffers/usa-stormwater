"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { FIPS_TO_STATE_CODE, STATE_CODE_TO_NAME } from "@/lib/usStates";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Brand-aligned choropleth (ink/water family)
const MAP_FILLS = {
  empty: "#e8eef2",
  one: "#a5d4de",
  few: "#5ab8c5",
  many: "#0e7490",
  selected: "#0b1c2c",
  hover: "#155e75",
  pressed: "#0b1c2c",
  stroke: "#ffffff",
  city: "#0f766e",
  citySelected: "#0b1c2c",
  county: "#0369a1",
  countySelected: "#0b1c2c",
  district: "#6366f1",
  districtSelected: "#0b1c2c",
  markerHalo: "#ffffff",
};

export type LocalityKind = "city" | "county" | "special_district";

export interface LocalityMarker {
  slug: string;
  name: string;
  stateCode: string;
  coordinates: [number, number];
  kind: LocalityKind;
}

/** @deprecated Prefer LocalityMarker — kept as an alias for older imports. */
export type CityMarker = LocalityMarker;

interface CoverageMapProps {
  counts: Record<string, number>;
  selectedState: string | null;
  onSelectState: (code: string | null) => void;
  localities?: LocalityMarker[];
  /** @deprecated Use `localities` */
  cities?: LocalityMarker[];
}

function fillForCount(count: number, isSelected: boolean): string {
  if (isSelected) return MAP_FILLS.selected;
  if (count === 0) return MAP_FILLS.empty;
  if (count === 1) return MAP_FILLS.one;
  if (count <= 3) return MAP_FILLS.few;
  return MAP_FILLS.many;
}

export function CoverageMap({
  counts,
  selectedState,
  onSelectState,
  localities,
  cities = [],
}: CoverageMapProps) {
  const markers = localities ?? cities;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4">
      <p className="mb-2 text-xs text-slate-500">
        Click a state or pin (city, county, or district) to filter the list.
        The map stays at national scale.
      </p>

      <ComposableMap
        projection="geoAlbersUsa"
        width={980}
        height={551}
        style={{ width: "100%", height: "auto" }}
      >
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const fips = String(geo.id).padStart(2, "0");
              const stateCode = FIPS_TO_STATE_CODE[fips];
              const count = stateCode ? counts[stateCode] ?? 0 : 0;
              const isSelected = Boolean(
                stateCode && selectedState === stateCode
              );
              const stateName = stateCode
                ? STATE_CODE_TO_NAME[stateCode]
                : geo.properties.name;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => {
                    if (!stateCode) return;
                    onSelectState(isSelected ? null : stateCode);
                  }}
                  style={{
                    default: {
                      fill: fillForCount(count, isSelected),
                      stroke: MAP_FILLS.stroke,
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: stateCode ? "pointer" : "default",
                    },
                    hover: {
                      fill: stateCode
                        ? MAP_FILLS.hover
                        : fillForCount(count, isSelected),
                      stroke: MAP_FILLS.stroke,
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: stateCode ? "pointer" : "default",
                    },
                    pressed: {
                      fill: MAP_FILLS.pressed,
                      stroke: MAP_FILLS.stroke,
                      strokeWidth: 0.5,
                      outline: "none",
                    },
                  }}
                >
                  <title>
                    {stateName}
                    {": "}
                    {count} manual{count === 1 ? "" : "s"}
                  </title>
                </Geography>
              );
            })
          }
        </Geographies>

        {markers.map((marker) => {
          const isInSelectedState = selectedState === marker.stateCode;
          const fill =
            marker.kind === "county"
              ? isInSelectedState
                ? MAP_FILLS.countySelected
                : MAP_FILLS.county
              : marker.kind === "special_district"
                ? isInSelectedState
                  ? MAP_FILLS.districtSelected
                  : MAP_FILLS.district
                : isInSelectedState
                  ? MAP_FILLS.citySelected
                  : MAP_FILLS.city;

          return (
            <Marker key={marker.slug} coordinates={marker.coordinates}>
              <g
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectState(
                    isInSelectedState ? null : marker.stateCode
                  );
                }}
              >
                <title>
                  {marker.name} — filter{" "}
                  {STATE_CODE_TO_NAME[marker.stateCode] ?? marker.stateCode}
                </title>
                {marker.kind === "county" ? (
                  <>
                    <rect
                      x={-5.5}
                      y={-5.5}
                      width={11}
                      height={11}
                      rx={1.5}
                      fill={MAP_FILLS.markerHalo}
                      opacity={0.95}
                    />
                    <rect
                      x={-4}
                      y={-4}
                      width={8}
                      height={8}
                      rx={1}
                      fill={fill}
                      stroke={MAP_FILLS.markerHalo}
                      strokeWidth={1.25}
                    />
                  </>
                ) : marker.kind === "special_district" ? (
                  <>
                    <polygon
                      points="0,-7.5 7.5,0 0,7.5 -7.5,0"
                      fill={MAP_FILLS.markerHalo}
                      opacity={0.95}
                    />
                    <polygon
                      points="0,-5.5 5.5,0 0,5.5 -5.5,0"
                      fill={fill}
                      stroke={MAP_FILLS.markerHalo}
                      strokeWidth={1.25}
                    />
                  </>
                ) : (
                  <>
                    <circle
                      r={6}
                      fill={MAP_FILLS.markerHalo}
                      opacity={0.9}
                    />
                    <circle
                      r={4.25}
                      fill={fill}
                      stroke={MAP_FILLS.markerHalo}
                      strokeWidth={1.5}
                    />
                  </>
                )}
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: MAP_FILLS.empty }}
            />
            No manual yet
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ backgroundColor: MAP_FILLS.few }}
            />
            State covered
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full ring-2 ring-white"
              style={{ backgroundColor: MAP_FILLS.city }}
            />
            City manual
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rounded-sm ring-2 ring-white"
              style={{ backgroundColor: MAP_FILLS.county }}
            />
            County manual
          </span>
          <span className="flex items-center gap-1">
            <span
              className="inline-block h-2.5 w-2.5 rotate-45 ring-2 ring-white"
              style={{ backgroundColor: MAP_FILLS.district }}
            />
            Special district
          </span>
        </div>
        {selectedState && (
          <button
            type="button"
            onClick={() => onSelectState(null)}
            className="font-medium text-water-link hover:text-water-deep hover:underline"
          >
            Clear map selection
          </button>
        )}
      </div>
    </div>
  );
}
