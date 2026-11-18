# Evidence QA report

Generated: 2026-11-18T11:57:25.726Z by `npm run qa:evidence`

Strict check: each excerpt must appear in the source manual (exact, or a close
in-order match with **every number identical**), and each extracted number must
be stated in its own excerpt.

## Records (356)

| Status | Count |
|--------|------:|
| Passed | 50 |
| Warnings only | 81 |
| Failed (excerpt not in source) | 225 |

## Excerpts (5095)

| Result | Count | Share |
|--------|------:|------:|
| Exact | 4322 | 84.8% |
| Close match, numbers identical | 311 | 6.1% |
| Can't check: PDF text lost the numbers | 41 | 0.8% |
| Not found in source / different number | 421 | 8.3% |

## Warnings

| Kind | Count |
|------|------:|
| no_evidence | 465 |
| value_not_in_excerpt | 176 |

## Records needing attention (worst first, top 60)

| Record | Not found | Warnings | Fields |
|--------|----------:|---------:|--------|
| `ohio-rainwater` | 7 | 0 | design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `south-carolina-manual` | 6 | 1 | document_metadata.jurisdiction_name, document_metadata.document_title, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years |
| `des-moines-ia` | 6 | 0 | document_metadata.jurisdiction_name, document_metadata.jurisdiction_level, document_metadata.document_title, document_metadata.version_or_edition |
| `kentucky-bmp` | 6 | 0 | design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method, enrich_notes |
| `clarksville-tn` | 5 | 3 | document_metadata.version_or_edition, design_criteria.design_storm_return_periods_years, design_criteria.approved_bmp_categories, document_metadata.relationship_to_state_manual |
| `toledo-oh` | 5 | 3 | document_metadata.jurisdiction_name, design_parameters.wqv_depth_inches, design_parameters.bioretention_media_depth_min_inches, design_parameters.ed_drain_time_hours |
| `eugene-or` | 5 | 0 | document_metadata.state_code, document_metadata.adoption_or_effective_date, document_metadata.relationship_to_state_manual, design_criteria.peak_flow_calculation_method |
| `grand-rapids-mi` | 5 | 0 | document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `reading-pa` | 4 | 7 | document_metadata.jurisdiction_name, design_parameters.bioretention_media_depth_min_inches, design_parameters.ed_drain_time_hours, design_parameters.green_roof_media_depth_inches |
| `fremont-ca` | 4 | 6 | document_metadata.jurisdiction_level, document_metadata.state_code, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `san-bernardino-county-ca` | 4 | 5 | document_metadata.state_code, document_metadata.relationship_to_state_manual, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `erie-pa` | 4 | 4 | document_metadata.jurisdiction_name, design_parameters.shwt_separation_inches, design_parameters.bioretention_ponding_depth_inches, design_parameters.green_roof_media_depth_inches |
| `youngstown-oh` | 4 | 3 | document_metadata.jurisdiction_name, design_parameters.wqv_depth_inches, design_parameters.max_drawdown_hours, design_parameters.ed_drain_time_hours |
| `prince-georges-county-md` | 4 | 2 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method |
| `richmond-va` | 4 | 1 | document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `springfield-mo` | 4 | 1 | document_metadata.adoption_or_effective_date, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories |
| `tallahassee-fl` | 4 | 1 | document_metadata.jurisdiction_name, document_metadata.jurisdiction_level, document_metadata.relationship_to_state_manual, design_criteria.approved_bmp_categories |
| `tn-state` | 4 | 1 | design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.required_hydrologic_hydraulic_software, design_criteria.approved_bmp_categories |
| `broward-county-fl` | 4 | 0 | document_metadata.jurisdiction_level, document_metadata.version_or_edition, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
| `buffalo-ny` | 4 | 0 | document_metadata.jurisdiction_level, document_metadata.version_or_edition, design_criteria.design_storm_return_periods_years, design_criteria.approved_bmp_categories |
| `fl-sfwmd-erp-ah2` | 4 | 0 | document_metadata.jurisdiction_name, document_metadata.jurisdiction_level, design_criteria.design_storm_return_periods_years |
| `frisco-tx` | 4 | 0 | document_metadata.document_title, document_metadata.adoption_or_effective_date, document_metadata.relationship_to_state_manual, design_criteria.approved_bmp_categories |
| `harrisburg-pa` | 3 | 9 | design_parameters.bioretention_media_depth_min_inches, design_parameters.bioretention_ponding_depth_inches, design_parameters.green_roof_media_depth_inches, design_criteria.water_quality_volume_method |
| `allentown-pa` | 3 | 4 | document_metadata.jurisdiction_name, design_criteria.water_quality_volume_method, design_parameters.green_roof_media_depth_inches, design_criteria.peak_flow_calculation_method |
| `independence-mo` | 3 | 4 | document_metadata.jurisdiction_name, design_criteria.water_quality_volume_method, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years |
| `stamford-ct` | 3 | 4 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_parameters.swale_bottom_width_inches, design_criteria.design_storm_return_periods_years |
| `akron-oh` | 3 | 3 | document_metadata.jurisdiction_name, design_parameters.wqv_depth_inches, design_parameters.ed_drain_time_hours, design_criteria.design_storm_return_periods_years |
| `cedar-rapids-ia` | 3 | 3 | document_metadata.jurisdiction_name, document_metadata.document_title, design_criteria.water_quality_volume_method, design_criteria.design_storm_return_periods_years |
| `cleveland-oh` | 3 | 3 | document_metadata.jurisdiction_name, design_parameters.wqv_depth_inches, design_parameters.ed_drain_time_hours, design_criteria.design_storm_return_periods_years |
| `elizabeth-nj` | 3 | 3 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.water_quality_volume_method, design_criteria.design_storm_return_periods_years |
| `newark-nj` | 3 | 3 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.water_quality_volume_method, design_criteria.design_storm_return_periods_years |
| `paterson-nj` | 3 | 3 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.water_quality_volume_method, design_criteria.design_storm_return_periods_years |
| `bakersfield-ca` | 3 | 2 | document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.approved_bmp_categories, design_parameters.max_drawdown_hours |
| `killeen-tx` | 3 | 2 | document_metadata.relationship_to_state_manual, design_parameters.wqv_depth_inches, design_parameters.ed_drain_time_hours, design_criteria.peak_flow_calculation_method |
| `tx-txdot-hydraulic` | 3 | 2 | document_metadata.document_title, design_criteria.design_storm_return_periods_years, design_criteria.approved_bmp_categories, design_criteria.required_hydrologic_hydraulic_software |
| `ky-kytc-drainage` | 3 | 1 | document_metadata.document_title, design_criteria.peak_flow_calculation_method, design_criteria.approved_bmp_categories, design_criteria.required_hydrologic_hydraulic_software |
| `memphis-tn` | 3 | 1 | document_metadata.document_title, design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories, design_criteria.design_storm_return_periods_years |
| `pa-penndot-drainage` | 3 | 1 | document_metadata.jurisdiction_name, document_metadata.document_title, design_criteria.approved_bmp_categories, design_criteria.required_hydrologic_hydraulic_software |
| `birmingham-al` | 3 | 0 | document_metadata.jurisdiction_name, document_metadata.jurisdiction_level, design_criteria.approved_bmp_categories |
| `ca-caltrans-project-planning` | 3 | 0 | document_metadata.jurisdiction_name, design_criteria.design_storm_return_periods_years, design_criteria.approved_bmp_categories |
| `ca-casqa-municipal` | 3 | 0 | document_metadata.document_title, design_criteria.approved_bmp_categories |
| `dallas-tx` | 3 | 0 | document_metadata.jurisdiction_level, document_metadata.version_or_edition, document_metadata.relationship_to_state_manual |
| `fl-srwmd-erp-ah2` | 3 | 0 | document_metadata.jurisdiction_name, document_metadata.jurisdiction_level, design_parameters.max_drawdown_hours |
| `montgomery-al` | 3 | 0 | document_metadata.jurisdiction_name, document_metadata.jurisdiction_level, design_criteria.approved_bmp_categories |
| `overland-park-ks` | 3 | 0 | document_metadata.jurisdiction_name, design_criteria.water_quality_volume_method, design_criteria.approved_bmp_categories |
| `rochester-ny` | 3 | 0 | document_metadata.jurisdiction_name, design_criteria.design_storm_return_periods_years, design_criteria.approved_bmp_categories |
| `salem-or` | 3 | 0 | document_metadata.version_or_edition, document_metadata.relationship_to_state_manual, design_criteria.approved_bmp_categories |
| `seattle-wa-2026` | 3 | 0 | design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method, design_parameters.design_infiltration_rate_in_per_hr |
| `tarrant-county-tx` | 3 | 0 | document_metadata.jurisdiction_name, document_metadata.state_code, document_metadata.relationship_to_state_manual |
| `raleigh-nc` | 2 | 8 | document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method, design_criteria.peak_flow_calculation_method |
| `annapolis-md` | 2 | 6 | document_metadata.jurisdiction_name, design_criteria.water_quality_volume_method, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
| `bellingham-wa` | 2 | 5 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method |
| `evansville-in` | 2 | 5 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
| `everett-wa` | 2 | 5 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method |
| `olympia-wa` | 2 | 5 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.water_quality_volume_method |
| `ann-arbor-mi` | 2 | 4 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
| `bridgeport-ct` | 2 | 4 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
| `hartford-ct` | 2 | 4 | document_metadata.jurisdiction_name, design_parameters.swale_bottom_width_inches, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
| `new-haven-ct` | 2 | 4 | document_metadata.jurisdiction_name, document_metadata.relationship_to_state_manual, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
| `davenport-ia` | 2 | 3 | document_metadata.jurisdiction_name, design_criteria.water_quality_volume_method, design_criteria.design_storm_return_periods_years, design_criteria.peak_flow_calculation_method |
