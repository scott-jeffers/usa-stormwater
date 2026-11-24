"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { SERVICE_LIFE, bridgeFreeboard, compensatoryStorage, designSlr, floorFreeboard, slrAt, tidalTailwater, velocityHead, type Band } from "@/lib/floodplain/engine";
import { WORKED_FLOODPLAIN } from "@/lib/floodplain/example";

type State = {
  bfe: number;
  lowestFloor: number;
  floorFreeboardReq: number;
  ratio: number;
  bands: Band[];
  inFloodway: boolean;
  riseFt: number;
  allowedRiseFt: number;
  bridge: { designWse: number; lowChord: number; V: number; fb: number };
  tide: { mhhw: number; startYear: number; life: number; table: string; riverineTw: number; crown: number };
};

const tableText = (t: Array<[number, number]>) => t.map((r) => r.join(", ")).join("\n");

function exampleState(): State {
  const W = WORKED_FLOODPLAIN;
  return {
    bfe: W.bfe,
    lowestFloor: W.lowestFloor,
    floorFreeboardReq: W.floorFreeboardReq,
    ratio: W.ratio,
    bands: W.bands.map((b) => ({ ...b })),
    inFloodway: false,
    riseFt: W.riseFt,
    allowedRiseFt: W.allowedRiseFt,
    bridge: { ...W.bridge },
    tide: { mhhw: W.tide.mhhw, startYear: W.tide.startYear, life: W.tide.life, table: tableText(W.tide.table), riverineTw: W.tide.riverineTw, crown: 3.0 },
  };
}

const encode = (s: State) => {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  } catch {
    return "";
  }
};
const decode = (h: string): State | null => {
  try {
    const d = exampleState();
    const x = JSON.parse(decodeURIComponent(escape(atob(h))));
    return { ...d, ...x, bridge: { ...d.bridge, ...(x.bridge ?? {}) }, tide: { ...d.tide, ...(x.tide ?? {}) } };
  } catch {
    return null;
  }
};

function parsePairs(text: string): Array<[number, number]> {
  return text
    .split(/\n/)
    .map((l) => l.split(/[,\t ]+/).filter(Boolean).map(Number))
    .filter((p) => p.length >= 2 && p.every(Number.isFinite))
    .map((p) => [p[0]!, p[1]!] as [number, number]);
}

const IN = "h-9 w-full rounded-md border border-edge-strong bg-surface px-2 text-sm tabular-nums focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30";
const CELL = "h-8 w-full min-w-[4.5rem] rounded border border-edge-strong bg-surface px-1.5 text-xs tabular-nums focus:border-water-link focus:outline-none";
const fx = (v: number | null | undefined, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));

function Num({ label, value, onChange, step = 0.1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      <input type="number" inputMode="decimal" step={step} value={Number.isFinite(value) ? +value.toFixed(3) : ""} onChange={(e) => onChange(parseFloat(e.target.value))} className={IN} />
    </label>
  );
}

function Fieldset({ title, children, note }: { title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-3 border-t border-edge pt-4">
      <legend className="pr-2 text-sm font-semibold text-ink">{title}</legend>
      {children}
      {note ? <p className="text-xs text-fg-muted">{note}</p> : null}
    </fieldset>
  );
}

