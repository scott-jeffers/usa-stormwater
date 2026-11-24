"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CULVERT_INLETS,
  SPLASH_OVER_2FT,
  criticalDepth,
  culvert,
  curbOnGrade,
  curbSag,
  froude,
  fullPipe,
  geometry,
  grateOnGrade,
  grateSag,
  gutterForFlow,
  hglRun,
  inletControlHW,
  normalDepth,
  requiredDiameter,
  standardSize,
  type Bench,
  type DrainRun,
  type Section,
} from "@/lib/hydraulics/engine";
import { WORKED_CONVEYANCE, runConveyanceExample } from "@/lib/hydraulics/example";
import { tidalTailwater } from "@/lib/floodplain/engine";

/* ---------- State ---------- */

type Tab = "pipe" | "channel" | "inlet" | "culvert" | "hgl";
type PipeRow = { id: string; dIn: number; n: number; L: number; invUp: number; invDn: number; Q: number };
type StructRow = { id: string; rim: number; bench: Bench; angle: number; surfaceQ: number };
type InletKind = "curbGrade" | "grateGrade" | "curbSag" | "grateSag";

type State = {
  tab: Tab;
  pipe: { Q: number; dIn: number; n: number; S: number; minIn: number };
  channel: { b: number; z1: number; z2: number; n: number; S: number; Q: number; permShear: number; depth: number };
  inlet: { kind: InletKind; Q: number; Sx: number; SL: number; n: number; W: number; aIn: number; L: number; Wg: number; Vo: number; hIn: number; openRatio: number; clog: number; allowT: number };
  culvert: { shape: "circle" | "box"; dIn: number; b: number; h: number; inlet: string; Q: number; barrels: number; n: number; L: number; S: number; TW: number; allowHW: number };
  hgl: { pipes: PipeRow[]; structures: StructRow[]; tailwater: number; tidal?: boolean; mhhw?: number; slr?: number };
};

function exampleState(tab: Tab = "pipe"): State {
  const W = WORKED_CONVEYANCE;
  const ex = runConveyanceExample();
  return {
    tab,
    pipe: { Q: ex.run.pipes[1]!.Q, dIn: 18, n: 0.013, S: Math.round(ex.sizing[1]!.S * 10000) / 10000, minIn: 15 },
    channel: { ...(W.channel.section as Extract<Section, { kind: "trap" }>), n: W.channel.n, S: W.channel.S, Q: W.channel.Q100, permShear: 0, depth: 3.25 },
    inlet: { kind: "curbGrade", Q: W.inlet1.Q, Sx: W.gutter.Sx, SL: W.gutter.SL, n: W.gutter.n, W: W.gutter.W!, aIn: 2, L: W.inlet1.L, Wg: 2, Vo: 8.2, hIn: 6, openRatio: 0.8, clog: 50, allowT: W.allowableSpreadFt },
    culvert: { shape: "circle", dIn: 48, b: 6, h: 4, inlet: "rcp_groove_headwall", Q: W.culvert.Q25, barrels: 1, n: W.culvert.n, L: W.culvert.L, S: W.culvert.S, TW: W.culvert.TW25, allowHW: W.culvert.allowableHW },
    hgl: {
      pipes: ex.run.pipes.map((p) => ({ id: p.id, dIn: Math.round(p.d * 12), n: p.n, L: p.L, invUp: p.invUp, invDn: p.invDn, Q: p.Q })),
      structures: ex.run.structures.map((s) => ({ id: s.id, rim: s.rim, bench: s.bench, angle: s.angle, surfaceQ: Math.round(s.surfaceQ * 100) / 100 })),
      tailwater: ex.run.tailwater,
    },
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
    const base = exampleState();
    const v = JSON.parse(decodeURIComponent(escape(atob(h)))) as Partial<State>;
    return {
      ...base,
      ...v,
      pipe: { ...base.pipe, ...v.pipe },
      channel: { ...base.channel, ...v.channel },
      inlet: { ...base.inlet, ...v.inlet },
      culvert: { ...base.culvert, ...v.culvert },
      hgl: { ...base.hgl, ...v.hgl },
    };
  } catch {
    return null;
  }
};

/* ---------- UI atoms ---------- */

const IN = "h-9 w-full rounded-md border border-edge-strong bg-surface px-2 text-sm tabular-nums focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30";
const CELL = "h-8 w-full min-w-[4.5rem] rounded border border-edge-strong bg-surface px-1.5 text-xs tabular-nums focus:border-water-link focus:outline-none";
const fx = (v: number | null | undefined, d = 2) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toFixed(d));

function Num({ label, value, onChange, step = 0.1, help }: { label: string; value: number; onChange: (v: number) => void; step?: number; help?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-fg-muted" title={help}>{label}</span>
      <input type="number" inputMode="decimal" step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(parseFloat(e.target.value))} className={IN} />
    </label>
  );
}

function Fieldset({ title, children, note }: { title: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <fieldset className="space-y-3 border-t border-edge pt-4">
      <legend className="pr-2 text-sm font-semibold text-ink">{title}</legend>
      {children}
      {note ? <p className="text-xs text-fg-muted">{note}</p> : null}
    </fieldset>
  );
}

type Check = { ok: boolean | null; text: string; clause: string };

