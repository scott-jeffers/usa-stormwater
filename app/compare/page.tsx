import { pageMeta } from "@/lib/site";
import type { Metadata } from "next";
import { CompareView } from "@/components/CompareView";
import { COMPARE_PARAMS } from "@/lib/compare";
import { allRequirementValues, statsOf } from "@/lib/requirements";
import { SearchMeta } from "@/components/SiteSearch";

export const metadata: Metadata = pageMeta("/compare/", "Compare manuals", "Put up to four stormwater design manuals side by side: design storms, water-quality methods, software, BMPs and key design values, each with its citation check.");

export default function ComparePage() {
  const all = allRequirementValues();
  const national: Record<string, { mode: number; n: number }> = {};
  for (const [key] of COMPARE_PARAMS) {
    const st = statsOf(all.get(key) ?? []);
    if (st) national[key] = { mode: st.mode, n: st.n };
  }
  return (
    <main className="w-data mx-auto space-y-8">
      <SearchMeta type="Resource" />
      <header className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-ink">
          Compare jurisdictions
        </h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          Pick up to four jurisdictions to see their requirements side by side. Values marked{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-300">✓</span> were found
          word-for-word in the source manual; anything else should be checked against the PDF
          before you rely on it. Jurisdictions that use a state or regional manual show that
          manual&rsquo;s values.
        </p>
      </header>
      <CompareView national={national} params={COMPARE_PARAMS.map(([key, label, unit]) => ({ key, label, unit }))} />
    </main>
  );
}
