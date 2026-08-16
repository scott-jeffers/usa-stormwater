import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Stormwater Atlas works — and how people, tools, and AIs can fetch the open JSON data.",
};

const BASE = "https://stormwateratlas.com";

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-12">
      <header className="space-y-3">
        <p className="text-sm font-medium text-water">
          <Link href="/" className="hover:underline">
            ← Back to atlas
          </Link>
        </p>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          About Stormwater Atlas
        </h1>
        <p className="text-base leading-relaxed text-fg-secondary">
          An ongoing open project to index and compare U.S. stormwater design
          manual requirements. Criteria are extracted from public agency
          documents and paired with the exact quote that supports each field.
          New manuals, corrected extractions, and schema updates land
          regularly — coverage and quality are still improving. Source code is
          on{" "}
          <a
            href="https://github.com/scott-jeffers/usa-stormwater"
            className="font-medium text-water-link hover:underline"
          >
            GitHub
          </a>{" "}
          (MIT); contributions welcome.
        </p>
      </header>

      <Section title="Ongoing development">
        <p>
          Stormwater Atlas is <strong>actively under development</strong>, not a
          finished reference product. Manuals are added from a public queue;
          many records are automated first drafts flagged for quality review.
          Treat the site as a living dataset — always confirm critical values
          against the linked official PDF.
        </p>
        <p className="mt-3">
          Currently maintained on{" "}
          <a
            href="https://github.com/scott-jeffers/usa-stormwater"
            className="font-medium text-water-link hover:underline"
          >
            GitHub
          </a>
          .
        </p>
      </Section>

      <Section title="Purpose">
        <p>
          Stormwater Atlas is a <strong>research and comparison tool</strong>.
          Use it to find what different jurisdictions&apos; manuals say about
          design storms, water-quality volume methods, peak-flow approaches,
          BMP categories, and related criteria — without reading hundreds of
          PDFs. Each value is paired with a cited excerpt and a link to the
          official agency document.
        </p>
        <p className="mt-3">
          It is <strong>not</strong> adopted regulation and not a substitute
          for the controlling manual, ordinance, or engineer of record. Always
          open the linked official PDF before design or permitting decisions.
        </p>
      </Section>

      <Section title="For people">
        <p>
          Use the{" "}
          <Link href="/" className="font-medium text-water-link hover:underline">
            homepage map and table
          </Link>{" "}
          to find a federal, state, county, or city manual. Open a jurisdiction to see
          design storms, water-quality methods, BMPs, and other fields — each
          with a cited excerpt and a link to the official PDF or agency page.
        </p>
        <p className="mt-3">
          Browse{" "}
          <Link
            href="/federal/"
            className="font-medium text-water-link hover:underline"
          >
            federal drainage guidance
          </Link>{" "}
          (FHWA hydraulic circulars) separately from adopted state and local
          manuals. The{" "}
          <Link
            href="/national/"
            className="font-medium text-water-link hover:underline"
          >
            U.S. Stormwater Practice Synthesis
          </Link>{" "}
          is an 18-chapter research draft with practice notes, criteria
          guidance tables, and curated citations — provisional language for
          discussion, not a design manual or adopted practice. Data freshness
          follows the latest{" "}
          <code className="rounded bg-mist px-1 text-xs">npm run export:data</code>{" "}
          / site build.
        </p>
      </Section>

      <Section title="For tools and AIs">
        <p>
          The same database is published as static JSON. No API key, no
          signup. Fetch over HTTPS from any script, agent, or notebook.
        </p>
        <p className="mt-3 text-sm text-fg-muted">
          Discovery file for crawlers:{" "}
          <a
            href="/llms.txt"
            className="font-medium text-water-link hover:underline"
          >
            /llms.txt
          </a>
        </p>
      </Section>

      <Section title="Endpoints">
        <div className="overflow-x-auto rounded-xl border border-edge/80 bg-surface shadow-sm">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="border-b border-edge bg-surface-muted/80 text-xs uppercase tracking-wide text-fg-muted">
              <tr>
                <th className="px-4 py-3 font-medium">URL</th>
                <th className="px-4 py-3 font-medium">What you get</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge text-fg-secondary">
              <EndpointRow
                path="/data/manuals.json"
                desc="Lightweight index of every manual (slug, state, title, confidence, links)"
              />
              <EndpointRow
                path="/data/manuals/{slug}.json"
                desc="Full record for one jurisdiction (criteria + evidence + sources)"
              />
              <EndpointRow
                path="/data/atlas.json"
                desc="Complete dump of all manuals for bulk analysis"
              />
              <EndpointRow
                path="/data/schema.json"
                desc="Field guide describing the JSON shape"
              />
              <EndpointRow
                path="/data/national/outline.json"
                desc="Practice synthesis outline (chapters/sections + prevalence)"
              />
              <EndpointRow
                path="/data/national/drafts.json"
                desc="Index of drafted synthesis sections"
              />
              <EndpointRow
                path="/data/national/draft/{sectionId}.json"
                desc="One drafted section (survey, recommendation, citations)"
              />
              <EndpointRow
                path="/llms.txt"
                desc="Short plain-text summary for AI agents"
              />
              <EndpointRow
                path="/national/"
                desc="Human-readable practice synthesis reader"
              />
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-fg-muted">
          Base URL:{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-water-deep">
            {BASE}
          </code>
          . CORS is open for{" "}
          <code className="rounded bg-mist px-1.5 py-0.5 text-water-deep">
            /data/*
          </code>
          .
        </p>
      </Section>

      <Section title="Attribution and linking">
        <p>
          You may link to Stormwater Atlas without asking first. A short credit
          is appreciated but not required. Prefer the project name in public
          copy; individual maintainer credit is optional.
        </p>
        <p className="mt-3 text-sm text-fg-muted">
          Suggested attribution line (project only):
        </p>
        <blockquote className="mt-2 rounded-xl border border-edge/80 bg-mist/40 px-4 py-3 text-sm italic text-fg-secondary">
          Stormwater Atlas — national index of stormwater design manual criteria
          with cited excerpts.{" "}
          <a href={BASE} className="text-water-link not-italic hover:underline">
            {BASE}
          </a>
        </blockquote>
        <p className="mt-3 text-sm text-fg-muted">
          Suggested blurb for resource pages:
        </p>
        <blockquote className="mt-2 rounded-xl border border-edge/80 bg-mist/40 px-4 py-3 text-sm text-fg-secondary">
          <a href={BASE} className="font-medium text-water-link hover:underline">
            Stormwater Atlas
          </a>{" "}
          is a free, open reference for comparing stormwater design manual
          requirements across U.S. federal, state, county, and city
          jurisdictions. Key fields are paired with verbatim excerpts and
          links to official agency PDFs. The database is under active
          development — use it as a research aid and always verify against the
          current official document.
        </blockquote>
      </Section>

      <Section title="Needs review flag" id="needs-review">
        <p>
          Many records show a <strong>Needs review</strong> badge or an orange
          banner on the manual page. This is an <strong>extraction quality
          flag</strong>, not a public volunteer program.
        </p>
        <p className="mt-3">
          Records are flagged when automated extraction from the source PDF had
          low or medium confidence, ambiguous wording, missing fields, or
          citation checks that did not fully pass. The flag means:{" "}
          <em>compare the cited excerpt to the official PDF before you rely on
          this field.</em>
        </p>
        <p className="mt-3">
          <strong>How to check a record yourself:</strong>
        </p>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm">
          <li>Open the manual page and note any populated design-criteria fields.</li>
          <li>
            Read the quoted excerpt under each field and confirm it supports the
            value shown.
          </li>
          <li>
            Open the linked official PDF or agency page and verify against the
            current adopted text (edition, date, and section).
          </li>
          <li>
            Check <em>Fields not found in document</em> — those criteria were not
            located in the extracted text and may still exist elsewhere in the
            manual.
          </li>
        </ol>
        <p className="mt-3">
          There is no in-site correction form yet. To report a fix, open an
          issue on{" "}
          <a
            href="https://github.com/scott-jeffers/usa-stormwater"
            className="font-medium text-water-link hover:underline"
          >
            GitHub
          </a>{" "}
          with the manual slug, field name, and the correct excerpt or page
          reference from the official document.
        </p>
        <p className="mt-3 text-sm text-fg-muted">
          Use the homepage filter <strong>Needs review only</strong> to browse
          flagged records, or filter by <strong>Confidence: High</strong> for
          extractions that passed without the review flag.
        </p>
      </Section>

      <Section title="Examples">
        <h3 className="font-display text-base font-semibold text-ink">
          Fetch the index
        </h3>
        <CodeBlock>{`curl ${BASE}/data/manuals.json`}</CodeBlock>

        <h3 className="mt-6 font-display text-base font-semibold text-ink">
          Fetch one manual
        </h3>
        <CodeBlock>{`curl ${BASE}/data/manuals/austin-tx-ecm.json`}</CodeBlock>

        <h3 className="mt-6 font-display text-base font-semibold text-ink">
          Filter in JavaScript
        </h3>
        <CodeBlock>{`const res = await fetch("${BASE}/data/atlas.json");
const { manuals } = await res.json();

// Texas manuals that list a 100-year design storm
const tx100 = manuals.filter(
  (m) =>
    m.document_metadata.state_code === "TX" &&
    m.design_criteria.design_storm_return_periods_years.includes(100)
);

console.log(tx100.map((m) => m.document_metadata.jurisdiction_name));`}</CodeBlock>

        <h3 className="mt-6 font-display text-base font-semibold text-ink">
          Prompts for an AI agent
        </h3>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-fg-secondary">
          <li>
            “Fetch <code className="rounded bg-mist px-1">/data/atlas.json</code>{" "}
            and compare design storm return periods for Texas vs California
            state manuals.”
          </li>
          <li>
            “Which manuals list bioretention (or rain gardens) under approved
            BMP categories? Cite the evidence excerpt.”
          </li>
          <li>
            “Load{" "}
            <code className="rounded bg-mist px-1">
              /data/manuals/seattle-wa.json
            </code>{" "}
            and quote the source text for the water quality volume method.”
          </li>
          <li>
            “From the index, list every municipality in Florida with{" "}
            <code className="rounded bg-mist px-1">confidence: high</code>.”
          </li>
        </ul>
      </Section>

      <Section title="Trust and limits">
        <p>
          Extractions are a research aid, not a substitute for the controlling
          manual, ordinance, or engineer of record. Always open the linked
          official document before design or permitting decisions.
        </p>
        <p className="mt-3">
          See{" "}
          <a href="#needs-review" className="font-medium text-water-link hover:underline">
            Needs review flag
          </a>{" "}
          for what the quality badges mean and how to verify a record.
        </p>
      </Section>
    </main>
  );
}

function Section({
  title,
  id,
  children,
}: {
  title: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 space-y-3">
      <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>
      <div className="text-base leading-relaxed text-fg-secondary">{children}</div>
    </section>
  );
}

function EndpointRow({ path, desc }: { path: string; desc: string }) {
  const href = path.includes("{")
    ? undefined
    : path.startsWith("/data/") || path === "/llms.txt"
      ? path
      : undefined;
  return (
    <tr>
      <td className="px-4 py-3 align-top font-mono text-xs text-water-deep">
        {href ? (
          <a href={href} className="hover:underline">
            {path}
          </a>
        ) : (
          path
        )}
      </td>
      <td className="px-4 py-3 align-top text-fg-secondary">{desc}</td>
    </tr>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-2 overflow-x-auto rounded-xl border border-edge/80 bg-code px-4 py-3 text-xs leading-relaxed text-code-fg sm:text-sm">
      <code>{children}</code>
    </pre>
  );
}
