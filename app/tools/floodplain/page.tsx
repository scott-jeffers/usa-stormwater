import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { SearchMeta } from "@/components/SiteSearch";
import { FloodplainCalculator } from "@/components/FloodplainCalculator";

export const metadata: Metadata = pageMeta(
  "/tools/floodplain/",
  "Floodplain, bridge and tidal outfall calculator",
  "Check compensatory storage band by band, lowest-floor and bridge freeboard, the allowable rise in flood elevations, and a tidal tailwater with a sea-level-rise allowance against the model manual."
);

export default function FloodplainToolPage() {
  return (
    <main className="w-data mx-auto space-y-6">
      <SearchMeta type="Resource" />
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/resources/" className="text-water-link">Resources</Link> <span aria-hidden>/</span> Tools
      </nav>
      <header className="w-read space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Floodplain, bridge and tidal outfall calculator</h1>
        <p className="text-fg-secondary">
          Checks a project in or beside a floodplain: the lowest floor against the base flood elevation, fill against compensatory storage one
          elevation band at a time, the rise in flood levels, a bridge&rsquo;s freeboard, and the design tailwater of a tidal outfall with a
          sea-level-rise allowance over its service life. It applies <Link href="/manual/#c-8-8" className="text-water-link">8.8–8.10 of the model manual</Link> and
          opens on the manual&rsquo;s <Link href="/manual/#appendix-i-worked-example-floodplain-bridge-and-tidal-outfall" className="text-water-link">worked example</Link>.
        </p>
        <p className="draft-note">
          A teaching and checking tool, not a substitute for a sealed design or a floodplain permit. The community&rsquo;s floodplain ordinance
          controls where it is stricter; the example&rsquo;s sea-level projection is illustrative.
        </p>
      </header>
      <FloodplainCalculator />
      <section aria-labelledby="method" className="w-read space-y-2 border-t border-edge pt-6 text-sm text-fg-secondary">
        <h2 id="method" className="text-base font-semibold text-ink">Method and checks</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Compensatory storage is checked in each elevation band separately: cut in a higher band does not make up for fill in a lower one.</li>
          <li>Bridge freeboard is the larger of the entered freeboard and the velocity head V²/2g, as Maricopa County requires.</li>
          <li>The sea-level-rise allowance is the projected rise at the end of the service life minus the rise at the start, interpolated linearly in the projection table. It reproduces the examples of the Texas DOT Hydraulic Design Manual and Corpus Christi.</li>
          <li>The tests run on every build: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/tests/floodplain.test.ts" className="text-water-link underline">tests/floodplain.test.ts</a>. Source: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/lib/floodplain/engine.ts" className="text-water-link underline">lib/floodplain/engine.ts</a>.</li>
        </ul>
      </section>
    </main>
  );
}
