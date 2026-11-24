import Link from "next/link";
import { getManualListItems } from "@/lib/data";
import { CRITERIA, allRequirementValues, statsOf, fmtValue, fmtRange } from "@/lib/requirements";
import { loadManual } from "@/lib/manual/parse";
import { SiteSearch } from "@/components/SiteSearch";
import { HomeMap, type MapLayer } from "@/components/HomeMap";
import { DATASET_VERSION } from "@/lib/dataset";
import { archiveCounts, loadLibraries, loadExternalPlans } from "@/lib/archive";

const REPO = "https://github.com/scott-jeffers/usa-stormwater";

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
  const arc = archiveCounts();
  const libraries = loadLibraries().length;
  const extPlans = loadExternalPlans().length;

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
        <section className="space-y-5 lg:pt-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-water-link">An open research project</p>
          <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl lg:text-[2.5rem] lg:leading-tight">
            Every U.S. stormwater design manual, read and made searchable
          </h1>
          <p className="text-lg text-fg-secondary">
            Stormwater Atlas collects the country&rsquo;s stormwater design manuals and reads what each one actually requires: {sources} manuals across {states} so far, with every value tied to the sentence and PDF page it came from.
          </p>
          <p className="text-fg-secondary">
            The goal is a shared, checkable record that engineers can use in design today, and a starting point for a conversation about a national stormwater standard.
          </p>
          <SiteSearch variant="hero" />
          <p className="text-sm text-fg-muted">
            <span className="num">{nValues.toLocaleString("en-US")}</span> values · <span className="num">{manuals.length}</span> jurisdictions · dataset {DATASET_VERSION} · CC BY 4.0
          </p>
        </section>
        <HomeMap layers={layers} />
      </div>

      <section aria-labelledby="aims" className="space-y-4">
        <h2 id="aims" className="text-lg font-semibold text-ink">What the project does</h2>
        <ol className="grid gap-px overflow-hidden rounded-md border border-edge bg-edge md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: "1",
              h: "A database of manuals",
              p: `${manuals.length} federal, state, county and city jurisdictions, with ${nValues.toLocaleString("en-US")} design values read from their manuals. Each value carries its quote, its page and whether it was checked against the PDF.`,
              links: [["/requirements/", "Requirements"], ["/jurisdictions/", "Jurisdictions"], ["/compare/", "Compare"]],
            },
            {
              n: "2",
              h: "Links for design work",
              p: `Where to find the drawings and examples behind the rules: ${libraries} standard-detail libraries, ${arc.drawings} drawings, and ${arc.examples + arc.plans + extPlans} worked examples and sample plans from public agencies, plus calculators for site hydrology, detention outlets, and storm drains, inlets, culverts and channels.`,
              links: [["/archive/", "Design archive"], ["/tools/hydrology/", "Hydrology"], ["/tools/compliance/", "Credits"], ["/tools/detention/", "Detention"], ["/tools/hydraulics/", "Hydraulics"]],
            },
            {
              n: "3",
              h: "Open data and an API",
              p: "Everything is published as CSV and JSON at stable addresses, with no key or account, under CC BY 4.0, for spreadsheets, scripts, research and other tools.",
              links: [["/data/", "Data and API"], ["/data/values.csv", "values.csv"]],
            },
            {
              n: "4",
              h: "Toward a national standard",
              p: `A draft model manual (${manual.clauses.length} clauses) built from what the manuals agree on, with each number graded by how much evidence supports it. It is published for review and comment.`,
              links: [["/manual/", "Model manual"], ["/manual/evidence/", "Evidence"], [`${REPO}/issues`, "Comment on GitHub"]],
            },
          ].map((a) => (
            <li key={a.n} className="flex flex-col bg-surface p-5">
              <span className="num text-sm font-semibold text-fg-faint">{a.n}</span>
              <h3 className="mt-1 font-semibold text-ink">{a.h}</h3>
              <p className="mt-1.5 flex-1 text-sm text-fg-secondary">{a.p}</p>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {a.links.map(([href, label]) => (
                  <a key={href} href={href} className="font-medium text-water-link">
                    {label} →
                  </a>
                ))}
              </p>
            </li>
          ))}
        </ol>
        <p className="text-sm text-fg-muted">
          This is research, not regulation. Values are read from published documents and may be out of date or misread; confirm against the agency&rsquo;s current manual before using one in design, and{" "}
          <a href={`${REPO}/issues/new`} className="text-water-link">report anything wrong</a>.
        </p>
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

    </main>
  );
}
