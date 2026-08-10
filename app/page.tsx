import { getAllManuals } from "@/lib/data";
import { ManualsExplorer } from "@/components/ManualsExplorer";
import { isUsStateCode } from "@/lib/usStates";

export default function HomePage() {
  const manuals = getAllManuals();

  const statesCovered = new Set(
    manuals
      .map((m) => m.data.document_metadata.state_code)
      .filter(isUsStateCode)
  ).size;

  const needsReviewCount = manuals.filter(
    (m) => m.data.extraction_quality.needs_human_review
  ).length;

  return (
    <main className="space-y-8">
      <header className="max-w-2xl space-y-2">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
          Stormwater design rules, in one place
        </h1>
        <p className="text-base leading-relaxed text-slate-600">
          Browse U.S. state, county, and city manuals. Key requirements are
          listed with the quote from the source document.
        </p>
        <p className="pt-1 text-sm text-slate-500">
          {manuals.length} manuals · {statesCovered} states
          {needsReviewCount > 0 ? (
            <>
              {" "}
              ·{" "}
              <span className="text-orange-600">
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
