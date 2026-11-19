/**
 * Server-rendered dot strip: one dot per manual on a 0..max scale, the most
 * common value in the accent colour. Read at a glance; hover gives the value.
 */
interface Props {
  label: string;
  unit: string;
  values: Array<{ name: string; value: number }>;
  mode: number | null;
}

const fmt = (v: number) => String(Math.round(v * 100) / 100);
/** A value with its unit, written the way engineers write it (2:1, 24 in, 72 hours). */
export const withUnit = (v: number, unit: string) =>
  unit === "ratio" ? `${fmt(v)}:1` : unit === "%" ? `${fmt(v)}%` : unit === "factor" ? fmt(v) : `${fmt(v)} ${unit === "inches" ? "in" : unit}`;

export function ValueStrip({ label, unit, values, mode }: Props) {
  if (!values.length) return null;
  const max = Math.max(...values.map((v) => v.value));
  const min = Math.min(...values.map((v) => v.value));
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v.value, (counts.get(v.value) ?? 0) + 1);
  const tallest = Math.max(...counts.values());
  // Stack step shrinks for tall columns so the strip stays under ~110 px.
  const step = Math.max(2.2, Math.min(7, 96 / tallest));
  const r = Math.min(3.5, Math.max(1.6, step / 2));
  const x0 = 12, x1 = 560, base = 14 + tallest * step;
  const sx = (v: number) => x0 + (max ? (v / max) * (x1 - x0) : 0);
  const seen = new Map<number, number>();
  return (
    <svg viewBox={`0 0 640 ${base + 26}`} role="img" aria-label={`${label}: ${values.length} manuals, ${fmt(min)} to ${fmt(max)} ${unit}`} className="h-auto w-full max-w-2xl">
      <line x1={x0} x2={x1} y1={base} y2={base} className="stroke-edge-strong" strokeWidth={1} />
      {values.map((v, i) => {
        const k = seen.get(v.value) ?? 0;
        seen.set(v.value, k + 1);
        const hit = mode != null && v.value === mode;
        return (
          <circle key={`${v.name}-${i}`} cx={sx(v.value)} cy={base - 6 - k * step} r={r} className={hit ? "fill-water" : "fill-fg-faint"} opacity={hit ? 1 : 0.55}>
            <title>{`${v.name}: ${withUnit(v.value, unit)}`}</title>
          </circle>
        );
      })}
      <text x={sx(min)} y={base + 18} textAnchor="middle" className="fill-fg-subtle" fontSize={12}>{fmt(min)}</text>
      <text x={x1 + 8} y={base + 4} className="fill-fg-subtle" fontSize={12}>{withUnit(max, unit)}</text>
      {mode != null && Math.abs(sx(mode) - sx(min)) > 28 && (
        <text x={sx(mode)} y={base + 18} textAnchor="middle" className="fill-water" fontSize={12} fontWeight={600}>{fmt(mode)}</text>
      )}
      {mode != null && (
        <text x={sx(mode) + 8} y={base - 6 - ((counts.get(mode) ?? 1) - 1) * step + 4} className="fill-fg-subtle" fontSize={11}>{counts.get(mode)} manuals</text>
      )}
    </svg>
  );
}

/** One plain sentence describing a set of values. */
export function describeValues(label: string, unit: string, values: number[], mode: number | null): string {
  if (!values.length) return `${label}: no manual states a value.`;
  const n = values.length;
  const min = Math.min(...values), max = Math.max(...values);
  const atMode = mode == null ? 0 : values.filter((v) => v === mode).length;
  const range = min === max ? `all ${withUnit(min, unit)}` : unit === "ratio" ? `${fmt(min)}:1 to ${fmt(max)}:1` : `${fmt(min)}–${withUnit(max, unit)}`;
  const common = mode != null && atMode >= 2 ? `; most common ${withUnit(mode, unit)} (${atMode} manuals)` : "";
  return `${label}: ${n} manual${n === 1 ? "" : "s"}, ${range}${common}.`;
}
