"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { FIPS_TO_STATE_CODE, STATE_CODE_TO_NAME } from "@/lib/usStates";

export type MapLayer = {
  key: string;
  tab: string;
  title: string;
  /** "count" for coverage, otherwise the requirement's unit. */
  unit: string;
  /** Per-state value: a manual count for coverage, the median value for a requirement. */
  byState: Record<string, number>;
  /** Per-state manual count behind the value. */
  nByState: Record<string, number>;
  href: string;
  /** Where a state click goes; {state} is replaced. */
  stateHref: string;
  note: string;
};

const RAMP = ["#bfe3ea", "#86c7d4", "#45a8ba", "#1a8296", "#0c5568"];
const NONE = "var(--edge)";

function fmt(v: number, unit: string) {
  const n = Number.isInteger(v) ? String(v) : String(Math.round(v * 100) / 100);
  if (unit === "count") return `${n} manual${v === 1 ? "" : "s"}`;
  if (unit === "ratio") return `${n}:1`;
  if (unit === "%") return `${n}%`;
  if (unit === "cf/acre") return `${Number(n).toLocaleString("en-US")} cf/acre`;
  return `${n} ${unit}`;
}

/** Colour classes: one per distinct value when there are few, otherwise quantiles. */
function classes(vals: number[]) {
  const d = [...new Set(vals)].sort((a, b) => a - b);
  if (d.length <= RAMP.length) {
    const step = d.length > 1 ? (RAMP.length - 1) / (d.length - 1) : 0;
    return { color: (v: number) => RAMP[Math.round(d.indexOf(v) * step)]!, legend: d.map((v) => ({ v, label: null as string | null })) };
  }
  const sorted = [...vals].sort((a, b) => a - b);
  const cuts = [...new Set([1, 2, 3, 4].map((i) => sorted[Math.floor((i * sorted.length) / RAMP.length)]!))];
  const idx = (v: number) => {
    let i = 0;
    while (i < cuts.length && v >= cuts[i]!) i++;
    return i;
  };
  const scale = (RAMP.length - 1) / Math.max(1, cuts.length);
  const color = (v: number) => RAMP[Math.round(idx(v) * scale)]!;
  const lo = [sorted[0]!, ...cuts];
  return { color, legend: lo.map((v, i) => ({ v, label: i === lo.length - 1 ? "≥" : null })) };
}

export function HomeMap({ layers }: { layers: MapLayer[] }) {
  const router = useRouter();
  const [k, setK] = useState(layers[0]!.key);
  const [hover, setHover] = useState<string | null>(null);
  // On touch screens the first tap previews a state and the second opens it.
  const touch = useRef<{ code: string; wasShown: boolean } | null>(null);
  const layer = layers.find((l) => l.key === k)!;
  const cls = useMemo(() => classes(Object.values(layer.byState)), [layer]);
  const f = (v: number) => fmt(v, layer.unit);
  const open = (code: string) => router.push(layer.stateHref.replace("{state}", code));
  const shown = hover && layer.byState[hover] !== undefined ? hover : null;

  return (
    <section aria-labelledby="map-h" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="map-h" className="text-base font-semibold text-ink">{layer.title}</h2>
        <div role="group" aria-label="Map layer" className="flex flex-wrap gap-1 rounded-md border border-edge bg-surface p-1 text-sm">
          {layers.map((l) => (
            <button
              key={l.key}
              type="button"
              aria-pressed={l.key === k}
              onClick={() => {
                setK(l.key);
                setHover(null);
              }}
              className={`rounded px-2.5 py-1.5 font-medium ${l.key === k ? "bg-water-link text-white" : "text-fg-secondary hover:bg-surface-muted"}`}
            >
              {l.tab}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-edge bg-surface">
        <div aria-live="polite" className="flex h-10 items-center gap-3 border-b border-edge px-4 text-sm">
          {shown ? (
            <>
              <span className="font-semibold text-ink">{STATE_CODE_TO_NAME[shown]}</span>
              <span className="num font-semibold text-water-link">{f(layer.byState[shown]!)}</span>
              {layer.unit !== "count" && <span className="text-xs text-fg-muted">median of {layer.nByState[shown]} manual{layer.nByState[shown] === 1 ? "" : "s"}</span>}
              <Link href={layer.stateHref.replace("{state}", shown)} className="ml-auto text-xs font-medium text-water-link underline">
                Open {shown} →
              </Link>
            </>
          ) : hover ? (
            <span className="text-fg-muted">{STATE_CODE_TO_NAME[hover]}: no value read yet</span>
          ) : (
            <span className="text-fg-muted">Point at or tap a state</span>
          )}
        </div>
        <ComposableMap projection="geoAlbersUsa" width={960} height={540} className="h-auto w-full" aria-label={`${layer.title}. Select a state to open it.`}>
          <Geographies geography="/geo/states-10m.json">
            {({ geographies }) =>
              geographies.map((geo) => {
                const code = FIPS_TO_STATE_CODE[String(geo.id).padStart(2, "0")];
                const v = code ? layer.byState[code] : undefined;
                const has = !!code && v !== undefined;
                const name = code ? STATE_CODE_TO_NAME[code] : geo.properties.name;
                const fill = has ? cls.color(v!) : NONE;
                const on = has && hover === code;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    tabIndex={has ? 0 : -1}
                    role={has ? "link" : undefined}
                    aria-label={has ? `${name}: ${f(v!)}` : undefined}
                    onMouseEnter={() => code && setHover(code)}
                    onMouseLeave={() => setHover((h) => (h === code ? null : h))}
                    onFocus={() => code && setHover(code)}
                    onBlur={() => setHover((h) => (h === code ? null : h))}
                    onPointerDown={(e) => {
                      touch.current = e.pointerType === "touch" && code ? { code, wasShown: hover === code } : null;
                    }}
                    onClick={() => {
                      if (!has) return;
                      const t = touch.current;
                      if (t && t.code === code && !t.wasShown) {
                        setHover(code!);
                        return;
                      }
                      open(code!);
                    }}
                    onKeyDown={(e) => {
                      if (has && (e.key === "Enter" || e.key === " ")) {
                        e.preventDefault();
                        open(code!);
                      }
                    }}
                    style={{
                      default: { fill, stroke: on ? "var(--foreground)" : "var(--surface)", strokeWidth: on ? 1.75 : 0.75, outline: "none", cursor: has ? "pointer" : "default", transition: "fill 250ms" },
                      hover: { fill, stroke: has ? "var(--foreground)" : "var(--surface)", strokeWidth: has ? 1.75 : 0.75, outline: "none" },
                      pressed: { fill, stroke: "var(--foreground)", strokeWidth: 2, outline: "none" },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ComposableMap>

      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-fg-muted">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {cls.legend.map((b, i) => (
            <span key={i} className="flex items-center gap-1">
              <span className="inline-block h-3 w-4 rounded-sm" style={{ background: cls.color(b.v) }} />
              <span className="num">{b.label ? `${b.label} ` : ""}{f(b.v)}</span>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-4 rounded-sm border border-edge" style={{ background: NONE }} /> none yet
          </span>
        </div>
        <span>
          {layer.note}{" "}
          <Link href={layer.href} className="font-medium text-water-link underline">
            {layer.unit === "count" ? "All jurisdictions" : "Every value"} →
          </Link>
        </span>
      </div>
    </section>
  );
}
