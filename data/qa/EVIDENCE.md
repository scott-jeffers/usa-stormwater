# Evidence QA report

Generated: 2026-11-18T14:46:56.445Z by `npm run qa:evidence`

Strict check: each excerpt must appear in the source manual (exact, or a close
in-order match with **every number identical**), and each extracted number must
be stated in its own excerpt.

## Records (356)

| Status | Count |
|--------|------:|
| Passed | 199 |
| Warnings only | 157 |
| Failed (excerpt not in source) | 0 |

## Excerpts (5353)

| Result | Count | Share |
|--------|------:|------:|
| Exact | 5028 | 93.9% |
| Close match, numbers identical | 320 | 6.0% |
| Can't check: PDF text lost the numbers | 5 | 0.1% |
| … of which checked by eye on the page image (`data/qa/visual-checks.json`) | 5 | 0.1% |
| Not found in source / different number | 0 | 0.0% |

## Warnings

| Kind | Count |
|------|------:|
| no_evidence | 210 |
| value_not_in_excerpt | 23 |

## National drafts and practice pages

exact: 1565 · fuzzy: 445 · unverifiable: 6 · fail: 0 · unchecked: 0

## Records needing attention (worst first, top 60)

| Record | Not found | Warnings | Fields |
|--------|----------:|---------:|--------|
| `erie-pa` | 0 | 5 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.bioretention_ponding_depth_inches |
| `harrisburg-pa` | 0 | 5 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.bioretention_ponding_depth_inches |
| `allentown-pa` | 0 | 4 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.green_roof_media_depth_inches |
| `cincinnati-oh` | 0 | 4 | design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `reading-pa` | 0 | 4 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.green_roof_media_depth_inches |
| `brownsville-tx` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `independence-mo` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.design_storm_return_periods_years |
| `lafayette-la` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `laredo-tx` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `scranton-pa` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `south-carolina-manual` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.design_storm_return_periods_years |
| `wilmington-de` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `asheville-nc` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `beaumont-tx` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `bend-or` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `boca-raton-fl` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `carson-city-nv` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `cedar-rapids-ia` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `charleston-sc` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `clarksville-tn` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `concord-nc` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `davenport-ia` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `duluth-mn` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `elizabeth-nj` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `fargo-nd` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `fayetteville-ar` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `flagstaff-az` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `flint-mi` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `gastonia-nc` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `grand-rapids-mi` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `greensboro-nc` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `gulfport-ms` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `hialeah-fl` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `huntsville-al` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `jacksonville-fl` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `las-cruces-nm` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `lawrence-ks` | 0 | 2 | design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `lincoln-ne` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `missoula-mt` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `newark-nj` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `oakland-ca` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `omaha-ne` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `oregon-manual` | 0 | 2 | design_parameters.bioretention_ponding_depth_inches, design_parameters.green_roof_slope_percent |
| `overland-park-ks` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `paterson-nj` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `port-st-lucie-fl` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `richmond-va` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `roanoke-va` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `rockford-il` | 0 | 2 | design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `san-bernardino-county-ca` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `santa-fe-nm` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `scottsdale-az` | 0 | 2 | design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `springfield-il` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `springfield-mo` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `st-louis-mo` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.design_storm_return_periods_years |
| `west-palm-beach-fl` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `yuma-az` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `akron-oh` | 0 | 1 | design_criteria.approved_bmp_categories |
| `alexandria-va` | 0 | 1 | design_criteria.approved_bmp_categories |
| `amarillo-tx` | 0 | 1 | design_criteria.water_quality_volume_method |
