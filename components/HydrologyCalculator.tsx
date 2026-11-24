"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  SHALLOW_K,
  SHEET_N,
  intensityAt,
  nrcsHydrograph,
  rationalPeak,
  timeOfConcentration,
  weightedC,
  weightedCN,
  type Cover,
  type Segment,
} from "@/lib/hydrology/engine";
import { EX_IDF_10, WORKED_HYDROLOGY } from "@/lib/hydrology/example";

/* ---------- State ---------- */

type SegRow = { kind: Segment["kind"]; L: number; S: number; n: number; surface: string; V: number };
type CoverRow = { label: string; area: number; C: number; cn: number; impervious: boolean };
type Side = { segments: SegRow[]; cover: CoverRow[] };
type State = {
  P2: number;
  dist: "II" | "III";
  prf: number;
  storms: Array<{ years: number; depth: number }>;
  idfYears: number;
  idf: string;
  smallStorm: number;
  pre: Side;
  post: Side;
};

const toRow = (s: Segment): SegRow => ({
  kind: s.kind,
  L: s.L,
  S: s.kind === "channel" ? 0.01 : s.S,
  n: s.kind === "sheet" ? s.n : 0.24,
  surface: s.kind === "shallow" ? s.surface : "Unpaved",
  V: s.kind === "channel" ? s.V : 3,
});

function exampleState(): State {
  const W = WORKED_HYDROLOGY;
  const side = (k: "pre" | "post"): Side => ({
    segments: W[k].segments.map(toRow),
    cover: W[k].cover.map((c, i) => ({ label: c.label, area: c.area, cn: c.cn, impervious: c.impervious, C: W[k].C[i]!.C })),
  });
  return {
    P2: W.P2,
    dist: "II",
    prf: 484,
    storms: W.storms.map((s) => ({ ...s })),
    idfYears: 10,
    idf: EX_IDF_10.map((r) => r.join(", ")).join("\n"),
    smallStorm: W.smallStorm,
    pre: side("pre"),
    post: side("post"),
  };
}

const toSegment = (r: SegRow): Segment =>
  r.kind === "sheet" ? { kind: "sheet", L: r.L, S: r.S, n: r.n } : r.kind === "shallow" ? { kind: "shallow", L: r.L, S: r.S, surface: r.surface } : { kind: "channel", L: r.L, V: r.V };

function parsePairs(text: string): Array<[number, number]> {
  return text
    .split(/\n/)
    .map((l) => l.split(/[,\t ]+/).filter(Boolean).map(Number))
    .filter((p) => p.length >= 2 && p.every(Number.isFinite))
    .map((p) => [p[0]!, p[1]!] as [number, number]);
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
    return { ...exampleState(), ...JSON.parse(decodeURIComponent(escape(atob(h)))) };
  } catch {
    return null;
  }
};

/* ---------- Computation ---------- */

const DT = 1 / 60;

function compute(s: State) {
  const idf = parsePairs(s.idf);
  const side = (x: Side) => {
    const tc = timeOfConcentration(x.segments.map(toSegment), s.P2);
    const tcUsed = Math.max(tc.tc, 5);
    const cover: Cover[] = x.cover.map((c) => ({ label: c.label, area: c.area, cn: c.cn, impervious: c.impervious }));
    const area = cover.reduce((a, c) => a + c.area, 0);
    const C = weightedC(x.cover.map((c) => ({ area: c.area, C: c.C })));
    const i = idf.length ? intensityAt(tcUsed, idf) : 0;
    const rational = rationalPeak(C, i, area, s.idfYears);
    const storms = s.storms.map((st) => ({
      ...st,
      weighted: nrcsHydrograph(cover, tcUsed, st.depth, s.dist, "weighted", s.prf, DT),
      separate: nrcsHydrograph(cover, tcUsed, st.depth, s.dist, "separate", s.prf, DT),
    }));
    const small = {
      weighted: nrcsHydrograph(cover, tcUsed, s.smallStorm, s.dist, "weighted", s.prf, DT),
      separate: nrcsHydrograph(cover, tcUsed, s.smallStorm, s.dist, "separate", s.prf, DT),
    };
    const impArea = cover.filter((c) => c.impervious).reduce((a, c) => a + c.area, 0);
    return { tc, tcUsed, cover, area, C, i, rational, storms, small, cn: weightedCN(cover), impShare: area ? impArea / area : 0 };
  };
  return { pre: side(s.pre), post: side(s.post), idf };
}

