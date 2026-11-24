"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MEASURE_LABEL, STORAGE_BASED, accountSite, creditFraction, rv, type Hsg, type Measure, type MeasureKind } from "@/lib/credits/engine";
import { WORKED_CREDITS } from "@/lib/credits/example";

/* ---------- State ---------- */

type Row = Measure & { roofPerDownspout?: number; pathFt?: number; slopePct?: number };
type State = { P: number; siteAreaSf: number; siteImpPct: number; trees: number; measures: Row[] };

function exampleState(): State {
  const W = WORKED_CREDITS;
  return {
    P: W.P,
    siteAreaSf: W.siteAreaSf,
    siteImpPct: W.siteImpPct,
    trees: 0,
    measures: W.measures.map((m) => (m.kind === "disconnection" ? { ...m, roofPerDownspout: 1000, pathFt: 40, slopePct: 3 } : { ...m })),
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
    return { ...exampleState(), ...JSON.parse(decodeURIComponent(escape(atob(h)))) };
  } catch {
    return null;
  }
};

const KINDS = Object.keys(MEASURE_LABEL) as MeasureKind[];

/* ---------- UI atoms ---------- */

const IN = "h-9 w-full rounded-md border border-edge-strong bg-surface px-2 text-sm tabular-nums focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30";
const CELL = "h-8 w-full min-w-[4.5rem] rounded border border-edge-strong bg-surface px-1.5 text-xs tabular-nums focus:border-water-link focus:outline-none";
const fx = (v: number | null | undefined, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));

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

/* ---------- Volume bar ---------- */

