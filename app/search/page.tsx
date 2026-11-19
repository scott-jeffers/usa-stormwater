import type { Metadata } from "next";
import { Suspense } from "react";
import { pageMeta } from "@/lib/site";
import { SearchResults } from "@/components/SearchResults";

export const metadata: Metadata = pageMeta(
  "/search/",
  "Search",
  "Search every stormwater requirement, manual and model-manual clause in the Stormwater Atlas."
);

export default function SearchPage() {
  return (
    <main className="w-read mx-auto space-y-6" data-pagefind-ignore="all">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">Search</h1>
      <Suspense fallback={<p className="text-fg-muted">Loading…</p>}>
        <SearchResults />
      </Suspense>
    </main>
  );
}
