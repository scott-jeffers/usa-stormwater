import { getManualListItems } from "@/lib/data";
import { ManualsExplorer } from "@/components/ManualsExplorer";
import { FederalGuidanceCard } from "@/components/FederalGuidanceCard";
import { isUsStateCode } from "@/lib/usStates";

export default function HomePage() {
  const manuals = getManualListItems();

  const statesCovered = new Set(
    manuals.map((m) => m.state_code).filter(isUsStateCode)
  ).size;

  // Records that share one PDF count once as a source manual.
  const sourceManuals = new Set(
    manuals.map((m) => m.document_url ?? m.landing_page_url ?? m.slug)
  ).size;
  const standIns = manuals.filter((m) => m.coverage_basis === "stand_in").length;

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
          {sourceManuals} source manuals · {manuals.length} jurisdiction records ·{" "}
          {statesCovered} states
          {standIns > 0 && (
            <>
              {" "}
              · <span title="Records that show another jurisdiction's manual as a placeholder">
                {standIns} stand-ins
              </span>
            </>
          )}
        </p>
      </header>

      <ManualsExplorer manuals={manuals} />

      <FederalGuidanceCard count={federalCount} />
    </main>
  );
}