function Checks({ items }: { items: Check[] }) {
  return (
    <section aria-label="Checks against the model manual" className="space-y-2">
      <h2 className="text-sm font-semibold text-ink">Checks against the model manual</h2>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className={it.ok === false ? "font-bold text-foreground" : it.ok ? "text-water-link" : "text-fg-faint"}>{it.ok === false ? "!" : it.ok ? "✓" : "•"}</span>
            <span>
              <span className="sr-only">{it.ok === false ? "Check: " : it.ok ? "Meets: " : "Note: "}</span>
              {it.text}{" "}
              <a href={`/manual/#c-${it.clause.replace(/\./g, "-")}`} className="text-xs text-water-link underline">§{it.clause}</a>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Stat({ label, value, unit, strong }: { label: string; value: string; unit?: string; strong?: boolean }) {
  return (
    <div className="rounded-md border border-edge bg-surface px-3 py-2">
      <div className="text-xs text-fg-muted">{label}</div>
      <div className={`num text-lg ${strong ? "font-semibold text-ink" : "text-foreground"}`}>
        {value}
        {unit ? <span className="ml-1 text-xs font-normal text-fg-muted">{unit}</span> : null}
      </div>
    </div>
  );
}

function niceTicks(lo: number, hi: number, count = 5): number[] {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const raw = span / count, mag = 10 ** Math.floor(Math.log10(raw)), n = raw / mag;
  const step = (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) out.push(Math.round(t * 1000) / 1000);
  return out;
}

/* ---------- Charts ---------- */

type Series = { name: string; color: string; pts: Array<[number, number]>; dash?: boolean };

/** Line chart with a crosshair tooltip. x and y in data units. */
function LineChart({ title, series, xLabel, yLabel, refs = [], marks = [], height = 240, width = 640, ariaLabel }: {
  title: string; series: Series[]; xLabel: string; yLabel: string; height?: number; width?: number; ariaLabel: string;
  refs?: Array<{ y: number; label: string }>; marks?: Array<{ x: number; label: string }>;
}) {
  const ref = useRef<SVGSVGElement>(null);
  const [hx, setHx] = useState<number | null>(null);
  const W = width, H = height, P = { l: 52, r: 16, t: 14, b: 32 };
  const all = series.flatMap((s) => s.pts);
  if (!all.length) return null;
  const xs = all.map((p) => p[0]), ys = [...all.map((p) => p[1]), ...refs.map((r) => r.y)];
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = (y1 - y0) * 0.08 || 1;
  y0 -= pad; y1 += pad;
  const sx = (x: number) => P.l + ((x - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
  const sy = (y: number) => H - P.b - ((y - y0) / (y1 - y0)) * (H - P.t - P.b);
  const path = (pts: Array<[number, number]>) => pts.map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join("");
  const at = (s: Series, x: number) => {
    const p = s.pts;
    for (let i = 1; i < p.length; i++) if (p[i]![0] >= x && p[i - 1]![0] <= x) {
      const t = (x - p[i - 1]![0]) / (p[i]![0] - p[i - 1]![0] || 1);
      return p[i - 1]![1] + t * (p[i]![1] - p[i - 1]![1]);
    }
    return null;
  };
  const onMove = (e: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const x = x0 + ((((e.clientX - box.left) / box.width) * W - P.l) / (W - P.l - P.r)) * (x1 - x0);
    setHx(x >= x0 && x <= x1 ? x : null);
  };
  return (
    <figure className="viz-root space-y-2">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{title}</span>
        <span className="flex flex-wrap items-center gap-4 text-xs text-fg-secondary">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className="inline-block w-5" style={{ borderTop: `2px ${s.dash ? "dashed" : "solid"} ${s.color}` }} /> {s.name}
            </span>
          ))}
        </span>
      </figcaption>
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" role="img" aria-label={ariaLabel} onPointerMove={onMove} onPointerLeave={() => setHx(null)}>
          {niceTicks(y0, y1).map((t) => (
            <g key={t}>
              <line x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} stroke="var(--edge)" strokeWidth={1} />
              <text x={P.l - 6} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--fg-muted)">{t}</text>
            </g>
          ))}
          {niceTicks(x0, x1, 6).map((t) => (
            <text key={t} x={sx(t)} y={H - P.b + 16} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">{t}</text>
          ))}
          <text x={W - P.r} y={H - 4} textAnchor="end" fontSize={11} fill="var(--fg-muted)">{xLabel}</text>
          <text x={4} y={12} fontSize={11} fill="var(--fg-muted)">{yLabel}</text>
          {refs.map((r) => (
            <g key={r.label}>
              <line x1={P.l} x2={W - P.r} y1={sy(r.y)} y2={sy(r.y)} stroke="var(--fg-muted)" strokeDasharray="4 4" strokeWidth={1} />
              <text x={P.l + 6} y={sy(r.y) - 4} fontSize={11} fill="var(--fg-secondary)">{r.label}</text>
            </g>
          ))}
          {marks.map((m) => (
            <g key={m.label}>
              <line x1={sx(m.x)} x2={sx(m.x)} y1={P.t} y2={H - P.b} stroke="var(--edge-strong)" strokeWidth={1} />
              <text x={sx(m.x) + 4} y={P.t + 10} fontSize={11} fill="var(--fg-secondary)">{m.label}</text>
            </g>
          ))}
          {series.map((s) => (
            <path key={s.name} d={path(s.pts)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash ? "5 4" : undefined} strokeLinejoin="round" />
          ))}
          {hx !== null && (
            <g>
              <line x1={sx(hx)} x2={sx(hx)} y1={P.t} y2={H - P.b} stroke="var(--fg-muted)" strokeWidth={1} />
              {series.map((s) => {
                const y = at(s, hx);
                return y === null ? null : <circle key={s.name} cx={sx(hx)} cy={sy(y)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />;
              })}
            </g>
          )}
        </svg>
        {hx !== null && (
          <div className="pointer-events-none absolute top-1 rounded-md border border-edge-strong bg-surface px-2 py-1 text-xs tabular-nums" style={{ left: `${Math.min(68, (sx(hx) / W) * 100)}%` }}>
            <div className="text-fg-muted">{xLabel} {hx.toFixed(1)}</div>
            {series.map((s) => {
              const y = at(s, hx);
              return y === null ? null : <div key={s.name}>{s.name} {y.toFixed(2)}</div>;
            })}
          </div>
        )}
      </div>
    </figure>
  );
}

/* ---------- Panels ---------- */

