"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  centroidLag,
  drawdownHours,
  hydrograph,
  interp,
  orificeDiameterFor,
  prismStorage,
  rating,
  route,
  storageFromAreas,
  tr55StorageRatio,
  weirLengthFor,
  type Barrel,
  type Device,
  type Distribution,
} from "@/lib/detention/engine";
import { WORKED_EXAMPLE } from "@/lib/detention/example";

/* ---------- State ---------- */

type StormRow = { years: number; depth: number; role: "cp" | "peak" | "flood" | "none" };
type DeviceRow = { kind: Device["kind"]; z: number; a: number; b: number; label: string };
type State = {
  area: number;
  preCn: number;
  preTc: number;
  postCn: number;
  postTc: number;
  dist: "II" | "III" | "custom";
  customDist: string;
  storms: StormRow[];
  basinMode: "prism" | "table";
  L: number;
  W: number;
  z: number;
  stageArea: string;
  top: number;
  devices: DeviceRow[];
  barrelOn: boolean;
  barrelD: number; // in
  barrelL: number;
  barrelOut: number;
  barrelN: number;
  cpHours: number;
};

/** Device parameters by kind: z = invert or crest (ft); a, b as labelled. */
const KIND: Record<Device["kind"], { name: string; z: string; a: string; b?: string }> = {
  orifice: { name: "Circular orifice", z: "Invert (ft)", a: "Diameter (in)", b: "C" },
  rectOrifice: { name: "Rectangular orifice", z: "Invert (ft)", a: "Width (ft)", b: "Height (ft)" },
  weir: { name: "Sharp-crested weir", z: "Crest (ft)", a: "Length (ft)", b: "C (US)" },
  vnotch: { name: "V-notch weir", z: "Crest (ft)", a: "Angle (deg)" },
  riser: { name: "Riser top (open)", z: "Crest (ft)", a: "Diameter (in)" },
  spillway: { name: "Emergency spillway", z: "Crest (ft)", a: "Width (ft)", b: "C (US)" },
};

function exampleState(): State {
  const E = WORKED_EXAMPLE;
  return {
    area: E.post.areaAc,
    preCn: E.pre.cn,
    preTc: E.pre.tcHours,
    postCn: E.post.cn,
    postTc: E.post.tcHours,
    dist: "II",
    customDist: "0,0\n12,0.5\n24,1",
    storms: [
      { years: 1, depth: 2.6, role: "cp" },
      { years: 2, depth: 3.2, role: "peak" },
      { years: 10, depth: 4.9, role: "peak" },
      { years: 100, depth: 7.6, role: "flood" },
    ],
    basinMode: "prism",
    L: E.basin.length,
    W: E.basin.width,
    z: E.basin.sideSlope,
    stageArea: "0, 7200\n2, 9000\n4, 11000\n6, 13200\n8, 15600",
    top: E.topOfBerm,
    devices: [
      { kind: "orifice", z: 0, a: 2.25, b: 0.6, label: "Channel protection" },
      { kind: "weir", z: 3.8, a: 3.5, b: 3.33, label: "10-year notch" },
      { kind: "riser", z: 5.3, a: 48, b: 0, label: "Riser top" },
      { kind: "spillway", z: 6.0, a: 20, b: 2.6, label: "Emergency spillway" },
    ],
    barrelOn: true,
    barrelD: 36,
    barrelL: 60,
    barrelOut: -1.6,
    barrelN: 0.013,
    cpHours: 24,
  };
}

const toDevice = (d: DeviceRow): Device => {
  switch (d.kind) {
    case "orifice": return { kind: "orifice", invert: d.z, diameter: d.a / 12, C: d.b || 0.6, label: d.label };
    case "rectOrifice": return { kind: "rectOrifice", invert: d.z, width: d.a, height: d.b, label: d.label };
    case "weir": return { kind: "weir", crest: d.z, length: d.a, C: d.b || 3.33, label: d.label };
    case "vnotch": return { kind: "vnotch", crest: d.z, angle: d.a, label: d.label };
    case "riser": return { kind: "riser", crest: d.z, diameter: d.a / 12, label: d.label };
    case "spillway": return { kind: "spillway", crest: d.z, width: d.a, C: d.b || 2.6, label: d.label };
  }
};

