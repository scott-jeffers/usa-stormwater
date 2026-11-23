import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { SearchMeta } from "@/components/SiteSearch";
import { DetentionCalculator } from "@/components/DetentionCalculator";

export const metadata: Metadata = pageMeta(
  "/tools/detention/",
  "Detention and outlet calculator",
  "Size a detention basin outlet: NRCS hydrographs, stage-storage-discharge, orifices, weirs, riser, barrel and emergency spillway, routed storm by storm and checked against the model manual."
);

export default function DetentionToolPage() {
  return (
    <main className="w-data mx-auto space-y-6">
      <SearchMeta type="Resource" />
      <nav aria-label="Breadcrumb" className="text-sm text-fg-muted">
        <Link href="/resources/" className="text-water-link">Resources</Link> <span aria-hidden>/</span> Tools
      </nav>
      <header className="w-read space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Detention and outlet calculator</h1>
        <p className="text-fg-secondary">
          Builds NRCS runoff hydrographs before and after development, a stage-storage-discharge table for your basin and outlet,
          and routes every design storm through it. It then checks the result against{" "}
          <Link href="/manual/#s-7" className="text-water-link">Section 7 of the model manual</Link>, including the 100-year storm with the
          principal outlet blocked. It opens on the manual&rsquo;s <Link href="/manual/#appendix-c-worked-example-detention-basin" className="text-water-link">worked example</Link>.
        </p>
        <p className="draft-note">
          A teaching and checking tool, not a substitute for a sealed design. The engine reproduces a published HEC-1 routing to within 1 cfs
          and 0.05 ft (see the method notes below); use your jurisdiction&rsquo;s required software and rainfall for submittals.
        </p>
      </header>
      <DetentionCalculator />
      <section aria-labelledby="method" className="w-read space-y-2 border-t border-edge pt-6 text-sm text-fg-secondary">
        <h2 id="method" className="text-base font-semibold text-ink">Method</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Runoff: NRCS curve number with initial abstraction 0.2 S, applied to the cumulative 24-hour distribution at a 1-minute step.</li>
          <li>Hydrograph: NRCS dimensionless unit hydrograph (NEH 630 ch. 16), lag 0.6 Tc, peak rate factor 484.</li>
          <li>Routing: storage-indication (modified Puls), HEC-22 eq. 10.45, with the stage-storage-discharge table at 0.05 ft.</li>
          <li>Outlets: HEC-22 4th ed. orifice, weir, V-notch and riser equations; barrel by outlet-control full flow with free outfall. Tailwater is not modeled.</li>
          <li>Check: the engine reproduces the HEC-1 run in the Knoxville BMP Manual (ST-12): inflow 77.6 cfs (HEC-1: 78), routed peak 30.5 cfs (31), maximum stage 959.71 ft (959.72). The test runs on every build.</li>
        </ul>
        <p>
          Source code: <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/lib/detention/engine.ts" className="text-water-link">lib/detention/engine.ts</a>.
        </p>
      </section>
    </main>
  );
}