function VolumeBar({ parts, total }: { parts: Array<{ name: string; v: number }>; total: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 56, GAP = 2;
  const used = parts.reduce((a, p) => a + p.v, 0);
  const all = [...parts, { name: "Remainder to treat (3.3)", v: Math.max(total - used, 0) }];
  const widths = all.map((p) => (total > 0 ? (p.v / total) * W : 0));
  const segs = all.map((p, i) => ({ ...p, x: widths.slice(0, i).reduce((a, b) => a + b, 0), w: widths[i]!, i, last: i === all.length - 1 }));
  return (
    <figure className="viz-root space-y-2">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">Site WQv: retained and remaining</span>
        <span className="flex flex-wrap items-center gap-4 text-xs text-fg-secondary">
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-sm" style={{ background: "var(--series-1)" }} /> Retained (one segment per measure)</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-sm border border-edge-strong" style={{ background: "var(--surface-muted)" }} /> Remainder to treat</span>
        </span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Site WQv ${fx(total)} cubic feet: ${all.map((p) => `${p.name} ${fx(p.v)} cf`).join("; ")}`} onPointerLeave={() => setHover(null)}>
          {segs.map((s) =>
            s.w > 0.5 ? (
              <g key={s.i} onPointerEnter={() => setHover(s.i)}>
                <rect
                  x={s.x + (s.i ? GAP / 2 : 0)}
                  y={8}
                  width={Math.max(s.w - (s.i ? GAP / 2 : 0) - (s.last ? 0 : GAP / 2), 0.5)}
                  height={H - 16}
                  rx={4}
                  fill={s.last ? "var(--surface-muted)" : "var(--series-1)"}
                  stroke={s.last ? "var(--edge-strong)" : "none"}
                  opacity={hover === null || hover === s.i ? 1 : 0.55}
                />
                {s.w > 70 && (
                  <text x={s.x + s.w / 2} y={H / 2 + 4} textAnchor="middle" fontSize={12} fill={s.last ? "var(--fg-secondary)" : "var(--surface)"}>
                    {fx((s.v / total) * 100)}%
                  </text>
                )}
              </g>
            ) : null
          )}
        </svg>
        {hover !== null && segs[hover] && (
          <div className="pointer-events-none absolute -top-2 rounded-md border border-edge-strong bg-surface px-2 py-1 text-xs tabular-nums" style={{ left: `${Math.min(62, ((segs[hover]!.x + segs[hover]!.w / 2) / W) * 100)}%` }}>
            <div className="font-medium text-ink">{segs[hover]!.name}</div>
            <div>{fx(segs[hover]!.v)} cf ({fx((segs[hover]!.v / total) * 100)}% of WQv)</div>
          </div>
        )}
      </div>
    </figure>
  );
}

/* ---------- Main ---------- */

export function ComplianceCalculator() {
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
  const setM = (i: number, p: Partial<Row>) => set("measures", s.measures.map((m, j) => (j === i ? { ...m, ...p } : m)));

  const r = useMemo(() => accountSite(s.siteAreaSf, s.siteImpPct, s.P, s.measures, s.trees), [s]);

  const checks: Array<{ ok: boolean | null; text: string; clause: string }> = [];
  const drained = s.measures.reduce((a, m) => a + (m.areaSf || 0), 0);
  if (drained > s.siteAreaSf + 1) checks.push({ ok: false, text: `The drainage areas add up to ${fx(drained)} sq ft, more than the ${fx(s.siteAreaSf)} sq ft site. No area may be counted twice.`, clause: "3.9" });
  s.measures.forEach((m, i) => {
    const n = m.label || `Measure ${i + 1}`;
    if (m.kind === "disconnection") {
      if (m.roofPerDownspout !== undefined) checks.push({ ok: m.roofPerDownspout <= 1000, text: m.roofPerDownspout <= 1000 ? `${n}: ${fx(m.roofPerDownspout)} sq ft per downspout, within 1,000 sq ft.` : `${n}: ${fx(m.roofPerDownspout)} sq ft per downspout exceeds 1,000 sq ft; it does not count as disconnected.`, clause: "3.8.2" });
      if (m.pathFt !== undefined) checks.push({ ok: m.pathFt >= 40, text: m.pathFt >= 40 ? `${n}: ${fx(m.pathFt)} ft flow path meets the 40 ft minimum.` : `${n}: a ${fx(m.pathFt)} ft flow path is shorter than 40 ft.`, clause: "3.8.3" });
      if (m.slopePct !== undefined) checks.push({ ok: m.slopePct <= 5, text: m.slopePct <= 5 ? `${n}: ${fx(m.slopePct, 1)}% slope, within 5%.` : `${n}: a ${fx(m.slopePct, 1)}% slope exceeds 5%.`, clause: "3.8.3" });
      if (m.amended && m.hsg !== "A" && m.hsg !== "B") checks.push({ ok: null, text: `${n}: the 50% credit on C or D soils requires restoration to 3.8.4 (12 in tilled, top 8 in amended).`, clause: "3.8.4" });
    }
    if (m.kind === "infiltrating" && (m.hsg === "C" || m.hsg === "D")) checks.push({ ok: null, text: `${n}: an infiltrating practice on HSG ${m.hsg} soils needs a tested rate of at least 0.5 in/hr; otherwise add an underdrain and use the underdrained credit.`, clause: "5.2" });
    if (m.kind === "harvesting" && (m.usedCf ?? 0) < (m.storageCf ?? 0)) checks.push({ ok: null, text: `${n}: only the ${fx(m.usedCf)} cf used between storms is credited, not the full ${fx(m.storageCf)} cf tank.`, clause: "6.10.1" });
    const res = r.measures[i];
    if (res?.capped) checks.push({ ok: null, text: `${n}: credit is capped at its drainage area's WQv (${fx(res.wqvIn)} cf). Spare storage is not moved to other areas.`, clause: "3.9" });
  });
  if (s.trees > 0) checks.push({ ok: null, text: `${s.trees} trees offset ${fx(r.treeOffsetSf)} sq ft of impervious area${r.treeOffsetSf < s.trees * 100 ? " (capped at 25% of impervious area)" : ""}.`, clause: "3.8.5" });
  checks.push({ ok: r.remainder <= 0.5 ? true : null, text: r.remainder <= 0.5 ? "The whole WQv is retained." : `${fx(r.remainder)} cf of the WQv is not retained; it must be treated to 80% TSS removal.`, clause: "3.3" });

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,34rem)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Inputs">
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => setS(exampleState())} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">Load worked example</button>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">{copied ? "Link copied" : "Copy link to this design"}</button>
        </div>
        <Fieldset title="Site" note="WQv = P × Rv × A / 12 with Rv = 0.05 + 0.009 I (4.2). Trees offset 100 sq ft of impervious area each, up to 25% (3.8.5).">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Num label="WQ rainfall (in)" value={s.P} onChange={(v) => set("P", v)} />
            <Num label="Site area (sq ft)" value={s.siteAreaSf} step={100} onChange={(v) => set("siteAreaSf", v)} />
            <Num label="Impervious (%)" value={s.siteImpPct} step={1} onChange={(v) => set("siteImpPct", v)} />
            <Num label="Qualifying trees" value={s.trees} step={1} onChange={(v) => set("trees", v)} />
          </div>
        </Fieldset>
        <Fieldset title="Measures and practices" note="Storage-based credits apply to the storage entered; flow-through credits apply to the WQv of the area draining to the measure (3.9).">
          {s.measures.map((m, i) => (
            <div key={i} className="space-y-2 rounded-md border border-edge p-3">
              <div className="grid grid-cols-[1fr_2rem] gap-2">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-fg-muted">Name</span>
                  <input value={m.label} onChange={(e) => setM(i, { label: e.target.value })} className={IN} />
                </label>
                <button type="button" aria-label={`Remove ${m.label || `measure ${i + 1}`}`} onClick={() => set("measures", s.measures.filter((_, j) => j !== i))} className="mt-5 h-9 rounded-md text-fg-muted hover:bg-surface-muted">×</button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <label className="col-span-2 flex flex-col gap-1">
                  <span className="text-xs font-medium text-fg-muted">Kind</span>
                  <select value={m.kind} onChange={(e) => setM(i, { kind: e.target.value as MeasureKind })} className={IN}>
                    {KINDS.map((k) => <option key={k} value={k}>{MEASURE_LABEL[k]}</option>)}
                  </select>
                </label>
                <Num label="Area draining (sq ft)" value={m.areaSf} step={100} onChange={(v) => setM(i, { areaSf: v })} />
                <Num label="Its impervious (%)" value={m.impPct} step={1} onChange={(v) => setM(i, { impPct: v })} />
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-fg-muted">Soil group</span>
                  <select value={m.hsg} onChange={(e) => setM(i, { hsg: e.target.value as Hsg })} className={IN}>
                    {(["A", "B", "C", "D"] as Hsg[]).map((h) => <option key={h} value={h}>HSG {h}</option>)}
                  </select>
                </label>
                {(m.kind === "disconnection" || m.kind === "conservation" || m.kind === "grassChannel") && (
                  <label className="col-span-2 flex items-center gap-2 self-end pb-2 text-xs text-fg-secondary">
                    <input type="checkbox" checked={!!m.amended} onChange={(e) => setM(i, { amended: e.target.checked })} /> Soils restored (3.8.4)
                  </label>
                )}
                {STORAGE_BASED[m.kind] && <Num label={m.kind === "underdrained" ? "Storage above underdrain (cf)" : "Storage (cf)"} value={m.storageCf ?? 0} step={50} onChange={(v) => setM(i, { storageCf: v })} />}
                {m.kind === "underdrained" && <Num label="Sump below underdrain (cf)" value={m.sumpCf ?? 0} step={50} onChange={(v) => setM(i, { sumpCf: v })} />}
                {m.kind === "harvesting" && <Num label="Used between storms (cf)" value={m.usedCf ?? 0} step={50} onChange={(v) => setM(i, { usedCf: v })} />}
                {m.kind === "disconnection" && (
                  <>
                    <Num label="Roof per downspout (sq ft)" value={m.roofPerDownspout ?? 0} step={50} onChange={(v) => setM(i, { roofPerDownspout: v })} />
                    <Num label="Flow path (ft)" value={m.pathFt ?? 0} step={5} onChange={(v) => setM(i, { pathFt: v })} />
                    <Num label="Flow path slope (%)" value={m.slopePct ?? 0} step={0.5} onChange={(v) => setM(i, { slopePct: v })} />
                  </>
                )}
              </div>
              <p className="text-xs text-fg-muted">Credit {fx(creditFraction(m.kind, m.hsg, m.amended) * 100)}% of {m.kind === "underdrained" ? "storage above the underdrain, plus 100% of the sump" : STORAGE_BASED[m.kind] ? (m.kind === "harvesting" ? "the volume used" : "storage") : "the WQv draining to it"}.</p>
            </div>
          ))}
          <button type="button" onClick={() => set("measures", [...s.measures, { label: "Bioretention", kind: "infiltrating", areaSf: 10000, impPct: 100, hsg: "B", storageCf: 800 }])} className="h-8 text-sm font-medium text-water-link hover:underline">+ Add measure</button>
        </Fieldset>
      </form>

      <section aria-labelledby="cres" className="min-w-0 space-y-6">
        <h2 id="cres" className="text-lg font-semibold text-ink">Results</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Site WQv", `${fx(r.siteWqv)} cf`, `Rv ${fx(rv(r.effImpPct), 3)}`],
            ["Retained", `${fx(r.retained)} cf`, `${fx(r.retainedShare * 100)}% of WQv`],
            ["To treat", `${fx(r.remainder)} cf`, "3.3, 80% TSS"],
            ["Not draining to a measure", `${fx(r.untreatedArea)} sq ft`, "of the site"],
          ].map(([k, v, sub]) => (
            <div key={k} className="space-y-0.5">
              <dt className="text-xs text-fg-muted">{k}</dt>
              <dd className="text-xl font-semibold tabular-nums text-ink">{v}</dd>
              <dd className="text-xs text-fg-muted">{sub}</dd>
            </div>
          ))}
        </dl>
        <VolumeBar parts={r.measures.map((m) => ({ name: m.label || MEASURE_LABEL[m.kind], v: m.retained }))} total={r.siteWqv} />
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Credit by measure">
          <table className="data-table text-sm">
            <thead><tr><th>Measure</th><th className="text-right">Its WQv</th><th className="text-right">Credit</th><th className="text-right">Applied to</th><th className="text-right">Retained</th></tr></thead>
            <tbody>
              {r.measures.map((m, i) => (
                <tr key={i}>
                  <td>{m.label || MEASURE_LABEL[m.kind]}<div className="text-xs text-fg-muted">{MEASURE_LABEL[m.kind]}</div></td>
                  <td className="num text-right">{fx(m.wqvIn)} cf</td>
                  <td className="num text-right">{fx(m.credit * 100)}%{m.kind === "underdrained" ? " + sump" : ""}</td>
                  <td className="num text-right">{fx(m.basis)} cf</td>
                  <td className="num text-right font-semibold">{fx(m.retained)} cf{m.capped ? " (capped)" : ""}</td>
                </tr>
              ))}
              <tr>
                <td className="font-medium">Total</td>
                <td className="num text-right">{fx(r.siteWqv)} cf</td>
                <td />
                <td />
                <td className="num text-right font-semibold">{fx(r.retained)} cf</td>
              </tr>
            </tbody>
          </table>
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
      </section>
    </div>
  );
}
