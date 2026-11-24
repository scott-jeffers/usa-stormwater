"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { UNDERDRAIN_N, underdrainCapacity } from "@/lib/bioretention/engine";
import { WORKED_BIORETENTION, runBioretentionExample } from "@/lib/bioretention/example";

type State = typeof WORKED_BIORETENTION & { tpTarget: number };

const exampleState = (): State => ({ ...WORKED_BIORETENTION, media: { ...WORKED_BIORETENTION.media }, tpTarget: 50 });

const encode = (s: State) => {
  try {
    return btoa(unescape(encodeURIComponent(JSON.stringify(s))));
  } catch {
    return "";
  }
};
const decode = (h: string): State | null => {
  try {
    const x = JSON.parse(decodeURIComponent(escape(atob(h))));
    const d = exampleState();
    return { ...d, ...x, media: { ...d.media, ...(x.media ?? {}) } };
  } catch {
    return null;
  }
};

const IN = "h-9 w-full rounded-md border border-edge-strong bg-surface px-2 text-sm tabular-nums focus:border-water-link focus:outline-none focus:ring-2 focus:ring-water-link/30";
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

/** Annual phosphorus budget as one segmented bar. */
function LoadBar({ parts, total }: { parts: Array<{ name: string; v: number; fill: string; stroke?: boolean; darkText?: boolean }>; total: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 56, GAP = 2;
  const widths = parts.map((p) => (total > 0 ? (Math.max(p.v, 0) / total) * W : 0));
  const segs = parts.map((p, i) => ({ ...p, x: widths.slice(0, i).reduce((a, b) => a + b, 0), w: widths[i]!, i }));
  return (
    <figure className="viz-root space-y-2">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-medium text-ink">Annual phosphorus load: {fx(total, 2)} lb</span>
        <span className="flex flex-wrap items-center gap-4 text-xs text-fg-secondary">
          {parts.map((p) => (
            <span key={p.name} className="flex items-center gap-1.5"><span className={`inline-block h-3 w-4 rounded-sm ${p.stroke ? "border border-edge-strong" : ""}`} style={{ background: p.fill }} /> {p.name}</span>
          ))}
        </span>
      </figcaption>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Annual phosphorus load ${fx(total, 2)} pounds: ${parts.map((p) => `${p.name} ${fx(p.v, 2)} lb`).join("; ")}`} onPointerLeave={() => setHover(null)}>
          {segs.map((s) =>
            s.w > 0.5 ? (
              <g key={s.i} onPointerEnter={() => setHover(s.i)}>
                <rect x={s.x + (s.i ? GAP / 2 : 0)} y={8} width={Math.max(s.w - GAP, 0.5)} height={H - 16} rx={4} fill={s.fill} stroke={s.stroke ? "var(--edge-strong)" : "none"} opacity={hover === null || hover === s.i ? 1 : 0.55} />
                {s.w > 60 && <text x={s.x + s.w / 2} y={H / 2 + 4} textAnchor="middle" fontSize={12} fill={s.stroke || s.darkText ? "var(--fg-secondary)" : "var(--surface)"}>{fx((s.v / total) * 100)}%</text>}
              </g>
            ) : null
          )}
        </svg>
        {hover !== null && segs[hover] && (
          <div className="pointer-events-none absolute -top-2 rounded-md border border-edge-strong bg-surface px-2 py-1 text-xs tabular-nums" style={{ left: `${Math.min(62, ((segs[hover]!.x + segs[hover]!.w / 2) / W) * 100)}%` }}>
            <div className="font-medium text-ink">{segs[hover]!.name}</div>
            <div>{fx(segs[hover]!.v, 2)} lb/yr ({fx((segs[hover]!.v / total) * 100)}%)</div>
          </div>
        )}
      </div>
    </figure>
  );
}

export function BioretentionCalculator() {
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
  const setMedia = (k: keyof State["media"], v: number) => setS((x) => ({ ...x, media: { ...x.media, [k]: v } }));
  const r = useMemo(() => runBioretentionExample(s), [s]);
  const cap = underdrainCapacity(s.underdrainIn ?? 4, s.underdrainCount, s.underdrainN, s.underdrainSlope);

  const checks: Array<{ ok: boolean | null; text: string; clause: string }> = [];
  checks.push({ ok: s.dfFt >= 1.5, text: s.dfFt >= 1.5 ? `Media depth ${fx(s.dfFt * 12)} in meets the 18 in minimum.` : `Media depth ${fx(s.dfFt * 12)} in is less than 18 in.`, clause: "6.1.1" });
  checks.push({ ok: s.pondFt <= 1, text: s.pondFt <= 1 ? `Ponding ${fx(s.pondFt * 12)} in is within 12 in.` : `Ponding ${fx(s.pondFt * 12)} in exceeds 12 in.`, clause: "6.1.2" });
  checks.push({ ok: s.areaProvidedSf >= r.afRequired, text: s.areaProvidedSf >= r.afRequired ? `${fx(s.areaProvidedSf)} sq ft provided; ${fx(r.afRequired)} sq ft required (${r.afStorage >= r.afDarcy ? "storage governs" : "Darcy's law governs"}).` : `${fx(s.areaProvidedSf)} sq ft is less than the ${fx(r.afRequired)} sq ft required.`, clause: "6.1.8" });
  checks.push({ ok: r.pondDrainH <= 24, text: `Ponded water drains through the media in ${fx(r.pondDrainH, 1)} h at the design conductivity (limit 24 h).`, clause: "6.1.8" });
  if (s.sumpFt > 0) checks.push({ ok: r.sumpH <= 72 && s.subsoilTestInHr >= 0.1, text: r.sumpH <= 72 && s.subsoilTestInHr >= 0.1 ? `The sump drains to the subsoil in ${fx(r.sumpH)} h; it earns the sump credit.` : `The sump would take ${fx(r.sumpH)} h to drain${s.subsoilTestInHr < 0.1 ? " and the subsoil is below 0.1 in/hr" : ""}; it does not earn the sump credit.`, clause: "3.9.1" });
  checks.push({ ok: r.underdrainIn !== null && (s.underdrainIn ?? 4) >= r.underdrainIn, text: r.underdrainIn === null ? "No standard underdrain up to 12 in carries the media flow; add pipes." : `Media flow at full ponding is ${fx(r.qPeak, 3)} cfs; ${s.underdrainCount} × ${s.underdrainIn ?? 4} in carries ${fx(cap, 3)} cfs. Smallest that works: ${r.underdrainIn} in.`, clause: "6.1.9" });
  for (const m of r.media) if (m.ok !== null) checks.push({ ok: m.ok, text: `${m.spec.label}: ${fx(m.value, m.spec.key === "kInHr" ? 1 : 0)}${m.spec.key === "pIndex" ? "" : m.spec.key === "kInHr" ? " in/hr" : "%"} (${m.spec.min !== undefined ? `min ${m.spec.min}` : ""}${m.spec.min !== undefined && m.spec.max !== undefined ? ", " : ""}${m.spec.max !== undefined ? `max ${m.spec.max}` : ""}).`, clause: m.spec.clause });
  checks.push({ ok: r.removedShare * 100 >= s.tpTarget, text: `Estimated phosphorus removal ${fx(r.removedShare * 100)}% against a ${fx(s.tpTarget)}% target.`, clause: "3.10.1" });

  const bypass = r.loadLb * (1 - s.capture);
  const retainedLb = r.loadLb * s.capture * r.retainedShare;
  const filteredLb = r.loadLb * s.capture * (1 - r.retainedShare) * s.filterRemoval;
  const throughLb = r.loadLb - bypass - retainedLb - filteredLb;

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,32rem)_minmax(0,1fr)]">
      <form className="min-w-0 space-y-5" onSubmit={(e) => e.preventDefault()} aria-label="Inputs">
        <div className="flex flex-wrap gap-2 no-print">
          <button type="button" onClick={() => setS(exampleState())} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">Load worked example</button>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(window.location.href).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }); }} className="h-9 rounded-md border border-edge-strong px-3 text-sm font-medium hover:bg-surface-muted">{copied ? "Link copied" : "Copy link to this design"}</button>
        </div>
        <Fieldset title="Drainage area" note="WQv by 4.2.">
          <div className="grid grid-cols-3 gap-2">
            <Num label="Area (sq ft)" value={s.areaSf} step={100} onChange={(v) => set("areaSf", v)} />
            <Num label="Impervious (%)" value={s.impPct} step={1} onChange={(v) => set("impPct", v)} />
            <Num label="WQ rainfall (in)" value={s.P} onChange={(v) => set("P", v)} />
          </div>
        </Fieldset>
        <Fieldset title="Section" note="Storage counts ponding, media voids (0.25) and stone voids (0.40) above the underdrain invert; the sump is stone below it.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Num label="Media depth (ft)" value={s.dfFt} onChange={(v) => set("dfFt", v)} />
            <Num label="Max ponding (ft)" value={s.pondFt} step={0.05} onChange={(v) => set("pondFt", v)} />
            <Num label="Stone above invert (ft)" value={s.stoneAboveFt} step={0.05} onChange={(v) => set("stoneAboveFt", v)} />
            <Num label="Sump below invert (ft)" value={s.sumpFt} step={0.05} onChange={(v) => set("sumpFt", v)} />
            <Num label="Area provided (sq ft)" value={s.areaProvidedSf} step={10} onChange={(v) => set("areaProvidedSf", v)} />
            <Num label="Share of WQv stored" value={s.storeShare} step={0.05} onChange={(v) => set("storeShare", v)} />
          </div>
        </Fieldset>
        <Fieldset title="Rates" note="Design rates are the tested rates divided by the safety factor (5.3).">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Num label="Media k tested (in/hr)" value={s.kTestInHr} onChange={(v) => { set("kTestInHr", v); setMedia("kInHr", v); }} />
            <Num label="Subsoil tested (in/hr)" value={s.subsoilTestInHr} step={0.05} onChange={(v) => set("subsoilTestInHr", v)} />
            <Num label="Safety factor" value={s.safety} step={0.5} onChange={(v) => set("safety", v)} />
            <Num label="Drain time tf (days)" value={s.tfDays} step={0.5} onChange={(v) => set("tfDays", v)} />
          </div>
        </Fieldset>
        <Fieldset title="Underdrain">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Num label="Diameter (in)" value={s.underdrainIn ?? 4} step={2} onChange={(v) => set("underdrainIn", v)} />
            <Num label="Number of pipes" value={s.underdrainCount} step={1} onChange={(v) => set("underdrainCount", v)} />
            <Num label="Slope (ft/ft)" value={s.underdrainSlope} step={0.001} onChange={(v) => set("underdrainSlope", v)} />
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-fg-muted">Pipe</span>
              <select value={String(s.underdrainN)} onChange={(e) => set("underdrainN", parseFloat(e.target.value))} className={IN}>
                {Object.entries(UNDERDRAIN_N).map(([k, v]) => <option key={k} value={v}>{k}</option>)}
              </select>
            </label>
          </div>
        </Fieldset>
        <Fieldset title="Media test results" note="Laboratory results for the blended media as delivered (6.1.5–6.1.7).">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Num label="Sand (%)" value={s.media.sandPct} step={1} onChange={(v) => setMedia("sandPct", v)} />
            <Num label="Clay (%)" value={s.media.clayPct} step={0.5} onChange={(v) => setMedia("clayPct", v)} />
            <Num label="Organic matter (%)" value={s.media.omPct} step={0.5} onChange={(v) => setMedia("omPct", v)} />
            <Num label="P-index or mg/kg" value={s.media.pIndex} step={1} onChange={(v) => setMedia("pIndex", v)} />
            <Num label="Compost organic matter (%)" value={s.media.compostOmPct ?? NaN} step={1} onChange={(v) => setMedia("compostOmPct", v)} />
          </div>
        </Fieldset>
        <Fieldset title="Phosphorus (3.10.1)" note="Simple Method: L = 0.226 · P · 0.9 · Rv · C · A. The media removal is a placeholder assumption (New York's 40% criterion) until the committee adopts practice efficiencies.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Num label="Annual rainfall (in)" value={s.annualIn} step={1} onChange={(v) => set("annualIn", v)} />
            <Num label="TP concentration (mg/L)" value={s.tpMgL} step={0.01} onChange={(v) => set("tpMgL", v)} />
            <Num label="Annual runoff captured" value={s.capture} step={0.05} onChange={(v) => set("capture", v)} />
            <Num label="Media TP removal" value={s.filterRemoval} step={0.05} onChange={(v) => set("filterRemoval", v)} />
            <Num label="Target (%)" value={s.tpTarget} step={5} onChange={(v) => set("tpTarget", v)} />
          </div>
        </Fieldset>
      </form>

      <section aria-labelledby="bres" className="min-w-0 space-y-6">
        <h2 id="bres" className="text-lg font-semibold text-ink">Results</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["WQv", `${fx(r.wqv)} cf`, "4.2"],
            ["Area required", `${fx(r.afRequired)} sq ft`, `Darcy ${fx(r.afDarcy)}, storage ${fx(r.afStorage)}`],
            ["Retention credit", `${fx(r.retained)} cf`, `${fx(r.retainedShare * 100)}% of WQv (3.9)`],
            ["Phosphorus removed", `${fx(r.removedShare * 100)}%`, `${fx(r.removedLb, 2)} of ${fx(r.loadLb, 2)} lb/yr`],
          ].map(([k, v, sub]) => (
            <div key={k} className="space-y-0.5">
              <dt className="text-xs text-fg-muted">{k}</dt>
              <dd className="text-xl font-semibold tabular-nums text-ink">{v}</dd>
              <dd className="text-xs text-fg-muted">{sub}</dd>
            </div>
          ))}
        </dl>
        <LoadBar
          total={r.loadLb}
          parts={[
            { name: "Retained", v: retainedLb, fill: "var(--series-1)" },
            { name: "Removed by media", v: filteredLb, fill: "var(--series-2)" },
            { name: "Passes through media", v: throughLb, fill: "var(--surface-muted)", stroke: true },
            { name: "Bypasses", v: bypass, fill: "var(--edge-strong)", darkText: true },
          ]}
        />
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Design quantities">
          <table className="data-table text-sm">
            <thead><tr><th>Quantity</th><th className="text-right">Value</th></tr></thead>
            <tbody>
              <tr><td>Design media k</td><td className="num text-right">{fx(r.kDesignInHr, 2)} in/hr</td></tr>
              <tr><td>Storage depth above invert (water)</td><td className="num text-right">{fx(r.depthEq, 2)} ft</td></tr>
              <tr><td>Storage above invert, as provided</td><td className="num text-right">{fx(r.storageCf)} cf</td></tr>
              <tr><td>Sump storage</td><td className="num text-right">{fx(r.sumpCf)} cf</td></tr>
              <tr><td>Ponded water drains in</td><td className="num text-right">{fx(r.pondDrainH, 1)} h</td></tr>
              <tr><td>Sump drains in</td><td className="num text-right">{fx(r.sumpH)} h</td></tr>
              <tr><td>Media flow at full ponding (tested k)</td><td className="num text-right">{fx(r.qPeak, 3)} cfs</td></tr>
              <tr><td>Underdrain capacity, flowing full</td><td className="num text-right">{fx(cap, 3)} cfs</td></tr>
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
