import type { Metadata } from "next";
import Link from "next/link";
import { getManualListItems } from "@/lib/data";
import { LevelBadge } from "@/components/Badge";

export const metadata: Metadata = {
  title: "Federal manuals",
  description:
    "FHWA and other U.S. federal drainage and stormwater design guidance in the Stormwater Atlas.",
};

export default function FederalIndexPage() {
  const manuals = getManualListItems()
    .filter((m) => m.jurisdiction_level === "federal")
    .sort((a, b) => a.document_title.localeCompare(b.document_title));

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-fg-muted">
          <Link href="/" className="text-water-deep hover:underline">
            ← Atlas
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          Federal drainage guidance
        </h1>
        <p className="max-w-2xl text-fg-secondary">
          Federal Highway Administration (FHWA) hydraulic circulars and related
          federal design manuals. These are national <em>guidance</em>, not
          adopted local criteria — always verify against the controlling
          jurisdiction manual.
        </p>
      </div>

      {manuals.length === 0 ? (
        <p className="rounded-xl border border-dashed border-edge-strong bg-surface p-8 text-fg-muted">
          No federal manuals ingested yet.
        </p>
      ) : (
        <ul className="divide-y divide-edge rounded-xl border border-edge bg-surface">
          {manuals.map((m) => (
            <li key={m.slug}>
              <Link
                href={`/${m.slug}/`}
                className="flex flex-col gap-1 px-4 py-3 hover:bg-mist/60 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
              >
                <span className="font-medium text-ink">{m.document_title}</span>
                <span className="flex shrink-0 items-center gap-2 text-xs text-fg-muted">
                  <LevelBadge level="federal" />
                  {m.jurisdiction_name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
