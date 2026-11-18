# Changelog

Dataset versions use `YEAR.MONTH.PATCH`. The site always serves the latest version; the files listed on [/data/](https://www.stormwateratlas.com/data/) are rebuilt on every deploy.

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
- In a random audit of 27 values, 59% were fully correct, 33% partly right and 7% wrong.
- Several numeric fields do not record whether a value is a minimum, maximum or design value, and design storms do not record their purpose.
- Arkansas and Nevada have no state manual in the atlas.