/** Fill and required cut by elevation band, as paired horizontal bars. */
function BandChart({ bands, ratio }: { bands: Band[]; ratio: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const rows = [...bands].sort((a, b) => b.lo - a.lo);
  const max = Math.max(1, ...rows.flatMap((b) => [b.fillCf * ratio, b.cutCf]));
  const W = 640, L = 96, R = 70, rowH = 34, H = rows.length * rowH + 24;
  const sx = (v: number) => (v / max) * (W - L - R);
  return (
    <figure className="viz-root space-y-2">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">Required and provided storage by elevation band</span>
        <span className="flex flex-wrap items-center gap-4 text-xs text-fg-secondary">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-sm" style={{ background: "var(--series-2)" }} /> Required ({fx(ratio, 1)} × fill)</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-sm" style={{ background: "var(--series-1)" }} /> Cut provided</span>
        </span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Storage by band: ${rows.map((b) => `${b.lo} to ${b.hi} ft, required ${fx(b.fillCf * ratio)} cf, cut ${fx(b.cutCf)} cf`).join("; ")}`} onPointerLeave={() => setHover(null)}>
          {rows.map((b, i) => {
            const y = 8 + i * rowH;
            const short = b.cutCf + 1e-9 < b.fillCf * ratio;
            return (
              <g key={i} onPointerEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.55}>
                <rect x={0} y={y - 4} width={W} height={rowH} fill="transparent" />
                <text x={L - 8} y={y + 15} textAnchor="end" fontSize={12} fill="var(--fg-secondary)">{fx(b.lo, 1)}–{fx(b.hi, 1)} ft</text>
                <rect x={L} y={y} width={Math.max(sx(b.fillCf * ratio), 1)} height={11} rx={3} fill="var(--series-2)" />
                <rect x={L} y={y + 13} width={Math.max(sx(b.cutCf), 1)} height={11} rx={3} fill="var(--series-1)" />
                <text x={L + Math.max(sx(b.fillCf * ratio), sx(b.cutCf)) + 6} y={y + 16} fontSize={12} fill="var(--fg-secondary)">{short ? "short" : "ok"}</text>
              </g>
            );
          })}
        </svg>
        {hover !== null && rows[hover] && (
          <div className="pointer-events-none absolute right-0 top-0 rounded-md border border-edge-strong bg-surface px-2 py-1 text-xs tabular-nums">
            <div className="font-medium text-ink">{fx(rows[hover]!.lo, 1)}–{fx(rows[hover]!.hi, 1)} ft</div>
            <div>Fill {fx(rows[hover]!.fillCf)} cf; required {fx(rows[hover]!.fillCf * ratio)} cf</div>
            <div>Cut {fx(rows[hover]!.cutCf)} cf</div>
          </div>
        )}
      </div>
    </figure>
  );
}

export function FloodplainCalculator() {
  const [s, setS] = useState<State>(exampleState);
  const [copied, setCopied] = useState(false);
  const loaded = useRef(false);
  useEffect(() => {
    const h = window.location.hash.slice(1);
    if (h) {
      const st = decode(h);
      if (st) queueMicrotask(() => setS(st));
    }
    loaded.current = true;
  }, []);
  useEffect(() => {
    if (!loaded.current) return;
    const t = setTimeout(() => window.history.replaceState(null, "", `#${encode(s)}`), 300);
    return () => clearTimeout(t);
  }, [s]);

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((x) => ({ ...x, [k]: v }));
  const setBridge = (p: Partial<State["bridge"]>) => setS((x) => ({ ...x, bridge: { ...x.bridge, ...p } }));
  const setTide = (p: Partial<State["tide"]>) => setS((x) => ({ ...x, tide: { ...x.tide, ...p } }));
  const setBand = (i: number, p: Partial<Band>) => set("bands", s.bands.map((b, j) => (j === i ? { ...b, ...p } : b)));

  const r = useMemo(() => {
    const table = parsePairs(s.tide.table);
    const slr = designSlr(s.tide.startYear, s.tide.life, table);
    return {
      comp: compensatoryStorage(s.bands, s.ratio),
      floor: floorFreeboard(s.lowestFloor, s.bfe, s.floorFreeboardReq),
      bridge: bridgeFreeboard(s.bridge.lowChord, s.bridge.designWse, s.bridge.V, s.bridge.fb),
      table,
      slr,
      slrStart: slrAt(s.tide.startYear, table),
      tw: tidalTailwater(s.tide.mhhw, slr, s.tide.riverineTw),
    };
  }, [s]);

  const allowed = s.inFloodway ? 0.01 : s.allowedRiseFt;
  const riseOk = s.inFloodway ? s.riseFt < 0.01 : s.riseFt <= s.allowedRiseFt;
  const checks: Array<{ ok: boolean | null; text: string; clause: string }> = [
    { ok: r.floor.ok, text: `Lowest floor is ${fx(r.floor.provided, 2)} ft above the base flood elevation; ${fx(r.floor.required, 1)} ft required.`, clause: "8.8.1" },
    { ok: r.comp.ok, text: r.comp.ok ? `Cut meets ${fx(s.ratio, 1)}:1 in every band (${fx(r.comp.cut)} cf for ${fx(r.comp.fill)} cf of fill).` : `Cut is short in ${r.comp.bands.filter((b) => !b.ok).length} band(s); cut in another band does not count.`, clause: "8.8.3" },
    { ok: riseOk, text: s.inFloodway ? (riseOk ? "No measurable rise in the floodway." : `A ${fx(s.riseFt, 2)} ft rise in a floodway is not allowed.`) : `Rise ${fx(s.riseFt, 2)} ft against ${fx(allowed, 2)} ft allowed in the flood fringe.`, clause: "8.8.4" },
    { ok: r.bridge.ok, text: `Bridge low chord is ${fx(r.bridge.provided, 2)} ft above the design water surface; ${fx(r.bridge.required, 2)} ft required (${r.bridge.governing} governs; velocity head ${fx(velocityHead(s.bridge.V), 2)} ft).`, clause: "8.9.1" },
    { ok: null, text: `Sea-level-rise allowance ${fx(r.slr, 2)} ft over ${fx(s.tide.life)} years from ${s.tide.startYear}; design tailwater ${fx(r.tw.tw, 2)} ft (${r.tw.governs === "tide" ? "tide governs" : "riverine stage governs"}).`, clause: "8.10.2" },
    { ok: s.tide.crown >= r.tw.tw ? true : null, text: s.tide.crown >= r.tw.tw ? "The outfall crown stays above the design tailwater." : `The outfall crown (${fx(s.tide.crown, 2)} ft) is below the design tailwater: provide backflow prevention and route the HGL with the gate closed.`, clause: "8.10.3" },
  ];

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Inputs">
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => setS(exampleState())} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">Load worked example</button>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">{copied ? "Link copied" : "Copy link to this design"}</button>
        </div>
        <Fieldset title="Building (8.8.1)" note="Elevations in feet on one datum (NAVD88 recommended).">
          <div className="grid grid-cols-3 gap-2">
            <Num label="Base flood elevation" value={s.bfe} onChange={(v) => set("bfe", v)} />
            <Num label="Lowest floor" value={s.lowestFloor} onChange={(v) => set("lowestFloor", v)} />
            <Num label="Freeboard required (ft)" value={s.floorFreeboardReq} step={0.5} onChange={(v) => set("floorFreeboardReq", v)} />
          </div>
        </Fieldset>
        <Fieldset title="Fill and compensatory storage (8.8.3)" note="One row per elevation band between normal water and the base flood elevation.">
          <div className="w-40"><Num label="Ratio (cut : fill)" value={s.ratio} onChange={(v) => set("ratio", v)} /></div>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Elevation bands">
            <table className="data-table text-xs">
              <thead><tr><th>From (ft)</th><th>To (ft)</th><th>Fill (cf)</th><th>Cut (cf)</th><th className="relative"><span className="sr-only">Remove</span></th></tr></thead>
              <tbody>
                {s.bands.map((b, i) => (
                  <tr key={i}>
                    {(["lo", "hi", "fillCf", "cutCf"] as const).map((k) => (
                      <td key={k}><input type="number" step={k === "lo" || k === "hi" ? 0.5 : 50} aria-label={`Band ${i + 1} ${k === "lo" ? "lower elevation" : k === "hi" ? "upper elevation" : k === "fillCf" ? "fill" : "cut"}`} value={Number.isFinite(b[k]) ? b[k] : ""} onChange={(e) => setBand(i, { [k]: parseFloat(e.target.value) } as Partial<Band>)} className={CELL} /></td>
                    ))}
                    <td><button type="button" aria-label={`Remove band ${i + 1}`} onClick={() => set("bands", s.bands.filter((_, j) => j !== i))} className="h-8 w-8 rounded text-fg-muted hover:bg-surface-muted">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" onClick={() => { const top = s.bands.reduce((a, b) => Math.max(a, b.hi), s.bfe - 1); set("bands", [...s.bands, { lo: top, hi: top + 1, fillCf: 0, cutCf: 0 }]); }} className="h-8 text-sm font-medium text-water-link hover:underline">+ Add band</button>
        </Fieldset>
        <Fieldset title="Rise (8.8.4)" note="From a hydraulic model of the reach with and without the project.">
          <div className="grid grid-cols-3 items-end gap-2">
            <Num label="Computed rise (ft)" value={s.riseFt} step={0.01} onChange={(v) => set("riseFt", v)} />
            <Num label="Allowed in fringe (ft)" value={s.allowedRiseFt} step={0.1} onChange={(v) => set("allowedRiseFt", v)} />
            <label className="flex items-center gap-2 pb-2 text-xs text-fg-secondary"><input type="checkbox" checked={s.inFloodway} onChange={(e) => set("inFloodway", e.target.checked)} /> In the floodway</label>
          </div>
        </Fieldset>
        <Fieldset title="Bridge (8.9.1)">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Num label="Design water surface" value={s.bridge.designWse} onChange={(v) => setBridge({ designWse: v })} />
            <Num label="Low chord" value={s.bridge.lowChord} onChange={(v) => setBridge({ lowChord: v })} />
            <Num label="Velocity (ft/s)" value={s.bridge.V} step={0.5} onChange={(v) => setBridge({ V: v })} />
            <Num label="Freeboard (ft)" value={s.bridge.fb} step={0.5} onChange={(v) => setBridge({ fb: v })} />
          </div>
        </Fieldset>
        <Fieldset title="Tidal outfall (8.10)" note="Projection: year and relative sea-level rise (ft) at the tide station, one pair per line, from NOAA's scenarios or the state's adopted projection.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Num label="MHHW" value={s.tide.mhhw} onChange={(v) => setTide({ mhhw: v })} />
            <Num label="Start year" value={s.tide.startYear} step={1} onChange={(v) => setTide({ startYear: v })} />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-muted">Service life</span>
              <select value={String(s.tide.life)} onChange={(e) => setTide({ life: parseFloat(e.target.value) })} className={IN}>
                {Object.entries(SERVICE_LIFE).map(([k, v]) => <option key={k} value={v}>{k} ({v} yr)</option>)}
              </select>
            </label>
            <Num label="Riverine tailwater" value={s.tide.riverineTw} onChange={(v) => setTide({ riverineTw: v })} />
            <Num label="Outfall crown" value={s.tide.crown} onChange={(v) => setTide({ crown: v })} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-muted">Year, rise (ft)</span>
            <textarea rows={4} value={s.tide.table} onChange={(e) => setTide({ table: e.target.value })} className={`${IN} h-auto py-1 font-mono text-xs`} />
          </label>
        </Fieldset>
      </form>

      <section aria-labelledby="fres" className="min-w-0 space-y-6">
        <h2 id="fres" className="text-lg font-semibold text-ink">Results</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Floor freeboard", `${fx(r.floor.provided, 2)} ft`, `${fx(r.floor.required, 1)} ft required`],
            ["Compensatory cut", `${fx(r.comp.cut)} cf`, `${fx(r.comp.required)} cf required`],
            ["Bridge freeboard", `${fx(r.bridge.provided, 2)} ft`, `${fx(r.bridge.required, 2)} ft required`],
            ["Design tailwater", `${fx(r.tw.tw, 2)} ft`, `MHHW + ${fx(r.slr, 2)} ft rise`],
          ].map(([k, v, sub]) => (
            <div key={k} className="space-y-0.5">
              <dt className="text-xs text-fg-muted">{k}</dt>
              <dd className="text-xl font-semibold tabular-nums text-ink">{v}</dd>
              <dd className="text-xs text-fg-muted">{sub}</dd>
            </div>
          ))}
        </dl>
        <BandChart bands={s.bands} ratio={s.ratio} />
        <section aria-label="Checks against the model manual" className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">Checks against the model manual</h2>
          <ul className="space-y-1 text-sm">
            {checks.map((it, i) => (
              <li key={i} className="flex gap-2">
                <span aria-hidden className={it.ok === false ? "font-bold text-foreground" : it.ok ? "text-water-link" : "text-fg-faint"}>{it.ok === false ? "!" : it.ok ? "✓" : "•"}</span>
                <span><span className="sr-only">{it.ok === false ? "Check: " : it.ok ? "Meets: " : "Note: "}</span>{it.text}{" "}<a href={`/manual/#c-${it.clause.replace(/\./g, "-")}`} className="text-xs text-water-link underline">§{it.clause}</a></span>
              </li>
            ))}
          </ul>
        </section>
        <p className="text-sm text-fg-secondary">
          Use the design tailwater of {fx(r.tw.tw, 2)} ft as the outfall tailwater in the <Link href="/tools/hydraulics/" className="text-water-link underline">hydraulics calculator</Link>&rsquo;s HGL tab, whose tidal option applies the same rule.
        </p>
      </section>
    </div>
  );
}
