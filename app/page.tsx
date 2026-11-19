import Link from "next/link";
import { getManualListItems } from "@/lib/data";
import { CRITERIA, allRequirementValues, statsOf, fmtValue, fmtRange } from "@/lib/requirements";
import { loadManual } from "@/lib/manual/parse";
import { SiteSearch } from "@/components/SiteSearch";
import { DATASET_VERSION } from "@/lib/dataset";

const FEATURED = ["wqv_depth_inches", "max_drawdown_hours", "bioretention_media_depth_min_inches", "shwt_separation_inches", "stabilization_days", "basin_storage_cf_per_acre"];

export default function HomePage() {
  const manuals = getManualListItems();
  const own = manuals.filter((m) => m.coverage_basis === "own" || m.coverage_basis === "issuer");
  const sources = new Set(own.map((m) => m.document_url ?? m.landing_page_url ?? m.slug)).size;
  const states = new Set(manuals.map((m) => m.state_code).filter(Boolean)).size;
  const all = allRequirementValues();
  const nValues = [...all.values()].reduce((n, vs) => n + vs.length, 0);
  const manual = loadManual();

  return (
    <main className="mx-auto max-w-4xl space-y-12">
      <section className="space-y-5 pt-4 sm:pt-10">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">What does each U.S. stormwater manual actually require?</h1>
        <p className="max-w-2xl text-lg text-fg-secondary">
          Design values read from {sources} manuals in {states} states, each with the sentence and page it came from, and a draft national model manual built on them.
        </p>
        <SiteSearch variant="hero" />
        <p className="text-sm text-fg-muted">
          <span className="num">{nValues.toLocaleString("en-US")}</span> values · <span className="num">{manuals.length}</span> jurisdictions · dataset {DATASET_VERSION} · CC BY 4.0
        </p>
      </section>

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
