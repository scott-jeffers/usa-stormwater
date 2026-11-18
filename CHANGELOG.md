# Changelog

Dataset versions use `YEAR.MONTH.PATCH`. The site always serves the latest version; the files listed on [/data/](https://www.stormwateratlas.com/data/) are rebuilt on every deploy.

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
