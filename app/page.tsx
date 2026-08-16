import Link from "next/link";
import { getManualListItems } from "@/lib/data";
import { ManualsExplorer } from "@/components/ManualsExplorer";
import { FederalGuidanceCard } from "@/components/FederalGuidanceCard";
import { isUsStateCode } from "@/lib/usStates";

export default function HomePage() {
  const manuals = getManualListItems();

  const statesCovered = new Set(
    manuals.map((m) => m.state_code).filter(isUsStateCode)
  ).size;

  const highConfidenceCount = manuals.filter(
    (m) => m.confidence === "high" && !m.needs_human_review
  ).length;
  const federalCount = manuals.filter(
    (m) => m.jurisdiction_level === "federal"
  ).length;

  return (
    <main className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Stormwater design manuals, in one place
        </h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          Browse U.S. federal, state, county, and city manuals.
        </p>
        <p className="pt-1 text-sm text-fg-muted">
          {manuals.length} manuals · {statesCovered} states
          {highConfidenceCount > 0 ? (
            <> · {highConfidenceCount} high-confidence extractions</>
          ) : null}
        </p>
        <p className="text-xs text-fg-muted">
          Automated extractions with cited excerpts — always verify against the{" "}
          <Link href="/about/#needs-review" className="text-water-link hover:underline">
            official PDF
          </Link>
          .
        </p>
      </header>

      <ManualsExplorer manuals={manuals} />

      <FederalGuidanceCard count={federalCount} />
    </main>
  );
}