function parsePairs(text: string): Array<[number, number]> {
  return text
    .split(/\n/)
    .map((l) => l.split(/[,\t ]+/).filter(Boolean).map(Number))
    .filter((p) => p.length >= 2 && p.every(Number.isFinite))
    .map((p) => [p[0]!, p[1]!] as [number, number])
    .sort((a, b) => a[0] - b[0]);
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
  const dist: Distribution = s.dist === "custom" ? { custom: parsePairs(s.customDist) } : s.dist;
  const top = Math.max(s.top, 0.5);
  const stages = Array.from({ length: Math.round(top / 0.05) + 1 }, (_, i) => Math.round(i * 5) / 100);
  let stor: number[];
  if (s.basinMode === "table") {
    const pts = parsePairs(s.stageArea);
    if (pts.length < 2) return { error: "Enter at least two stage, area pairs." as const };
    const st = pts.map((p) => p[0] - pts[0]![0]);
    const cum = storageFromAreas(st, pts.map((p) => p[1]));
    stor = stages.map((h) => interp(h, st, cum));
  } else stor = stages.map((h) => prismStorage(h, s.L, s.W, s.z));
  const devices = s.devices.map(toDevice);
  const barrel: Barrel | undefined = s.barrelOn ? { diameter: s.barrelD / 12, length: s.barrelL, outletInvert: s.barrelOut, n: s.barrelN } : undefined;
  const rt = rating(stages, devices, barrel);
  const disch = rt.map((r) => r.total);
  const pre = { areaAc: s.area, cn: s.preCn, tcHours: s.preTc };
  const post = { areaAc: s.area, cn: s.postCn, tcHours: s.postTc };
  const storms = s.storms.map((st) => {
    const hours = st.role === "cp" ? 120 : 60;
    const hp = hydrograph(pre, st.depth, dist, DT, hours);
    const hq = hydrograph(post, st.depth, dist, DT, hours);
    const r = route(hq.q, DT, stages, stor, disch);
    const lag = centroidLag(hq.q, r.outflow, DT);
    const prePeak = Math.max(...hp.q);
    const dd = drawdownHours(r.storage, DT, 0.1);
    let ok: boolean | null = null;
    if (st.role === "peak") ok = r.peakOut <= prePeak + 1e-6;
    if (st.role === "cp") ok = lag >= s.cpHours;
    if (st.role === "flood") ok = top - r.maxStage >= 1;
    return { ...st, prePeak, runoff: hq.runoffIn, inflow: hq.q, preQ: hp.q, r, lag, dd, ok, freeboard: top - r.maxStage };
  });
  // Spillway check: largest storm, all primary outlets blocked, basin full to the lowest spillway crest
  const flood = [...s.storms].sort((a, b) => b.years - a.years)[0];
  const spill = devices.filter((d) => d.kind === "spillway") as Array<Extract<Device, { kind: "spillway" }>>;
  let blocked: { maxStage: number; peakOut: number; freeboard: number; years: number } | null = null;
  if (flood && spill.length) {
    const crest = Math.min(...spill.map((d) => d.crest));
    const bd = rating(stages, devices, barrel, true).map((r) => r.total);
    const hq = hydrograph(post, flood.depth, dist, DT, 60);
    const r = route(hq.q, DT, stages, stor, bd, crest);
    blocked = { maxStage: r.maxStage, peakOut: r.peakOut, freeboard: top - r.maxStage, years: flood.years };
  }
  const highest = Math.max(...storms.map((x) => x.r.maxStage), 0);
  const barrelControls = rt.some((r) => r.barrelControls && r.stage <= highest);
  return { stages, stor, rt, storms, blocked, devices, barrelControls, top };
}

