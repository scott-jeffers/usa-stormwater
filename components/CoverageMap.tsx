"use client";

import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import { FIPS_TO_STATE_CODE, STATE_CODE_TO_NAME } from "@/lib/usStates";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

export interface CityMarker {
  slug: string;
  name: string;
  stateCode: string;
  coordinates: [number, number];
}

interface CoverageMapProps {
  counts: Record<string, number>;
  selectedState: string | null;
  onSelectState: (code: string | null) => void;
  cities?: CityMarker[];
}

function fillForCount(count: number, isSelected: boolean): string {
  if (isSelected) return "#1d4ed8";
  if (count === 0) return "#e2e8f0";
  if (count === 1) return "#93c5fd";
  if (count <= 3) return "#60a5fa";
  return "#2563eb";
}

export function CoverageMap({
  counts,
  selectedState,
  onSelectState,
  cities = [],
}: CoverageMapProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-2 text-xs text-slate-500">
        Click a state (or city pin) to filter the list to that state. The map
        stays at national scale.
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
                      stroke: "#ffffff",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: stateCode ? "pointer" : "default",
                    },
                    hover: {
                      fill: stateCode
                        ? "#1d4ed8"
                        : fillForCount(count, isSelected),
                      stroke: "#ffffff",
                      strokeWidth: 0.5,
                      outline: "none",
                      cursor: stateCode ? "pointer" : "default",
                    },
                    pressed: {
                      fill: "#1e40af",
                      stroke: "#ffffff",
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

        {cities.map((city) => {
          const isInSelectedState = selectedState === city.stateCode;
          return (
            <Marker key={city.slug} coordinates={city.coordinates}>
              <g
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Same behavior as clicking the state: filter to everything
                  // in that state (state + city manuals), no zoom.
                  onSelectState(
                    isInSelectedState ? null : city.stateCode
                  );
                }}
              >
                <title>
                  {city.name} — filter {STATE_CODE_TO_NAME[city.stateCode] ?? city.stateCode}
                </title>
                <circle
                  r={4}
                  fill={isInSelectedState ? "#115e59" : "#0f766e"}
                  stroke="#ffffff"
                  strokeWidth={1.25}
                />
              </g>
            </Marker>
          );
        })}
      </ComposableMap>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-slate-200" />
            No manual yet
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-400" />
            State covered
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-teal-700 ring-1 ring-white" />
            City manual
          </span>
        </div>
        {selectedState && (
          <button
            type="button"
            onClick={() => onSelectState(null)}
            className="font-medium text-blue-700 hover:underline"
          >
            Clear map selection
          </button>
        )}
      </div>
    </div>
  );
}
