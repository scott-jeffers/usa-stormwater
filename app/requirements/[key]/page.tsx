import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta } from "@/lib/site";
import { CRITERIA, getCriterion, allRequirementValues, statsOf, fmtValue, fmtRange } from "@/lib/requirements";
import { loadManual, clauseId } from "@/lib/manual/parse";
import { inline, Chip, TAG_STYLE, GRADE_STYLE, GRADE_MEANING } from "@/components/ManualText";
import { ValueStrip } from "@/components/ValueStrip";
import { RequirementExplorer } from "@/components/RequirementExplorer";
import { SearchMeta } from "@/components/SiteSearch";

export const dynamicParams = false;
export function generateStaticParams() {
  return CRITERIA.map((c) => ({ key: c.key }));
}

export async function generateMetadata({ params }: { params: Promise<{ key: string }> }): Promise<Metadata> {
  const { key } = await params;
  const c = getCriterion(key);
  if (!c) return {};
  const s = statsOf(allRequirementValues().get(key) ?? []);
  return pageMeta(
    `/requirements/${key}/`,
    c.label,
    s
      ? `${c.label} in ${s.n} U.S. stormwater manuals across ${s.states} states: most common ${fmtValue(s.mode, c.unit)}, range ${fmtRange(s.min, s.max, c.unit)}, with source quotes.`
      : `${c.label} in U.S. stormwater manuals.`
  );
}

export default async function RequirementPage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const c = getCriterion(key);
  if (!c) notFound();
  const values = allRequirementValues().get(key) ?? [];
  const s = statsOf(values);
  const manual = loadManual();
  const clause = c.clause ? manual.clauses.find((x) => x.number === c.clause) : undefined;
  const own = values.filter((v) => v.basis === "own" || v.basis === "issuer");

  return (
    <main className="w-data mx-auto space-y-8">
      <SearchMeta type="Requirement" />
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/requirements/" className="text-water-link hover:underline">Requirements</Link> <span aria-hidden>/</span> {c.group}
      </nav>
      <header className="w-read space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{c.label}</h1>
        <p className="text-fg-secondary">{c.means}</p>
      </header>

      {s ? (
        <section aria-label="Summary" className="grid gap-px overflow-hidden rounded-md border border-edge bg-edge sm:grid-cols-4">
          {[
            ["Most common", fmtValue(s.mode, c.unit), `${s.modeCount} of ${s.n} manuals`],
            ["Median", fmtValue(s.median, c.unit), "each manual counted once"],
            ["Range", fmtRange(s.min, s.max, c.unit), "lowest to highest"],
            ["Coverage", `${s.n} manuals`, `${s.states} states`],
          ].map(([k, v, sub]) => (
            <div key={k} className="bg-surface p-4">
              <div className="text-xs font-medium uppercase tracking-wide text-fg-muted">{k}</div>
              <div className="num mt-1 text-2xl font-semibold text-ink">{v}</div>
              <div className="text-xs text-fg-muted">{sub}</div>
            </div>
          ))}
        </section>
      ) : (
        <p className="text-fg-muted">No manual with its own rules states this value yet.</p>
      )}

      {clause && (
        <section aria-labelledby="mm" className="w-read rounded-md border-l-4 border-water bg-surface p-4">
          <h2 id="mm" className="text-sm font-semibold text-ink">
            Proposed in the model manual,{" "}
            <Link href={`/manual/#${clauseId(clause.number)}`} className="text-water-link hover:underline">§{clause.number}{clause.title ? ` ${clause.title}` : ""}</Link>
          </h2>
          <p className="mt-1 text-sm text-fg-secondary">
            {clause.tags.map((t) => <Chip key={t} kind={TAG_STYLE[t]!} label={t} />)}{" "}
            {clause.grade ? <Chip kind={GRADE_STYLE[clause.grade]!} label={clause.grade} title={GRADE_MEANING[clause.grade]} /> : null} {inline(clause.text)}
          </p>
        </section>
      )}

      {own.length > 1 && (
        <section aria-labelledby="dist" className="space-y-2">
          <h2 id="dist" className="text-lg font-semibold text-ink">Distribution</h2>
          <p className="text-sm text-fg-muted">One dot per manual; the most common value is highlighted.</p>
          <ValueStrip label={c.label} unit={c.unit} values={own.map((v) => ({ name: v.name, value: v.value }))} mode={s?.mode ?? null} />
        </section>
      )}

      <section aria-labelledby="all" className="space-y-3">
        <h2 id="all" className="text-lg font-semibold text-ink">Every value</h2>
        <RequirementExplorer rows={values} unit={c.unit} byState={s?.byState ?? {}} criterionKey={c.key} />
      </section>
    </main>
  );
}