/* ---------- UI ---------- */

const IN = "h-9 w-full rounded-md border border-edge-strong bg-surface px-2 text-sm tabular-nums focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30";
const f1 = (v: number) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(v < 1 ? 2 : 1));

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

function Hydrograph({ inflow, outflow, target, title }: { inflow: number[]; outflow: number[]; target?: number; title: string }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 240, P = { l: 44, r: 14, t: 14, b: 30 };
  // window: from first inflow above 1% of peak, to when outflow drops below 2% of its peak (max 48 h)
  const pk = Math.max(...inflow);
  const opk = Math.max(...outflow, 1e-9);
  let i0 = inflow.findIndex((q) => q > 0.01 * pk);
  if (i0 < 0) i0 = 0;
  i0 = Math.max(0, i0 - 30);
  const ipk = outflow.indexOf(opk);
  let i1 = outflow.findIndex((q, i) => i > ipk && q < 0.05 * opk);
  if (i1 < 0) i1 = outflow.length - 1;
  i1 = Math.min(Math.max(i1, inflow.indexOf(pk) + 180), i0 + 36 * 60, outflow.length - 1);
  const yMax = Math.max(pk, opk, target ?? 0) * 1.08 || 1;
  const sx = (i: number) => P.l + ((i - i0) / (i1 - i0)) * (W - P.l - P.r);
  const sy = (q: number) => H - P.b - (q / yMax) * (H - P.t - P.b);
  const step = Math.max(1, Math.floor((i1 - i0) / 400));
  const path = (q: number[]) => {
    let d = "";
    for (let i = i0; i <= i1; i += step) d += `${d ? "L" : "M"}${sx(i).toFixed(1)},${sy(q[i] ?? 0).toFixed(1)}`;
    return d;
  };
  const ticksY = niceTicks(yMax);
  const t0 = i0 * DT, t1 = i1 * DT;
  const ticksX = niceTicks(t1 - t0).map((t) => t + Math.ceil(t0)).filter((t) => t <= t1);
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
        <span className="flex items-center gap-4 text-xs text-fg-secondary">
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 rounded" style={{ background: "var(--series-1)" }} /> Inflow</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5 rounded" style={{ background: "var(--series-2)" }} /> Outflow</span>
          {target !== undefined && <span className="flex items-center gap-1.5"><span className="inline-block w-5 border-t border-dashed border-fg-muted" /> Pre-development peak</span>}
        </span>
      </figcaption>
      <div className="relative">
        <svg ref={ref} viewBox={`0 0 ${W} ${H}`} className="h-auto w-full touch-none" role="img" aria-label={`${title}: inflow peak ${f1(pk)} cfs, outflow peak ${f1(opk)} cfs`} onPointerMove={onMove} onPointerLeave={() => setHover(null)}>
          {ticksY.map((t) => (
            <g key={t}>
              <line x1={P.l} x2={W - P.r} y1={sy(t)} y2={sy(t)} stroke="var(--edge)" strokeWidth={1} />
              <text x={P.l - 6} y={sy(t) + 4} textAnchor="end" fontSize={11} fill="var(--fg-muted)">{t}</text>
            </g>
          ))}
          {ticksX.map((t) => (
            <text key={t} x={sx(t / DT)} y={H - P.b + 16} textAnchor="middle" fontSize={11} fill="var(--fg-muted)">{t}</text>
          ))}
          <text x={W - P.r} y={H - 4} textAnchor="end" fontSize={11} fill="var(--fg-muted)">hours</text>
          <text x={4} y={12} fontSize={11} fill="var(--fg-muted)">cfs</text>
          {target !== undefined && <line x1={P.l} x2={W - P.r} y1={sy(target)} y2={sy(target)} stroke="var(--fg-muted)" strokeDasharray="4 4" strokeWidth={1} />}
          <path d={path(inflow)} fill="none" stroke="var(--series-1)" strokeWidth={2} strokeLinejoin="round" />
          <path d={path(outflow)} fill="none" stroke="var(--series-2)" strokeWidth={2} strokeLinejoin="round" />
          {hover !== null && (
            <g>
              <line x1={sx(hover)} x2={sx(hover)} y1={P.t} y2={H - P.b} stroke="var(--fg-muted)" strokeWidth={1} />
              <circle cx={sx(hover)} cy={sy(inflow[hover] ?? 0)} r={4} fill="var(--series-1)" stroke="var(--surface)" strokeWidth={2} />
              <circle cx={sx(hover)} cy={sy(outflow[hover] ?? 0)} r={4} fill="var(--series-2)" stroke="var(--surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
        {hover !== null && (
          <div className="pointer-events-none absolute top-1 rounded-md border border-edge-strong bg-surface px-2 py-1 text-xs tabular-nums" style={{ left: `${Math.min(70, (sx(hover) / W) * 100)}%` }}>
            <div className="text-fg-muted">{(hover * DT).toFixed(2)} h</div>
            <div>Inflow {f1(inflow[hover] ?? 0)} cfs</div>
            <div>Outflow {f1(outflow[hover] ?? 0)} cfs</div>
          </div>
        )}
      </div>
    </figure>
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

function Pass({ ok }: { ok: boolean | null }) {
  if (ok === null) return <span className="text-fg-faint">—</span>;
  return ok ? (
    <span className="status-chip status-strong">✓ Meets</span>
  ) : (
    <span className="status-chip status-open">✕ Fails</span>
  );
}

export function DetentionCalculator() {
  const [s, setS] = useState<State>(exampleState);
  const [shown, setShown] = useState(2);
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

  const res = useMemo(() => {
    try {
      return compute(s);
    } catch (e) {
      return { error: String(e) as string };
    }
  }, [s]);
  const set = <K extends keyof State>(k: K, v: State[K]) => setS((x) => ({ ...x, [k]: v }));
  const setStorm = (i: number, patch: Partial<StormRow>) => set("storms", s.storms.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setDev = (i: number, patch: Partial<DeviceRow>) => set("devices", s.devices.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  // helpers
  const [help, setHelp] = useState({ q: 1, h: 3, wq: 10, wh: 1, qo: 20, qi: 45, vr: 3.3 });
  const csv = useMemo(() => {
    if ("error" in res) return "";
    const head = ["stage_ft", "storage_cf", ...res.devices.map((d, i) => `${(d.label || d.kind).replace(/,/g, " ")}_${i + 1}_cfs`), "total_cfs", "barrel_controls"];
    const rows = res.rt.filter((_, i) => i % 2 === 0).map((r, i) => [r.stage.toFixed(2), Math.round(res.stor[i * 2]!), ...r.parts.map((p) => p.toFixed(3)), r.total.toFixed(3), r.barrelControls ? "yes" : ""].join(","));
    return "data:text/csv;charset=utf-8," + encodeURIComponent([head.join(","), ...rows].join("\n"));
  }, [res]);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* ---------- Inputs ---------- */}
      <form className="space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Inputs">
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => setS(exampleState())} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">
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

        <Fieldset title="Drainage area" note="Lag is taken as 0.6 Tc; peak rate factor 484 (NRCS).">
          <div className="grid grid-cols-3 gap-2">
            <Num label="Area (ac)" value={s.area} onChange={(v) => set("area", v)} />
            <span />
            <span />
            <Num label="Pre CN" value={s.preCn} step={1} onChange={(v) => set("preCn", v)} />
            <Num label="Pre Tc (h)" value={s.preTc} step={0.01} onChange={(v) => set("preTc", v)} />
            <span />
            <Num label="Post CN" value={s.postCn} step={1} onChange={(v) => set("postCn", v)} />
            <Num label="Post Tc (h)" value={s.postTc} step={0.01} onChange={(v) => set("postTc", v)} />
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-medium text-fg-muted">24-hour rainfall distribution</span>
            <select value={s.dist} onChange={(e) => set("dist", e.target.value as State["dist"])} className={IN}>
              <option value="II">NRCS Type II (0.1 h table)</option>
              <option value="III">NRCS Type III (TR-55 break points)</option>
              <option value="custom">Custom (e.g. NOAA Atlas 14 regional)</option>
            </select>
          </label>
          {s.dist === "custom" && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-muted">Hour, cumulative fraction (one pair per line)</span>
              <textarea rows={5} value={s.customDist} onChange={(e) => set("customDist", e.target.value)} className={`${IN} h-auto py-1 font-mono text-xs`} />
            </label>
          )}
        </Fieldset>

        <Fieldset title="Design storms" note="Role sets the check: channel protection = centroid detention time; peak control = routed peak ≤ pre-development peak; flood = 1 ft freeboard (model manual 3.4–3.6).">
          {s.storms.map((st, i) => (
            <div key={i} className="grid grid-cols-[4.5rem_4.5rem_1fr_2rem] items-end gap-2">
              <Num label="Years" value={st.years} step={1} onChange={(v) => setStorm(i, { years: v })} />
              <Num label="Depth (in)" value={st.depth} onChange={(v) => setStorm(i, { depth: v })} />
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-fg-muted">Role</span>
                <select value={st.role} onChange={(e) => setStorm(i, { role: e.target.value as StormRow["role"] })} className={IN}>
                  <option value="cp">CP detention</option>
                  <option value="peak">Peak control</option>
                  <option value="flood">Flood safety</option>
                  <option value="none">Report only</option>
                </select>
              </label>
              <button type="button" aria-label={`Remove ${st.years}-year storm`} onClick={() => set("storms", s.storms.filter((_, j) => j !== i))} className="h-9 rounded-md text-fg-muted hover:bg-surface-muted">×</button>
            </div>
          ))}
          <div className="flex items-end gap-3">
            <button type="button" onClick={() => set("storms", [...s.storms, { years: 25, depth: 6, role: "peak" }])} className="h-9 text-sm font-medium text-water-link hover:underline">+ Add storm</button>
            <div className="w-32"><Num label="Detention target (h)" value={s.cpHours} step={1} onChange={(v) => set("cpHours", v)} /></div>
          </div>
        </Fieldset>

        <Fieldset title="Storage">
          <div className="flex gap-4 text-sm" role="radiogroup" aria-label="Storage geometry">
            <label className="flex items-center gap-2"><input type="radio" checked={s.basinMode === "prism"} onChange={() => set("basinMode", "prism")} /> Rectangular basin</label>
            <label className="flex items-center gap-2"><input type="radio" checked={s.basinMode === "table"} onChange={() => set("basinMode", "table")} /> Stage-area table</label>
          </div>
          {s.basinMode === "prism" ? (
            <div className="grid grid-cols-3 gap-2">
              <Num label="Bottom L (ft)" value={s.L} step={1} onChange={(v) => set("L", v)} />
              <Num label="Bottom W (ft)" value={s.W} step={1} onChange={(v) => set("W", v)} />
              <Num label="Side slope z:1" value={s.z} step={0.5} onChange={(v) => set("z", v)} />
            </div>
          ) : (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-muted">Stage (ft), surface area (sf), one pair per line</span>
              <textarea rows={5} value={s.stageArea} onChange={(e) => set("stageArea", e.target.value)} className={`${IN} h-auto py-1 font-mono text-xs`} />
            </label>
          )}
          <div className="w-40"><Num label="Top of embankment (ft)" value={s.top} onChange={(v) => set("top", v)} /></div>
        </Fieldset>

        <Fieldset title="Outlet devices" note="Elevations are above the basin bottom. Orifice C 0.60 sharp-edged (0.40 torch-cut); weir C 3.33; spillway C 2.6 (model manual 7.6–7.7).">
          {s.devices.map((d, i) => (
            <div key={i} className="space-y-2 rounded-md border border-edge p-2">
              <div className="flex items-center gap-2">
                <select aria-label="Device type" value={d.kind} onChange={(e) => setDev(i, { kind: e.target.value as Device["kind"], b: e.target.value === "weir" ? 3.33 : e.target.value === "spillway" ? 2.6 : e.target.value === "orifice" ? 0.6 : e.target.value === "rectOrifice" ? 0.5 : 0 })} className={`${IN} flex-1`}>
                  {Object.entries(KIND).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                </select>
                <button type="button" aria-label="Remove device" onClick={() => set("devices", s.devices.filter((_, j) => j !== i))} className="h-9 w-9 rounded-md text-fg-muted hover:bg-surface-muted">×</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Num label={KIND[d.kind].z} value={d.z} onChange={(v) => setDev(i, { z: v })} />
                <Num label={KIND[d.kind].a} value={d.a} onChange={(v) => setDev(i, { a: v })} />
                {KIND[d.kind].b ? <Num label={KIND[d.kind].b!} value={d.b} step={0.01} onChange={(v) => setDev(i, { b: v })} /> : <span />}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => set("devices", [...s.devices, { kind: "orifice", z: 0, a: 6, b: 0.6, label: "" }])} className="h-9 text-sm font-medium text-water-link hover:underline">+ Add device</button>
        </Fieldset>

        <Fieldset title="Outlet barrel" note="Outlet-control capacity, free outfall (HDS-5 simplified). The barrel caps the flow of every device except spillways.">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={s.barrelOn} onChange={(e) => set("barrelOn", e.target.checked)} /> Check the barrel</label>
          {s.barrelOn && (
            <div className="grid grid-cols-2 gap-2">
              <Num label="Diameter (in)" value={s.barrelD} step={3} onChange={(v) => set("barrelD", v)} />
              <Num label="Length (ft)" value={s.barrelL} step={5} onChange={(v) => set("barrelL", v)} />
              <Num label="Outlet invert (ft)" value={s.barrelOut} onChange={(v) => set("barrelOut", v)} />
              <Num label="Manning n" value={s.barrelN} step={0.001} onChange={(v) => set("barrelN", v)} />
            </div>
          )}
        </Fieldset>
      </form>

      {/* ---------- Results ---------- */}
      <section aria-labelledby="res" className="min-w-0 space-y-6">
        <h2 id="res" className="text-lg font-semibold text-ink">Results</h2>
        {"error" in res ? (
          <p className="text-fg-muted">{res.error}</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Storm</th>
                    <th className="text-right">Pre peak</th>
                    <th className="text-right">Post peak</th>
                    <th className="text-right">Routed peak</th>
                    <th className="text-right">Max stage</th>
                    <th className="text-right">Freeboard</th>
                    <th className="text-right">Detention</th>
                    <th>Check</th>
                  </tr>
                </thead>
                <tbody>
                  {res.storms.map((x, i) => (
                    <tr key={i} className={i === shown ? "bg-surface-muted" : undefined}>
                      <td>
                        <button type="button" onClick={() => setShown(i)} className="font-medium text-water-link hover:underline" aria-pressed={i === shown}>
                          {x.years}-year
                        </button>
                        <div className="text-xs text-fg-muted">{x.depth} in · {x.role === "cp" ? "channel protection" : x.role === "peak" ? "peak control" : x.role === "flood" ? "flood safety" : "report"}</div>
                      </td>
                      <td className="num text-right">{f1(x.prePeak)}</td>
                      <td className="num text-right">{f1(x.r.peakIn)}</td>
                      <td className="num text-right font-semibold">{f1(x.r.peakOut)}</td>
                      <td className="num text-right">{x.r.maxStage.toFixed(2)} ft</td>
                      <td className={`num text-right ${x.freeboard < 1 ? "font-semibold text-foreground" : ""}`}>{x.freeboard.toFixed(2)} ft</td>
                      <td className="num text-right">{x.role === "cp" ? `${x.lag.toFixed(1)} h` : x.dd != null ? `${x.dd.toFixed(0)} h to 10%` : "—"}</td>
                      <td><Pass ok={x.ok} /></td>
                    </tr>
                  ))}
                  {res.blocked && (
                    <tr>
                      <td>
                        <span className="font-medium">{res.blocked.years}-year, outlet blocked</span>
                        <div className="text-xs text-fg-muted">full to spillway crest (7.8.2)</div>
                      </td>
                      <td className="num text-right">—</td>
                      <td className="num text-right">—</td>
                      <td className="num text-right font-semibold">{f1(res.blocked.peakOut)}</td>
                      <td className="num text-right">{res.blocked.maxStage.toFixed(2)} ft</td>
                      <td className="num text-right">{res.blocked.freeboard.toFixed(2)} ft</td>
                      <td className="num text-right">—</td>
                      <td><Pass ok={res.blocked.freeboard >= 1} /></td>
                    </tr>
                  )}
                </tbody>
              </table>
              <p className="mt-1 text-xs text-fg-muted">Flows in cfs. Stages above the basin bottom. Detention for channel protection is the time between the centroids of the inflow and outflow hydrographs.</p>
            </div>

            <Checks s={s} res={res} />

            {res.storms[shown] && (
              <Hydrograph
                title={`${res.storms[shown]!.years}-year inflow and routed outflow`}
                inflow={res.storms[shown]!.inflow}
                outflow={res.storms[shown]!.r.outflow}
                target={res.storms[shown]!.role === "peak" ? res.storms[shown]!.prePeak : undefined}
              />
            )}

            <details className="rounded-md border border-edge bg-surface">
              <summary className="cursor-pointer px-4 py-2.5 text-sm font-medium">Stage-storage-discharge table</summary>
              <div className="overflow-x-auto border-t border-edge p-2">
                <table className="data-table text-xs">
                  <thead>
                    <tr>
                      <th className="text-right">Stage (ft)</th>
                      <th className="text-right">Storage (cf)</th>
                      {res.devices.map((d, i) => <th key={i} className="text-right">{d.label || KIND[d.kind].name}</th>)}
                      <th className="text-right">Total (cfs)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {res.rt.filter((_, i) => i % 5 === 0).map((r) => (
                      <tr key={r.stage}>
                        <td className="num text-right">{r.stage.toFixed(2)}</td>
                        <td className="num text-right">{Math.round(interp(r.stage, res.stages, res.stor)).toLocaleString("en-US")}</td>
                        {r.parts.map((p, i) => <td key={i} className="num text-right">{p ? p.toFixed(2) : "0"}</td>)}
                        <td className="num text-right font-medium">{r.total.toFixed(2)}{r.barrelControls ? " *" : ""}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="px-2 pt-2 text-xs text-fg-muted">* barrel capacity limits the primary outlet. <a href={csv} download="stage-storage-discharge.csv" className="font-medium text-water-link underline">Download CSV (0.1 ft steps)</a></p>
              </div>
            </details>
          </>
        )}

        <section aria-labelledby="helpers" className="space-y-3 border-t border-edge pt-4">
          <h2 id="helpers" className="text-base font-semibold text-ink">Sizing helpers</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 rounded-md border border-edge p-3">
              <p className="text-sm font-medium">Orifice for a flow</p>
              <div className="grid grid-cols-2 gap-2">
                <Num label="Q (cfs)" value={help.q} onChange={(v) => setHelp({ ...help, q: v })} />
                <Num label="Head to center (ft)" value={help.h} onChange={(v) => setHelp({ ...help, h: v })} />
              </div>
              <p className="num text-sm">D = {(orificeDiameterFor(help.q, help.h) * 12).toFixed(2)} in <span className="text-fg-muted">(C 0.6)</span></p>
            </div>
            <div className="space-y-2 rounded-md border border-edge p-3">
              <p className="text-sm font-medium">Weir for a flow</p>
              <div className="grid grid-cols-2 gap-2">
                <Num label="Q (cfs)" value={help.wq} onChange={(v) => setHelp({ ...help, wq: v })} />
                <Num label="Head (ft)" value={help.wh} onChange={(v) => setHelp({ ...help, wh: v })} />
              </div>
              <p className="num text-sm">L = {weirLengthFor(help.wq, help.wh).toFixed(2)} ft <span className="text-fg-muted">(C 3.33)</span></p>
            </div>
            <div className="space-y-2 rounded-md border border-edge p-3">
              <p className="text-sm font-medium">TR-55 storage estimate</p>
              <div className="grid grid-cols-3 gap-2">
                <Num label="qo" value={help.qo} onChange={(v) => setHelp({ ...help, qo: v })} />
                <Num label="qi" value={help.qi} onChange={(v) => setHelp({ ...help, qi: v })} />
                <Num label="Runoff (in)" value={help.vr} onChange={(v) => setHelp({ ...help, vr: v })} />
              </div>
              <p className="num text-sm">
                Vs/Vr = {tr55StorageRatio(help.qo / help.qi, s.dist === "III" ? "III" : "II").toFixed(3)}; Vs ≈{" "}
                {Math.round(tr55StorageRatio(help.qo / help.qi) * help.vr * s.area * 3630).toLocaleString("en-US")} cf
              </p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function Checks({ s, res }: { s: State; res: Exclude<ReturnType<typeof compute>, { error: string }> }) {
  const items: Array<{ ok: boolean; text: string; clause: string }> = [];
  const orifices = s.devices.filter((d) => d.kind === "orifice");
  for (const o of orifices)
    items.push({
      ok: o.a >= 3,
      text: o.a >= 3 ? `Orifice ${o.a} in meets the 3 in minimum.` : `Orifice ${o.a} in is below 3 in: it needs internal protection (hood, reverse-slope pipe or screened chamber), and may not be below 1 in.`,
      clause: "7.6.2",
    });
  const spill = s.devices.some((d) => d.kind === "spillway");
  items.push({ ok: spill, text: spill ? "An emergency spillway is provided." : "No emergency spillway: every impounding facility needs one.", clause: "7.8" });
  if (res.blocked) items.push({ ok: res.blocked.freeboard >= 1, text: `With the principal outlet blocked, the ${res.blocked.years}-year storm leaves ${res.blocked.freeboard.toFixed(2)} ft of freeboard (1 ft required).`, clause: "7.8.2" });
  if (s.barrelOn) items.push({ ok: !res.barrelControls, text: res.barrelControls ? "The barrel limits the outflow below the highest routed water surface: enlarge it or lower its outlet." : "The barrel does not control the outflow for any design storm.", clause: "7.5.2" });
  const dd = Math.max(...res.storms.map((x) => x.dd ?? 0));
  items.push({ ok: dd <= 72, text: `Storage falls to 10% of its peak within ${dd.toFixed(0)} hours in every storm (72 h maximum drawdown).`, clause: "6.0.1" });
  if (s.basinMode === "prism") items.push({ ok: s.z >= 3, text: s.z >= 3 ? `Side slopes ${s.z}:1 meet the 3:1 minimum.` : `Side slopes ${s.z}:1 are steeper than 3:1.`, clause: "7.9.1" });
  return (
    <section aria-labelledby="checks" className="space-y-2">
      <h3 id="checks" className="text-sm font-semibold text-ink">Checks against the model manual</h3>
      <ul className="space-y-1 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden className={it.ok ? "text-water-link" : "font-bold text-foreground"}>{it.ok ? "✓" : "!"}</span>
            <span>
              <span className="sr-only">{it.ok ? "Meets: " : "Check: "}</span>
              {it.text}{" "}
              <a href={`/manual/#c-${it.clause.replace(/\./g, "-")}`} className="text-xs text-water-link underline">§{it.clause}</a>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

