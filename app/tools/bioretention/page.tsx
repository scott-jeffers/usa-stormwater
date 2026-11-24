import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { SearchMeta } from "@/components/SiteSearch";
import { BioretentionCalculator } from "@/components/BioretentionCalculator";

export const metadata: Metadata = pageMeta(
  "/tools/bioretention/",
  "Bioretention and phosphorus calculator",
  "Size bioretention by Darcy's law and storage, check drawdown, the underdrain and media test results, and estimate annual phosphorus removal against the model manual."
);

export default function BioretentionToolPage() {
  return (
    <main className="w-data mx-auto space-y-6">
      <SearchMeta type="Resource" />
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/resources/" className="text-water-link">Resources</Link> <span aria-hidden>/</span> Tools
      </nav>
      <header className="w-read space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Bioretention and phosphorus calculator</h1>
        <p className="text-fg-secondary">
          Sizes a bioretention cell or filter by Darcy&rsquo;s law and by storage, checks that it drains in time, sizes the underdrain, checks
          laboratory results for the media, and estimates how much of the annual phosphorus load it removes. It applies <Link href="/manual/#c-6-1-5" className="text-water-link">6.1</Link> and <Link href="/manual/#c-3-10" className="text-water-link">3.10</Link> of
          the model manual and opens on the manual&rsquo;s <Link href="/manual/#appendix-g-worked-example-bioretention-and-phosphorus" className="text-water-link">worked example</Link>.
        </p>
        <p className="draft-note">
          A teaching and checking tool, not a substitute for a sealed design. The phosphorus estimate uses a placeholder media removal of 40%;
          use the efficiencies your state publishes where it has them.
        </p>
      </header>
      <BioretentionCalculator />
      <section aria-labelledby="method" className="w-read space-y-2 border-t border-edge pt-6 text-sm text-fg-secondary">
        <h2 id="method" className="text-base font-semibold text-ink">Method and checks</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Filter area by Darcy&rsquo;s law, Af = WQv·df / [k·(hf + df)·tf]. Reproduces the published examples of the Rhode Island manual (bioretention and dry swale), Clarksville, Tennessee, and Tarrant County, Texas (sand filter).</li>
          <li>Storage counts ponding, media voids of 0.25 and stone voids of 0.40 above the underdrain invert; the larger of the two areas governs (6.1.8).</li>
          <li>Underdrain capacity by Manning&rsquo;s equation flowing full, with the pipe engine behind the <Link href="/tools/hydraulics/" className="text-water-link underline">hydraulics calculator</Link>; the media flow uses the tested conductivity so that new media does not surcharge the pipe.</li>
          <li>Annual load by the Simple Method (Schueler, 1987); retained water carries no load and the rest leaves through the media at the removal entered.</li>
          <li>The tests run on every build: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/tests/bioretention.test.ts" className="text-water-link underline">tests/bioretention.test.ts</a>. Source: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/lib/bioretention/engine.ts" className="text-water-link underline">lib/bioretention/engine.ts</a>.</li>
        </ul>
      </section>
    </main>
  );
}
