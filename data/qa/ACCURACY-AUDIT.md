# Accuracy audit — 2026-11-18

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
