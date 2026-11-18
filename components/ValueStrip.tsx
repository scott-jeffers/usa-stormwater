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

export function ValueStrip({ label, unit, values, mode }: Props) {
  if (!values.length) return null;
  const max = Math.max(...values.map((v) => v.value));
  const min = Math.min(...values.map((v) => v.value));
  const counts = new Map<number, number>();
  for (const v of values) counts.set(v.value, (counts.get(v.value) ?? 0) + 1);
  const tallest = Math.max(...counts.values());
  const x0 = 12, x1 = 560, base = 14 + tallest * 7;
  const sx = (v: number) => x0 + (max ? (v / max) * (x1 - x0) : 0);
  const seen = new Map<number, number>();
  return (
    <svg viewBox={`0 0 640 ${base + 26}`} role="img" aria-label={`${label}: ${values.length} manuals, ${fmt(min)} to ${fmt(max)} ${unit}`} className="h-auto w-full max-w-2xl">
      <line x1={x0} x2={x1} y1={base} y2={base} className="stroke-edge-strong" strokeWidth={1} />
      {values.map((v, i) => {
        const k = seen.get(v.value) ?? 0;
        seen.set(v.value, k + 1);
        const hit = mode != null && Math.abs(v.value - mode) <= 0.1 * mode;
        return (
          <circle key={`${v.name}-${i}`} cx={sx(v.value)} cy={base - 6 - k * 7} r={3.5} className={hit ? "fill-water" : "fill-fg-faint"} opacity={hit ? 1 : 0.55}>
            <title>{`${v.name}: ${fmt(v.value)} ${unit}`}</title>
          </circle>
        );
      })}
      <text x={sx(min)} y={base + 18} textAnchor="middle" className="fill-fg-subtle" fontSize={12}>{fmt(min)}</text>
      <text x={x1 + 8} y={base + 4} className="fill-fg-subtle" fontSize={12}>{`${fmt(max)} ${unit}`}</text>
      {mode != null && Math.abs(sx(mode) - sx(min)) > 28 && (
        <text x={sx(mode)} y={base + 18} textAnchor="middle" className="fill-water" fontSize={12} fontWeight={600}>{fmt(mode)}</text>
      )}
    </svg>
  );
}

/** One plain sentence describing a set of values. */
export function describeValues(label: string, unit: string, values: number[], mode: number | null): string {
  const u = unit === "inches" ? "in" : unit;
  if (!values.length) return `${label}: no manual states a value.`;
  const n = values.length;
  const min = Math.min(...values), max = Math.max(...values);
  const atMode = mode == null ? 0 : values.filter((v) => Math.abs(v - mode) <= 0.1 * mode).length;
  const range = min === max ? `all ${fmt(min)} ${u}` : `${fmt(min)}–${fmt(max)} ${u}`;
  const common = mode != null && atMode >= 2 ? `; most common ${fmt(mode)} ${u} (${atMode} manuals)` : "";
  return `${label}: ${n} manual${n === 1 ? "" : "s"}, ${range}${common}.`;
}
