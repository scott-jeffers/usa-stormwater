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