/* ---------- UI atoms ---------- */

const IN = "h-9 w-full rounded-md border border-edge-strong bg-surface px-2 text-sm tabular-nums focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30";
const CELL = "h-8 w-full min-w-[4.5rem] rounded border border-edge-strong bg-surface px-1.5 text-xs tabular-nums focus:border-water-link focus:outline-none";
const fx = (v: number | null | undefined, d = 2) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toFixed(d));

function Num({ label, value, onChange, step = 0.1 }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium text-fg-muted">{label}</span>
      <input type="number" inputMode="decimal" step={step} value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(parseFloat(e.target.value))} className={IN} />
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

function niceTicks(max: number): number[] {
  if (!(max > 0)) return [0];
  const raw = max / 4, mag = 10 ** Math.floor(Math.log10(raw)), n = raw / mag;
  const step = (n >= 5 ? 5 : n >= 2 ? 2 : 1) * mag;
  const out: number[] = [];
  for (let t = 0; t <= max + 1e-9; t += step) out.push(Math.round(t * 1000) / 1000);
  return out;
}

function Hydrographs({ series, title }: { series: Array<{ name: string; color: string; q: number[]; dash?: boolean }>; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 240, P = { l: 44, r: 14, t: 14, b: 30 };
  const pk = Math.max(...series.flatMap((s) => s.q), 1e-9);
  const first = Math.min(...series.map((s) => s.q.findIndex((v) => v > 0.01 * pk)).filter((i) => i >= 0));
  const i0 = Math.max(0, first - 30);
  const last = Math.max(...series.map((s) => { const p = s.q.indexOf(Math.max(...s.q)); const j = s.q.findIndex((v, k) => k > p && v < 0.03 * pk); return j < 0 ? s.q.length - 1 : j; }));
  const i1 = Math.min(Math.max(last, i0 + 60), i0 + 30 * 60);
  const yMax = pk * 1.08;
  const sx = (i: number) => P.l + ((i - i0) / (i1 - i0)) * (W - P.l - P.r);
  const sy = (q: number) => H - P.b - (q / yMax) * (H - P.t - P.b);
  const step = Math.max(1, Math.floor((i1 - i0) / 400));
  const path = (q: number[]) => {
    let d = "";
    for (let i = i0; i <= i1; i += step) d += `${d ? "L" : "M"}${sx(i).toFixed(1)},${sy(q[i] ?? 0).toFixed(1)}`;
    return d;
  };
  const t0 = i0 * DT, t1 = i1 * DT;
  const ticksX = niceTicks(t1 - t0).map((t) => Math.round((t + Math.ceil(t0)) * 100) / 100).filter((t) => t <= t1);
  const onMove = (e: React.PointerEvent) => {
    const box = ref.current!.getBoundingClientRect();
    const x = ((e.clientX - box.left) / box.width) * W;
    const i = Math.round(i0 + ((x - P.l) / (W - P.l - P.r)) * (i1 - i0));
    setHover(i >= i0 && i <= i1 ? i : null);
  };
  return (
    <figure className="viz-root space-y-2">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">{title}</span>
        <span className="flex flex-wrap items-center gap-4 text-xs text-fg-secondary">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5"><span className="inline-block w-5" style={{ borderTop: `2px ${s.dash ? "dashed" : "solid"} ${s.color}` }} /> {s.name}</span>
          ))}
        </span>
      </figcaption>
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" role="img" aria-label={`${title}: ${series.map((s) => `${s.name} peak ${fx(Math.max(...s.q), 1)} cfs`).join(", ")}`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {niceTicks(yMax).map((t) => (
            <g key={t}>
              <line x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} stroke="var(--edge)" strokeWidth={1} />
              <text x={P.l - 6} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--fg-muted)">{t}</text>
            </g>
          ))}
          {ticksX.map((t) => <text key={t} x={sx(t / DT)} y={H - P.b + 16} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">{t}</text>)}
          <text x={W - P.r} y={H - 4} textAnchor="end" fontSize={11} fill="var(--fg-muted)">hours</text>
          <text x={4} y={12} fontSize={11} fill="var(--fg-muted)">cfs</text>
          {series.map((s) => <path key={s.name} d={path(s.q)} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dash ? "5 4" : undefined} strokeLinejoin="round" />)}
          {hover !== null && (
            <g>
              <line x1={sx(hover)} x2={sx(hover)} y1={P.t} y2={H - P.b} stroke="var(--fg-muted)" strokeWidth={1} />
              {series.map((s) => <circle key={s.name} cx={sx(hover)} cy={sy(s.q[hover] ?? 0)} r={4} fill={s.color} stroke="var(--surface)" strokeWidth={2} />)}
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-md border border-edge-strong bg-surface px-2 py-1 text-xs tabular-nums" style={{ left: `${Math.min(68, (sx(hover) / W) * 100)}%` }}>
            <div className="text-fg-muted">{(hover * DT).toFixed(2)} h</div>
            {series.map((s) => <div key={s.name}>{s.name} {fx(s.q[hover] ?? 0, 1)} cfs</div>)}
          </div>
        )}
      </div>
    </figure>
  );
}

