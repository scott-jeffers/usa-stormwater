import Link from "next/link";

export function FederalGuidanceCard({ count }: { count: number }) {
  if (count === 0) return null;

  return (
    <Link
      href="/federal/"
      className="block rounded-xl border border-indigo-200/80 bg-indigo-50/50 px-4 py-3 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-950/30 dark:hover:bg-indigo-950/50"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-base font-semibold text-ink sm:text-lg">
          Federal drainage guidance
        </h2>
        <span className="text-xs text-fg-muted">{count} manuals</span>
      </div>
      <p className="mt-1 text-sm leading-relaxed text-fg-secondary">
        FHWA HEC/HDS circulars and other national hydraulic design manuals.
      </p>
    </Link>
  );
}
