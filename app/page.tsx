import { getManualListItems } from "@/lib/data";
import { ManualsExplorer } from "@/components/ManualsExplorer";
import { isUsStateCode } from "@/lib/usStates";

export default function HomePage() {
  const manuals = getManualListItems();

  const statesCovered = new Set(
    manuals.map((m) => m.state_code).filter(isUsStateCode)
  ).size;

  const needsReviewCount = manuals.filter((m) => m.needs_human_review).length;

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
          {needsReviewCount > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="text-orange-600 dark:text-orange-400">
                {needsReviewCount} need review
              </span>
            </>
          ) : null}
        </p>
      </header>

      <ManualsExplorer manuals={manuals} />
    </main>
  );
}
