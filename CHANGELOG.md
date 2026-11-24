# Changelog

Dataset versions use `YEAR.MONTH.PATCH`. The site always serves the latest version; the files listed on [/data/](https://www.stormwateratlas.com/data/) are rebuilt on every deploy.

## 2026.11.5 — 2026-11-24: conveyance standards

- **Model manual Draft 0.6.** New Section 8 sets conveyance standards: design storms for storm drains, inlets, culverts and channels with a 100-year overflow path (8.1), gutter spread and inlet interception on grade and in sags (8.2), storm drain size, roughness, velocity, cover and access spacing (8.3), the hydraulic grade line by the FHWA access-hole method with 1 ft of clearance (8.4), culvert headwater by HDS-5 with HW/D ≤ 1.5 (8.5), open channels with 1 ft of freeboard (8.6) and outfalls (8.7). New Appendix D works a street, storm drain, culvert and channel and is part of the automated tests. Five new open questions. Former Sections 8–16 are renumbered 9–17; requirement pages and the evidence page follow.
- **New hand-read evidence:** 379 conveyance values from 119 state, local and federal manuals in 44 states (`data/national/conv-checks.json`, `/data/conv-checks.csv`), classified in `conv-classification.json`. Key results: 10-year storm drains in 15 of 25 states and 10-year inlets in 7 of 11; 3 ft/s minimum velocity in 16 of 33; 1 ft HGL clearance in 11 of 14; HW/D ≤ 1.5 in 10 of 13; 18 in minimum culvert in 10 of 22; 1 ft channel freeboard in 7 of 10. Culvert design storms, minimum pipe size, maximum velocity, cover and manhole spacing divide states and are open questions.
- **Versioning and future rainfall.** The manual now states that it stays at version 0.x through community and professional review (no version 1 until outside reviewers have checked it). New clause 4.1.1 sets no future-rainfall factor and waits for NOAA Atlas 15; added as open question 11.
- **Fourteen new requirement pages** (Conveyance group) on /requirements/.
- **Storm drain, inlet, culvert and channel calculator** (/tools/hydraulics/): pipe sizing, gutter spread and inlet interception, HGL and EGL through a storm drain with a profile chart and CSV, culvert headwater with a performance curve, and channel normal depth, freeboard and shear, each checked against Section 8. Its engine (`lib/hydraulics/engine.ts`) reproduces the worked examples of HEC-22 chapters 5, 7 and 9 and HDS-5 culvert examples (`tests/hydraulics.test.ts`).

## 2026.11.4 — 2026-11-24: detention standards

- **Model manual Draft 0.5.** Section 7 is now a full detention standard: performance and pre-development baseline (7.2), downstream analysis to the 10% point (7.3), preliminary sizing and storage-indication routing (7.4), multi-stage outlets, barrels and risers (7.5), orifice and weir equations and coefficients (7.6–7.7), emergency spillways sized for the 100-year storm with the principal outlet blocked and 1 ft of freeboard (7.8), basin geometry (7.9), and underground and parking-lot storage (7.10). New Appendix C works a full design and is part of the automated tests. Three new open questions (pre-development baseline, minimum orifice, basin depth).
- **New hand-read evidence:** 309 detention, outlet and spillway values from 135 state, local and federal manuals in 45 states and DC (`data/national/det-checks.json`, `/data/det-checks.csv`), classified in `det-classification.json` (`npm run national:classify`). Key results: 100-year spillway storm in 28 of 30 states; 1 ft freeboard in 31 of 33; 10% downstream point in 12 of 16; orifice C 0.60 in 11 of 22; minimum orifice most often 3 in but 0.5–6 in by region.
- **Seven new requirement pages** (Detention outlets and spillways group) on /requirements/.
- **Detention and outlet calculator** (/tools/detention/): NRCS hydrographs, stage-storage-discharge with orifices, weirs, V-notches, riser and spillway, barrel check, storage-indication routing, clogged-outlet spillway check, hover chart, CSV, shareable links. Its engine (`lib/detention/engine.ts`) reproduces a published HEC-1 routing (Knoxville BMP Manual ST-12) within 1 cfs and 0.05 ft.

## Site redesign — 2026-11-19

No data changed (dataset stays 2026.11.3); the site was rebuilt around three jobs: search, look up a requirement, find a jurisdiction.

- **Search everywhere.** A search box in every page header (press `/`), with a full results page at /search/, built with Pagefind at deploy time. It covers requirements, jurisdictions, model-manual clauses and resources.
- **Requirements** (new, /requirements/): one page per design value (24) with the most common value, median and range, a dot strip, a state map that filters the table, every manual's value with its quote, PDF page and check, and a CSV of the rows shown. National figures count each manual with its own rules once.
- **Jurisdictions** (/jurisdictions/) replaces the 358-row home list: 50 rows a page, filters kept in the address so a view can be shared.
- **Home** is now a search box, three starting points and a six-line summary (36 KB, down from 3.2 MB).
- **Record pages** open with a requirement sheet: this manual's value beside the national most common value and the model-manual clause.
- **Compare** marks values that differ, can hide rows where all agree, and adds a national column.
- **Model manual**: find a clause by number or words; print or save as PDF. The evidence page moved to /manual/evidence/; the Markdown source is now /data/model-manual.md.
- **Retired:** the /national/ practice-synthesis reader (machine-drafted sections and practice pages), superseded by the model manual and the requirement pages. Old addresses redirect (301). The JSON under /data/national/ is unchanged.
- **Look:** flat surfaces, IBM Plex Sans with tabular numbers, two page widths, colour for links and data only, print stylesheet. The US map is served from the site instead of a CDN.
- **Checks:** 43 scripted interaction tests pass on desktop and mobile; axe finds no violations (including target size) on 16 sampled pages; no broken internal links in 393 sitemap pages.

## 2026.11.3 — 2026-11-18

**Design archive** (new, at /archive/)
- 25 agency libraries of standard drawings (CAD and PDF), for permanent practices and construction erosion and sediment control, each linked to the agency's own page (`data/archive/libraries.json`).
- 955 drawings found inside 128 atlas manuals (typical sections, plans, profiles, details), tagged by practice and linked to the PDF page (`drawings.json`, `drawings.csv`).
- 859 worked design examples, sample plans and plan-review checklists inside atlas manuals, tagged by practice or topic (`examples.json`, `examples.csv`), plus agency sample plan sets published separately.
- Built by `npm run archive:build`; spot checks: drawings 25 of 30 right (4 partly), examples 26 of 30 right (3 partly). The archive links to the agencies' files and hosts no copies.

## 2026.11.2 — 2026-11-18

**Data**
- New construction erosion and sediment control evidence: 154 values read by hand from 68 state and local manuals in 33 states, across nine criteria (basin threshold, trap and basin storage, stabilization deadline, inspection interval and storm trigger, silt fence limits, construction entrance length, natural buffer). `data/national/esc-checks.json`, download `esc-checks.csv`; classified with `npm run national:classify` into `esc-classification.json`.

**Model manual — Draft 0.4**
- New Part B, Sections 12–16: construction scope and plans, stabilization, sediment controls, inspection and closeout, and how construction controls hand over to permanent practices. Set against the federal construction permit (EPA CGP, 40 CFR 450).
- Near-consensus values: inspect every 7 days (21 of 23 states) and within 24 h of 0.5 in of rain; stabilize within 14 days; sediment basins above 5 acres; 3,600 cf of storage per acre.
- Two new open questions: a 7-day stabilization deadline for sensitive waters or wet seasons, and the 5-acre versus federal 10-acre basin threshold.

## 2026.11.1 — 2026-11-18

**Data**
- Every numeric design parameter (1,107 values) read by hand against its quote: 48 corrected, 52 removed (construction practices, pond maintenance drains, extended-detention times filed as drawdown, siting tests), 57 flagged as weak quotes. Review in `data/qa/value-review.json`, applied by `npm run qa:apply-review`.
- New `design_parameters.value_qualifiers` (min / max / design / typical / range / average) and `wqv_basis` (rainfall or runoff).
- New `design_parameters.design_storms`: each design storm with its purpose (water quality, channel protection, peak control, conveyance, flood), from the manual's own requirement sentences. New download `design-storms.csv`.
- `values.csv` gains `qualifier`, `basis` and `hand_review` columns.
- Hand-checked evidence updated from the review: 216 of 249 values kept; water-quality depths given as runoff are counted separately.
- Accuracy audit round 2: numeric values 13 of 14 correct; prose and list fields remain weaker.
- Data license stated on /data/ and in CITATION.cff: CC BY 4.0 (it was already the license in NOTICE).

**Model manual — Draft 0.3**
- 3.2 counts rainfall and runoff depths separately: 1.0 in rainfall in 7 of 15 states; 4 more use 1.0 in of runoff.
- 3.4–3.6 rest on storms classified by purpose: 13 state manuals use the 1-year storm for channel protection, 20 the 2-year for peak control. 3.4 is now an open question.
- 6.0.1 drawdown shows a suggestive regional pattern again (p = 0.09 after corrections); new 10.4 lets arid-West states allow up to 96 h.

## 2026.11.0 — 2026-11-18

First versioned release.

**Data**
- 358 manual records from 255 source manuals; 287 of 309 coverage targets.
- 5,351 source quotes, every one machine-checked against its PDF (0 failing).
- New research downloads: `values.csv` (long format, one row per value with quote, page and check), `manuals.csv`, `hand-checks.csv`, `dictionary.json` and `dataset.json`.
- Hand-checked state-level evidence grew from 147 to 249 values (224 kept) across 39 states and 11 criteria (adds TSS target, extended-detention time, pond length-to-width, infiltration safety factor, bioretention ponding depth).
- Classification: the most common value is now the most frequent exact value (it was a ±10% window, which could report 85% for a criterion where 16 of 20 states use 80%).

**Model manual**
- Public Review Draft 0.2 published at [/manual/](https://www.stormwateratlas.com/manual/), with the Markdown source in `content/manual/model-manual.md`.
- 11 provisions now rest on hand-checked evidence (E1), up from 6.
- Maximum drawdown no longer shows a regional pattern with 27 states (p = 0.36, was 0.05 with 21), so the regional drawdown table was removed and drawdown became an open question.
- Extended-detention release time settled at 24 hours (12 of 19 states).

**Known limits**
- In a random audit of 27 values, 59% were fully correct, 33% partly right and 7% wrong (see 2026.11.1 for the follow-up).
- Arkansas and Nevada have no state manual in the atlas.