function PipePanel({ s, set }: { s: State["pipe"]; set: (p: Partial<State["pipe"]>) => void }) {
  const r = useMemo(() => {
    const D = s.dIn / 12;
    const sec: Section = { kind: "circle", d: D };
    const dReq = requiredDiameter(s.Q, s.n, s.S);
    const full = fullPipe(D, s.n, s.S);
    const yn = normalDepth(sec, s.Q, s.n, s.S);
    const yc = criticalDepth(sec, s.Q);
    const V = yn === null ? s.Q / geometry(sec, D).A : s.Q / geometry(sec, yn).A;
    return { dReq, std: standardSize(dReq, s.minIn), full, yn, yc, V, fr: yn === null ? null : froude(sec, s.Q, yn) };
  }, [s]);
  const checks: Check[] = [
    { ok: s.dIn >= 15, text: s.dIn >= 15 ? `${s.dIn} in meets the 15 in minimum for public storm drains.` : `${s.dIn} in is below the 15 in minimum (12 in only for inlet leads under 50 ft).`, clause: "8.3.1" },
    { ok: r.full.Q >= s.Q, text: r.full.Q >= s.Q ? `Full-flow capacity ${fx(r.full.Q)} cfs carries the ${s.Q} cfs design flow.` : `Full-flow capacity ${fx(r.full.Q)} cfs is less than ${s.Q} cfs: the pipe surcharges; check the HGL (8.4) or use ${r.std} in.`, clause: "8.3.2" },
    { ok: r.full.V >= 3, text: r.full.V >= 3 ? `Full-flow velocity ${fx(r.full.V, 1)} ft/s meets the 3 ft/s self-cleaning minimum.` : `Full-flow velocity ${fx(r.full.V, 1)} ft/s is below 3 ft/s${r.full.V >= 2.5 ? " (2.5 ft/s needs agency approval)" : ""}: steepen the pipe.`, clause: "8.3.3" },
    { ok: r.V <= 15, text: r.V <= 15 ? `Velocity at the design flow, ${fx(r.V, 1)} ft/s, is within 15 ft/s.` : `Velocity ${fx(r.V, 1)} ft/s exceeds 15 ft/s: design for abrasion and dissipate energy at the outlet.`, clause: "8.3.4" },
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Pipe inputs">
        <Fieldset title="Circular pipe" note="Manning's equation; n = 0.013 for concrete and smooth-interior plastic (8.3.2).">
          <div className="grid grid-cols-2 gap-2">
            <Num label="Design flow (cfs)" value={s.Q} onChange={(v) => set({ Q: v })} />
            <Num label="Slope (ft/ft)" value={s.S} step={0.001} onChange={(v) => set({ S: v })} />
            <Num label="Manning n" value={s.n} step={0.001} onChange={(v) => set({ n: v })} />
            <Num label="Pipe diameter (in)" value={s.dIn} step={3} onChange={(v) => set({ dIn: v })} />
            <Num label="Minimum size (in)" value={s.minIn} step={3} onChange={(v) => set({ minIn: v })} />
          </div>
        </Fieldset>
      </form>
      <section aria-label="Pipe results" className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Diameter for full flow" value={fx(r.dReq * 12, 1)} unit="in" />
          <Stat label="Smallest standard size" value={String(r.std)} unit="in" strong />
          <Stat label="Full-flow capacity" value={fx(r.full.Q)} unit="cfs" />
          <Stat label="Full-flow velocity" value={fx(r.full.V)} unit="ft/s" />
          <Stat label="Normal depth" value={r.yn === null ? "surcharged" : fx(r.yn)} unit={r.yn === null ? undefined : `ft (${fx((r.yn / (s.dIn / 12)) * 100, 0)}% full)`} />
          <Stat label="Velocity at design flow" value={fx(r.V)} unit="ft/s" />
          <Stat label="Critical depth" value={fx(r.yc)} unit="ft" />
          <Stat label="Flow regime" value={r.fr === null ? "pressure" : r.fr > 1 ? "supercritical" : "subcritical"} unit={r.fr === null ? undefined : `Fr ${fx(r.fr)}`} />
        </div>
        <Checks items={checks} />
      </section>
    </div>
  );
}

function ChannelPanel({ s, set }: { s: State["channel"]; set: (p: Partial<State["channel"]>) => void }) {
  const r = useMemo(() => {
    const sec: Section = { kind: "trap", b: s.b, z1: s.z1, z2: s.z2 };
    const yn = normalDepth(sec, s.Q, s.n, s.S);
    if (yn === null) return null;
    const g = geometry(sec, yn);
    const yc = criticalDepth(sec, s.Q);
    const curve: Array<[number, number]> = Array.from({ length: 41 }, (_, i) => {
      const q = (s.Q * 1.5 * (i + 1)) / 41;
      return [q, normalDepth(sec, q, s.n, s.S) ?? 0];
    });
    return { yn, V: s.Q / g.A, T: g.T, fr: froude(sec, s.Q, yn), yc, shear: 62.4 * yn * s.S, curve };
  }, [s]);
  if (!r) return <p className="text-fg-muted">Enter a positive slope and flow.</p>;
  const checks: Check[] = [
    { ok: r.fr < 0.8 || r.fr > 1.2, text: r.fr < 0.8 || r.fr > 1.2 ? `Froude number ${fx(r.fr)} is clear of the unstable 0.8–1.2 band.` : `Froude number ${fx(r.fr)} is near critical (0.8–1.2): change the section or slope.`, clause: "8.6.1" },
    { ok: s.depth >= r.yn + 1, text: s.depth >= r.yn + 1 ? `A ${s.depth} ft channel leaves ${fx(s.depth - r.yn)} ft of freeboard (1 ft required).` : `A ${s.depth} ft channel leaves ${fx(s.depth - r.yn)} ft of freeboard; at least ${fx(r.yn + 1)} ft of depth is needed.`, clause: "8.6.2" },
    s.permShear > 0
      ? { ok: r.shear <= s.permShear, text: `Design shear ${fx(r.shear)} lb/sq ft ${r.shear <= s.permShear ? "is within" : "exceeds"} the lining's ${s.permShear} lb/sq ft.`, clause: "8.6.3" }
      : { ok: null, text: `Design shear is ${fx(r.shear)} lb/sq ft; enter the lining's permissible shear (HEC-15 or the product's tested value) to check it.`, clause: "8.6.3" },
    { ok: Math.min(s.z1, s.z2) >= 3 ? true : null, text: Math.min(s.z1, s.z2) >= 3 ? "Side slopes are 3:1 or flatter." : "Side slopes steeper than 3:1 are not suitable for mowed grass channels.", clause: "8.6.4" },
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Channel inputs">
        <Fieldset title="Trapezoidal channel" note="Bottom width 0 gives a V; side slopes 0 give a rectangle. Use n for the lining as maintained.">
          <div className="grid grid-cols-3 gap-2">
            <Num label="Bottom (ft)" value={s.b} step={0.5} onChange={(v) => set({ b: v })} />
            <Num label="Left z:1" value={s.z1} step={0.5} onChange={(v) => set({ z1: v })} />
            <Num label="Right z:1" value={s.z2} step={0.5} onChange={(v) => set({ z2: v })} />
            <Num label="Manning n" value={s.n} step={0.001} onChange={(v) => set({ n: v })} />
            <Num label="Slope (ft/ft)" value={s.S} step={0.001} onChange={(v) => set({ S: v })} />
            <Num label="Flow (cfs)" value={s.Q} step={1} onChange={(v) => set({ Q: v })} />
            <Num label="Channel depth (ft)" value={s.depth} step={0.25} onChange={(v) => set({ depth: v })} />
            <Num label="Permissible shear" value={s.permShear} step={0.1} onChange={(v) => set({ permShear: v })} help="lb/sq ft; 0 to skip" />
          </div>
        </Fieldset>
      </form>
      <section aria-label="Channel results" className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Normal depth" value={fx(r.yn)} unit="ft" strong />
          <Stat label="Velocity" value={fx(r.V)} unit="ft/s" />
          <Stat label="Top width" value={fx(r.T, 1)} unit="ft" />
          <Stat label="Froude number" value={fx(r.fr)} />
          <Stat label="Critical depth" value={fx(r.yc)} unit="ft" />
          <Stat label="Shear stress" value={fx(r.shear)} unit="lb/sq ft" />
          <Stat label="Depth with freeboard" value={fx(r.yn + 1)} unit="ft" />
        </div>
        <Checks items={checks} />
        <LineChart
          title="Rating curve"
          ariaLabel={`Normal depth against flow; ${fx(r.yn)} ft at ${s.Q} cfs`}
          series={[{ name: "Normal depth", color: "var(--series-1)", pts: r.curve }]}
          refs={[{ y: s.depth, label: "Channel depth" }]}
          marks={[{ x: s.Q, label: "Design flow" }]}
          xLabel="cfs"
          yLabel="ft"
        />
      </section>
    </div>
  );
}

