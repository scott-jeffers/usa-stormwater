/**
 * Paged-media stylesheet for the printable model manual (/manual/print/).
 * Paged.js reads the @page rules; the rest styles the paginated content.
 */
export const PRINT_CSS = String.raw`
@page {
  size: letter;
  margin: 0.85in 0.85in 0.8in 0.85in;
  @top-left { content: string(doc-short); font: 500 7.5pt/1 var(--font-plex-sans), sans-serif; color: #5b6673; letter-spacing: 0.02em; }
  @top-right { content: string(section-title); font: 500 7.5pt/1 var(--font-plex-sans), sans-serif; color: #5b6673; }
  @bottom-left { content: string(doc-status); font: 400 7pt/1.3 var(--font-plex-sans), sans-serif; color: #7a8590; }
  @bottom-right { content: counter(page) " / " counter(pages); font: 500 7.5pt/1 var(--font-plex-sans), sans-serif; color: #2b3540; }
}
@page cover {
  margin: 0;
  @top-left { content: none; } @top-right { content: none; } @bottom-left { content: none; } @bottom-right { content: none; }
}
@page front {
  @top-right { content: none; }
}

.pagedjs_pages { font-family: var(--font-plex-sans), system-ui, sans-serif; font-size: 9.6pt; line-height: 1.48; color: #1d2630; font-feature-settings: "tnum"; }
.pagedjs_pages .doc-short { string-set: doc-short content(text); display: none; }
.pagedjs_pages .doc-status { string-set: doc-status content(text); display: none; }

/* ---- cover ---- */
.cover { page: cover; break-after: page; }
.pagedjs_pages .cover { width: 8.5in; height: 11in; position: relative; break-after: page; display: flex; flex-direction: column; }
.pagedjs_pages .cover-band { background: #0d3b48; color: #fff; padding: 0.9in 0.85in 0.55in; }
.pagedjs_pages .cover-band .kicker { font-size: 9pt; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #9fd3de; }
.pagedjs_pages .cover-band h1 { margin: 0.28in 0 0; font-size: 34pt; line-height: 1.08; font-weight: 600; letter-spacing: -0.01em; }
.pagedjs_pages .cover-band .version { margin-top: 0.22in; font-size: 13pt; color: #d8eef2; }
.pagedjs_pages .cover-body { padding: 0.5in 0.85in 0; flex: 1; }
.pagedjs_pages .cover-status { border-left: 3pt solid #c47d0e; padding: 4pt 0 4pt 10pt; font-size: 10.5pt; color: #2b3540; max-width: 5.2in; }
.pagedjs_pages .cover-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8pt; margin-top: 0.45in; }
.pagedjs_pages .cover-grid div { border-top: 1.5pt solid #0d3b48; padding-top: 5pt; }
.pagedjs_pages .cover-grid b { display: block; font-size: 20pt; font-weight: 600; color: #0d3b48; line-height: 1.1; }
.pagedjs_pages .cover-grid span { font-size: 8pt; color: #5b6673; }
.pagedjs_pages .cover-foot { padding: 0 0.85in 0.75in; font-size: 8.5pt; color: #5b6673; display: flex; justify-content: space-between; align-items: flex-end; gap: 0.4in; }
.pagedjs_pages .cover-foot strong { color: #0d3b48; font-size: 10pt; }

/* ---- front matter ---- */
.front { page: front; break-after: page; }

.toc { page: front; break-before: page; break-after: page; }
.pagedjs_pages .toc ol { list-style: none; padding: 0; margin: 10pt 0 0; }
.pagedjs_pages .toc li { margin: 0; padding: 3.2pt 0; border-bottom: 0.5pt solid #e1e5ea; font-size: 10pt; }
.pagedjs_pages .toc li.appendix { color: #3b4652; }
.pagedjs_pages .toc a { color: inherit; text-decoration: none; display: flex; gap: 8pt; }
.pagedjs_pages .toc a .n { width: 0.35in; color: #7a8590; font-weight: 500; }
.pagedjs_pages .toc a .t { flex: 1; }
.pagedjs_pages .toc a::after { content: target-counter(attr(href), page); color: #2b3540; font-weight: 500; }
.pagedjs_pages .cite { margin-top: 14pt; padding: 8pt 10pt; background: #f2f5f7; font-size: 8.6pt; color: #2b3540; }
.pagedjs_pages .legend { display: grid; grid-template-columns: auto 1fr; gap: 3pt 10pt; font-size: 9pt; margin: 8pt 0 0; }

/* ---- body ---- */
.manual-section > h2 { break-before: page; string-set: section-title content(text); }
.pagedjs_pages h2 { font-size: 17pt; line-height: 1.2; font-weight: 600; color: #0d3b48; margin: 0 0 12pt; padding-bottom: 6pt; border-bottom: 1.5pt solid #0d3b48; }
.pagedjs_pages h2 .num { color: #6f8a92; margin-right: 4pt; font-weight: 500; }
.pagedjs_pages section > *:first-child { margin-top: 0; }
.pagedjs_pages p, .pagedjs_pages ul, .pagedjs_pages ol { margin: 0 0 6.5pt; orphans: 3; widows: 3; }
.pagedjs_pages ul, .pagedjs_pages ol { padding-left: 14pt; }
.pagedjs_pages li { margin: 0 0 3pt; }
.pagedjs_pages strong { font-weight: 600; color: #101820; }
.pagedjs_pages a { color: inherit; text-decoration: none; }
.pagedjs_pages code, .pagedjs_pages pre { font-family: var(--font-plex-mono), ui-monospace, monospace; font-size: 8.6pt; }
.pagedjs_pages code { background: #f0f3f5; padding: 0 2pt; border-radius: 2pt; }
.pagedjs_pages pre { background: #f2f5f7; border-left: 2pt solid #0d3b48; padding: 6pt 9pt; margin: 4pt 0 8pt; white-space: pre-wrap; break-inside: avoid; }

/* clauses */
.pagedjs_pages .clause { break-inside: avoid; }
.pagedjs_pages li.clause { list-style: none; margin-left: -14pt; }
.pagedjs_pages .clause-num { font-weight: 700; color: #0d3b48; margin-right: 2pt; }
.pagedjs_pages .status-chip { display: inline-block; border: 0.6pt solid #8b97a3; border-radius: 2pt; padding: 0 3pt; margin-right: 2pt; font-size: 6.8pt; font-weight: 600; line-height: 1.35; vertical-align: 0.12em; letter-spacing: 0.03em; color: #2b3540; background: none; text-transform: uppercase; }
.pagedjs_pages .status-chip.status-open { border-color: #c47d0e; color: #8a5300; background: #fdf3e2; }
.pagedjs_pages .status-chip.status-regional { border-color: #6c5bb8; color: #4b3d91; background: #f1effa; }
.pagedjs_pages .status-chip.status-strong { border-color: #2f7a44; color: #1f5a31; background: #ebf5ee; }
.pagedjs_pages .status-chip.status-good { border-color: #3f5fb0; color: #2d4685; background: #edf1fa; }
.pagedjs_pages .status-chip.status-placeholder { border-style: dashed; color: #5b6673; }

/* rationale */
.pagedjs_pages .why { break-inside: avoid; margin: 2pt 0 9pt 10pt; padding: 3pt 0 3pt 9pt; border-left: 1.5pt solid #b9c4cc; color: #3b4652; font-size: 8.9pt; }
.pagedjs_pages .why-label { display: inline; font-size: 6.8pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #6f8a92; margin-right: 4pt; }

/* tables */
.pagedjs_pages table { width: 100%; border-collapse: collapse; margin: 4pt 0 10pt; font-size: 8.4pt; line-height: 1.35; }
.pagedjs_pages thead { display: table-header-group; }
.pagedjs_pages tr { break-inside: avoid; }
.pagedjs_pages th { text-align: left; font-weight: 600; color: #101820; border-bottom: 1pt solid #0d3b48; padding: 3pt 6pt 3pt 0; vertical-align: bottom; }
.pagedjs_pages td { border-bottom: 0.5pt solid #dfe4e8; padding: 3pt 6pt 3pt 0; vertical-align: top; }
.pagedjs_pages .overflow-x-auto { overflow: visible; }

.pagedjs_pages .end { margin-top: 24pt; padding-top: 8pt; border-top: 0.5pt solid #b9c4cc; font-size: 8.5pt; color: #5b6673; }
`;
