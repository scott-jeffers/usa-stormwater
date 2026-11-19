import Link from "next/link";
import { getManualListItems } from "@/lib/data";
import { CRITERIA, allRequirementValues, statsOf, fmtValue, fmtRange } from "@/lib/requirements";
import { loadManual } from "@/lib/manual/parse";
import { SiteSearch } from "@/components/SiteSearch";
import { HomeMap, type MapLayer } from "@/components/HomeMap";
import { DATASET_VERSION } from "@/lib/dataset";

const MAP_LAYERS: Array<[string, string]> = [
  ["wqv_depth_inches", "Water-quality depth"],
  ["max_drawdown_hours", "Drawdown"],
  ["bioretention_media_depth_min_inches", "Bioretention media"],
  ["stabilization_days", "Stabilization"],
];

const FEATURED = ["wqv_depth_inches", "max_drawdown_hours", "bioretention_media_depth_min_inches", "shwt_separation_inches", "stabilization_days", "basin_storage_cf_per_acre"];

export default function HomePage() {
  const manuals = getManualListItems();
  const own = manuals.filter((m) => m.coverage_basis === "own" || m.coverage_basis === "issuer");
  const sources = new Set(own.map((m) => m.document_url ?? m.landing_page_url ?? m.slug)).size;
  const stateSet = new Set(manuals.map((m) => m.state_code).filter(Boolean));
  const states = stateSet.has("DC") ? `${stateSet.size - 1} states and DC` : `${stateSet.size} states`;
  const all = allRequirementValues();
  const nValues = [...all.values()].reduce((n, vs) => n + vs.length, 0);
  const manual = loadManual();

  const coverage: Record<string, number> = {};
  for (const m of own) if (m.state_code) coverage[m.state_code] = (coverage[m.state_code] ?? 0) + 1;
  const layers: MapLayer[] = [
    {
      key: "coverage",
      tab: "Coverage",
      title: "Manuals with their own rules, by state",
      unit: "count",
      byState: coverage,
      nByState: coverage,
      href: "/jurisdictions/",
      stateHref: "/jurisdictions/?state={state}",
      note: "State, county, city and district manuals.",
    },
    ...MAP_LAYERS.flatMap(([key, tab]): MapLayer[] => {
      const c = CRITERIA.find((x) => x.key === key);
      const vs = all.get(key) ?? [];
      const st = statsOf(vs);
      if (!c || !st) return [];
      const n: Record<string, number> = {};
      for (const v of vs) if (v.state && (v.basis === "own" || v.basis === "issuer")) n[v.state] = (n[v.state] ?? 0) + 1;
      return [{
        key,
        tab,
        title: `${c.label}, typical value by state`,
        unit: c.unit,
        byState: st.byState,
        nByState: n,
        href: `/requirements/${key}/`,
        stateHref: `/requirements/${key}/?state={state}#all`,
        note: `Most common nationally: ${fmtValue(st.mode, c.unit)} (${st.modeCount} of ${st.n} manuals).`,
      }];
    }),
  ];

  return (
    <main className="mx-auto max-w-6xl space-y-10">

      <div className="grid items-start gap-8 pt-2 sm:pt-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <section className="space-y-5 lg:pt-6">
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.5rem] lg:leading-tight">What does each U.S. stormwater manual actually require?</h1>
          <p className="text-lg text-fg-secondary">
            Design values read from {sources} manuals in {states}, each with the sentence and page it came from, and a draft national model manual built on them.
          </p>
          <SiteSearch variant="hero" />
          <p className="text-sm text-fg-muted">
            <span className="num">{nValues.toLocaleString("en-US")}</span> values · <span className="num">{manuals.length}</span> jurisdictions · dataset {DATASET_VERSION} · CC BY 4.0
          </p>
        </section>
        <HomeMap layers={layers} />
      </div>

      <section aria-label="Start" className="grid gap-px overflow-hidden rounded-md border border-edge bg-edge md:grid-cols-3">
        {[
          { href: "/requirements/", h: "Look up a requirement", p: "One page per design value: the national range, the most common value, a map, and every manual's quote." },
          { href: "/jurisdictions/", h: "Find a jurisdiction", p: "Every federal, state, county and city manual, with its requirements and a link to the PDF." },
          { href: "/manual/", h: "Read the model manual", p: `${manual.version}: ${manual.clauses.length} clauses, each graded by how much evidence stands behind it.` },
        ].map((t) => (
          <Link key={t.href} href={t.href} className="group bg-surface p-5 hover:bg-surface-muted">
            <h2 className="font-semibold text-water-link group-hover:underline">{t.h} →</h2>
            <p className="mt-1.5 text-sm text-fg-secondary">{t.p}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="glance" className="space-y-3">
        <h2 id="glance" className="text-lg font-semibold text-ink">At a glance</h2>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Requirement</th>
                <th className="text-right">Most common</th>
                <th className="hidden text-right sm:table-cell">Range</th>
                <th className="hidden text-right sm:table-cell">Manuals</th>
              </tr>
            </thead>
            <tbody>
              {FEATURED.map((k) => {
                const c = CRITERIA.find((x) => x.key === k)!;
                const s = statsOf(all.get(k) ?? []);
                if (!s) return null;
                return (
                  <tr key={k}>
                    <td><Link href={`/requirements/${k}/`} className="font-medium text-water-link hover:underline">{c.label}</Link></td>
                    <td className="num whitespace-nowrap text-right font-medium">{fmtValue(s.mode, c.unit)}</td>
                    <td className="num hidden whitespace-nowrap text-right text-fg-secondary sm:table-cell">{fmtRange(s.min, s.max, c.unit)}</td>
                    <td className="num hidden text-right sm:table-cell">{s.n}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-sm"><Link href="/requirements/" className="font-medium text-water-link hover:underline">All {CRITERIA.length} requirements →</Link></p>
      </section>

      <section className="grid gap-6 border-t border-edge pt-8 text-sm sm:grid-cols-3">
        <div>
          <h2 className="font-semibold text-ink"><Link href="/compare/" className="text-water-link hover:underline">Compare</Link></h2>
          <p className="mt-1 text-fg-secondary">Put up to four jurisdictions side by side; differences are highlighted.</p>
        </div>
        <div>
          <h2 className="font-semibold text-ink"><Link href="/data/" className="text-water-link hover:underline">Open data</Link></h2>
          <p className="mt-1 text-fg-secondary">Every value as CSV and JSON, with a data dictionary and citation file.</p>
        </div>
        <div>
          <h2 className="font-semibold text-ink"><Link href="/archive/" className="text-water-link hover:underline">Design archive</Link></h2>
          <p className="mt-1 text-fg-secondary">Standard detail libraries, drawings and worked examples from public agencies.</p>
        </div>
      </section>
    </main>
  );
}