/* ---------- Inputs for one condition ---------- */

function SideInputs({ title, side, set }: { title: string; side: Side; set: (s: Side) => void }) {
  const setSeg = (i: number, p: Partial<SegRow>) => set({ ...side, segments: side.segments.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const setCov = (i: number, p: Partial<CoverRow>) => set({ ...side, cover: side.cover.map((r, j) => (j === i ? { ...r, ...p } : r)) });
  const num = (v: number, on: (x: number) => void, step: number, label: string) => (
    <input type="number" step={step} aria-label={label} value={Number.isFinite(v) ? v : ""} onChange={(e) => on(parseFloat(e.target.value))} className={CELL} />
  );
  return (
    <Fieldset title={title}>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${title} flow path`}>
        <table className="data-table text-xs">
          <thead><tr><th>Segment</th><th>Length (ft)</th><th>Slope</th><th>Surface, n or velocity</th><th className="relative"><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>
            {side.segments.map((r, i) => (
              <tr key={i}>
                <td>
                  <select value={r.kind} onChange={(e) => setSeg(i, { kind: e.target.value as SegRow["kind"] })} className={`${CELL} min-w-[7.5rem]`} aria-label={`${title} segment ${i + 1} type`}>
                    <option value="sheet">Sheet flow</option>
                    <option value="shallow">Shallow concentrated</option>
                    <option value="channel">Channel or pipe</option>
                  </select>
                </td>
                <td>{num(r.L, (v) => setSeg(i, { L: v }), 10, `${title} segment ${i + 1} length`)}</td>
                <td>{r.kind === "channel" ? <span className="text-fg-faint">—</span> : num(r.S, (v) => setSeg(i, { S: v }), 0.005, `${title} segment ${i + 1} slope`)}</td>
                <td>
                  {r.kind === "sheet" ? (
                    <select value={String(r.n)} onChange={(e) => setSeg(i, { n: parseFloat(e.target.value) })} className={`${CELL} min-w-[12rem]`} aria-label={`${title} segment ${i + 1} sheet-flow roughness`}>
                      {Object.entries(SHEET_N).map(([k, v]) => <option key={k} value={v}>{k} (n {v})</option>)}
                    </select>
                  ) : r.kind === "shallow" ? (
                    <select value={r.surface} onChange={(e) => setSeg(i, { surface: e.target.value })} className={`${CELL} min-w-[12rem]`} aria-label={`${title} segment ${i + 1} surface`}>
                      {Object.keys(SHALLOW_K).map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  ) : (
                    <span className="flex items-center gap-1">{num(r.V, (v) => setSeg(i, { V: v }), 0.5, `${title} segment ${i + 1} velocity`)}<span className="text-fg-muted">ft/s</span></span>
                  )}
                </td>
                <td><button type="button" aria-label={`Remove ${title} segment ${i + 1}`} onClick={() => set({ ...side, segments: side.segments.filter((_, j) => j !== i) })} className="h-8 w-8 rounded text-fg-muted hover:bg-surface-muted">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => set({ ...side, segments: [...side.segments, { kind: "channel", L: 300, S: 0.01, n: 0.24, surface: "Unpaved", V: 3 }] })} className="h-8 text-sm font-medium text-water-link hover:underline">+ Add segment</button>
      <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={`${title} land cover`}>
        <table className="data-table text-xs">
          <thead><tr><th>Cover</th><th>Area (ac)</th><th>C</th><th>CN</th><th>Impervious</th><th className="relative"><span className="sr-only">Remove</span></th></tr></thead>
          <tbody>
            {side.cover.map((c, i) => (
              <tr key={i}>
                <td><input value={c.label} onChange={(e) => setCov(i, { label: e.target.value })} className={`${CELL} min-w-[9rem]`} aria-label={`${title} cover ${i + 1} name`} /></td>
                <td>{num(c.area, (v) => setCov(i, { area: v }), 0.5, `${title} cover ${i + 1} area`)}</td>
                <td>{num(c.C, (v) => setCov(i, { C: v }), 0.01, `${title} cover ${i + 1} runoff coefficient`)}</td>
                <td>{num(c.cn, (v) => setCov(i, { cn: v }), 1, `${title} cover ${i + 1} curve number`)}</td>
                <td className="text-center"><input type="checkbox" checked={c.impervious} onChange={(e) => setCov(i, { impervious: e.target.checked })} aria-label={`${title} cover ${i + 1} is impervious`} /></td>
                <td><button type="button" aria-label={`Remove ${title} cover ${i + 1}`} onClick={() => set({ ...side, cover: side.cover.filter((_, j) => j !== i) })} className="h-8 w-8 rounded text-fg-muted hover:bg-surface-muted">×</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={() => set({ ...side, cover: [...side.cover, { label: "Lawn", area: 1, C: 0.22, cn: 74, impervious: false }] })} className="h-8 text-sm font-medium text-water-link hover:underline">+ Add cover</button>
    </Fieldset>
  );
}

/* ---------- Main ---------- */

export function HydrologyCalculator() {
  const [s, setS] = useState<State>(exampleState);
  const [shown, setShown] = useState(1);
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

  const r = useMemo(() => {
    try {
      return compute(s);
    } catch (e) {
      return { error: String(e) };
    }
  }, [s]);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((x) => ({ ...x, [k]: v }));

  const checks: Array<{ ok: boolean | null; text: string; clause: string }> = [];
  if (!("error" in r)) {
    for (const [name, side, inp] of [["Before", r.pre, s.pre], ["After", r.post, s.post]] as const) {
      const sheet = inp.segments.filter((x) => x.kind === "sheet");
      const sheetL = sheet.reduce((a, x) => a + x.L, 0);
      checks.push({ ok: sheetL <= 100, text: sheetL <= 100 ? `${name}: sheet flow is ${sheetL} ft, within the 100 ft limit.` : `${name}: ${sheetL} ft of sheet flow exceeds 100 ft; treat the rest as shallow concentrated flow.`, clause: "4.4.2" });
      checks.push({ ok: side.tc.tc >= 5 ? true : null, text: side.tc.tc >= 5 ? `${name}: Tc ${fx(side.tc.tc, 1)} min.` : `${name}: computed Tc ${fx(side.tc.tc, 1)} min is below 5 min; 5 min is used.`, clause: "4.4.3" });
    }
    checks.push({ ok: r.post.area <= 200, text: r.post.area <= 200 ? `The ${fx(r.post.area, 1)}-acre area is within the 200-acre limit for rational-method conveyance peaks; storage must still be sized from a hydrograph.` : `At ${fx(r.post.area, 0)} acres the rational method is not appropriate; use a hydrograph.`, clause: "4.3" });
    const imp = s.post.cover.filter((c) => c.impervious);
    if (imp.some((c) => c.cn !== 98)) checks.push({ ok: false, text: "Directly connected impervious area should use CN 98.", clause: "4.6.1" });
    if (imp.some((c) => c.C < 0.9)) checks.push({ ok: null, text: "An impervious cover has C below 0.90; check it against HEC-22 Table 4.1.", clause: "4.5.1" });
    if (r.post.impShare > 0.1) checks.push({ ok: null, text: `Impervious cover is ${fx(r.post.impShare * 100, 0)}% of the site: compute impervious and pervious runoff separately. For the ${s.smallStorm} in storm the separate method gives ${fx(r.post.small.separate.runoffIn)} in of runoff and a weighted CN ${fx(r.post.small.weighted.runoffIn)} in.`, clause: "4.6.2" });
    if (r.pre.rational.capped || r.post.rational.capped) checks.push({ ok: null, text: "C × Cf was capped at 1.0.", clause: "4.5.2" });
  }

  const csv = useMemo(() => {
    if ("error" in r) return "";
    const st = r.post.storms[shown] ?? r.post.storms[0];
    const pre = r.pre.storms[shown] ?? r.pre.storms[0];
    if (!st || !pre) return "";
    const rows = ["hour,before_cfs,after_weighted_cfs,after_separate_cfs"];
    const n = Math.max(st.weighted.q.length, st.separate.q.length, pre.weighted.q.length);
    for (let i = 0; i < n; i += 5) rows.push([(i * DT).toFixed(3), fx(pre.weighted.q[i] ?? 0, 3), fx(st.weighted.q[i] ?? 0, 3), fx(st.separate.q[i] ?? 0, 3)].join(","));
    return "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
  }, [r, shown]);

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,30rem)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Inputs">
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => setS(exampleState())} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">Load worked example</button>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">{copied ? "Link copied" : "Copy link to this design"}</button>
        </div>
        <Fieldset title="Rainfall" note="Use NOAA Atlas 14 mean partial-duration values for the site (4.1). The intensity table is for the rational method; the 24-hour depths drive the NRCS hydrographs.">
          <div className="grid grid-cols-3 gap-2">
            <Num label="2-yr, 24-h depth (in)" value={s.P2} onChange={(v) => set("P2", v)} />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-muted">Distribution</span>
              <select value={s.dist} onChange={(e) => set("dist", e.target.value as State["dist"])} className={IN}>
                <option value="II">NRCS Type II</option>
                <option value="III">NRCS Type III</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-muted">Unit hydrograph</span>
              <select value={String(s.prf)} onChange={(e) => set("prf", parseFloat(e.target.value))} className={IN}>
                <option value="484">NRCS (484)</option>
                <option value="284">Delmarva (284)</option>
              </select>
            </label>
          </div>
          {s.storms.map((st, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_2rem] items-end gap-2">
              <Num label="Storm (years)" value={st.years} step={1} onChange={(v) => set("storms", s.storms.map((x, j) => (j === i ? { ...x, years: v } : x)))} />
              <Num label="24-h depth (in)" value={st.depth} onChange={(v) => set("storms", s.storms.map((x, j) => (j === i ? { ...x, depth: v } : x)))} />
              <button type="button" aria-label={`Remove ${st.years}-year storm`} onClick={() => set("storms", s.storms.filter((_, j) => j !== i))} className="h-9 rounded-md text-fg-muted hover:bg-surface-muted">×</button>
            </div>
          ))}
          <button type="button" onClick={() => set("storms", [...s.storms, { years: 25, depth: 6 }])} className="h-8 text-sm font-medium text-water-link hover:underline">+ Add storm</button>
          <div className="grid grid-cols-2 gap-2">
            <Num label="Intensity table storm (years)" value={s.idfYears} step={1} onChange={(v) => set("idfYears", v)} />
            <Num label="Small storm (in)" value={s.smallStorm} onChange={(v) => set("smallStorm", v)} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-muted">Duration (min), intensity (in/h), one pair per line</span>
            <textarea rows={5} value={s.idf} onChange={(e) => set("idf", e.target.value)} className={`${IN} h-auto py-1 font-mono text-xs`} />
          </label>
        </Fieldset>
        <SideInputs title="Before development" side={s.pre} set={(v) => set("pre", v)} />
        <SideInputs title="After development" side={s.post} set={(v) => set("post", v)} />
      </form>

      <section aria-labelledby="hres" className="min-w-0 space-y-6">
        <h2 id="hres" className="text-lg font-semibold text-ink">Results</h2>
        {"error" in r ? <p className="text-fg-muted">{r.error}</p> : (
          <>
            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Time of concentration">
              <table className="data-table text-sm">
                <thead><tr><th>Condition</th><th className="text-right">Sheet</th><th className="text-right">Shallow</th><th className="text-right">Channel</th><th className="text-right">Tc</th><th className="text-right">Area</th><th className="text-right">C</th><th className="text-right">CN</th></tr></thead>
                <tbody>
                  {[["Before", r.pre], ["After", r.post]].map(([name, x]) => {
                    const side = x as typeof r.pre;
                    const sum = (k: Segment["kind"]) => side.tc.segments.filter((g) => g.kind === k).reduce((a, g) => a + g.minutes, 0);
                    return (
                      <tr key={name as string}>
                        <td className="font-medium">{name as string}</td>
                        <td className="num text-right">{fx(sum("sheet"), 1)}</td>
                        <td className="num text-right">{fx(sum("shallow"), 1)}</td>
                        <td className="num text-right">{fx(sum("channel"), 1)}</td>
                        <td className="num text-right font-semibold">{fx(side.tc.tc, 1)} min</td>
                        <td className="num text-right">{fx(side.area, 1)} ac</td>
                        <td className="num text-right">{fx(side.C)}</td>
                        <td className="num text-right">{fx(side.cn, 1)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Peak flows">
              <table className="data-table text-sm">
                <thead><tr><th>Storm</th><th className="text-right">Before</th><th className="text-right">After, weighted CN</th><th className="text-right">After, separate</th></tr></thead>
                <tbody>
                  <tr>
                    <td>{s.idfYears}-year rational<div className="text-xs text-fg-muted">i at Tc: {fx(r.pre.i)} / {fx(r.post.i)} in/h</div></td>
                    <td className="num text-right">{fx(r.pre.rational.Q, 1)}</td>
                    <td className="num text-right font-semibold" colSpan={2}>{fx(r.post.rational.Q, 1)}</td>
                  </tr>
                  {r.post.storms.map((st, i) => (
                    <tr key={i} className={i === shown ? "bg-surface-muted" : undefined}>
                      <td>
                        <button type="button" onClick={() => setShown(i)} aria-pressed={i === shown} className="font-medium text-water-link hover:underline">{st.years}-year NRCS</button>
                        <div className="text-xs text-fg-muted">{st.depth} in, Type {s.dist}</div>
                      </td>
                      <td className="num text-right">{fx(r.pre.storms[i]?.weighted.peak, 1)}</td>
                      <td className="num text-right">{fx(st.weighted.peak, 1)}</td>
                      <td className="num text-right font-semibold">{fx(st.separate.peak, 1)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>{s.smallStorm} in storm<div className="text-xs text-fg-muted">runoff depth</div></td>
                    <td className="num text-right">{fx(r.pre.small.weighted.runoffIn)} in</td>
                    <td className="num text-right">{fx(r.post.small.weighted.runoffIn)} in</td>
                    <td className="num text-right font-semibold">{fx(r.post.small.separate.runoffIn)} in</td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-1 text-xs text-fg-muted">Peaks in cfs. Rational peaks use Cf for the intensity table&rsquo;s storm (4.5.2). &ldquo;Separate&rdquo; computes impervious and pervious covers with their own curve numbers and adds the hydrographs (4.6.2).</p>
            </div>

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

            {r.post.storms[shown] && r.pre.storms[shown] && (
              <Hydrographs
                title={`${r.post.storms[shown]!.years}-year hydrographs`}
                series={[
                  { name: "Before", color: "var(--fg-muted)", q: r.pre.storms[shown]!.weighted.q, dash: true },
                  { name: "After, weighted CN", color: "var(--series-2)", q: r.post.storms[shown]!.weighted.q },
                  { name: "After, separate", color: "var(--series-1)", q: r.post.storms[shown]!.separate.q },
                ]}
              />
            )}
            <p className="text-xs text-fg-muted"><a href={csv} download="hydrographs.csv" className="font-medium text-water-link underline">Download these hydrographs (CSV, 5-minute steps)</a></p>
          </>
        )}
      </section>
    </div>
  );
}
