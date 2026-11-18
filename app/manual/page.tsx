import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/site";
import { loadManual } from "@/lib/manual/parse";
import { Chip, GRADE_MEANING, ManualBlock } from "@/components/ManualText";

const manual = loadManual();

export const metadata: Metadata = pageMeta(
  "/manual/",
  `${manual.title} — ${manual.version}`,
  "A complete draft model stormwater design manual for U.S. states, with every number tagged by how strong its evidence is."
);

const GRADE_KIND: Record<string, string> = { E1: "status-strong", E2: "status-good", E3: "status-neutral", E0: "status-placeholder" };

export default function ManualPage() {
  const graded = manual.clauses.filter((c) => c.grade);
  const counts = (["E1", "E2", "E3", "E0"] as const).map((g) => ({ g, n: graded.filter((c) => c.grade === g).length }));
  const open = manual.clauses.filter((c) => c.tags.includes("Open"));
  return (
    <main className="lg:grid lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-10">
      <nav aria-label="Contents" className="hidden lg:block">
        <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-fg-muted">Contents</p>
          <ol className="space-y-1">
            {manual.sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded px-2 py-1 text-fg-secondary hover:bg-surface-muted hover:text-foreground">
                  {s.number ? <span className="mr-1.5 tabular-nums text-fg-faint">{s.number}</span> : null}
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </div>
      </nav>

      <article className="manual max-w-3xl">
        <header className="border-b border-edge-strong pb-6">
          <p className="draft-marker">{manual.version} · {manual.status}</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{manual.title}</h1>
          <p className="mt-2 text-fg-secondary">
            {manual.date} · {manual.clauses.length} numbered provisions · {open.length} open questions
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {counts.map(({ g, n }) => (
              <div key={g} className="rounded-md border border-edge bg-surface px-3 py-2">
                <dt><Chip kind={GRADE_KIND[g]!} label={g} /></dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{n}</dd>
                <dd className="text-xs text-fg-muted">{GRADE_MEANING[g]}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-fg-secondary">
            Evidence:{" "}
            <Link href="/national/model-manual/" className="text-water-link hover:underline">state-by-state classification</Link>
            {" · "}
            <Link href="/data/" className="text-water-link hover:underline">data downloads</Link>
            {" · "}
            <a href="/manual/model-manual.md" className="text-water-link hover:underline">Markdown source</a>
          </p>
          <details className="mt-4 lg:hidden">
            <summary className="cursor-pointer text-sm font-medium text-water-link">Contents</summary>
            <ol className="mt-2 space-y-1 text-sm">
              {manual.sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-fg-secondary hover:text-foreground">
                    {s.number ? `${s.number} ` : ""}{s.title}
                  </a>
                </li>
              ))}
            </ol>
          </details>
        </header>

        {manual.sections.map((s) => (
          <section key={s.id} id={s.id} className="scroll-mt-20 border-b border-edge py-8 last:border-0">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {s.number ? <span className="mr-2 tabular-nums text-fg-faint">{s.number}</span> : null}
              {s.title}
            </h2>
            <div className="mt-4 space-y-4 leading-relaxed text-fg-secondary">
              {s.blocks.map((b, i) => (
                <ManualBlock key={i} b={b} k={`${s.id}-${i}`} />
              ))}
            </div>
          </section>
        ))}
      </article>
    </main>
  );
}
