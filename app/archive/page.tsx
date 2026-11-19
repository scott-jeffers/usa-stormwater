import { SearchMeta } from "@/components/SiteSearch";
import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { getAllManuals } from "@/lib/data";
import { PRACTICE_LABELS, archiveCounts, loadExternalPlans, loadLibraries } from "@/lib/archive";
import { ArchiveBrowser } from "@/components/ArchiveBrowser";

export const metadata: Metadata = pageMeta(
  "/archive/",
  "Design archive: standard drawings and worked examples",
  "Find stormwater standard details (CAD and PDF), typical sections, worked design examples, sample plans and plan checklists from U.S. agencies, by practice, linked to the source."
);

export default function ArchivePage() {
  const libraries = loadLibraries();
  const plans = loadExternalPlans();
  const counts = archiveCounts();
  const manuals = getAllManuals().map((m) => ({
    slug: m.slug,
    name: m.data.document_metadata.jurisdiction_name,
    state: m.data.document_metadata.state_code,
  }));
  const partA = libraries.filter((l) => l.part.includes("A"));
  const partB = libraries.filter((l) => l.part.includes("B") && !l.part.includes("A"));
  return (
    <main className="w-data mx-auto space-y-12">
      <SearchMeta type="Resource" />
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Design archive</h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          Standard drawings and worked designs from U.S. stormwater agencies, sorted by practice: {libraries.length} agency
          libraries of CAD and PDF details, {counts.drawings.toLocaleString()} drawings found in {counts.drawingManuals} atlas manuals,{" "}
          {counts.examples.toLocaleString()} worked design examples and {counts.plans.toLocaleString()} sample plans and plan checklists.
        </p>
        <p className="draft-note">
          The drawings belong to the agencies that publish them: every entry links to the agency&rsquo;s own file or PDF page, and
          the atlas hosts no copies. Drawings and examples in the manuals were found automatically from page text, so some are
          missed (drawings with no text) and a few are mislabelled. Use the current agency version for design.
        </p>
        <nav aria-label="On this page" className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <a href="#libraries" className="text-water-link hover:underline">Agency CAD and PDF libraries</a>
          <a href="#drawings" className="text-water-link hover:underline">Drawings in the manuals</a>
          <a href="#examples" className="text-water-link hover:underline">Worked examples and sample plans</a>
        </nav>
      </header>

      <section id="libraries" className="scroll-mt-20 space-y-4">
        <h2 className="text-2xl font-semibold text-ink">Agency CAD and PDF libraries</h2>
        {[
          { title: "Permanent practices", rows: partA },
          { title: "Construction erosion and sediment control", rows: partB },
        ].map((g) => (
          <div key={g.title} className="space-y-2">
            <h3 className="text-lg font-semibold text-ink">{g.title}</h3>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Agency</th>
                    <th>State</th>
                    <th>Files</th>
                    <th>What it covers</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((l) => (
                    <tr key={l.id}>
                      <td className="min-w-[12rem]">
                        <a href={l.url} target="_blank" rel="noreferrer" className="font-medium text-water-link hover:underline">
                          {l.agency} ↗
                        </a>
                      </td>
                      <td>{l.state}</td>
                      <td className="whitespace-nowrap">{l.formats.join(", ")}</td>
                      <td className="min-w-[18rem] text-fg-secondary">
                        {l.description}
                        <div className="mt-1 text-xs text-fg-muted">{l.practices.map((p) => PRACTICE_LABELS[p] ?? p).join(" · ")}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>

      <section id="drawings" className="scroll-mt-20 space-y-3">
        <h2 className="text-2xl font-semibold text-ink">Drawings in the manuals</h2>
        <p className="max-w-3xl text-sm text-fg-secondary">
          Typical sections, plans, profiles and details printed inside the atlas manuals. Each opens the source PDF at its page.
        </p>
        <ArchiveBrowser practices={PRACTICE_LABELS} manuals={manuals} mode="drawings" />
      </section>

      <section id="examples" className="scroll-mt-20 space-y-3">
        <h2 className="text-2xl font-semibold text-ink">Worked examples and sample plans</h2>
        <p className="max-w-3xl text-sm text-fg-secondary">
          Step-by-step design calculations, sample plan sheets and plan-review checklists from the atlas manuals. Examples with no
          practice are tagged by topic (culverts, storm drains, hydrology and so on).
        </p>
        {plans.length > 0 && (
          <ul className="space-y-1 text-sm">
            {plans.map((p) => (
              <li key={p.id}>
                <a href={p.url} target="_blank" rel="noreferrer" className="font-medium text-water-link hover:underline">
                  {p.agency} ↗
                </a>{" "}
                <span className="text-fg-secondary">— {p.description}</span>
              </li>
            ))}
          </ul>
        )}
        <ArchiveBrowser practices={PRACTICE_LABELS} manuals={manuals} mode="examples" />
      </section>

      <p className="text-sm text-fg-muted">
        Downloads: <a href="/data/archive/libraries.json" className="text-water-link hover:underline">libraries.json</a>
        {" · "}
        <a href="/data/archive/drawings.csv" className="text-water-link hover:underline">drawings.csv</a>
        {" · "}
        <a href="/data/archive/examples.csv" className="text-water-link hover:underline">examples.csv</a> · see also the{" "}
        <Link href="/manual/" className="text-water-link hover:underline">draft model manual</Link>.
      </p>
    </main>
  );
}
