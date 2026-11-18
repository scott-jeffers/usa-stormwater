import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { ValueStrip } from "@/components/ValueStrip";
import { CLASS_LABELS, PROVISIONS, loadCriteria, type CriterionEvidence } from "@/lib/national/modelManual";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";

export const metadata: Metadata = pageMeta(
  "/national/model-manual/",
  "Draft national model manual",
  "Draft baseline provisions for a voluntary national stormwater design manual, each with the state-by-state evidence it rests on."
);

const STATUS_STYLE: Record<string, string> = {
  drafted: "bg-emerald-50 text-emerald-800 ring-emerald-700/15 dark:bg-emerald-950/50 dark:text-emerald-300",
  "open question": "bg-amber-50 text-amber-900 ring-amber-700/20 dark:bg-amber-950/50 dark:text-amber-200",
  "not drafted": "bg-surface-muted text-fg-secondary ring-edge-strong/40",
  provisional: "bg-surface-muted text-fg-secondary ring-edge-strong/40",
};

const fmt = (v: number | null) => (v == null ? "—" : String(Math.round(v * 100) / 100));

function Evidence({ c }: { c: CriterionEvidence }) {
  const cls = CLASS_LABELS[c.class];
  return (
    <div className="mt-4 space-y-2 border-t border-edge pt-4">
      <p className="text-sm text-fg-secondary">
        <span className="font-medium text-foreground">{cls.label}.</span> {cls.meaning}{" "}
        {c.states} states (from {c.records} hand-checked manuals); {Math.round(c.agreement * 100)}% use{" "}
        {fmt(c.most_common)} {c.unit}; range {fmt(c.min)}–{fmt(c.max)} {c.unit}.
      </p>
      <ValueStrip
        label={c.label}
        unit={c.unit}
        mode={c.most_common}
        values={c.by_state.map((s) => ({ name: STATE_CODE_TO_NAME[s.state] ?? s.state, value: s.value }))}
      />
      <details className="text-xs text-fg-muted">
        <summary className="cursor-pointer text-water-link hover:underline">By climate region</summary>
        <table className="mt-2 w-full max-w-xl text-left">
          <thead>
            <tr className="border-b border-edge">
              <th className="py-1 pr-3 font-medium">NOAA climate region</th>
              <th className="py-1 pr-3 font-medium">States</th>
              <th className="py-1 pr-3 font-medium">Median ({c.unit})</th>
              <th className="py-1 font-medium">Range</th>
            </tr>
          </thead>
          <tbody>
            {c.by_region.map((r) => (
              <tr key={r.region} className="border-b border-edge/60">
                <td className="py-1 pr-3">{r.region}</td>
                <td className="py-1 pr-3">{r.states}</td>
                <td className="py-1 pr-3">{fmt(r.median)}</td>
                <td className="py-1">{r.min === r.max ? fmt(r.min) : `${fmt(r.min)}–${fmt(r.max)}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2">
          Climate signal: η² = {c.climate_eta2}, permutation p = {c.climate_p}. States:{" "}
          {c.by_state.map((s) => `${s.state} ${fmt(s.value)}`).join(" · ")}
        </p>
      </details>
    </div>
  );
}

export default function ModelManualPage() {
  const data = loadCriteria();
  const byKey = new Map((data?.criteria ?? []).map((c) => [c.key, c]));
  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium text-water">
          <Link href="/national/" className="hover:underline">
            ← National synthesis
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Draft national model manual
        </h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          Starting text for a voluntary national stormwater design manual that states could adopt by
          reference. Each provision proposes the value most states already use, and shows the
          state-by-state evidence behind it.
        </p>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
          A proposal for discussion, not adopted criteria. Evidence = state-level manuals whose values
          were read by hand against their quotes. Your state or local manual controls.
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">How the evidence sorts</h2>
        <div className="overflow-x-auto rounded-xl border border-edge bg-surface">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-edge text-xs text-fg-muted">
                <th className="px-3 py-2 font-medium">Criterion</th>
                <th className="px-3 py-2 font-medium">States</th>
                <th className="px-3 py-2 font-medium">Most common</th>
                <th className="px-3 py-2 font-medium">Class</th>
              </tr>
            </thead>
            <tbody>
              {(data?.criteria ?? []).map((c) => (
                <tr key={c.key} className="border-b border-edge/60">
                  <td className="px-3 py-2">{c.label}</td>
                  <td className="px-3 py-2">{c.states}</td>
                  <td className="px-3 py-2">
                    {fmt(c.most_common)} {c.unit} ({Math.round(c.agreement * 100)}%)
                  </td>
                  <td className="px-3 py-2">{CLASS_LABELS[c.class].label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <details className="text-sm text-fg-muted">
            <summary className="cursor-pointer hover:text-fg-secondary">Method</summary>
            <p className="mt-2 leading-relaxed">{data.method}</p>
          </details>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink">Provisions</h2>
        {PROVISIONS.map((p) => {
          const c = p.criterion ? byKey.get(p.criterion) : undefined;
          return (
            <article key={p.id} id={p.id.toLowerCase()} className="rounded-xl border border-edge/80 bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="font-mono text-xs font-semibold text-water-deep">{p.id}</span>
                <h3 className="font-display text-lg font-semibold text-ink">{p.title}</h3>
                <span className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLE[p.status]}`}>
                  {p.status}
                </span>
              </div>
              <p className="mt-2 leading-relaxed text-foreground">{p.text}</p>
              {p.regional && <p className="mt-2 text-sm leading-relaxed text-fg-secondary">{p.regional}</p>}
              {p.open && (
                <p className="mt-2 text-sm leading-relaxed text-amber-800 dark:text-amber-200">
                  <span className="font-medium">Open question:</span> {p.open}
                </p>
              )}
              {c && <Evidence c={c} />}
            </article>
          );
        })}
      </section>

      <p className="text-sm text-fg-muted">
        Data: <a href="/data/national/criteria-classification.json" className="underline">criteria-classification.json</a>{" "}
        · rebuilt with <code className="rounded bg-surface-muted px-1">npm run national:classify</code>.
      </p>
    </main>
  );
}
