import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { SearchMeta } from "@/components/SiteSearch";
import { HydrologyCalculator } from "@/components/HydrologyCalculator";

export const metadata: Metadata = pageMeta(
  "/tools/hydrology/",
  "Time of concentration and peak flow calculator",
  "Compute time of concentration by segments, rational-method and NRCS peak flows before and after development, and the difference between weighted and separate curve numbers, checked against the model manual."
);

export default function HydrologyToolPage() {
  return (
    <main className="w-data mx-auto space-y-6">
      <SearchMeta type="Resource" />
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/resources/" className="text-water-link">Resources</Link> <span aria-hidden>/</span> Tools
      </nav>
      <header className="w-read space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Time of concentration and peak flow calculator</h1>
        <p className="text-fg-secondary">
          Builds the time of concentration from sheet, shallow concentrated and channel segments, then computes rational-method and NRCS
          peak flows before and after development, with impervious and pervious runoff computed both by a weighted curve number and
          separately. It checks the inputs against <Link href="/manual/#s-4" className="text-water-link">Section 4 of the model manual</Link> and opens on
          the manual&rsquo;s <Link href="/manual/#appendix-e-worked-example-site-hydrology" className="text-water-link">worked example</Link>.
        </p>
        <p className="draft-note">
          A teaching and checking tool, not a substitute for a sealed design. Enter NOAA Atlas 14 rainfall for your site; the example&rsquo;s
          intensities are illustrative.
        </p>
      </header>
      <HydrologyCalculator />
      <section aria-labelledby="method" className="w-read space-y-2 border-t border-edge pt-6 text-sm text-fg-secondary">
        <h2 id="method" className="text-base font-semibold text-ink">Method and checks</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Time of concentration: TR-55 sheet-flow equation (3-3) with Table 3-1 roughness, shallow concentrated velocities from TR-55 Figure 3-1 and HDS-2 Table 4.3, and channel or pipe velocities you enter. Reproduces HEC-22 Example 4.2.</li>
          <li>Rational method: area-weighted C, intensity at Tc interpolated log-log from your table, frequency factors 1.1, 1.2 and 1.25 for 25, 50 and 100 years with C·Cf capped at 1.0. Reproduces HEC-22 Examples 4.1 and 4.3.</li>
          <li>NRCS: curve-number runoff (Ia = 0.2 S), the NRCS dimensionless unit hydrograph with lag 0.6 Tc at a 1-minute step, Type II or III rainfall. The hydrograph engine is the one behind the <Link href="/tools/detention/" className="text-water-link underline">detention calculator</Link>, tested against a published HEC-1 run; the unit peak reproduces HEC-22 Example 4.4.</li>
          <li>The tests run on every build: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/tests/hydrology.test.ts" className="text-water-link underline">tests/hydrology.test.ts</a>. Source: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/lib/hydrology/engine.ts" className="text-water-link underline">lib/hydrology/engine.ts</a>.</li>
        </ul>
      </section>
    </main>
  );
}
