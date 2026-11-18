import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { ValueStrip, withUnit } from "@/components/ValueStrip";
import { CLASS_LABELS, CRITERION_CLAUSE, loadCriteria, type CriterionEvidence } from "@/lib/national/modelManual";
import { clauseId, loadManual } from "@/lib/manual/parse";
import { inline } from "@/components/ManualText";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";

export const metadata: Metadata = pageMeta(
  "/national/model-manual/",
  "Evidence for the model manual",
  "State-by-state, hand-checked evidence behind each number in the draft model stormwater manual, with agreement and climate tests."
);

const fmt = (v: number | null) => (v == null ? "—" : String(Math.round(v * 100) / 100));

function Evidence({ c }: { c: CriterionEvidence }) {
  const cls = CLASS_LABELS[c.class];
  return (
    <div className="mt-4 space-y-2 border-t border-edge pt-4">
      <p className="text-sm text-fg-secondary">
        <span className="font-medium text-foreground">{cls.label}.</span> {cls.meaning}{" "}
        {c.states} states (from {c.records} hand-checked manuals); {Math.round(c.agreement * 100)}% use{" "}
        {withUnit(c.most_common, c.unit)}; range {c.min == null ? "—" : withUnit(c.min, c.unit)} to {c.max == null ? "—" : withUnit(c.max, c.unit)}.
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
  const manual = loadManual();
  const clause = new Map(manual.clauses.map((c) => [c.number, c]));
  const crit = data?.criteria ?? [];
  const order = Object.keys(CRITERION_CLAUSE);
  const sorted = [...crit].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  const states = new Set(crit.flatMap((c) => c.by_state.map((s) => s.state)));
  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <header className="space-y-3">
        <p className="text-sm font-medium">
          <Link href="/manual/" className="text-water-link hover:underline">
            ← {manual.title}, {manual.version}
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Evidence for the model manual
        </h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          The numbers graded E1 in the draft manual come from state-level manuals read by hand: {crit.length}{" "}
          criteria, {states.size} states. For each one this page shows what states require, how much they agree,
          and whether the differences follow climate.
        </p>
        <p className="draft-note">
          Evidence for a proposal, not adopted criteria. Your state or local manual controls.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">How the evidence sorts</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Criterion</th>
                <th>Clause</th>
                <th className="text-right">States</th>
                <th>Most common</th>
                <th>Class</th>
                <th className="text-right">Climate p</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c) => (
                <tr key={c.key}>
                  <td><a href={`#${c.key}`} className="text-water-link hover:underline">{c.label}</a></td>
                  <td className="tabular-nums">
                    {CRITERION_CLAUSE[c.key] ? (
                      <Link href={`/manual/#${clauseId(CRITERION_CLAUSE[c.key]!)}`} className="text-water-link hover:underline">
                        {CRITERION_CLAUSE[c.key]}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className="text-right tabular-nums">{c.states}</td>
                  <td className="tabular-nums">
                    {withUnit(c.most_common, c.unit)} ({Math.round(c.agreement * 100)}%)
                  </td>
                  <td>{CLASS_LABELS[c.class].label}</td>
                  <td className="text-right tabular-nums">{c.climate_p.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {data && (
          <details className="text-sm text-fg-muted">
            <summary className="cursor-pointer text-water-link hover:underline">Method</summary>
            <p className="mt-2 leading-relaxed">{data.method}</p>
          </details>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink">Criterion by criterion</h2>
        {sorted.map((c) => {
          const num = CRITERION_CLAUSE[c.key];
          const cl = num ? clause.get(num) : undefined;
          return (
            <article key={c.key} id={c.key} className="scroll-mt-20 rounded-lg border border-edge bg-surface p-5">
              <h3 className="font-display text-lg font-semibold text-ink">{c.label}</h3>
              {cl && (
                <p className="mt-2 leading-relaxed text-fg-secondary">
                  <Link href={`/manual/#${clauseId(cl.number)}`} className="font-semibold text-water-link hover:underline">
                    Clause {cl.number}
                  </Link>{" "}
                  {cl.tags.map((t) => (
                    <span key={t} className={`status-chip ${t === "Open" ? "status-open" : t === "Regional" ? "status-regional" : "status-neutral"}`}>{t}</span>
                  ))}{" "}
                  {inline(cl.text, c.key)}
                </p>
              )}
              <Evidence c={c} />
            </article>
          );
        })}
      </section>

      <p className="text-sm text-fg-muted">
        Data: <a href="/data/national/criteria-classification.json" className="text-water-link hover:underline">criteria-classification.json</a>
        {" · "}
        <a href="/data/hand-checks.csv" className="text-water-link hover:underline">hand-checks.csv</a> · rebuilt with{" "}
        <code className="rounded bg-surface-muted px-1">npm run national:classify</code>.
      </p>
    </main>
  );
}
