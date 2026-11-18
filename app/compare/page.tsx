import { pageMeta } from "@/lib/site";
import type { Metadata } from "next";
import Link from "next/link";
import { CompareView } from "@/components/CompareView";
import { COMPARE_PARAMS } from "@/lib/compare";

export const metadata: Metadata = pageMeta("/compare/", "Compare manuals", "Put up to four stormwater design manuals side by side: design storms, water-quality methods, software, BMPs and key design values, each with its citation check.");

export default function ComparePage() {
  return (
    <main className="space-y-8">
      <header className="max-w-3xl space-y-3">
        <p className="text-sm font-medium text-water">
          <Link href="/" className="hover:underline">
            ← Back to atlas
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Compare manuals
        </h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          Pick up to four jurisdictions to see their requirements side by side. Values marked{" "}
          <span className="font-medium text-emerald-700 dark:text-emerald-300">✓</span> were found
          word-for-word in the source manual; anything else should be checked against the PDF
          before you rely on it. Jurisdictions that use a state or regional manual show that
          manual&rsquo;s values.
        </p>
      </header>
      <CompareView params={COMPARE_PARAMS.map(([key, label, unit]) => ({ key, label, unit }))} />
    </main>
  );
}
