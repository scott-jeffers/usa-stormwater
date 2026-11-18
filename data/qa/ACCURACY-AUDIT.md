# Accuracy audit

## Round 2 — 2026-11-18, after the full value review

After round 1, every numeric design parameter in the atlas (1,107 values) was
read by hand against its quote (`data/qa/value-review.json`): 950 kept as
stated, 57 kept with a weak quote, 48 corrected, 52 removed. Each kept value
now has a qualifier (min / max / design / typical / range / average), and
water-quality depths record rainfall vs runoff. Design storms now record their
purpose (`data/qa/design-storms.json`).

A fresh random sample (seed 20261119) of 30 values from records with their
own manual — 14 numeric parameters, 8 design storms with purposes, 5
water-quality methods, 3 practice lists — was read the same way as round 1.

| Field type | Correct | Partly right | Wrong |
|---|---:|---:|---:|
| Numeric parameters (14) | 13 | 1 | 0 |
| Design storms with purpose (8) | 2 | 4 | 2 |
| Water-quality method text (5) | 1 | 3 | 1 |
| Practice lists (3) | 0 | 3 | 0 |
| **All (30)** | **16 (53%)** | **11 (37%)** | **3 (10%)** |

Numeric parameters, the fields the model manual rests on, are now 93% correct
in the sample (13 of 14; the 14th is a swale-specific infiltration rate filed
under the general field). The prose and list fields are where the remaining
errors are:

- **Wrong, fixed:** Ohio DOT's water-quality method was a glossary fragment
  (now the 0.90 in Ohio EPA depth with its quote); Iowa's 5-year storm was
  classed as peak control though it sizes street intakes, and Spokane's "2-year
  cycle" water budget was read as a 2-year storm (both fixed in the classifier).
  El Paso's water-quality method was unsupported (quote: "bioretention") and
  was cleared: the manual sets no water-quality volume.
- **Partly right:** storms whose purpose is "not stated" or rests on a weak
  sentence; water-quality methods that name a requirement without its method;
  practice lists with no quote or a heading as the quote.

After these fixes the storm classifier was tuned (channel protection and water
quality weighted over generic peak-control words) and re-checked on a new
sample of 30 storms: 21 got a purpose, of which 16 were right, 2 partly right
and 3 wrong; 9 had no purpose sentence and are marked "purpose not stated".

Next step for the prose fields: re-extract water-quality methods and practice
lists with a quote required for every item.

## Round 1 — 2026-11-18

The citation check proves a quote exists in the source PDF. This audit asks the
harder question: **is the value a correct reading of the manual?**

Method: a random, stratified sample (seed 20261118) of 30 values from records
with their own manual and a local corpus — 10 numeric design parameters, 8
design-storm lists, 6 water-quality methods, 3 peak-flow method lists, 3 BMP
lists, at most one per record. Three sampled "parameters" were internal
bookkeeping (`enrich_schema_version`, not shown on the site) and were dropped,
leaving 27. Each value was read against its quotes and, where needed, the
surrounding page text.

## Result

| Verdict | Count | Share |
|---|---:|---:|
| Correct and well supported | 16 | 59% |
| Partly right: incomplete list, weak quote, or a different kind of number than the field implies | 9 | 33% |
| Wrong | 2 | 7% |

With 27 values the margin of error is roughly ±18 points, so treat these as
indicative, not precise.

## Wrong (fixed)

- `de-wet-ponds-draft` max_drawdown_hours = 24 — the 24 hours is the capacity
  rule for the maintenance drain pipe that empties the permanent pool, not a
  design drawdown. Removed.
- `baton-rouge-la` peak_flow_calculation_method — the value was a note saying
  no method is named. Removed.

## Partly right (patterns)

- **Design-storm lists mix purposes and are often incomplete.** Kennewick
  lists only the 2-year storm used for sand-filter overflows; Orlando only the
  100-year flood elevation; Washington's list includes a 25-year siting rule;
  Wayne County's 2-year quote is regulatory history. The field has no slot for
  *what* each storm is for (conveyance, detention, water quality, floodplain).
- **Numeric fields blur minimum / maximum / design values.** Rhode Island's
  "design infiltration rate" (0.5 in/hr) is the minimum soil rate for a site
  to qualify; Oregon's 6 in green-roof media is a maximum.
- **Weak quotes.** Des Moines' water-quality method is supported only by a
  heading; Peoria's BMP list has no quote; Louisiana DOTD cites a table-of-
  contents fragment (alongside good quotes).

## Correct

ct-state infiltration rate 0.5 in/hr; maine-manual filter drawdown 48 h;
lincoln-ne green-roof slope 25%; ny-state TR-55/TR-20; fl-sfwmd-erp-ah2 WQ
method; oh-odot-drainage wetland detention 24 h; harris-county-tx first 1 in;
ia-state-ch1 BMP categories; ohio-rainwater BMP list; charleston-wv first 1 in;
tucson-az peak-flow methods; mn-state-2008 WQ volume; el-paso-tx 50/100-yr;
la-ladotd-drainage storms; vt-state WQv formula; nd-nddot-drainage storms.

## Recommendations

1. Store design storms with their purpose (`{years, purpose}`), so a list can't
   silently mix conveyance, detention and floodplain criteria.
2. Give numeric parameters a qualifier (`min` / `max` / `design` / `typical`)
   and the practice they apply to.
3. Repeat this audit after each extraction round; track the "correct" share.