const INLET_LABEL: Record<InletKind, string> = {
  curbGrade: "Curb opening on grade",
  grateGrade: "Grate on grade",
  curbSag: "Curb opening in a sag",
  grateSag: "Grate in a sag",
};

function InletPanel({ s, set }: { s: State["inlet"]; set: (p: Partial<State["inlet"]>) => void }) {
  const a = s.aIn / 12;
  const g = { Sx: s.Sx, SL: s.SL, n: s.n, W: a > 0 ? s.W : 0, a };
  const r = useMemo(() => {
    const gut = gutterForFlow(g, s.Q);
    if (s.kind === "curbGrade") return { gut, curb: curbOnGrade(g, s.Q, s.L) };
    if (s.kind === "grateGrade") return { gut, grate: grateOnGrade(g, s.Q, s.Wg, s.L, s.Vo) };
    if (s.kind === "curbSag") return { gut, sag: curbSag(s.Q, s.L, s.hIn / 12, a, s.W), opening: s.hIn / 12 };
    const keep = 1 - s.clog / 100;
    return { gut, sag: grateSag(s.Q, (s.L + 2 * s.Wg) * keep, s.L * s.Wg * s.openRatio * keep), opening: Infinity };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);
  const sagT = r.sag ? r.sag.d / s.Sx : null;
  const checks: Check[] = [];
  if (s.kind === "curbGrade" || s.kind === "grateGrade")
    checks.push({ ok: r.gut.T <= s.allowT, text: `Spread ${fx(r.gut.T, 1)} ft ${r.gut.T <= s.allowT ? "is within" : "exceeds"} the ${s.allowT} ft allowed.`, clause: "8.2.1" });
  if (sagT !== null) {
    checks.push({ ok: sagT <= s.allowT, text: `Ponded spread at the sag ${fx(sagT, 1)} ft ${sagT <= s.allowT ? "is within" : "exceeds"} the ${s.allowT} ft allowed (use the 50-year flow where the sag has no overflow path, 8.1.2).`, clause: "8.2.1" });
    if (s.kind === "curbSag") checks.push({ ok: r.sag!.d + a <= r.opening!, text: `Depth at the curb ${fx(r.sag!.d + a)} ft ${r.sag!.d + a <= r.opening! ? "stays below" : "exceeds"} the ${fx(r.opening!)} ft opening (${r.sag!.control} flow).`, clause: "8.2.4" });
    if (s.kind === "grateSag") checks.push({ ok: s.clog >= 50, text: s.clog >= 50 ? `Grate perimeter and area are reduced ${s.clog}% for clogging.` : `Sag grates are designed 50% clogged; ${s.clog}% is assumed here.`, clause: "8.2.4" });
  }
  if (r.curb) checks.push({ ok: null, text: `Bypass of ${fx(r.curb.Qb)} cfs carries to the next inlet downstream.`, clause: "8.2.3" });
  if (r.grate) checks.push({ ok: null, text: `Bypass of ${fx(r.grate.Qb)} cfs carries to the next inlet downstream. Use a bicycle-safe grate where bicycles travel.`, clause: "8.2.5" });
  const onGrade = s.kind === "curbGrade" || s.kind === "grateGrade";
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Gutter and inlet inputs">
        <Fieldset title="Gutter" note="HEC-22 eq. 5.2–5.8. Depression 0 gives a uniform gutter. n = 0.016 for pavement with a concrete gutter.">
          <div className="grid grid-cols-3 gap-2">
            <Num label="Gutter flow (cfs)" value={s.Q} onChange={(v) => set({ Q: v })} />
            <Num label="Cross slope" value={s.Sx} step={0.005} onChange={(v) => set({ Sx: v })} />
            <Num label="Long. slope" value={s.SL} step={0.005} onChange={(v) => set({ SL: v })} />
            <Num label="Manning n" value={s.n} step={0.001} onChange={(v) => set({ n: v })} />
            <Num label="Gutter width (ft)" value={s.W} step={0.5} onChange={(v) => set({ W: v })} />
            <Num label="Depression (in)" value={s.aIn} step={0.5} onChange={(v) => set({ aIn: v })} />
            <Num label="Allowed spread (ft)" value={s.allowT} step={1} onChange={(v) => set({ allowT: v })} />
          </div>
        </Fieldset>
        <Fieldset title="Inlet">
          <select aria-label="Inlet type" value={s.kind} onChange={(e) => set({ kind: e.target.value as InletKind })} className={IN}>
            {Object.entries(INLET_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2">
            <Num label="Length (ft)" value={s.L} step={0.5} onChange={(v) => set({ L: v })} />
            {(s.kind === "grateGrade" || s.kind === "grateSag") && <Num label="Grate width (ft)" value={s.Wg} step={0.5} onChange={(v) => set({ Wg: v })} />}
            {s.kind === "grateGrade" && <Num label="Splash-over V (ft/s)" value={s.Vo} step={0.1} onChange={(v) => set({ Vo: v })} help="HEC-22 Figure 7.8" />}
            {s.kind === "curbSag" && <Num label="Opening height (in)" value={s.hIn} step={0.5} onChange={(v) => set({ hIn: v })} />}
            {s.kind === "grateSag" && <Num label="Opening ratio" value={s.openRatio} step={0.05} onChange={(v) => set({ openRatio: v })} help="HEC-22 Table 7.5" />}
            {s.kind === "grateSag" && <Num label="Clogging (%)" value={s.clog} step={5} onChange={(v) => set({ clog: v })} />}
          </div>
          {s.kind === "grateGrade" && (
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(SPLASH_OVER_2FT).map(([k, v]) => (
                <button key={k} type="button" onClick={() => set({ Vo: v, L: 2 })} className="rounded border border-edge px-2 py-1 hover:bg-surface-muted">{k}, 2 ft: {v} ft/s</button>
              ))}
            </div>
          )}
        </Fieldset>
      </form>
      <section aria-label="Inlet results" className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {onGrade && <Stat label="Spread" value={fx(r.gut.T, 1)} unit="ft" strong />}
          {onGrade && <Stat label="Depth at curb" value={fx(r.gut.d)} unit="ft" />}
          {onGrade && <Stat label="Gutter velocity" value={fx(r.gut.V)} unit="ft/s" />}
          {onGrade && <Stat label="Frontal flow ratio Eo" value={fx(r.curb?.Eo ?? r.grate?.Eo)} />}
          {r.curb && <Stat label="Length for 100%" value={fx(r.curb.LT, 1)} unit="ft" />}
          {r.grate && <Stat label="Rf / Rs" value={`${fx(r.grate.Rf)} / ${fx(r.grate.Rs, 3)}`} />}
          {(r.curb || r.grate) && <Stat label="Efficiency" value={fx((r.curb?.E ?? r.grate?.E ?? 0) * 100, 0)} unit="%" />}
          {(r.curb || r.grate) && <Stat label="Intercepted" value={fx(r.curb?.Qi ?? r.grate?.Qi)} unit="cfs" strong />}
          {(r.curb || r.grate) && <Stat label="Bypass" value={fx(r.curb?.Qb ?? r.grate?.Qb)} unit="cfs" />}
          {r.sag && <Stat label="Ponded depth" value={fx(r.sag.d, 3)} unit="ft" strong />}
          {r.sag && <Stat label="Control" value={r.sag.control} />}
          {r.sag && <Stat label="Weir / orifice depth" value={`${fx(r.sag.dWeir, 3)} / ${fx(r.sag.dOrifice, 3)}`} unit="ft" />}
          {sagT !== null && <Stat label="Ponded spread" value={fx(sagT, 1)} unit="ft" />}
        </div>
        <Checks items={checks} />
        <p className="text-xs text-fg-muted">
          {s.kind === "curbSag" ? "Depth is measured from the normal cross slope; the local depression adds to the depth at the curb. Weir up to the opening height, orifice above 1.4 times it, the larger depth between (HEC-22 7.3.2)." : s.kind === "grateSag" ? "Weir on the perimeter L + 2W against the curb, orifice on the clear opening; the larger depth governs (HEC-22 7.3.1)." : "Grates intercept all frontal flow below the splash-over velocity and part of the side flow (HEC-22 eq. 7.3–7.9); curb openings by eq. 7.10–7.13 with the equivalent cross slope for a depressed gutter."}
        </p>
      </section>
    </div>
  );
}

function CulvertPanel({ s, set }: { s: State["culvert"]; set: (p: Partial<State["culvert"]>) => void }) {
  const inlets = Object.entries(CULVERT_INLETS).filter(([, v]) => v.shape === s.shape);
  const inlet = CULVERT_INLETS[s.inlet]?.shape === s.shape ? CULVERT_INLETS[s.inlet]! : inlets[0]![1];
  const sec: Section = s.shape === "circle" ? { kind: "circle", d: s.dIn / 12 } : { kind: "box", b: s.b, h: s.h };
  const D = s.shape === "circle" ? s.dIn / 12 : s.h;
  const q = s.Q / Math.max(1, s.barrels);
  const r = useMemo(() => culvert({ section: sec, inlet, Q: q, n: s.n, L: s.L, S: s.S, TW: s.TW }), [s, inlet]); // eslint-disable-line react-hooks/exhaustive-deps
  const curve = useMemo(() => {
    const hi: Array<[number, number]> = [], ho: Array<[number, number]> = [];
    for (let i = 1; i <= 40; i++) {
      const Q = (s.Q * 1.6 * i) / 40;
      const c = culvert({ section: sec, inlet, Q: Q / Math.max(1, s.barrels), n: s.n, L: s.L, S: s.S, TW: s.TW });
      hi.push([Q, inletControlHW(sec, inlet, Q / Math.max(1, s.barrels), s.S).HW]);
      ho.push([Q, Math.max(c.HWo, 0)]);
    }
    return { hi, ho };
  }, [s, inlet]); // eslint-disable-line react-hooks/exhaustive-deps
  const minOk = s.shape === "box" || s.dIn >= 18;
  const checks: Check[] = [
    { ok: r.ratio <= 1.5, text: `HW/D = ${fx(r.ratio)} ${r.ratio <= 1.5 ? "is within" : "exceeds"} 1.5 at the design flow${s.shape === "box" && s.b * s.h > 30 ? "; boxes over 30 sq ft should stay within 1.2" : ""}.`, clause: "8.5.2" },
    { ok: r.HW <= s.allowHW, text: `Headwater ${fx(r.HW)} ft ${r.HW <= s.allowHW ? "stays below" : "exceeds"} the ${s.allowHW} ft allowable (road shoulder or the lowest protected elevation).`, clause: "8.5.2" },
    { ok: minOk, text: minOk ? (s.shape === "circle" ? `${s.dIn} in meets the 18 in minimum under public roads.` : "Box culvert.") : `${s.dIn} in is below the 18 in minimum under public roads (15 in for driveways).`, clause: "8.5.3" },
    { ok: null, text: `Outlet velocity ${fx(r.Vout, 1)} ft/s: compare it with the receiving channel's permissible velocity and design outlet protection with HEC-14 where it is exceeded.`, clause: "8.5.4" },
  ];
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Culvert inputs">
        <Fieldset title="Barrel" note="HDS-5 inlet-control equations (Appendix A, Table C.1 coefficients) and the outlet-control energy equation; the higher headwater governs (8.5.1).">
          <div className="flex gap-4 text-sm" role="radiogroup" aria-label="Barrel shape">
            <label className="flex items-center gap-2"><input type="radio" checked={s.shape === "circle"} onChange={() => set({ shape: "circle", inlet: "rcp_groove_headwall", n: 0.012 })} /> Pipe</label>
            <label className="flex items-center gap-2"><input type="radio" checked={s.shape === "box"} onChange={() => set({ shape: "box", inlet: "box_headwall_bevel45", n: 0.012 })} /> Box</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {s.shape === "circle" ? <Num label="Diameter (in)" value={s.dIn} step={6} onChange={(v) => set({ dIn: v })} /> : (
              <>
                <Num label="Span (ft)" value={s.b} step={1} onChange={(v) => set({ b: v })} />
                <Num label="Rise (ft)" value={s.h} step={1} onChange={(v) => set({ h: v })} />
              </>
            )}
            <Num label="Barrels" value={s.barrels} step={1} onChange={(v) => set({ barrels: Math.max(1, Math.round(v)) })} />
            <Num label="Manning n" value={s.n} step={0.001} onChange={(v) => set({ n: v })} />
            <Num label="Length (ft)" value={s.L} step={5} onChange={(v) => set({ L: v })} />
            <Num label="Slope (ft/ft)" value={s.S} step={0.001} onChange={(v) => set({ S: v })} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-muted">Inlet</span>
            <select value={s.inlet} onChange={(e) => set({ inlet: e.target.value })} className={IN}>
              {inlets.map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </label>
        </Fieldset>
        <Fieldset title="Flow">
          <div className="grid grid-cols-3 gap-2">
            <Num label="Design flow (cfs)" value={s.Q} step={5} onChange={(v) => set({ Q: v })} />
            <Num label="Tailwater (ft)" value={s.TW} onChange={(v) => set({ TW: v })} />
            <Num label="Allowable HW (ft)" value={s.allowHW} step={0.5} onChange={(v) => set({ allowHW: v })} />
          </div>
        </Fieldset>
      </form>
      <section aria-label="Culvert results" className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Headwater" value={fx(r.HW)} unit="ft" strong />
          <Stat label="Control" value={r.control} unit={r.control === "inlet" ? r.regime : undefined} />
          <Stat label="HW/D" value={fx(r.ratio)} strong />
          <Stat label="Outlet velocity" value={fx(r.Vout, 1)} unit="ft/s" />
          <Stat label="Inlet-control HW" value={fx(r.HWi)} unit="ft" />
          <Stat label="Outlet-control HW" value={fx(r.HWo)} unit="ft" />
          <Stat label="Critical depth" value={fx(r.dc)} unit="ft" />
          <Stat label="Normal depth" value={r.yn === null ? "full" : fx(r.yn)} unit={r.yn === null ? undefined : "ft"} />
        </div>
        <Checks items={checks} />
        <LineChart
          title="Performance curve"
          ariaLabel={`Headwater against flow; ${fx(r.HW)} ft at ${s.Q} cfs in ${r.control} control`}
          series={[
            { name: "Inlet control", color: "var(--series-1)", pts: curve.hi },
            { name: "Outlet control", color: "var(--series-2)", pts: curve.ho },
          ]}
          refs={[{ y: s.allowHW, label: "Allowable HW" }, { y: 1.5 * D, label: "HW/D = 1.5" }]}
          marks={[{ x: s.Q, label: "Design flow" }]}
          xLabel="cfs"
          yLabel="HW ft"
        />
      </section>
    </div>
  );
}

const BENCH_LABEL: Record<Bench, string> = { flat: "Flat", depressed: "Depressed", half: "Half bench", full: "Full bench", improved: "Improved" };

function HglPanel({ s, set }: { s: State["hgl"]; set: (p: Partial<State["hgl"]>) => void }) {
  const run: DrainRun = {
    pipes: s.pipes.map((p) => ({ id: p.id, d: p.dIn / 12, n: p.n, L: p.L, invUp: p.invUp, invDn: p.invDn, Q: p.Q })),
    structures: s.structures.map((x) => ({ ...x })),
    tailwater: s.tidal ? tidalTailwater(s.mhhw ?? 0, s.slr ?? 0, s.tailwater).tw : s.tailwater,
  };
  const r = useMemo(() => {
    try {
      return hglRun(run);
    } catch {
      return null;
    }
  }, [s]); // eslint-disable-line react-hooks/exhaustive-deps
  const setPipe = (i: number, patch: Partial<PipeRow>) => set({ pipes: s.pipes.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const setSt = (i: number, patch: Partial<StructRow>) => set({ structures: s.structures.map((p, j) => (j === i ? { ...p, ...patch } : p)) });
  const add = () => {
    const last = s.pipes[s.pipes.length - 1]!;
    set({
      pipes: [...s.pipes, { id: `${s.pipes.length + 1}-O`, dIn: last.dIn, n: last.n, L: 100, invUp: last.invDn - 0.1, invDn: last.invDn - 1.1, Q: last.Q }],
      structures: [...s.structures, { id: String(s.structures.length + 1), rim: last.invDn + last.dIn / 12 + 3, bench: "full", angle: 180, surfaceQ: 0 }],
    });
  };
  const remove = (i: number) => {
    if (s.pipes.length <= 1) return;
    set({ pipes: s.pipes.filter((_, j) => j !== i), structures: s.structures.filter((_, j) => j !== i) });
  };

  const checks: Check[] = [];
  if (r) {
    const worst = r.structures.reduce((a, b) => (b.clearance < a.clearance ? b : a));
    checks.push({ ok: worst.clearance >= 1, text: `Smallest clearance between the energy level and the rim is ${fx(worst.clearance)} ft, at structure ${worst.id} (1 ft required).`, clause: "8.4.3" });
    const slow = run.pipes.filter((p) => fullPipe(p.d, p.n, Math.max((p.invUp - p.invDn) / p.L, 1e-9)).V < 3);
    checks.push({ ok: slow.length === 0, text: slow.length ? `Full-flow velocity is below 3 ft/s in pipe ${slow.map((p) => p.id).join(", ")}.` : "Every pipe reaches 3 ft/s flowing full.", clause: "8.3.3" });
    const fast = r.pipes.filter((p) => p.V > 15);
    checks.push({ ok: fast.length === 0, text: fast.length ? `Velocity exceeds 15 ft/s in pipe ${fast.map((p) => p.id).join(", ")}.` : "No pipe exceeds 15 ft/s.", clause: "8.3.4" });
    const shrink = s.pipes.filter((p, i) => i > 0 && p.dIn < s.pipes[i - 1]!.dIn);
    checks.push({ ok: shrink.length === 0, text: shrink.length ? `Pipe size decreases downstream at ${shrink.map((p) => p.id).join(", ")}.` : "Pipe sizes never decrease downstream.", clause: "8.3.6" });
    const small = s.pipes.filter((p) => p.dIn < 15);
    checks.push({ ok: small.length === 0, text: small.length ? `Pipe ${small.map((p) => p.id).join(", ")} is below 15 in (12 in only for inlet leads under 50 ft).` : "Every pipe is at least 15 in.", clause: "8.3.1" });
    const sur = r.pipes.filter((p) => p.surcharged).map((p) => p.id);
    if (sur.length) checks.push({ ok: null, text: `Pipe ${sur.join(", ")} flows full (surcharged) at the design flow; acceptable only while the clearance above is met.`, clause: "8.4.1" });
  }

  // profile: distance from the upstream end
  const profile = useMemo(() => {
    if (!r) return null;
    let x = 0;
    const inv: Array<[number, number]> = [], crown: Array<[number, number]> = [], hgl: Array<[number, number]> = [], egl: Array<[number, number]> = [], rim: Array<[number, number]> = [];
    run.pipes.forEach((p, i) => {
      const h = r.pipes[i]!, st = r.structures[i]!;
      rim.push([x, run.structures[i]!.rim]);
      egl.push([x, st.EGL]);
      hgl.push([x, h.HGLup]);
      inv.push([x, p.invUp]); crown.push([x, p.invUp + p.d]);
      egl.push([x + 0.001, h.EGLup]);
      x += p.L;
      inv.push([x, p.invDn]); crown.push([x, p.invDn + p.d]);
      hgl.push([x, h.HGLdn]); egl.push([x, h.EGLdn]);
    });
    hgl.push([x, s.tailwater]);
    return { inv, crown, hgl, egl, rim, len: x };
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps

  const csv = useMemo(() => {
    if (!r) return "";
    const rows = [
      ["pipe", "Q_cfs", "D_in", "case_downstream", "condition_upstream", "yn_ft", "yc_ft", "V_ftps", "EGL_down", "HGL_down", "EGL_up", "HGL_up", "structure_up", "rim", "Eai_ft", "Ea_ft", "EGL_structure", "clearance_ft"].join(","),
      ...r.pipes.map((p, i) => {
        const st = r.structures[i]!;
        return [p.id, run.pipes[i]!.Q, s.pipes[i]!.dIn, p.caseDn, p.conditionUp, fx(p.yn, 3), fx(p.yc, 3), fx(p.V, 2), fx(p.EGLdn, 3), fx(p.HGLdn, 3), fx(p.EGLup, 3), fx(p.HGLup, 3), st.id, st.rim, fx(st.Eai, 3), fx(st.Ea, 3), fx(st.EGL, 3), fx(st.clearance, 3)].join(",");
      }),
    ];
    return "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
  }, [r]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <form className="space-y-4" onSubmit={(e) => e.preventDefault()} aria-label="Storm drain inputs">
        <p className="text-sm text-fg-secondary">One run of pipe, upstream end first. Each row is a structure and the pipe that leaves it; the last pipe discharges to the outfall. Surface flow enters at the rim and is treated as plunging.</p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Storm drain inputs table">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Structure</th><th>Rim</th><th>Floor</th><th>Angle in (°)</th><th>Surface Q</th>
                <th>Pipe</th><th>D (in)</th><th>n</th><th>L (ft)</th><th>Inv. up</th><th>Inv. down</th><th>Q (cfs)</th><th className="relative"><span className="sr-only">Remove</span></th>
              </tr>
            </thead>
            <tbody>
              {s.pipes.map((p, i) => {
                const st = s.structures[i]!;
                const c = (v: number, on: (n: number) => void, step: number, label: string) => <input type="number" step={step} aria-label={label} value={Number.isFinite(v) ? v : ""} onChange={(e) => on(parseFloat(e.target.value))} className={CELL} />;
                return (
                  <tr key={i}>
                    <td><input value={st.id} onChange={(e) => setSt(i, { id: e.target.value })} className={CELL} aria-label={`Structure id, row ${i + 1}`} /></td>
                    <td>{c(st.rim, (v) => setSt(i, { rim: v }), 0.01, `Rim elevation, structure ${st.id}`)}</td>
                    <td>
                      <select value={st.bench} onChange={(e) => setSt(i, { bench: e.target.value as Bench })} className={`${CELL} min-w-[7rem]`} aria-label={`Floor, structure ${st.id}`}>
                        {Object.entries(BENCH_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td>{c(st.angle, (v) => setSt(i, { angle: v }), 15, `Inflow angle, structure ${st.id}`)}</td>
                    <td>{c(st.surfaceQ, (v) => setSt(i, { surfaceQ: v }), 0.1, `Surface inflow, structure ${st.id}`)}</td>
                    <td><input value={p.id} onChange={(e) => setPipe(i, { id: e.target.value })} className={CELL} aria-label={`Pipe id, row ${i + 1}`} /></td>
                    <td>{c(p.dIn, (v) => setPipe(i, { dIn: v }), 3, `Diameter, pipe ${p.id}`)}</td>
                    <td>{c(p.n, (v) => setPipe(i, { n: v }), 0.001, `Manning n, pipe ${p.id}`)}</td>
                    <td>{c(p.L, (v) => setPipe(i, { L: v }), 5, `Length, pipe ${p.id}`)}</td>
                    <td>{c(p.invUp, (v) => setPipe(i, { invUp: v }), 0.01, `Upstream invert, pipe ${p.id}`)}</td>
                    <td>{c(p.invDn, (v) => setPipe(i, { invDn: v }), 0.01, `Downstream invert, pipe ${p.id}`)}</td>
                    <td>{c(p.Q, (v) => setPipe(i, { Q: v }), 0.1, `Flow, pipe ${p.id}`)}</td>
                    <td><button type="button" aria-label={`Remove ${p.id}`} onClick={() => remove(i)} className="h-8 w-8 rounded text-fg-muted hover:bg-surface-muted">×</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <button type="button" onClick={add} className="h-9 text-sm font-medium text-water-link hover:underline">+ Add pipe downstream</button>
          <div className="w-44"><Num label={s.tidal ? "Riverine tailwater elev. (ft)" : "Outfall tailwater elev. (ft)"} value={s.tailwater} onChange={(v) => set({ tailwater: v })} /></div>
          <label className="flex items-center gap-2 pb-2 text-sm text-fg-secondary"><input type="checkbox" checked={!!s.tidal} onChange={(e) => set({ tidal: e.target.checked, mhhw: s.mhhw ?? 0, slr: s.slr ?? 0 })} /> Tidal outfall (8.10)</label>
          {s.tidal ? (
            <>
              <div className="w-32"><Num label="MHHW elev. (ft)" value={s.mhhw ?? 0} onChange={(v) => set({ mhhw: v })} /></div>
              <div className="w-40"><Num label="Sea-level rise (ft)" value={s.slr ?? 0} help="Projected rise over the service life (8.10.2); the floodplain calculator computes it." onChange={(v) => set({ slr: v })} /></div>
            </>
          ) : null}
        </div>
        {s.tidal ? <p className="text-xs text-fg-muted">Tailwater used: {fx(run.tailwater)} ft, the higher of MHHW plus the sea-level-rise allowance and the riverine tailwater (8.10.1). The <Link href="/tools/floodplain/" className="text-water-link underline">floodplain calculator</Link> computes the allowance from a projection.</p> : null}
      </form>
      {r && profile ? (
        <section aria-label="HGL results" className="space-y-5">
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Structure results">
              <table className="data-table text-sm">
                <thead><tr><th>Structure</th><th className="text-right">Rim</th><th className="text-right">Energy level</th><th className="text-right">Clearance</th><th className="text-right">C<sub>B</sub> / C<sub>θ</sub> / C<sub>P</sub></th></tr></thead>
                <tbody>
                  {r.structures.map((st) => (
                    <tr key={st.id}>
                      <td className="font-medium">{st.id}</td>
                      <td className="num text-right">{fx(st.rim)}</td>
                      <td className="num text-right font-semibold">{fx(st.EGL)}</td>
                      <td className={`num text-right ${st.clearance < 1 ? "font-semibold text-foreground" : ""}`}>{fx(st.clearance)} ft</td>
                      <td className="num text-right text-xs">{fx(st.CB)} / {fx(st.Ctheta)} / {fx(st.CP)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Pipe results">
              <table className="data-table text-sm">
                <thead><tr><th>Pipe</th><th className="text-right">Full Q</th><th className="text-right">V</th><th className="text-right">yn / yc</th><th>Flow</th><th className="text-right">HGL up / down</th></tr></thead>
                <tbody>
                  {r.pipes.map((p, i) => (
                    <tr key={p.id + i}>
                      <td className="font-medium">{p.id}</td>
                      <td className="num text-right">{fx(p.Qfull, 1)}</td>
                      <td className="num text-right">{fx(p.V, 1)}</td>
                      <td className="num text-right">{p.yn === null ? "full" : fx(p.yn)} / {fx(p.yc)}</td>
                      <td className="text-xs">{p.surcharged ? "surcharged" : p.conditionUp === "D" ? "supercritical" : "partly full"}</td>
                      <td className="num text-right">{fx(p.HGLup)} / {fx(p.HGLdn)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <Checks items={checks} />
          <LineChart
            title="Profile, upstream to outfall"
            ariaLabel="Storm drain profile with invert, crown, hydraulic grade line, energy grade line and rims"
            height={300}
            width={1000}
            series={[
              { name: "HGL", color: "var(--series-1)", pts: profile.hgl },
              { name: "EGL", color: "var(--series-2)", pts: profile.egl },
              { name: "Crown", color: "var(--fg-muted)", pts: profile.crown, dash: true },
              { name: "Invert", color: "var(--fg-secondary)", pts: profile.inv },
              { name: "Rim", color: "var(--edge-strong)", pts: profile.rim, dash: true },
            ]}
            xLabel="ft"
            yLabel="elev."
          />
          <p className="text-xs text-fg-muted">
            Pipe ends by HEC-22 Tables 9.6 and 9.7, with the water surface integrated along partly full pipes; structure losses by the FHWA access-hole method (HEC-22 eq. 9.13–9.31), with the energy level used as the water level. <a href={csv} download="storm-drain-hgl.csv" className="font-medium text-water-link underline">Download CSV</a>
          </p>
        </section>
      ) : (
        <p className="text-fg-muted">Check the inputs: every pipe needs a length, diameter and flow.</p>
      )}
    </div>
  );
}

/* ---------- Shell ---------- */

const TABS: Array<{ id: Tab; label: string; clause: string }> = [
  { id: "pipe", label: "Pipe", clause: "8.3" },
  { id: "inlet", label: "Gutter and inlet", clause: "8.2" },
  { id: "hgl", label: "Storm drain HGL", clause: "8.4" },
  { id: "culvert", label: "Culvert", clause: "8.5" },
  { id: "channel", label: "Channel", clause: "8.6" },
];

export function HydraulicsCalculator() {
  const [s, setS] = useState<State>(() => exampleState());
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

  const part = <K extends Exclude<keyof State, "tab">>(k: K) => (p: Partial<State[K]>) => setS((x) => ({ ...x, [k]: { ...x[k], ...p } }));
  const onKey = (e: React.KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const j = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setS((x) => ({ ...x, tab: TABS[j]!.id }));
    document.getElementById(`tab-${TABS[j]!.id}`)?.focus();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Calculator" className="flex flex-wrap gap-1 rounded-lg border border-edge bg-surface-muted p-1">
          {TABS.map((t, i) => (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              role="tab"
              type="button"
              aria-selected={s.tab === t.id}
              aria-controls={`panel-${t.id}`}
              tabIndex={s.tab === t.id ? 0 : -1}
              onKeyDown={(e) => onKey(e, i)}
              onClick={() => setS((x) => ({ ...x, tab: t.id }))}
              className={`h-9 rounded-md px-3 text-sm font-medium ${s.tab === t.id ? "bg-surface text-ink shadow-sm" : "text-fg-secondary hover:text-ink"}`}
            >
              {t.label} <span className="text-xs font-normal text-fg-muted">§{t.clause}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => setS(exampleState(s.tab))} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">
            Load worked example
          </button>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard?.writeText(window.location.href).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              });
            }}
            className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted"
          >
            {copied ? "Link copied" : "Copy link to this design"}
          </button>
        </div>
      </div>
      <div id={`panel-${s.tab}`} role="tabpanel" aria-labelledby={`tab-${s.tab}`}>
        {s.tab === "pipe" && <PipePanel s={s.pipe} set={part("pipe")} />}
        {s.tab === "channel" && <ChannelPanel s={s.channel} set={part("channel")} />}
        {s.tab === "inlet" && <InletPanel s={s.inlet} set={part("inlet")} />}
        {s.tab === "culvert" && <CulvertPanel s={s.culvert} set={part("culvert")} />}
        {s.tab === "hgl" && <HglPanel s={s.hgl} set={part("hgl")} />}
      </div>
    </div>
  );
}
