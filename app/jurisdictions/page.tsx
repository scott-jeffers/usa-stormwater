import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import { jurisdictionRows } from "@/lib/jurisdictions";
import { JurisdictionsExplorer } from "@/components/JurisdictionsExplorer";
import { SearchMeta } from "@/components/SiteSearch";

export const metadata: Metadata = pageMeta(
  "/jurisdictions/",
  "Jurisdictions",
  "Every U.S. federal, state, regional, county and city stormwater design manual in the Atlas, filterable by state, level and manual type."
);

export default function JurisdictionsPage() {
  const rows = jurisdictionRows();
  return (
    <main className="w-data mx-auto space-y-6">
      <SearchMeta type="Resource" />
      <header className="w-read space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">Jurisdictions</h1>
        <p className="text-fg-secondary">
          Each jurisdiction links to its manual and to the requirements read from it. Filters are kept in the address, so a filtered list can be bookmarked or shared.
        </p>
      </header>
      <JurisdictionsExplorer rows={rows} />
    </main>
  );
}
