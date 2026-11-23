import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { SearchMeta } from "@/components/SiteSearch";
import { HydraulicsCalculator } from "@/components/HydraulicsCalculator";

export const metadata: Metadata = pageMeta(
  "/tools/hydraulics/",
  "Storm drain, inlet, culvert and channel calculator",
  "Size storm drain pipes, compute gutter spread and inlet interception, run the HGL through a storm drain with the FHWA access-hole method, find culvert headwater by HDS-5, and check channels, all against the model manual."
);

export default function HydraulicsToolPage() {
  return (
    <main className="w-data mx-auto space-y-6">
      <SearchMeta type="Resource" />
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/resources/" className="text-water-link">Resources</Link> <span aria-hidden>/</span> Tools
      </nav>
      <header className="w-read space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Storm drain, inlet, culvert and channel calculator</h1>
        <p className="text-fg-secondary">
          Five conveyance calculations in one place: pipe sizing, gutter spread and inlet interception, the hydraulic grade line through a storm
          drain, culvert headwater, and open channels. Each checks its result against{" "}
          <Link href="/manual/#s-8" className="text-water-link">Section 8 of the model manual</Link> and opens on the manual&rsquo;s{" "}
          <Link href="/manual/#appendix-d-worked-example-storm-drain-culvert-and-channel" className="text-water-link">worked example</Link>.
        </p>
        <p className="draft-note">
          A teaching and checking tool, not a substitute for a sealed design. The engine reproduces the worked examples of FHWA HEC-22 and the
          HDS-5 culvert examples listed below; use your jurisdiction&rsquo;s required methods and software for submittals.
        </p>
      </header>
      <HydraulicsCalculator />
      <section aria-labelledby="method" className="w-read space-y-2 border-t border-edge pt-6 text-sm text-fg-secondary">
        <h2 id="method" className="text-base font-semibold text-ink">Method and checks</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Pipes and channels: Manning&rsquo;s equation for any depth in circular pipes, boxes and trapezoidal channels; normal and critical depth by bisection. Reproduces HEC-22 Example 9.1 and HDS-4 Examples 4.1, 4.2 and 4.5.</li>
          <li>Gutters and inlets: HEC-22 4th edition equations 5.2–5.8 and 7.3–7.21, with the exponents as HEC-22 prints them. Reproduces Examples 5.1, 5.2 and 7.1–7.6.</li>
          <li>Storm drain HGL: HEC-22 Tables 9.6 and 9.7 at pipe ends, a water-surface profile along partly full pipes, and the FHWA access-hole method (eq. 9.13–9.31) for benching, angled and plunging inflow. Reproduces the energy levels of Example 9.2 to within 0.05 ft.</li>
          <li>Culverts: HDS-5 (2012) inlet-control equations with Table C.1 coefficients, interpolated between 3.5 and 4.0 for Q/AD<sup>0.5</sup>, and the outlet-control energy equation. Reproduces the HDS-5 box and pipe examples in the Mississippi DOT drainage manual (HW/D 1.27, 1.33, 1.92 and 2.3) and HDS-4 Example 9.1.</li>
          <li>The tests run on every build: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/tests/hydraulics.test.ts" className="text-water-link underline">tests/hydraulics.test.ts</a>.</li>
        </ul>
        <p>
          Source code: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/lib/hydraulics/engine.ts" className="text-water-link underline">lib/hydraulics/engine.ts</a>.
          See also the <Link href="/tools/detention/" className="text-water-link underline">detention and outlet calculator</Link>.
        </p>
      </section>
    </main>
  );
}
