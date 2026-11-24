import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { DATASET_VERSION } from "@/lib/dataset";
import { SearchMeta } from "@/components/SiteSearch";

export const metadata: Metadata = pageMeta(
  "/resources/",
  "Resources",
  "Open data downloads, the design archive of standard details and sample plans, federal guidance, and how the Stormwater Atlas is built and checked."
);

const ITEMS = [
  { href: "/data/", h: "Open data", p: `Every value as CSV and JSON with a data dictionary, citation file and changelog. Dataset ${DATASET_VERSION}, CC BY 4.0.` },
  { href: "/tools/detention/", h: "Detention and outlet calculator", p: "Route design storms through a basin and its orifices, weirs, riser, barrel and spillway, and check the result against Section 7 of the model manual." },
  { href: "/tools/hydrology/", h: "Time of concentration and peak flow calculator", p: "Build Tc from flow-path segments and compute rational and NRCS peaks before and after development, checked against Section 4 of the model manual." },
  { href: "/tools/compliance/", h: "Retention and volume credit calculator", p: "Credit retention for each practice and site-design measure and find the water-quality volume still to treat, under 3.8 and 3.9 of the model manual." },
  { href: "/tools/bioretention/", h: "Bioretention and phosphorus calculator", p: "Size bioretention by Darcy's law and storage, check the underdrain, drawdown and media test results, and estimate annual phosphorus removal, under 3.10 and 6.1 of the model manual." },
  { href: "/tools/hydraulics/", h: "Storm drain, inlet, culvert and channel calculator", p: "Size pipes, compute gutter spread and inlet interception, run the HGL with the FHWA access-hole method, find culvert headwater by HDS-5 and check channels against Section 8 of the model manual." },
  { href: "/archive/", h: "Design archive", p: "Standard detail libraries, CAD and PDF drawings, and worked design examples and sample plans published by public agencies." },
  { href: "/manual/evidence/", h: "Evidence for the model manual", p: "How each number in the model manual was chosen: state-by-state values, hand checks, agreement and climate tests." },
  { href: "/federal/", h: "Federal guidance", p: "EPA, FHWA and other federal stormwater manuals and how they relate to state requirements." },
  { href: "/about/", h: "About and methods", p: "Where the data comes from, how quotes are checked against the PDFs, what the grades mean, and how to report an error." },
];

export default function ResourcesPage() {
  return (
    <main className="w-read mx-auto space-y-8">
      <SearchMeta type="Resource" />
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Resources</h1>
      <ul className="divide-y divide-edge border-y border-edge">
        {ITEMS.map((i) => (
          <li key={i.href} className="py-4">
            <Link href={i.href} className="text-lg font-semibold text-water-link hover:underline">{i.h}</Link>
            <p className="mt-1 text-fg-secondary">{i.p}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
