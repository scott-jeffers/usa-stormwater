import type { Metadata } from "next";
import { loadManual } from "@/lib/manual/parse";
import { ManualBlock, GRADE_MEANING } from "@/components/ManualText";
import { PagedManual } from "@/components/PagedManual";
import { SITE_URL } from "@/lib/site";
import { DATASET_VERSION } from "@/lib/dataset";

const manual = loadManual();

export const metadata: Metadata = {
  title: `${manual.title} (${manual.version}) — print edition`,
  description: "Paginated, print-ready edition of the draft model stormwater design manual.",
  robots: { index: false, follow: true },
  alternates: { canonical: `${SITE_URL}/manual/` },
};

export default function ManualPrintPage() {
  const graded = manual.clauses.filter((c) => c.grade);
  const count = (g: string) => graded.filter((c) => c.grade === g).length;
  const open = manual.clauses.filter((c) => c.tags.includes("Open")).length;
  const year = manual.date.slice(0, 4);
  return (
    <main className="pm-main" data-pagefind-ignore="all">
      <PagedManual version={manual.version} />
      <div id="pm-source" hidden>
        <div className="pm">
          <div className="cover">
            <span className="doc-short">{manual.title} · {manual.version}</span>
            <span className="doc-status">Draft for committee review. Not adopted by any agency. stormwateratlas.com/manual/</span>
            <div className="cover-band">
              <div className="kicker">Stormwater Atlas · Proposed national standard</div>
              <h1>{manual.title}</h1>
              <div className="version">{manual.version} · {manual.date}</div>
            </div>
            <div className="cover-body">
              <p className="cover-status">
                <strong>{manual.status}</strong> Every number is a proposal for committee review, graded by the evidence behind it, and
                drawn from what U.S. state and local manuals already require.
              </p>
              <div className="cover-grid">
                <div><b>{manual.clauses.length}</b><span>numbered provisions</span></div>
                <div><b>{count("E1")}</b><span>read by hand in manuals (E1)</span></div>
                <div><b>{count("E0")}</b><span>placeholders, no evidence yet (E0)</span></div>
                <div><b>{open}</b><span>open questions for the committee</span></div>
              </div>
            </div>
            <div className="cover-foot">
              <div>
                <strong>stormwateratlas.com/manual</strong>
                <br />
                Online edition with search, evidence for every number and the detention calculator.
              </div>
              <div style={{ textAlign: "right" }}>
                Text and data: CC BY 4.0
                <br />
                Dataset {DATASET_VERSION}
              </div>
            </div>
          </div>

          <div className="front">
            <h2>About this edition</h2>
            <p>
              This is the print edition of the draft model manual published at <strong>stormwateratlas.com/manual/</strong>. The online edition is
              the reference: it links every graded provision to the state-by-state evidence behind it and is updated as the evidence grows.
            </p>
            <p><strong>How provisions are tagged.</strong></p>
            <div className="legend">
              <span className="status-chip">Default</span><span>A national value. Use it unless a regional adjustment applies.</span>
              <span className="status-chip status-regional">Regional</span><span>A value a state may replace for its climate (Section 11).</span>
              <span className="status-chip status-open">Open</span><span>A value the committee must still choose; the draft gives a starting value.</span>
              {(["E1", "E2", "E3", "E0"] as const).map((g) => (
                <span key={g} style={{ display: "contents" }}>
                  <span className={`status-chip ${g === "E1" ? "status-strong" : g === "E2" ? "status-good" : g === "E0" ? "status-placeholder" : ""}`}>{g}</span>
                  <span>{GRADE_MEANING[g]} ({count(g)} provisions)</span>
                </span>
              ))}
            </div>
            <div className="cite">
              <strong>Cite as:</strong> Stormwater Atlas ({year}). <em>{manual.title}</em>, {manual.version}. https://www.stormwateratlas.com/manual/.
              Evidence: Stormwater Atlas dataset {DATASET_VERSION}, CC BY 4.0.
            </div>
          </div>

          <div className="toc" role="navigation" aria-label="Contents">
            <h2>Contents</h2>
            <ol>
              {manual.sections.map((s) => (
                <li key={s.id} className={s.number ? undefined : "appendix"}>
                  <a href={`#p-${s.id}`}>
                    <span className="n">{s.number ?? ""}</span>
                    <span className="t">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>

          {manual.sections.map((s) => (
            <section key={s.id} id={`p-${s.id}`} className="manual-section">
              <h2>
                {s.number ? <span className="num">{`${s.number}\u00a0`}</span> : null}
                {s.title}
              </h2>
              {s.blocks.map((b, i) => (
                <ManualBlock key={i} b={b} k={`p-${s.id}-${i}`} />
              ))}
            </section>
          ))}
          <p className="end">
            End of {manual.title}, {manual.version}. Comments: github.com/scott-jeffers/usa-stormwater/issues
          </p>
        </div>
      </div>
    </main>
  );
}
