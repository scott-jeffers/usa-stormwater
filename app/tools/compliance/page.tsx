import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { SearchMeta } from "@/components/SiteSearch";
import { ComplianceCalculator } from "@/components/ComplianceCalculator";

export const metadata: Metadata = pageMeta(
  "/tools/compliance/",
  "Retention and volume credit calculator",
  "Account for a site's water-quality volume: credit retention for each practice and site-design measure under the model manual's credit table, and find the volume that must still be treated."
);

export default function ComplianceToolPage() {
  return (
    <main className="w-data mx-auto space-y-6">
      <SearchMeta type="Resource" />
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/resources/" className="text-water-link">Resources</Link> <span aria-hidden>/</span> Tools
      </nav>
      <header className="w-read space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Retention and volume credit calculator</h1>
        <p className="text-fg-secondary">
          Computes the site&rsquo;s water-quality volume, credits the retention each practice and site-design measure provides, caps each at the
          volume of its own drainage area, and reports what is left to treat. It applies <Link href="/manual/#c-3-8" className="text-water-link">3.8 and 3.9
          of the model manual</Link> and opens on the manual&rsquo;s <Link href="/manual/#appendix-f-worked-example-site-design-and-volume-credits" className="text-water-link">worked example</Link>.
        </p>
        <p className="draft-note">
          A teaching and checking tool, not a substitute for a sealed design. The credits are Draft 0.x proposals; only four states publish a
          credit for each practice, so check the rules of the state or city where the site is.
        </p>
      </header>
      <ComplianceCalculator />
      <section aria-labelledby="method" className="w-read space-y-2 border-t border-edge pt-6 text-sm text-fg-secondary">
        <h2 id="method" className="text-base font-semibold text-ink">Method and checks</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>WQv by the unified formula (4.2), with the impervious share reduced by any tree credit (3.8.5).</li>
          <li>Storage-based credits (infiltrating and underdrained practices, green roofs, harvesting) apply to the storage entered, following New York, Georgia&rsquo;s coastal supplement and West Virginia. Flow-through credits (disconnection, conservation areas, grass channels) apply to the WQv of the area draining to the measure, following the Runoff Reduction Method.</li>
          <li>Each measure&rsquo;s credit is capped at the WQv of its own drainage area, and the drainage areas may not add up to more than the site.</li>
          <li>The evidence for each credit is on the <Link href="/manual/evidence/#site-design" className="text-water-link underline">evidence page</Link>. The tests run on every build: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/tests/credits.test.ts" className="text-water-link underline">tests/credits.test.ts</a>. Source: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/lib/credits/engine.ts" className="text-water-link underline">lib/credits/engine.ts</a>.</li>
        </ul>
      </section>
    </main>
  );
}
