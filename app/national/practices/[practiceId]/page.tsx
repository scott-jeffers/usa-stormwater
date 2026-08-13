import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllPracticeSyntheses,
  getPracticeMatrix,
  getPracticeSynthesis,
} from "@/lib/practices";

const PLACEHOLDER = "_placeholder";

export function generateStaticParams() {
  const practices = getAllPracticeSyntheses();
  if (practices.length === 0) return [{ practiceId: PLACEHOLDER }];
  return practices.map((p) => ({ practiceId: p.practice_key }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}): Promise<Metadata> {
  const { practiceId } = await params;
  if (practiceId === PLACEHOLDER) return { title: "Practice synthesis" };
  const synth = getPracticeSynthesis(practiceId);
  return {
    title: synth?.practice_label ?? practiceId,
    description: `Practice synthesis — ${synth?.practice_label ?? practiceId}`,
  };
}

export default async function PracticePage({
  params,
}: {
  params: Promise<{ practiceId: string }>;
}) {
  const { practiceId } = await params;
  if (practiceId === PLACEHOLDER) {
    return (
      <main className="rounded-xl border border-dashed border-edge-strong bg-surface p-10 text-center text-fg-muted">
        No practice syntheses yet.
      </main>
    );
  }

  const synth = getPracticeSynthesis(practiceId);
  if (!synth) notFound();
  const matrix = getPracticeMatrix(practiceId);

  return (
    <main className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm text-fg-muted">
          <Link
            href="/national/practices/"
            className="text-water-deep hover:underline"
          >
            ← Practices
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink">
          {synth.practice_label}
        </h1>
        <p className="text-sm text-fg-muted">
          Generated {new Date(synth.generated_at).toLocaleString()}
          {synth.model ? ` · ${synth.model}` : ""}
        </p>
      </div>

      <div className="rounded-xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100">
        Provisional practice synthesis — not a design manual or adopted
        regulation. Numbers come from atlas{" "}
        <code className="text-xs">design_parameters</code>; verify against source
        PDFs. Controlling state/local criteria apply when more stringent.
      </div>

      <section className="space-y-2">
        <h2 className="font-display text-xl font-semibold text-ink">
          National baseline
        </h2>
        <p className="whitespace-pre-wrap leading-relaxed text-fg-secondary">
          {synth.national_baseline}
        </p>
      </section>

      {synth.matrix_summary && (
        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink">
            Matrix summary
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-fg-secondary">
            {synth.matrix_summary}
          </p>
        </section>
      )}

      {matrix && matrix.numeric_fields.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-ink">
            Cross-state parameters
          </h2>
          {matrix.numeric_fields.map((field) => (
            <div
              key={field.field}
              className="overflow-hidden rounded-xl border border-edge bg-surface"
            >
              <div className="border-b border-edge px-4 py-3">
                <h3 className="font-medium text-ink">{field.label}</h3>
                <p className="text-xs text-fg-muted">
                  n={field.count} · mode={field.mode ?? "—"} · median=
                  {field.median ?? "—"} · range=
                  {field.min != null && field.max != null
                    ? `${field.min}–${field.max}`
                    : "—"}{" "}
                  {field.unit}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[20rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-edge text-xs uppercase tracking-wide text-fg-muted">
                      <th className="px-3 py-2 font-medium">State</th>
                      <th className="px-3 py-2 font-medium">Slug</th>
                      <th className="px-3 py-2 font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {field.cells
                      .filter((c) => c.value != null)
                      .map((c) => (
                        <tr
                          key={`${field.field}-${c.slug}`}
                          className="border-b border-edge/60"
                        >
                          <td className="px-3 py-2">{c.state_code ?? "—"}</td>
                          <td className="px-3 py-2">
                            <Link
                              href={`/${c.slug}/`}
                              className="text-water-deep hover:underline"
                            >
                              {c.slug}
                            </Link>
                          </td>
                          <td className="px-3 py-2">
                            {c.value} {field.unit}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="font-display text-xl font-semibold text-ink">
          Regional modifiers
        </h2>
        {synth.regional_modifiers.length === 0 ? (
          <p className="text-fg-muted">None listed.</p>
        ) : (
          synth.regional_modifiers.map((m) => (
            <div
              key={m.id}
              className="space-y-2 rounded-xl border border-edge bg-surface px-4 py-3"
            >
              <h3 className="font-medium text-ink">{m.title}</h3>
              <p className="leading-relaxed text-fg-secondary">{m.text}</p>
              {(m.states.length > 0 || m.citation_slugs.length > 0) && (
                <p className="text-xs text-fg-muted">
                  {m.states.length > 0 && <>States: {m.states.join(", ")}. </>}
                  {m.citation_slugs.length > 0 && (
                    <>
                      Sources:{" "}
                      {m.citation_slugs.map((s, i) => (
                        <span key={s}>
                          {i > 0 && ", "}
                          <Link
                            href={`/${s}/`}
                            className="text-water-deep hover:underline"
                          >
                            {s}
                          </Link>
                        </span>
                      ))}
                    </>
                  )}
                </p>
              )}
            </div>
          ))
        )}
      </section>

      {synth.open_issues && (
        <section className="space-y-2">
          <h2 className="font-display text-xl font-semibold text-ink">
            Open issues
          </h2>
          <p className="whitespace-pre-wrap leading-relaxed text-fg-secondary">
            {synth.open_issues}
          </p>
        </section>
      )}
    </main>
  );
}
