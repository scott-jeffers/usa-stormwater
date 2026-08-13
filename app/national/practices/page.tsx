import type { Metadata } from "next";
import Link from "next/link";
import { getAllPracticeSyntheses } from "@/lib/practices";

export const metadata: Metadata = {
  title: "Practice Syntheses",
  description:
    "Base + regional-modifier practice syntheses from atlas design parameters — research draft, not adopted regulation.",
};

export default function PracticesIndexPage() {
  const practices = getAllPracticeSyntheses();

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-fg-muted">
          <Link href="/national/" className="text-water-deep hover:underline">
            ← Practice Synthesis
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Practice-level syntheses
        </h1>
        <p className="max-w-2xl text-fg-secondary">
          Cross-state matrices of parameterized criteria, with a national
          baseline and regional modifiers. Provisional research draft — verify
          against controlling manuals.
        </p>
      </div>

      {practices.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge-strong bg-surface p-8 text-fg-muted">
          No practice syntheses yet. Enrich Tier A parameters, build a matrix,
          then synthesize (e.g. bioretention).
        </p>
      ) : (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface">
          {practices.map((p) => (
            <li key={p.practice_key}>
              <Link
                href={`/national/practices/${p.practice_key}/`}
                className="flex items-baseline justify-between gap-4 px-4 py-3 hover:bg-mist/60"
              >
                <span className="font-medium text-ink">{p.practice_label}</span>
                <span className="text-xs text-fg-muted">
                  {p.editorial_status ?? "draft"} ·{" "}
                  {p.regional_modifiers.length} modifiers
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
