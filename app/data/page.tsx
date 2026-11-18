import type { Metadata } from "next";
import Link from "next/link";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pageMeta } from "@/lib/site";
import { DATASET_VERSION, FIELDS } from "@/lib/dataset";
import { ValuesTable } from "@/components/ValuesTable";

export const metadata: Metadata = pageMeta(
  "/data/",
  "Data downloads and dictionary",
  "Download the Stormwater Atlas as CSV or JSON: every manual, every extracted value with its source quote and check status, and the hand-checked values behind the model manual."
);

function readJson<T>(rel: string): T | null {
  const p = path.join(process.cwd(), "public/data", rel);
  return existsSync(p) ? (JSON.parse(readFileSync(p, "utf-8")) as T) : null;
}

const FILES = [
  { href: "/data/values.csv", name: "values.csv", what: "One row per extracted value: manual, state, field, value, unit, whether it is a minimum, maximum or design value, the hand-review verdict, source quote, page and citation-check result. The main research table." },
  { href: "/data/design-storms.csv", name: "design-storms.csv", what: "One row per design storm per manual, with what it is used for (water quality, channel protection, peak control, conveyance, flood) and the source sentence." },
  { href: "/data/manuals.csv", name: "manuals.csv", what: "One row per manual record: jurisdiction, level, edition, whose rules apply (coverage basis), quote-check counts and source links." },
  { href: "/data/hand-checks.csv", name: "hand-checks.csv", what: "Values read by hand for the model manual, with verdict, page and quote." },
  { href: "/data/esc-checks.csv", name: "esc-checks.csv", what: "Construction erosion and sediment control values read by hand from state and local manuals (Part B of the model manual), with page and quote." },
  { href: "/data/dictionary.json", name: "dictionary.json", what: "Every field, its meaning, unit and fill rate." },
  { href: "/data/manuals.json", name: "manuals.json", what: "Index of all records (JSON API). Full records at /data/manuals/{slug}.json." },
  { href: "/data/schema.json", name: "schema.json", what: "Record shape and API endpoints." },
  { href: "/manual/model-manual.md", name: "model-manual.md", what: "The draft model manual, as Markdown." },
];

export default function DataPage() {
  const dict = readJson<{ records_with_own_rules: number; fields: Array<{ field: string; filled: number; fill_rate: number }> }>("dictionary.json");
  const ds = readJson<{ records: number; values: number; hand_checked_values: number; citation: string }>("dataset.json");
  const fill = new Map((dict?.fields ?? []).map((f) => [f.field, f]));
  return (
    <main className="space-y-10">
      <header className="max-w-3xl space-y-3">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">Data</h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          The whole atlas is open for research: {ds?.records ?? "—"} manual records, {ds?.values.toLocaleString() ?? "—"} extracted
          values each with its source quote, and {ds?.hand_checked_values ?? "—"} values read by hand. Dataset version{" "}
          <span className="font-semibold text-foreground">{DATASET_VERSION}</span>.
        </p>
        <p className="draft-note">
          Values are machine-extracted and checked against their quotes; a quote that matches does not prove the value
          is the right requirement. Every numeric value was then read by hand against its quote and given a qualifier (minimum, maximum, design value); 48 were corrected and 52 removed. Prose and list fields are weaker (see the audit). Check the source before design use, and see the{" "}
          <Link href="/about/" className="text-water-link hover:underline">method</Link>.
        </p>
      </header>

      <section className="max-w-3xl space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Downloads</h2>
        <ul className="divide-y divide-edge rounded-lg border border-edge bg-surface">
          {FILES.map((f) => (
            <li key={f.href} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:items-baseline sm:gap-4">
              <a href={f.href} download className="shrink-0 font-mono text-sm font-semibold text-water-link hover:underline sm:w-44">
                {f.name}
              </a>
              <span className="text-sm text-fg-secondary">{f.what}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-3xl space-y-2">
        <h2 className="font-display text-xl font-semibold text-ink">Cite and reuse</h2>
        <p className="rounded-md bg-surface-muted px-4 py-3 font-mono text-sm text-foreground">{ds?.citation}</p>
        <p className="text-sm text-fg-secondary">
          The data and the draft manual are licensed{" "}
          <a href="https://creativecommons.org/licenses/by/4.0/" className="text-water-link hover:underline">CC BY 4.0</a>: reuse them freely,
          crediting Stormwater Atlas. Quoted excerpts and the source manuals stay the copyright of their issuing agencies (see{" "}
          <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/NOTICE" className="text-water-link hover:underline">NOTICE</a>). Code is MIT. Changes between versions are listed in the{" "}
          <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/CHANGELOG.md" className="text-water-link hover:underline">changelog</a>; a{" "}
          <a href="https://github.com/scott-jeffers/usa-stormwater/blob/main/CITATION.cff" className="text-water-link hover:underline">CITATION.cff</a> file is in the repository.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Data dictionary</h2>
        <p className="max-w-3xl text-sm text-fg-secondary">
          Fill rate is the share of the {dict?.records_with_own_rules ?? "—"} records with their own rules (stand-ins excluded) that state the field.
          Each numeric value carries a qualifier (min, max, design, typical, range or average) in values.csv and in the API (design_parameters.value_qualifiers).
        </p>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Field</th>
                <th>Meaning</th>
                <th>Unit</th>
                <th className="text-right">Filled</th>
                <th className="text-right">Fill rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(FIELDS).map(([field, m]) => {
                const f = fill.get(field);
                return (
                  <tr key={field}>
                    <td>
                      <div className="font-medium text-foreground">{m.label}</div>
                      <div className="font-mono text-xs text-fg-faint">{field}</div>
                    </td>
                    <td className="min-w-[16rem] text-fg-secondary">{m.meaning}</td>
                    <td className="whitespace-nowrap">{m.unit || "—"}</td>
                    <td className="text-right tabular-nums">{f?.filled ?? "—"}</td>
                    <td className="text-right tabular-nums">{f ? `${Math.round(f.fill_rate * 100)}%` : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-semibold text-ink">Browse values</h2>
        <p className="max-w-3xl text-sm text-fg-secondary">
          Every numeric value in values.csv. Filter by field and state, sort any column, and open the record to see the quote in context.
        </p>
        <ValuesTable fields={Object.entries(FIELDS).filter(([, m]) => m.type === "number").map(([k, m]) => ({ key: k, label: m.label, unit: m.unit }))} />
      </section>
    </main>
  );
}
