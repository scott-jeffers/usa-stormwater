import { SearchMeta } from "@/components/SiteSearch";
import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { ValueStrip, withUnit } from "@/components/ValueStrip";
import { CLASS_LABELS, CRITERION_CLAUSE, DET_CRITERION_CLAUSE, ESC_CRITERION_CLAUSE, loadCriteria, loadDetCriteria, loadEscCriteria, type CriterionEvidence } from "@/lib/national/modelManual";
import type { Clause } from "@/lib/manual/parse";
import { clauseId, loadManual } from "@/lib/manual/parse";
import { inline } from "@/components/ManualText";
import { STATE_CODE_TO_NAME } from "@/lib/usStates";

export const metadata: Metadata = pageMeta(
  "/manual/evidence/",
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

function EvidenceGroup({
  id,
  title,
  intro,
  crit,
  clauseMap,
  clause,
}: {
  id: string;
  title: string;
  intro: string;
  crit: CriterionEvidence[];
  clauseMap: Record<string, string>;
  clause: Map<string, Clause>;
}) {
  const order = Object.keys(clauseMap);
  const sorted = [...crit].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="text-2xl font-semibold text-ink">{title}</h2>
      <p className="text-sm leading-relaxed text-fg-secondary">{intro}</p>
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
                  {clauseMap[c.key] ? (
                    <Link href={`/manual/#${clauseId(clauseMap[c.key]!)}`} className="text-water-link hover:underline">
                      {clauseMap[c.key]}
                    </Link>
                  ) : "—"}
                </td>
                <td className="text-right tabular-nums">{c.states}</td>
                <td className="tabular-nums">{withUnit(c.most_common, c.unit)} ({Math.round(c.agreement * 100)}%)</td>
                <td>{CLASS_LABELS[c.class].label}</td>
                <td className="text-right tabular-nums">{c.climate_p.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {sorted.map((c) => {
        const num = clauseMap[c.key];
        const cl = num ? clause.get(num) : undefined;
        return (
          <article key={c.key} id={c.key} className="scroll-mt-20 rounded-lg border border-edge bg-surface p-5">
            <h3 className="text-lg font-semibold text-ink">{c.label}</h3>
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
  );
}

export default function ModelManualPage() {
  const data = loadCriteria();
  const esc = loadEscCriteria();
  const det = loadDetCriteria();
  const detCrit = det?.criteria ?? [];
  const detStates = new Set(detCrit.flatMap((c) => c.by_state.map((s) => s.state)));
  const manual = loadManual();
  const clause = new Map(manual.clauses.map((c) => [c.number, c]));
  const crit = data?.criteria ?? [];
  const escCrit = esc?.criteria ?? [];
  const states = new Set(crit.flatMap((c) => c.by_state.map((s) => s.state)));
  const escStates = new Set(escCrit.flatMap((c) => c.by_state.map((s) => s.state)));
  return (
    <main className="mx-auto max-w-3xl space-y-10">
      <SearchMeta type="Model manual" />
      <header className="space-y-3">
        <p className="text-sm font-medium">
          <Link href="/manual/" className="text-water-link hover:underline">
            ← {manual.title}, {manual.version}
          </Link>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Evidence for the model manual
        </h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          The numbers graded E1 in the draft manual come from manuals read by hand. For each criterion this page shows
          what states require, how much they agree, and whether the differences follow climate.
        </p>
        <p className="draft-note">
          Evidence for a proposal, not adopted criteria. Your state or local manual controls.
        </p>
        <p className="text-sm">
          <a href="#part-a" className="text-water-link hover:underline">Part A: permanent stormwater</a>
          {" · "}
          <a href="#detention" className="text-water-link hover:underline">Detention, outlets and spillways</a>
          {" · "}
          <a href="#part-b" className="text-water-link hover:underline">Part B: construction erosion and sediment control</a>
        </p>
        {data && (
          <details className="text-sm text-fg-muted">
            <summary className="cursor-pointer text-water-link hover:underline">Method</summary>
            <p className="mt-2 leading-relaxed">{data.method}</p>
          </details>
        )}
      </header>

      <EvidenceGroup
        id="part-a"
        title="Part A: permanent stormwater"
        intro={`State-level manuals read by hand: ${crit.length} criteria, ${states.size} states.`}
        crit={crit}
        clauseMap={CRITERION_CLAUSE}
        clause={clause}
      />
      <EvidenceGroup
        id="detention"
        title="Detention, outlets and spillways (Section 7)"
        intro={`State, local and federal manuals read by hand: ${detCrit.length} criteria, ${detStates.size} states. One value per state is the median of its manuals; federal manuals are listed in the data but not counted as a state.`}
        crit={detCrit}
        clauseMap={DET_CRITERION_CLAUSE}
        clause={clause}
      />
      <EvidenceGroup
        id="part-b"
        title="Part B: construction erosion and sediment control"
        intro={`State and local manuals read by hand (many states publish construction handbooks separately): ${escCrit.length} criteria, ${escStates.size} states. One value per state is the median of its manuals.`}
        crit={escCrit}
        clauseMap={ESC_CRITERION_CLAUSE}
        clause={clause}
      />

      <p className="text-sm text-fg-muted">
        Data: <a href="/data/national/criteria-classification.json" className="text-water-link hover:underline">criteria-classification.json</a>
        {" · "}
        <a href="/data/national/esc-classification.json" className="text-water-link hover:underline">esc-classification.json</a>
        {" · "}
        <a href="/data/hand-checks.csv" className="text-water-link hover:underline">hand-checks.csv</a>
        {" · "}
        <a href="/data/esc-checks.csv" className="text-water-link hover:underline">esc-checks.csv</a>
        {" · "}
        <a href="/data/det-checks.csv" className="text-water-link hover:underline">det-checks.csv</a> · rebuilt with{" "}
        <code className="rounded bg-surface-muted px-1">npm run national:classify</code>.
      </p>
    </main>
  );
}
