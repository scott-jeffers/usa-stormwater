# Evidence QA report

Generated: 2026-11-18T13:52:28.821Z by `npm run qa:evidence`

Strict check: each excerpt must appear in the source manual (exact, or a close
in-order match with **every number identical**), and each extracted number must
be stated in its own excerpt.

## Records (356)

| Status | Count |
|--------|------:|
| Passed | 162 |
| Warnings only | 194 |
| Failed (excerpt not in source) | 0 |

## Excerpts (5325)

| Result | Count | Share |
|--------|------:|------:|
| Exact | 4998 | 93.9% |
| Close match, numbers identical | 310 | 5.8% |
| Can't check: PDF text lost the numbers | 17 | 0.3% |
| Not found in source / different number | 0 | 0.0% |

## Warnings

| Kind | Count |
|------|------:|
| no_evidence | 223 |
| value_not_in_excerpt | 109 |

## National drafts and practice pages

exact: 1543 · fuzzy: 445 · unverifiable: 17 · fail: 0 · unchecked: 0

## Records needing attention (worst first, top 60)

| Record | Not found | Warnings | Fields |
|--------|----------:|---------:|--------|
| `harrisburg-pa` | 0 | 8 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.bioretention_ponding_depth_inches |
| `erie-pa` | 0 | 6 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.bioretention_ponding_depth_inches |
| `reading-pa` | 0 | 6 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.permeable_pavement_storage_depth_inches |
| `allentown-pa` | 0 | 5 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.permanent_pool_depth_inches |
| `fl-fdot-drainage` | 0 | 5 | design_criteria.design_storm_return_periods_years, design_parameters.shwt_separation_inches, design_parameters.permanent_pool_depth_inches, design_parameters.swale_bottom_width_inches |
| `scranton-pa` | 0 | 5 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.permeable_pavement_storage_depth_inches |
| `cincinnati-oh` | 0 | 4 | design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `independence-mo` | 0 | 4 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.design_storm_return_periods_years, design_parameters.shwt_separation_inches |
| `wilmington-de` | 0 | 4 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.shwt_separation_inches |
| `asheville-nc` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_parameters.wqv_depth_inches |
| `boca-raton-fl` | 0 | 3 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.wqv_depth_inches |
| `brownsville-tx` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `concord-nc` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_parameters.wqv_depth_inches |
| `daytona-beach-fl` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `deltona-fl` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `gastonia-nc` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_parameters.wqv_depth_inches |
| `greensboro-nc` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_parameters.wqv_depth_inches |
| `hialeah-fl` | 0 | 3 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.wqv_depth_inches |
| `lafayette-la` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `laredo-tx` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `lincoln-ne` | 0 | 3 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.design_infiltration_rate_in_per_hr |
| `mcallen-tx` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `melbourne-fl` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `missoula-mt` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories, design_parameters.shwt_separation_inches |
| `palm-bay-fl` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `palm-coast-fl` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `philadelphia-pa` | 0 | 3 | design_parameters.shwt_separation_inches, design_parameters.bioretention_media_depth_min_inches, design_parameters.bioretention_ponding_depth_inches |
| `port-st-lucie-fl` | 0 | 3 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.wqv_depth_inches |
| `rockville-md` | 0 | 3 | design_criteria.approved_bmp_categories, design_parameters.shwt_separation_inches, design_parameters.bioretention_media_depth_min_inches |
| `south-carolina-manual` | 0 | 3 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.design_storm_return_periods_years |
| `springfield-mo` | 0 | 3 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.shwt_separation_inches |
| `west-palm-beach-fl` | 0 | 3 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_parameters.wqv_depth_inches |
| `annapolis-md` | 0 | 2 | design_parameters.shwt_separation_inches, design_parameters.bioretention_media_depth_min_inches |
| `bakersfield-ca` | 0 | 2 | design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `baton-rouge-la` | 0 | 2 | design_criteria.design_storm_return_periods_years, design_parameters.permeable_pavement_storage_depth_inches |
| `beaumont-tx` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `bend-or` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `burlington-vt` | 0 | 2 | design_criteria.approved_bmp_categories, design_parameters.swale_bottom_width_inches |
| `carson-city-nv` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `cedar-rapids-ia` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `charleston-sc` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `chattanooga-tn` | 0 | 2 | design_criteria.approved_bmp_categories, design_parameters.green_roof_media_depth_inches |
| `clarksville-tn` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `davenport-ia` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `dover-de` | 0 | 2 | design_criteria.approved_bmp_categories, design_parameters.shwt_separation_inches |
| `duluth-mn` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `durham-nc` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_parameters.shwt_separation_inches |
| `elizabeth-nj` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `fargo-nd` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `fayetteville-ar` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `fl-sjrwmd-erp-ah2` | 0 | 2 | design_criteria.approved_bmp_categories, design_parameters.shwt_separation_inches |
| `flagstaff-az` | 0 | 2 | design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `flint-mi` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `grand-rapids-mi` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `gulfport-ms` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `helena-mt` | 0 | 2 | design_criteria.approved_bmp_categories, design_parameters.shwt_separation_inches |
| `huntsville-al` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `indiana-manual` | 0 | 2 | design_parameters.wqv_depth_inches, design_parameters.bioretention_media_depth_min_inches |
| `jacksonville-fl` | 0 | 2 | design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `lakeland-fl` | 0 | 2 | design_criteria.water_quality_volume_method, design_parameters.shwt_separation_inches |
