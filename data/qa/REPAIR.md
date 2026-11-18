# Evidence repair log

Generated 2026-11-18T13:20:17.561Z by `npm run qa:repair`.

Quotes the strict check could not find in their source manual were repaired
by copying the closest real sentence from the manual (only when it matches the
quote's wording and states the extracted value), trimmed to the parts that are
in the source, or removed. Values were never changed; a value whose quote was
removed shows "No supporting quote" on its page and the record is flagged for
review.

| Action | Count |
|--------|------:|
| Replaced with verbatim source text | 13 |
| Trimmed to the parts found in the source | 14 |
| Removed (no supporting text found) | 368 |

## Changes

### `akron-oh` — document_metadata.jurisdiction_name — removed

- Before: City of Akron MS4 — Ohio Rainwater and Land Development standards

### `al-aldot-drainage` — document_metadata.document_title — removed

- Before: ALDOT Hydraulic Manual

### `albany-ny` — document_metadata.jurisdiction_name — removed

- Before: City of Albany capital MS4 follows NYS Design Manual

### `alexandria-va` — design_criteria.approved_bmp_categories — removed

- Before: Urban Bioretention; Permeable Pavement

### `allentown-pa` — document_metadata.jurisdiction_name — removed

- Before: Allentown Act 167 Stormwater Management Ordinance (Chapter 538) cites Pennsylvania Stormwater Best Management Practices Manual

### `allentown-pa` — design_criteria.water_quality_volume_method — removed

- Before: pollutant load approach, coupling volume and water quality management

### `allentown-pa` — design_parameters.green_roof_media_depth_inches — removed

- Before: Table 3-90 ... 3.6.2 Green Roof ... Min. 3 in (Typically, lightweight growing material.)

### `amarillo-tx` — design_criteria.design_storm_return_periods_years — removed

- Before: 2-Year / 5-Year / 10-Year / 25-Year Peak Flow Curves

### `amarillo-tx` — design_criteria.water_quality_volume_method — removed

- Before: Minor Storm Provisions / Major Storm Provisions / Detention and Retention

### `anaheim-ca` — design_criteria.design_storm_return_periods_years — removed

- Before: minimum of the 10-year storm / capture Q25 / 100-year protection of habitable areas

### `anchorage-ak` — design_criteria.required_hydrologic_hydraulic_software — trimmed (PDF p. 9)

- Before: Criteria March 2015 vii LIST OF TABLES Table 2.1-1: Summary of Urban Stormwater Pollutants ............................................................ 2-7 Table 3.2-1: Summary of Stormwater Standards and Requirements.......................................... 3-3 Table 4.
- After: Criteria March 2015 vii LIST OF TABLES Table 2.1-1: Summary of Urban Stormwater Pollutants … 2-7 Table 3.2-1: Summary of Stormwater Standards and Requirements

### `ann-arbor-mi` — document_metadata.jurisdiction_name — removed

- Before: Ann Arbor follows Washtenaw County Water Resources Commissioner Rules (Ch.63 by reference)

### `ann-arbor-mi` — document_metadata.relationship_to_state_manual — removed

- Before: independent county WRC rules adopted by city ordinance

### `annapolis-md` — document_metadata.jurisdiction_name — removed

- Before: City of Annapolis capital MS4 follows Maryland Stormwater Design Manual

### `annapolis-md` — design_criteria.water_quality_volume_method — removed

- Before: WQv is calculated as (P)(Rv)(A)/12, where P is the rainfall depth (1.0 inch ... 0.9 inch ...)

### `arkansas-manual` — design_criteria.water_quality_volume_method — trimmed (PDF p. 78)

- Before: SA = FS(Q2/VS) where Q2 = Design inflow based on the peak discharge from the developed 2-year runoff event ... VS = 0.00096 fps ... SA = 2 x Q2/0.00096 or 2080 square feet per cfs of inflow.
- After: SA = FS(Q2/VS) where Q2 = Design inflow based on the peak discharge from the developed 2-year runoff event … SA = 2 x Q2/0.00096 or 2080 square feet per cfs of inflow.

### `arlington-tx` — document_metadata.version_or_edition — removed

- Before: Updated April 1, 2020

### `athens-ga` — document_metadata.jurisdiction_name — removed

- Before: Athens-Clarke County adopts GSMM technical standards

### `augusta-ga` — document_metadata.jurisdiction_name — removed

- Before: Augusta adopts GSMM technical standards

### `augusta-me` — document_metadata.jurisdiction_name — removed

- Before: City of Augusta capital MS4 follows Maine Stormwater Design Manual Vol III

### `aurora-co` — design_criteria.design_storm_return_periods_years — removed

- Before: detention / storm frequencies

### `az-adot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Retention Basin

### `bakersfield-ca` — document_metadata.relationship_to_state_manual — removed

- Before: Kern County Development Standards Division Four

### `bakersfield-ca` — design_criteria.approved_bmp_categories — removed

- Before: Retention Basin Design; Detention Basin Design; Closed Conduit Systems, Catch Basins

### `bellingham-wa` — document_metadata.jurisdiction_name — removed

- Before: City of Bellingham MS4 follows Ecology SWMMWW

### `bellingham-wa` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — Ecology SWMMWW 2024

### `bend-or` — document_metadata.jurisdiction_name — removed

- Before: Bend — coverage via Eugene Stormwater Management Manual as Oregon municipal reference (not Bend-adopted)

### `birmingham-al` — document_metadata.jurisdiction_name — removed

- Before: City of Birmingham uses ADEM LID Handbook

### `birmingham-al` — document_metadata.jurisdiction_level — removed

- Before: municipality — City of Birmingham

### `birmingham-al` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention; Constructed Stormwater Wetlands

### `boca-raton-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Boca Raton is within SFWMD and follows ERP Applicant's Handbook Vol II

### `boise-id` — design_criteria.water_quality_volume_method — trimmed (PDF p. 16)

- Before: Water quality treatment depth is based on the City's goal to fully treat at least 80% of the storms annually (i.e. 80% of daily storm events are estimated to have a depth of 0.34" or less)... offsite stormwater discharges... require water quality treatment prior to discharge into the receiving drainage system to achieve an 80% reduction of Total Suspended Solids (TSS)
- After: Water quality treatment depth is based on the City's goal to fully treat at least 80% of the storms annually (i.e. 80% of daily storm events are estimated to have a depth of 0.34" or less) … require water quality treatment prior to discharge into the receiving drainage system to achieve an 80% reduction of Total Suspended Solids (TSS)

### `boulder-co` — document_metadata.jurisdiction_name — removed

- Before: City of Boulder Front Range MS4 — coverage via MHFD/UDFCD Volume 3 WQCV

### `boulder-co` — design_criteria.water_quality_volume_method — removed

- Before: Water Quality Capture Volume (WQCV) based on runoff from 0.6 inches

### `bridgeport-ct` — document_metadata.jurisdiction_name — removed

- Before: City of Bridgeport follows CT Stormwater Quality Manual 2024

### `bridgeport-ct` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — CT DEEP 2024 Manual

### `broward-county-fl` — document_metadata.jurisdiction_level — removed

- Before: SOUTH BROWARD DRAINAGE DISTRICT / BROWARD COUNTY, FLORIDA

### `broward-county-fl` — document_metadata.version_or_edition — removed

- Before: March 26, 2015 / Latest Revision February 2015

### `broward-county-fl` — design_criteria.design_storm_return_periods_years — removed

- Before: 100-year, 3-day storm event / second-order drainage system ... 3-year

### `broward-county-fl` — design_criteria.peak_flow_calculation_method — trimmed (PDF p. 24)

- Before: allowable discharge ... inch of runoff per day per acre ... SFWMD C-9 / C-11 basin
- After: inch of runoff per day per acre

### `buffalo-ny` — document_metadata.jurisdiction_level — removed

- Before: City of Buffalo Code / Green Code

### `buffalo-ny` — document_metadata.version_or_edition — removed

- Before: 191015 Plan Review SW Guidance

### `buffalo-ny` — design_criteria.design_storm_return_periods_years — removed

- Before: 1-, 10-, and 100- year storm event / 25-year / 2-year

### `buffalo-ny` — design_criteria.approved_bmp_categories — removed

- Before: Bio-retention /Rain Gardens / Porous Pavement / Underground detention

### `burlington-vt` — document_metadata.jurisdiction_name — removed

- Before: City of Burlington MS4 follows Vermont Stormwater Management Manual

### `ca-caltrans-construction` — document_metadata.version_or_edition — removed

- Before: March 2024 CTSW-RT-24-425.11.1

### `ca-caltrans-construction` — design_criteria.approved_bmp_categories — removed

- Before: Caltrans Construction Site BMPs are divided into six categories, as shown in Table 2-1: Temporary Soil Stabilization, Temporary Sediment Control, Wind Erosion Control, Tracking Control, Non-Stormwater Management, Waste Management and Materials Pollution Control

### `ca-caltrans-project-planning` — document_metadata.jurisdiction_name — removed

- Before: California Department of Transportation (Caltrans)

### `ca-caltrans-project-planning` — design_criteria.design_storm_return_periods_years — removed

- Before: 2, 5-year design storms referenced

### `ca-caltrans-project-planning` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention, Infiltration Basin, Infiltration Trench, Sand Filter

### `ca-casqa-municipal` — document_metadata.document_title — removed

- Before: Stormwater Best Management Practice Handbook Municipal

### `ca-casqa-municipal` — design_criteria.approved_bmp_categories — removed

- Before: Table 3-1 Municipal Fixed Facility BMPs: Non-Stormwater Management, Vehicle and Equipment Management, Material and Waste Management, Building and Grounds Management, Over Water Activities, General Stormwater Management

### `ca-casqa-municipal` — design_criteria.approved_bmp_categories — removed

- Before: Table 4-1 Treatment Control BMPs — Manufactured (Proprietary): MP-20 Wetland, MP-40 Media Filter, MP-50 Wet Vault, MP-51 Vortex Separator, MP-52 Drain Inlet

### `cambridge-ma` — document_metadata.jurisdiction_name — removed

- Before: City of Cambridge follows MassDEP Stormwater Handbook / Standards

### `cape-coral-fl` — design_criteria.approved_bmp_categories — removed

- Before: CATCH BASINS / OUTFALLS

### `cedar-rapids-ia` — document_metadata.jurisdiction_name — removed

- Before: City of Cedar Rapids adopted SUDAS effective January 1, 2019

### `cedar-rapids-ia` — document_metadata.document_title — trimmed (PDF p. 1)

- Before: --- page 1 --- TOC Design Manual Chapter 2 - Stormwater Table of Contents Table of Contents i Revised: 2021 Edition Chapter 2 - Stormwater 2A General Information 2A-1--------------------------------General Information A. Concept…………………………………………………………………………... 1 B. Informin
- After: TOC Design Manual Chapter 2 - Stormwater Table of Contents Table of Contents i Revised: 2021 Edition Chapter 2 - Stormwater 2A General Information 2A-1--------------------------------General Information A. Concept

### `cedar-rapids-ia` — design_criteria.water_quality_volume_method — removed

- Before: Water Quality Volume, WQv / Design Standards include ISWMM

### `chandler-az` — design_criteria.peak_flow_calculation_method — removed

- Before: Storm Drainage System Design / Runoff Control

### `chandler-az` — design_criteria.approved_bmp_categories — removed

- Before: Retention Basins / Drywells

### `charleston-sc` — design_criteria.water_quality_volume_method — removed

- Before: WQV Water Quality Volume / Chapter 6 Post-Construction

### `charleston-sc` — design_criteria.approved_bmp_categories — removed

- Before: permanent construction stormwater management practices / BMPs

### `chattanooga-tn` — document_metadata.relationship_to_state_manual — removed

- Before: City RMG / NPDES MS4 Permit technical guidance

### `chattanooga-tn` — design_criteria.approved_bmp_categories — removed

- Before: Stay-On Volume (SOV) measures / stormwater management practices

### `cheyenne-wy` — document_metadata.jurisdiction_name — removed

- Before: City of Cheyenne — partial coverage via WYDOT construction stormwater field guide

### `chula-vista-ca` — document_metadata.jurisdiction_name — removed

- Before: Chula Vista — San Diego County MS4; coverage via City of San Diego Stormwater Standards as regional reference

### `clarksville-tn` — document_metadata.version_or_edition — removed

- Before: June 2014 / October 2014 Updated Chapter 4... Chapter 9, Post Construction

### `clarksville-tn` — design_criteria.design_storm_return_periods_years — removed

- Before: Q2-yr / Q10-yr preliminary hydrologic calculations; 25-year spillway example

### `clarksville-tn` — design_criteria.approved_bmp_categories — removed

- Before: 9.7 Bioretention; 9.10 Water Quality Swales; permeable pavement specification

### `clarksville-tn` — document_metadata.relationship_to_state_manual — removed

- Before: independent city stormwater management manual

### `clarksville-tn` — design_parameters.wqv_depth_inches — removed

- Before: WQv = (1.11") (0.62) (3.0ac)

### `cleveland-oh` — document_metadata.jurisdiction_name — removed

- Before: City of Cleveland MS4 — Ohio Rainwater and Land Development standards

### `college-station-tx` — document_metadata.jurisdiction_name — removed

- Before: College Station — BCS Drainage Design Manual PDF 404; temporary NCTCOG iSWM / Dallas criteria

### `colorado-springs-co` — document_metadata.jurisdiction_name — removed

- Before: City of Colorado Springs Front Range MS4 — coverage via MHFD/UDFCD Volume 3 WQCV

### `colorado-springs-co` — design_criteria.water_quality_volume_method — removed

- Before: Water Quality Capture Volume (WQCV) based on runoff from 0.6 inches

### `columbia-sc` — design_criteria.peak_flow_calculation_method — removed

- Before: Channel Protection Volume ... 1-year storm; Overbank Flood Protection (Q25)

### `columbus-oh` — design_criteria.water_quality_volume_method — removed

- Before: WQv Water Quality Volume / Method used for calculating the Water Quality Volume (WQv)

### `corpus-christi-tx` — design_criteria.approved_bmp_categories — removed

- Before: Detention Basin Design / Stormwater Retention

### `corpus-christi-tx` — design_parameters.shwt_separation_inches — replaced (PDF p. 210)

- Before: Minimum of 3 feet between stone reservoir level and seasonally high-water table.
- After: Minimum of 3 feet between stone reservoir level and seasonally highwater table. h.

### `ct-ctdot-drainage` — document_metadata.document_title — removed

- Before: CTDOT Drainage Manual

### `ct-ctdot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Wet Pond, Dry Pond, Detention Basin

### `ct-state` — design_parameters.swale_bottom_width_inches — replaced (PDF p. 250)

- Before: Bottom Width Minimum: 2 feet
- After: Minimum Bottom Width: 2 feet

### `dallas-tx` — document_metadata.jurisdiction_level — removed

- Before: criteria that cities and counties may use as a component of their stormwater management related development regulations

### `dallas-tx` — document_metadata.relationship_to_state_manual — removed

- Before: The criteria may be customized by local governments to meet specific local needs

### `davenport-ia` — document_metadata.jurisdiction_name — removed

- Before: City of Davenport uses SUDAS Design Manual / ISWMM

### `davenport-ia` — design_criteria.water_quality_volume_method — removed

- Before: Water Quality Volume, WQv / ISWMM Design Standards

### `daytona-beach-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Daytona Beach (SJRWMD) — coverage via Jacksonville LDPM Vol 2 pattern

### `dc-ddot-stormwater` — design_criteria.design_storm_return_periods_years — removed

- Before: 2-year design storms referenced

### `dc-ddot-stormwater` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention, Infiltration Basin, Filter Strip, Permeable Pavement

### `de-deldot-drainage` — document_metadata.document_title — removed

- Before: DelDOT Road Design Manual Ch.6 Drainage and Stormwater Management

### `dekalb-county-ga` — document_metadata.jurisdiction_name — removed

- Before: DeKalb County adopts GSMM technical standards

### `dekalb-county-ga` — design_criteria.peak_flow_calculation_method — removed

- Before: SCS Curve Number Method

### `deltona-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Deltona (SJRWMD) — coverage via Jacksonville LDPM Vol 2 pattern

### `denton-tx` — document_metadata.relationship_to_state_manual — removed

- Before: iSWM Technical Manuals / City stormwater criteria supersede iSWM where conflicting

### `denton-tx` — design_criteria.peak_flow_calculation_method — removed

- Before: 4.9 Detention Facilities / iSWM Hydrology Technical Manual

### `des-moines-ia` — document_metadata.jurisdiction_name — removed

- Before: SUDAS Design Manual Chapter 2 Stormwater

### `des-moines-ia` — document_metadata.jurisdiction_level — removed

- Before: Iowa Statewide Urban Design and Specifications

### `des-moines-ia` — document_metadata.document_title — trimmed (PDF p. 1)

- Before: --- page 1 --- TOC Design Manual Chapter 2 - Stormwater Table of Contents Table of Contents i Revised: 2021 Edition Chapter 2 - Stormwater 2A General Information 2A-1--------------------------------General Information A. Concept…………………………………………………………………………... 1 B. Informin
- After: TOC Design Manual Chapter 2 - Stormwater Table of Contents Table of Contents i Revised: 2021 Edition Chapter 2 - Stormwater 2A General Information 2A-1--------------------------------General Information A. Concept

### `des-moines-ia` — document_metadata.version_or_edition — removed

- Before: Chapter_02.pdf SUDAS Design Manual

### `des-moines-ia` — design_criteria.peak_flow_calculation_method — removed

- Before: 2G Detention Practices / Detention Basin Design Methods

### `des-moines-ia` — design_criteria.approved_bmp_categories — removed

- Before: Detention Practices / stormwater facilities

### `dover-de` — document_metadata.jurisdiction_name — removed

- Before: City of Dover capital MS4 follows DNREC Sediment and Stormwater standards

### `duluth-mn` — document_metadata.jurisdiction_name — removed

- Before: City of Duluth MS4 follows Minnesota Stormwater Manual

### `durham-nc` — design_criteria.peak_flow_calculation_method — removed

- Before: Storm Drainage / Culverts / Open Channels

### `el-paso-tx` — design_criteria.design_storm_return_periods_years — removed

- Before: (on roadways of four lanes or more) 100-year Within curb height (maximum curb h=1½” below top of curb and 50 cfs max) Streets (Local Streets) 50-year One lane high and dry 100-year Within curb height (maximum curb h= 1½” below top of curb and 50 cfs max) Storm Drain System 10

### `el-paso-tx` — design_criteria.peak_flow_calculation_method — removed

- Before: Rational Method / HEC-HMS

### `elizabeth-nj` — document_metadata.jurisdiction_name — removed

- Before: City of Elizabeth MS4 follows NJDEP Stormwater BMP Manual

### `elizabeth-nj` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — NJDEP BMP Manual / N.J.A.C. 7:8

### `elizabeth-nj` — design_criteria.water_quality_volume_method — removed

- Before: WQDS: 1.25 inches of rain falling nonuniformly over 2 hours

### `erie-pa` — document_metadata.jurisdiction_name — removed

- Before: City of Erie MS4 / Act 167 cites PA PCSM Manual

### `erie-pa` — design_parameters.shwt_separation_inches — trimmed (PDF p. 388)

- Before: Distance Above SHWT 2 ft ... (multiple infiltration and bioretention SCM columns)
- After: Distance Above SHWT 2 ft

### `erie-pa` — design_parameters.bioretention_ponding_depth_inches — removed

- Before: Maximum Ponding/Storage Depth ... 3.5.1 Bioinfiltration 2 ft; 3.6.1 Bioretention 2 ft

### `erie-pa` — design_parameters.green_roof_media_depth_inches — removed

- Before: Soil Media Depth Min. ... 3.6.2 Green Roof Min. 3 in

### `eugene-or` — document_metadata.state_code — removed

- Before: Oregon / Eugene Code

### `eugene-or` — document_metadata.adoption_or_effective_date — removed

- Before: Eugene Code as in effect on July 1, 2025

### `eugene-or` — document_metadata.relationship_to_state_manual — removed

- Before: Eugene Code 9.6790 Stormwater Development Standards

### `eugene-or` — design_criteria.peak_flow_calculation_method — removed

- Before: STORMWATER FLOOD CONTROL / FLOW CONTROL

### `eugene-or` — design_criteria.approved_bmp_categories — removed

- Before: Stormwater quality / oil control / flow control / flood control facilities

### `evansville-in` — document_metadata.jurisdiction_name — removed

- Before: Evansville Municipal Code Title 16 Drainage cites Indiana Storm Water Quality Manual

### `evansville-in` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — IDEM / Indiana SWQ Manual

### `everett-wa` — document_metadata.jurisdiction_name — removed

- Before: City of Everett MS4 follows Ecology SWMMWW

### `everett-wa` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — Ecology SWMMWW 2024

### `fairfax-county-va` — document_metadata.relationship_to_state_manual — removed

- Before: Fairfax County Public Facilities Manual

### `fairfax-county-va` — design_criteria.approved_bmp_categories — removed

- Before: bioretention basins or rain gardens / Retention, Detention, and Best Management Practices

### `fayetteville-ar` — document_metadata.jurisdiction_name — removed

- Before: City of Fayetteville is an NWA MS4 using the regional Stormwater BMP Manual

### `fhwa-hds-4` — document_metadata.jurisdiction_level — removed

- Before: a single seven-parameter regression equation was developed for nationwide application

### `fhwa-hec-24` — document_metadata.version_or_edition — removed

- Before: queue id fhwa-hec-24; Hydraulic Engineering Circular stormwater pump station manual context

### `fl-nwfwmd-erp-ah2` — document_metadata.relationship_to_state_manual — removed

- Before: Chapter 62-330, F.A.C. ERP stormwater design

### `fl-nwfwmd-erp-ah2` — design_criteria.approved_bmp_categories — removed

- Before: Retention Systems; On-Line and Off-line Stormwater Systems

### `fl-sfwmd-erp-ah2` — document_metadata.jurisdiction_name — removed

- Before: South Florida Water Management District (SFWMD)

### `fl-sfwmd-erp-ah2` — document_metadata.jurisdiction_name — removed

- Before: South Florida Water Management District (SFWMD)

### `fl-sfwmd-erp-ah2` — document_metadata.jurisdiction_level — removed

- Before: Florida water management district (ERP Applicant's Handbook Volume II)

### `fl-sfwmd-erp-ah2` — design_criteria.design_storm_return_periods_years — removed

- Before: Road crown: Frequency: 5-year... Parking lots: Frequency: 5-year

### `fl-sjrwmd-erp-ah2` — document_metadata.document_title — removed

- Before: SJRWMD ERP Applicant's Handbook Volume II

### `fl-sjrwmd-erp-ah2` — design_criteria.approved_bmp_categories — removed

- Before: Wet Pond, Vegetated Swale, Detention Basin, Retention Basin

### `fl-srwmd-erp-ah2` — document_metadata.jurisdiction_name — removed

- Before: Suwannee River Water Management District (SRWMD)

### `fl-srwmd-erp-ah2` — document_metadata.jurisdiction_level — removed

- Before: Florida water management district (ERP Applicant's Handbook Volume II)

### `fl-srwmd-erp-ah2` — design_parameters.max_drawdown_hours — replaced (PDF p. 21)

- Before: Volume II requires all systems to recover treatment volumes within 72 hours
- After: 4.4 Recovery All stormwater management systems shall be designed to recover treatment volumes within 72 hours.

### `fl-swfwmd-erp-ah2` — document_metadata.jurisdiction_name — removed

- Before: Southwest Florida Water Management District (SWFWMD)

### `flagstaff-az` — design_parameters.wqv_depth_inches — removed

- Before: Low Impact Development Runoff Capture Volume (ROCV): Impervious Surface Area (sq ft) × 1 inch = ROCV.

### `fort-collins-co` — document_metadata.jurisdiction_name — removed

- Before: City of Fort Collins Front Range MS4 — coverage via MHFD/UDFCD Volume 3 WQCV

### `fort-collins-co` — design_criteria.water_quality_volume_method — removed

- Before: Water Quality Capture Volume (WQCV) based on runoff from 0.6 inches

### `fort-worth-tx` — design_criteria.approved_bmp_categories — removed

- Before: Dry Detention Pond / Underground Detention

### `fort-worth-tx` — design_parameters.swale_longitudinal_slope_percent — removed

- Before: Enhanced Swales ... Site Slope 4% max

### `frankfort-ky` — document_metadata.jurisdiction_name — removed

- Before: Frankfort capital — coverage via LFUCG Stormwater Manual as KY urban reference (not a Frankfort-adopted document)

### `fremont-ca` — document_metadata.jurisdiction_level — removed

- Before: Clean Water Program / MRP municipalities

### `fremont-ca` — document_metadata.state_code — removed

- Before: California / Municipal Regional Permit

### `fremont-ca` — design_criteria.water_quality_volume_method — removed

- Before: 85th percentile value / Volume-based BMP sizing criteria and 80 percent capture

### `fremont-ca` — design_criteria.peak_flow_calculation_method — removed

- Before: Hydromodification Management / Flow Duration Control / BAHM

### `frisco-tx` — document_metadata.document_title — removed

- Before: Engineering Standards / Design Standards

### `frisco-tx` — document_metadata.adoption_or_effective_date — trimmed (PDF p. 1)

- Before: Standards Table of Contents October 2025 TC-1 Table of Contents Part A ñ Design Standards Page SECTION 1 GENERAL REQUIREMENTS 1-1 1.01 Short Title ..................................................................................................................1-2 1.0
- After: Standards Table of Contents October 2025 TC-1 Table of Contents Part A ñ Design Standards Page SECTION 1 GENERAL REQUIREMENTS 1-1 1.01 Short Title

### `frisco-tx` — document_metadata.relationship_to_state_manual — removed

- Before: City Engineering Standards / NCTCOG

### `frisco-tx` — design_criteria.approved_bmp_categories — removed

- Before: Detention/Retention Facility Design / Stormwater Quality Treatment

### `fulton-county-ga` — document_metadata.jurisdiction_name — removed

- Before: Fulton County adopts GSMM technical standards

### `fulton-county-ga` — design_criteria.peak_flow_calculation_method — removed

- Before: SCS Curve Number Method

### `ga-gdot-drainage` — document_metadata.document_title — removed

- Before: GDOT Drainage Design Policy Manual

### `ga-gdot-drainage` — design_parameters.wqv_depth_inches — removed

- Before: Table 3.1 lists Water Quality under Rational Method applications; no water-quality rainfall/runoff depth in inches is stated.

### `garland-tx` — document_metadata.adoption_or_effective_date — removed

- Before: Garland Development Code (GDC) on Tuesday, May 19, 2015

### `garland-tx` — design_criteria.approved_bmp_categories — removed

- Before: Detention/Retention Facility / Stormwater Quality BMPs

### `grand-rapids-mi` — document_metadata.relationship_to_state_manual — removed

- Before: Stormwater Ordinance Chapter 32 / Chapter 67

### `grand-rapids-mi` — design_criteria.design_storm_return_periods_years — removed

- Before: 2-year, 24-hour / 100-year storm

### `grand-rapids-mi` — design_criteria.water_quality_volume_method — removed

- Before: Treat the runoff generated from 1 inch of rain / "first flush"

### `grand-rapids-mi` — design_criteria.peak_flow_calculation_method — removed

- Before: Channel Protection / Flood Control performance standards

### `grand-rapids-mi` — design_criteria.approved_bmp_categories — removed

- Before: infiltration BMPs / Structural Best Management Practices

### `greenville-sc` — document_metadata.jurisdiction_name — removed

- Before: Greenville SC — coverage via Columbia BMP Design Manual / GSMM sizing pattern (needs local confirmation)

### `gulfport-ms` — document_metadata.jurisdiction_name — removed

- Before: City of Gulfport MS4 follows MDEQ Volume 2

### `gwinnett-county-ga` — document_metadata.jurisdiction_name — removed

- Before: Gwinnett County Stormwater Management Manual based on GSMM

### `gwinnett-county-ga` — design_criteria.peak_flow_calculation_method — removed

- Before: SCS Curve Number Method

### `harrisburg-pa` — design_parameters.bioretention_media_depth_min_inches — removed

- Before: Soil Media Depth Min. ... Min. 18 in [Bioretention column, Table 3-90]

### `harrisburg-pa` — design_parameters.bioretention_ponding_depth_inches — removed

- Before: Maximum Ponding/Storage Depth ... 2 ft [3.6.1 Bioretention, Table 3-90]

### `harrisburg-pa` — design_parameters.green_roof_media_depth_inches — removed

- Before: Soil Media Depth Min. ... Min. 3 in [Green Roof column, Table 3-90]

### `hartford-ct` — document_metadata.jurisdiction_name — removed

- Before: City of Hartford follows CT Stormwater Quality Manual 2024

### `hartford-ct` — design_parameters.swale_bottom_width_inches — replaced (PDF p. 250)

- Before: Bottom Width Minimum: 2 feet
- After: Minimum Bottom Width: 2 feet

### `hawaii-dot-pcbmp` — document_metadata.last_revised_date — removed

- Before: Revision No. 1 December 2021

### `helena-mt` — document_metadata.jurisdiction_name — removed

- Before: Helena capital MS4 follows Montana DEQ-8 stormwater standards

### `hialeah-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Hialeah is within SFWMD and follows ERP Applicant's Handbook Vol II

### `houston-tx` — design_parameters.wqv_depth_inches — replaced (PDF p. 48)

- Before: permanent stormwater quality BMPs for new development and significant redevelopment must treat the first 1/2 inch of runoff
- After: At a minimum, the system must be designed to treat the first 1/2 inch of runoff, except as noted in the SWQGM or the MDC.

### `huntsville-al` — document_metadata.jurisdiction_name — removed

- Before: City of Huntsville MS4 coverage via ADEM LID Handbook

### `ia-dot-drainage` — document_metadata.document_title — removed

- Before: Iowa DOT Design Manual Ch4 Drainage

### `id-itd-drainage` — document_metadata.document_title — removed

- Before: ITD Roadway Design Manual Section 600 Hydraulics

### `il-iepa-stormwater` — design_criteria.approved_bmp_categories — removed

- Before: Infiltration Trench, Vegetated Swale, Filter Strip, Permeable Pavement

### `in-indot-drainage` — document_metadata.document_title — removed

- Before: INDOT Design Manual Chapter 203

### `in-indot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Infiltration Basin, Detention Basin

### `independence-mo` — document_metadata.jurisdiction_name — removed

- Before: City of Independence Engineering Codes list APWA 5600 and MARC & KC APWA BMP Manual

### `independence-mo` — design_criteria.water_quality_volume_method — removed

- Before: Default Strategy: Comprehensive Protection Peak runoff control shall be provided for the 1%, 10% and 50% chance storms and volumetric and/or extended detention control of the 90% mean annual event ... WQv captures 90% ... 1.37-inch Water Quality Storm

### `independence-mo` — document_metadata.relationship_to_state_manual — removed

- Before: independent — metro APWA 5600 + MARC BMP standards

### `jackson-ms` — document_metadata.jurisdiction_name — removed

- Before: City of Jackson capital coverage via MDEQ Volume 2

### `jacksonville-fl` — design_criteria.water_quality_volume_method — removed

- Before: wet detention Table 3.7-1

### `jacksonville-fl` — design_criteria.peak_flow_calculation_method — removed

- Before: Rational SMF storage 100-year / SCS 25-year

### `jefferson-city-mo` — document_metadata.jurisdiction_name — removed

- Before: Jefferson City capital coverage via Missouri Guide to Green Infrastructure

### `juneau-ak` — document_metadata.jurisdiction_name — removed

- Before: Juneau capital MS4 follows Alaska Storm Water Guide

### `killeen-tx` — document_metadata.relationship_to_state_manual — removed

- Before: independent city drainage design manual

### `killeen-tx` — design_parameters.wqv_depth_inches — removed

- Before: No water-quality rainfall or runoff depth (inches) stated; design storms referenced as 25- and 100-year frequency

### `killeen-tx` — design_parameters.ed_drain_time_hours — removed

- Before: Extended detention named among pond types; no drain or drawdown time in hours given

### `king-county-wa` — document_metadata.relationship_to_state_manual — removed

- Before: King County Code (KCC) Chapter 9.04

### `king-county-wa` — design_criteria.design_storm_return_periods_years — removed

- Before: Flow Control / design standards

### `ks-kdot-drainage` — document_metadata.document_title — removed

- Before: KDOT Drainage Design Manual

### `ky-kytc-drainage` — document_metadata.document_title — removed

- Before: KYTC Drainage Guidance Manual

### `ky-kytc-drainage` — design_criteria.peak_flow_calculation_method — removed

- Before: ational Resources Conservation Service (NRCS) NRCS has developed hydrologic and hydraulic-related programs, such as the TR-5

### `ky-kytc-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Detention Basin, Retention Basin

### `lafayette-la` — document_metadata.jurisdiction_name — removed

- Before: Lafayette — coverage via Shreveport Drainage Manual as LA municipal pattern

### `lakeland-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Lakeland is within SWFWMD and follows ERP AH Volume II

### `lancaster-pa-swmf` — design_parameters.practice_mentions.manufactured_treatment — removed

- Before: Proprietary Water Quality Filters and Hydrodynamic Devices – city-approved prefabricated stormwater treatment structures

### `las-vegas-nv` — design_criteria.design_storm_return_periods_years — removed

- Before: minor storm 10-year / major storm 100-year

### `las-vegas-nv` — design_criteria.approved_bmp_categories — removed

- Before: detention / channels / storm drains

### `lexington-ky` — design_criteria.approved_bmp_categories — removed

- Before: GREEN INFRASTRUCTURE PRACTICES / extended detention basins

### `louisville-ky` — document_metadata.relationship_to_state_manual — removed

- Before: MSD Design Manual Chapter 10 stormwater

### `lubbock-tx` — design_criteria.peak_flow_calculation_method — removed

- Before: Rational Method / Playa Analysis / Detention and Retention

### `lubbock-tx` — design_criteria.approved_bmp_categories — removed

- Before: Structural Controls / Detention/Retention Basin

### `ma-massdot-drainage` — document_metadata.document_title — removed

- Before: MassDOT Stormwater Design Guide 2023 Edition

### `ma-massdot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention, Infiltration Basin, Filter Strip, Permeable Pavement

### `ma-state-draft` — design_criteria.approved_bmp_categories — removed

- Before: Non-Structural Street Cleaning ESSD Credits Structural Pretreatment Deep Sump Catch Basin Oil/Grit Separator Proprietary Separator Sediment Forebay Vegetated Filter Strip Structural Treatment Bioretention Area Constructed Stormwater Wetland Extended Dry Detention Basin Gravel Wetland Proprietary Media Filter Sand/Organic Filter Tree Box Filter Wet Basin Roof Dripline Filter Structural Conveyance Drainage Channel Grass Channel Water Quality Swale Structural Infiltration Dry well Infiltration Basin Infiltration Trench Leaching Catch Basin Porous pavement Subsurface Infiltrator Structural Other Dry Detention Basin Green Roof Rain Barrels & Cisterns

### `macon-ga` — document_metadata.jurisdiction_name — removed

- Before: Macon adopts GSMM technical standards

### `madison-wi` — design_criteria.design_storm_return_periods_years — removed

- Before: 10-year / 100-year / 500-year storm event

### `madison-wi` — design_criteria.approved_bmp_categories — removed

- Before: Green Infrastructure / infiltration basins

### `manchester-nh` — document_metadata.jurisdiction_name — removed

- Before: Manchester Stormwater Regulations implement NHDES / NH Stormwater Manual standards

### `maricopa-county-az` — document_metadata.state_code — removed

- Before: Arizona / ADWR State Standard 8-99

### `maricopa-county-az` — design_criteria.approved_bmp_categories — removed

- Before: Retention basins / Detention Basin Requirements

### `mckinney-tx` — document_metadata.relationship_to_state_manual — removed

- Before: City Engineering Design Manual / iSWM Technical Manuals

### `md-sha-drainage` — document_metadata.document_title — removed

- Before: MDOT SHA Drainage Manual

### `melbourne-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Melbourne (SJRWMD) — coverage via Jacksonville LDPM Vol 2 pattern

### `memphis-tn` — document_metadata.document_title — removed

- Before: Volume 1 Policies and Procedures

### `memphis-tn` — design_criteria.water_quality_volume_method — removed

- Before: water quality BMPs are encouraged but not required

### `memphis-tn` — design_criteria.approved_bmp_categories — removed

- Before: detention / water quality BMPs

### `mesa-az` — design_criteria.approved_bmp_categories — removed

- Before: Retention Basins / Low Impact Development (LID) Landscape

### `mesquite-tx` — document_metadata.relationship_to_state_manual — removed

- Before: independent city engineering design manual

### `mi-mdot-drainage` — document_metadata.document_title — removed

- Before: MDOT Drainage Manual Chapter 7

### `mi-mdot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Detention Basin

### `miami-fl` — design_criteria.design_storm_return_periods_years — removed

- Before: Road crown: Frequency: 5-year... Parking lots: Frequency: 5-year

### `missoula-mt` — document_metadata.jurisdiction_name — removed

- Before: City of Missoula MS4 follows Montana DEQ-8 standards

### `missouri-manual` — design_criteria.approved_bmp_categories — trimmed (PDF p. 89)

- Before: Examples include grass swales, filter strips, constructed wetlands, rain gardens and other bioretention practices. ... wet ponds, dry basins, or multi-chamber catch basins ... infiltration basins, subsurface trenches and pervious pavements. Chapter 6 practices include Green Roofs, Cisterns/Storage Tanks, Rain Gardens, Infiltration Trenches, Dry wells, Pervious Pavements, Tree Box and Tree Vault, Bioretention, Bioswales (Vegetative Swales), Filter strips, Wet Ponds, Constructed Wetlands.
- After: Examples include grass swales, filter strips, constructed wetlands, rain gardens and other bioretention practices. … wet ponds, dry basins, or multi-chamber catch basins

### `mobile-al` — document_metadata.relationship_to_state_manual — removed

- Before: City of Mobile’s Storm Water Manual Volume 1 LID Design

### `montgomery-al` — document_metadata.jurisdiction_name — removed

- Before: City of Montgomery capital coverage via ADEM LID Handbook

### `montgomery-al` — document_metadata.jurisdiction_level — removed

- Before: municipality — City of Montgomery

### `montgomery-al` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention; Constructed Stormwater Wetlands

### `montpelier-vt` — document_metadata.jurisdiction_name — removed

- Before: City of Montpelier capital MS4 follows Vermont Stormwater Management Manual

### `mt-mdt-drainage` — document_metadata.document_title — removed

- Before: MDT Hydraulics Manual Chapter 9

### `murfreesboro-tn` — document_metadata.relationship_to_state_manual — removed

- Before: independent city LID / planning guide

### `nd-nddot-drainage` — document_metadata.document_title — removed

- Before: NDDOT Design Manual Chapter V

### `new-haven-ct` — document_metadata.jurisdiction_name — removed

- Before: City of New Haven follows CT Stormwater Quality Manual 2024

### `new-haven-ct` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — CT DEEP 2024 Manual

### `newark-nj` — document_metadata.jurisdiction_name — removed

- Before: City of Newark MS4 follows NJDEP Stormwater BMP Manual

### `newark-nj` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — NJDEP BMP Manual / N.J.A.C. 7:8

### `newark-nj` — design_criteria.water_quality_volume_method — removed

- Before: WQDS: 1.25 inches of rain falling nonuniformly over 2 hours

### `nj-njdot-drainage` — document_metadata.document_title — removed

- Before: NJDOT Drainage Design Manual

### `ny-nysdot-drainage` — document_metadata.document_title — removed

- Before: NYSDOT Highway Design Manual Chapter 8

### `ny-state` — design_criteria.design_storm_return_periods_years — removed

- Before: 1-year, 2-year, 10-year, and 100-year

### `nyc-ny` — design_parameters.bioretention_ponding_depth_inches — replaced (PDF p. 69)

- Before: Surface ponding depth 12" MAX
- After: MIN Surface ponding depth 12" MAXC 12" MAX 12" MAXC - - Media layers Mulch Eng.

### `nyc-ny` — design_parameters.green_roof_media_depth_inches — removed

- Before: Planting/filter media depth ... Green roof 4" MIN

### `oakland-ca` — design_criteria.water_quality_volume_method — removed

- Before: C.3 stormwater quality measures

### `oakland-ca` — design_criteria.peak_flow_calculation_method — removed

- Before: Modified Rational / Synthetic UH; 25% peak reduction

### `oh-odot-drainage` — document_metadata.jurisdiction_name — removed

- Before: Ohio Department of Transportation (ODOT)

### `oh-odot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Infiltration Basin, Extended Detention, Filter Strip, Detention Basin

### `ohio-rainwater` — design_criteria.design_storm_return_periods_years — trimmed (PDF p. 83)

- Before: Storm Event Return Interval (years) 2 5 10 25 50 100 ... 1-year 2-year 5-year 10-year 25-year 50-year 100-year
- After: 1-year 2-year 5-year 10-year 25-year 50-year 100-year

### `ohio-rainwater` — design_criteria.water_quality_volume_method — trimmed (PDF p. 37)

- Before: The water quality volume (WQv) is the volume of runoff that is treated in a water quality pond. WQv (ac-ft) = C * 0.75 * A / 12 ... C = 0.858i² – 0.78i + 0.773i + 0.04 ... the Ohio EPA NPDES stormwater general permit for construction activities requires that the water quality volume be increased by 20% for capacity lost over time due to sediment accumulation.
- After: The water quality volume (WQv) is the volume of runoff that is treated in a water quality pond. WQv (ac-ft) = C * 0.75 * A / 12 … the Ohio EPA NPDES stormwater general permit for construction activities requires that the water quality volume be increased by 20% for capacity lost over time due to sediment accumulation.

### `ohio-rainwater` — design_criteria.peak_flow_calculation_method — trimmed (PDF p. 93)

- Before: NRCS Technical Release 55 (TR 55) or other suitable method shall be used to determine ... peak discharges were estimated using empirical equations developed by the U.S. Geological Survey (Sherwood, 1986)
- After: NRCS Technical Release 55 (TR 55) or other suitable method shall be used to determine

### `ohio-rainwater` — design_criteria.approved_bmp_categories — removed

- Before: 2.6 Water Quality Ponds; 2.7 Infiltration Trench; 2.8 Sand & Organic Filter; 2.9 Grass Filter; 3.0 Bioretention Area; 2.1 Reduction of Impervious Areas; 2.2 Low Impact Development; 2.3 Conservation Development

### `ohio-rainwater` — design_parameters.ed_drain_time_hours — removed

- Before: draw down the extended detention volume over a 48-hour period (dry ED); over a 24-hour period (wet ED)

### `ohio-rainwater` — design_parameters.max_drawdown_hours — removed

- Before: Ohio EPA requires ... minimum drawdown time of 40 hours (bioretention); drained over a 24-48 hour period (ponds)

### `olympia-wa` — document_metadata.jurisdiction_name — removed

- Before: City of Olympia MS4 follows Ecology SWMMWW

### `olympia-wa` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — Ecology SWMMWW 2024

### `or-odot-drainage` — document_metadata.document_title — removed

- Before: ODOT Hydraulics Manual Chapter 13

### `orange-county-ca` — design_criteria.approved_bmp_categories — removed

- Before: Local Detention Basins / Water Quality Vegetated Swale

### `oregon-manual` — design_parameters.bioretention_ponding_depth_inches — removed

- Before: Diagram labels 3" (ponding zone above growing medium)

### `overland-park-ks` — document_metadata.jurisdiction_name — removed

- Before: City of Overland Park / Planning and Development Services / Public Works

### `overland-park-ks` — design_criteria.water_quality_volume_method — removed

- Before: Stormwater Treatment Facilities / Detention Basin Size

### `overland-park-ks` — design_criteria.approved_bmp_categories — removed

- Before: Stormwater Detention / Stormwater Treatment Facilities

### `pa-penndot-drainage` — document_metadata.jurisdiction_name — removed

- Before: Pennsylvania Department of Transportation (PennDOT)

### `pa-penndot-drainage` — document_metadata.document_title — removed

- Before: PennDOT Drainage Manual (Publication 584)

### `pa-penndot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention, Infiltration Trench, Wet Pond, Dry Pond

### `pa-state` — design_criteria.approved_bmp_categories — removed

- Before: A.1 Protect and Preserve Natural Landscape Processes A.2 Enhanced Natural Landscape SCMs B.1 Infiltration-Based SCMs B.2 Non-Infiltration SCMs Managed Release Concept Rate Control SCMs

### `palm-bay-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Palm Bay (SJRWMD) — coverage via Jacksonville LDPM Vol 2 pattern

### `palm-coast-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Palm Coast (SJRWMD) — coverage via Jacksonville LDPM Vol 2 pattern

### `paterson-nj` — document_metadata.jurisdiction_name — removed

- Before: City of Paterson MS4 follows NJDEP Stormwater BMP Manual

### `paterson-nj` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — NJDEP BMP Manual / N.J.A.C. 7:8

### `paterson-nj` — design_criteria.water_quality_volume_method — removed

- Before: WQDS: 1.25 inches of rain falling nonuniformly over 2 hours

### `pensacola-fl` — document_metadata.jurisdiction_name — removed

- Before: Pensacola / NWFWMD geographic boundaries

### `pierre-sd` — document_metadata.jurisdiction_name — removed

- Before: City of Pierre — partial coverage via SDDOT ESC/stormwater course manual (city design PDF 403)

### `pinellas-county-fl` — document_metadata.relationship_to_state_manual — removed

- Before: Pinellas County Stormwater Manual / state water quality standards

### `pinellas-county-fl` — design_criteria.approved_bmp_categories — removed

- Before: Bioswales/Treatment Swales / Wet Detention / Green Infrastructure

### `pittsburgh-pa` — document_metadata.state_code — removed

- Before: Pennsylvania / Title Thirteen

### `plano-tx` — document_metadata.document_title — removed

- Before: Stormwater Design Manual / Storm Drainage Design Manual

### `plano-tx` — design_criteria.peak_flow_calculation_method — removed

- Before: Rational Method Runoff Calculation / Detention Storage Calculation

### `port-st-lucie-fl` — document_metadata.jurisdiction_name — removed

- Before: City of Port St. Lucie is within SFWMD and follows ERP Applicant's Handbook Vol II

### `portland-me` — document_metadata.jurisdiction_name — removed

- Before: City of Portland ME MS4 follows Maine Stormwater Design Manual Vol III

### `prince-georges-county-md` — document_metadata.jurisdiction_name — removed

- Before: Prince George's County implements Maryland SWM Design Manual

### `prince-georges-county-md` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — Maryland SWM Design Manual ESD to MEP

### `prince-georges-county-md` — design_criteria.design_storm_return_periods_years — removed

- Before: 1, 2, 10, 100 year design storms (Maryland SWM Design Manual)

### `prince-georges-county-md` — design_criteria.water_quality_volume_method — removed

- Before: WQv is calculated as (P)(Rv)(A)/12, where P is the rainfall depth (1.0 inch in the Eastern Rainfall Zone, 0.9 inch in the Western Rainfall Zone)

### `providence-ri` — document_metadata.jurisdiction_level — removed

- Before: State of Rhode Island / Providence capital

### `raleigh-nc` — document_metadata.relationship_to_state_manual — removed

- Before: NCDEQ SCM Design Manual

### `raleigh-nc` — design_criteria.design_storm_return_periods_years — removed

- Before: design storms / peak rate

### `reading-pa` — document_metadata.jurisdiction_name — removed

- Before: City of Reading MS4 / Act 167 cites PA PCSM Manual

### `reading-pa` — design_parameters.bioretention_media_depth_min_inches — removed

- Before: Table 3-90: 3.6.1 Bioretention — Soil Media Depth Min. 18 in

### `reading-pa` — design_parameters.ed_drain_time_hours — removed

- Before: Table 3-90: 3.8.2 Naturalized Detention Basin — Maximum Ponding Time 72 hrs

### `reading-pa` — design_parameters.green_roof_media_depth_inches — removed

- Before: Table 3-90: 3.6.2 Green Roof — Soil Media Depth Min. 3 in (Typically, lightweight growing material.)

### `ri-ridot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention, Infiltration Basin, Infiltration Trench, Extended Detention

### `richmond-va` — document_metadata.relationship_to_state_manual — removed

- Before: Virginia Stormwater Management Program (VSMP) / Virginia Stormwater Management Handbook

### `richmond-va` — design_criteria.design_storm_return_periods_years — removed

- Before: 100-year flood / storm drain design references

### `richmond-va` — design_criteria.water_quality_volume_method — removed

- Before: Runoff Reduction Method / Runoff Reduction Spreadsheet

### `richmond-va` — design_criteria.approved_bmp_categories — removed

- Before: stormwater quantity and water quality / detention/retention

### `riverside-county-ca` — document_metadata.jurisdiction_name — removed

- Before: County of Riverside / Santa Ana Region of Riverside County

### `riverside-county-ca` — design_criteria.water_quality_volume_method — removed

- Before: Design Capture Volume (DCV) / 85th percentile 24-hour storm event

### `roanoke-va` — document_metadata.jurisdiction_name — removed

- Before: City of Roanoke Stormwater Management Design Manual

### `roanoke-va` — design_criteria.water_quality_volume_method — removed

- Before: runoff reduction method will be utilized. A water quality compliance worksheet ... 9VAC25-870-65

### `rochester-mn` — document_metadata.relationship_to_state_manual — removed

- Before: independent city storm water management plan

### `rochester-ny` — document_metadata.jurisdiction_name — removed

- Before: City of Rochester adopts NYSDEC Stormwater Management Design Manual for MS4/post-construction design

### `rochester-ny` — design_criteria.design_storm_return_periods_years — removed

- Before: 1, 2, 10, 100 year design storms (NYS Design Manual)

### `rochester-ny` — design_criteria.approved_bmp_categories — replaced (PDF p. 143)

- Before: Stormwater Ponds; Stormwater Wetlands; Infiltration Practices; Filtering Practices; Open Channel Practices
- After: These include ponds, wetlands, infiltration practices, filtering practices and open channel systems.

### `rockford-il` — document_metadata.relationship_to_state_manual — removed

- Before: independent city technical manual (supplements Stormwater Ordinance)

### `rockville-md` — document_metadata.jurisdiction_name — removed

- Before: City of Rockville MS4 follows Maryland Stormwater Design Manual

### `round-rock-tx` — document_metadata.jurisdiction_name — removed

- Before: Drainage Criteria Manual / City of Round Rock

### `salem-or` — document_metadata.version_or_edition — removed

- Before: Public Works Design Standards - March 2025

### `salem-or` — document_metadata.relationship_to_state_manual — removed

- Before: Salem Revised Code / Public Works Design Standards

### `salem-or` — design_criteria.approved_bmp_categories — replaced (PDF p. 88)

- Before: Green Stormwater Infrastructure - GSI; Infiltration Facility
- After: Green Stormwater Infrastructure (GSI).

### `san-bernardino-county-ca` — document_metadata.state_code — removed

- Before: Santa Ana Regional / ORDER No. R8-2010-0036

### `san-bernardino-county-ca` — document_metadata.relationship_to_state_manual — removed

- Before: NPDES No. CAS618036 MS4 Order R8-2010-0036

### `san-bernardino-county-ca` — design_criteria.water_quality_volume_method — removed

- Before: Design Capture Volume or "DCV" / LID Performance Criteria

### `san-bernardino-county-ca` — design_criteria.peak_flow_calculation_method — removed

- Before: HCOC Performance Criteria / Hydromodification Impacts

### `san-francisco-ca` — document_metadata.jurisdiction_name — removed

- Before: City of San Francisco / San Francisco Public Utilities Commission / Port of San Francisco

### `san-francisco-ca` — design_criteria.approved_bmp_categories — removed

- Before: 1st Priority: Reduce Stormwater Runoff — Rainwater harvesting, Permeable pavement, Vegetated roof; 2nd Priority: Detain & Biotreat — Unlined bioretention, Subsurface infiltration, Bioretention swales, Infiltration basin, Constructed wetland, Lined bioretention; 3rd Priority: Detain — Detention tank, Wet pond, Detention pond

### `san-jose-ca` — document_metadata.document_title — trimmed (PDF p. 4)

- Before: rements . . . . . . . . . . 2- 1 2.1 Stormwater Issues in Developed Areas.................................................................2-1 2.2 Post-Construction Stormwater Controls ................................................................2-3 2.3 Municipal Stormwater
- After: rements . . . . . . . . . . 2- 1 2.1 Stormwater Issues in Developed Areas … 2-1 2.2 Post-Construction Stormwater Controls

### `san-jose-ca` — design_parameters.practice_mentions.green_roof — removed

- Before: Green roofs listed as site design measure in Table 2-1

### `santa-barbara-ca` — document_metadata.document_title — removed

- Before: Storm Water BMP Technical Guidance Manual

### `scottsdale-az` — design_criteria.approved_bmp_categories — removed

- Before: STORMWATER STORAGE / DETENTION BASINS

### `scranton-pa` — document_metadata.jurisdiction_name — removed

- Before: City of Scranton MS4 / Act 167 cites PA PCSM Manual

### `seattle-wa` — design_criteria.design_storm_return_periods_years — removed

- Before: 2-year, 5-year, 10-year, 25-year, 50-year, 100-year

### `seattle-wa` — design_criteria.approved_bmp_categories — removed

- Before: This volume covers four primary functional categories of stormwater BMPs: On-site stormwater management, Flow control BMPs, Water quality treatment BMPs, Conveyance BMPs

### `seattle-wa-2026` — design_criteria.design_storm_return_periods_years — removed

- Before: 2-year, 5-year, 10-year, 25-year, 50-year, and 100-year recurrence intervals

### `seattle-wa-2026` — design_criteria.peak_flow_calculation_method — removed

- Before: Single Event Hydrograph Method, Continuous Simulation Method, Rational Method

### `seattle-wa-2026` — design_parameters.design_infiltration_rate_in_per_hr — removed

- Before: Table 3.3. Minimum Measured Infiltration Rates. (multiple BMP-specific minimums in in/hr, e.g., Infiltration Trenches 2, Drywells 5, Infiltrating Bioretention without underdrain 0.6)

### `shreveport-la` — design_criteria.water_quality_volume_method — replaced (PDF p. 300)

- Before: reducing peak flow of a post-development site to peak flow the pre-development ... 10-year, 25-year, and 100-year design storms
- After: The purpose of detention basins is to reduce the peak flow of a post-development site to peak flow the predevelopment conditions. … 10-year, 25-year, and 100-year design storms

### `shreveport-la` — document_metadata.relationship_to_state_manual — removed

- Before: independent city drainage design standards

### `sioux-falls-sd` — document_metadata.jurisdiction_name — removed

- Before: City of Sioux Falls — partial coverage via SDDOT ESC/stormwater course manual (city design PDF 403)

### `south-bend-in` — document_metadata.jurisdiction_name — removed

- Before: South Bend MS4 references Indiana Storm Water Quality Manual

### `south-carolina-manual` — document_metadata.jurisdiction_name — removed

- Before: South Carolina DHEC Storm Water Management BMP Handbook

### `south-carolina-manual` — document_metadata.document_title — removed

- Before: Storm Water Management BMP Handbook

### `south-carolina-manual` — document_metadata.relationship_to_state_manual — removed

- Before: SCDES BMP Handbook evaluates numerous Best Management Practices (BMPs)

### `south-carolina-manual` — design_criteria.design_storm_return_periods_years — removed

- Before: Ponds shall be designed for the 2 and 10-year storms; The 100-year storm should not overtop the embankment

### `south-carolina-manual` — design_criteria.water_quality_volume_method — removed

- Before: design permanent pool volume is equal to 1-inch of runoff per impervious acre on the site

### `south-carolina-manual` — design_criteria.peak_flow_calculation_method — removed

- Before: Size the outlet structure for water quality control and water quantity control (based upon hydrologic

### `south-salt-lake-ut` — design_criteria.water_quality_volume_method — trimmed (PDF p. 6)

- Before: For new developments, the new MS4 permit requires 80th percentile storm precipitation for the total disturbed area... 80th Percentile: 0.6 inches... V80 = RV × d80 × A
- After: For new developments, the new MS4 permit requires 80th percentile storm precipitation for the total disturbed area … 80th Percentile: 0.6 inches

### `spokane-wa` — design_criteria.design_storm_return_periods_years — removed

- Before: 2-year, 10-year, 25-year, 100-year, 24 hour Isopluvial Map

### `springfield-ma` — document_metadata.jurisdiction_name — removed

- Before: City of Springfield follows MassDEP Stormwater Handbook / Standards

### `springfield-mo` — document_metadata.adoption_or_effective_date — removed

- Before: Adopted April 2022 / effective May 4, 2022

### `springfield-mo` — design_criteria.design_storm_return_periods_years — removed

- Before: 2-, 25-, and 100-year design flows / 1-, 10-, and 100-year storms

### `springfield-mo` — design_criteria.peak_flow_calculation_method — removed

- Before: 100-year (1 percent AEP) rainfall / on-site detention

### `springfield-mo` — design_criteria.approved_bmp_categories — removed

- Before: stormwater detention / Best Management Practices (BMPs)

### `stamford-ct` — document_metadata.jurisdiction_name — removed

- Before: City of Stamford follows CT Stormwater Quality Manual 2024

### `stamford-ct` — document_metadata.relationship_to_state_manual — removed

- Before: adopts_state_manual_directly — CT DEEP 2024 Manual

### `stamford-ct` — design_parameters.swale_bottom_width_inches — replaced (PDF p. 250)

- Before: Bottom Width Minimum: 2 feet
- After: Minimum Bottom Width: 2 feet

### `stockton-ca` — document_metadata.relationship_to_state_manual — removed

- Before: Regionwide Permit / Statewide Trash Amendments

### `stockton-ca` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention / Infiltration Basin / Extended Detention Basin

### `syracuse-ny` — document_metadata.jurisdiction_name — removed

- Before: City of Syracuse Stormwater Management Reviews cite NYS Design Manual

### `tacoma-wa` — design_criteria.approved_bmp_categories — removed

- Before: Infiltration Facilities / Detention

### `tallahassee-fl` — document_metadata.jurisdiction_name — removed

- Before: Tallahassee capital / NWFWMD geographic boundaries

### `tallahassee-fl` — document_metadata.jurisdiction_level — removed

- Before: municipality — City of Tallahassee

### `tallahassee-fl` — document_metadata.relationship_to_state_manual — removed

- Before: Chapter 62-330, F.A.C. ERP stormwater design

### `tallahassee-fl` — design_criteria.approved_bmp_categories — removed

- Before: Retention Systems; On-Line and Off-line Stormwater Systems

### `tarrant-county-tx` — document_metadata.jurisdiction_name — removed

- Before: iSWM Technical Manual Site Development Controls — NCTCOG regional guidance used in Tarrant County

### `tarrant-county-tx` — document_metadata.state_code — removed

- Before: North Central Texas Council of Governments

### `tarrant-county-tx` — document_metadata.relationship_to_state_manual — removed

- Before: iSWM Online Technical Manual referenced by community iSWM Criteria Manuals

### `tn-state` — design_criteria.design_storm_return_periods_years — replaced (PDF p. 60)

- Before: Typically, a 10-year or 25-year return design storm is used to size storm sewer systems... Similarly, a 2-year or 5-year return design storm is used to protect from downstream... Additionally, a 100-year return design storm is used to protect from downstream flooding
- After: Generally, a 10-year or 25-year return design storm is used to size storm drainage infrastructure and a 100-year return design storm is used to protect from downstream ﬂooding. … Additionally, a 100-year return design storm is used to protect from downstream flooding

### `tn-state` — design_criteria.water_quality_volume_method — replaced (PDF p. 23)

- Before: designed, built, and maintained to infiltrate, evapotranspirate, harvest and/or use, the first inch of every rainfall event preceded by 72 hours of dry weather.
- After: Runoﬀ Reduction and Pollutant Removal with Smart Site Design Site design standards for all new development and redevelopment require management measures that are designed, built, and maintained to inﬁltrate, evapotranspire, harvest and/or reuse, at a minimum, the ﬁrst inch of every rainfall event preceded by 72 hours of no measurable precipitation.

### `tn-tdot-drainage` — document_metadata.document_title — removed

- Before: TDOT Drainage Manual Chapter 7

### `toledo-oh` — document_metadata.jurisdiction_name — removed

- Before: City of Toledo MS4 — Ohio Rainwater and Land Development standards

### `toledo-oh` — design_parameters.ed_drain_time_hours — removed

- Before: draw down the extended detention volume over a 48-hour period (dry ED); over a 24-hour period (wet ED)

### `toledo-oh` — design_parameters.shwt_separation_inches — removed

- Before: minimum 4ft of separation required between the water table and the bioretention practice; infiltration trench: at least 2 feet between seasonal high-water table and trench bottom

### `topeka-ks` — document_metadata.relationship_to_state_manual — removed

- Before: independent — aligns with MARC/APWA BMP Manual and TMC 13.35

### `trenton-nj` — document_metadata.jurisdiction_name — removed

- Before: City of Trenton MS4 follows NJDEP Stormwater BMP Manual

### `trenton-nj` — design_parameters.wqv_depth_inches — removed

- Before: WQv method: NJDEP Water Quality Design Storm (WQDS): 1.25 inches of rain falling nonuniformly over 2 hours (N.J.A.C. 7:8-5.5).

### `tulsa-ok` — document_metadata.version_or_edition — removed

- Before: June 2019 / October 2019

### `tulsa-ok` — design_criteria.peak_flow_calculation_method — removed

- Before: RATIONAL METHOD / DESIGN STORM

### `tx-txdot-hydraulic` — document_metadata.document_title — removed

- Before: TxDOT Hydraulic Design Manual

### `tx-txdot-hydraulic` — design_criteria.design_storm_return_periods_years — removed

- Before: 0% 0.50 2-year 20% 0.20 5-year 10% 0.10 10-year 4% 0.04 25-year 2% 0.02 50-year 1% 0.01 100-year While AEP, expressed as a perc

### `tx-txdot-hydraulic` — design_criteria.approved_bmp_categories — removed

- Before: Detention Basin, Retention Basin

### `ut-udot-drainage` — document_metadata.document_title — removed

- Before: UDOT Drainage Design Manual of Instruction

### `va-vdot-drainage` — document_metadata.jurisdiction_name — removed

- Before: Virginia Department of Transportation (VDOT)

### `va-vdot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Bioretention, Wet Pond, Extended Detention, Filter Strip

### `vancouver-wa` — design_criteria.design_storm_return_periods_years — removed

- Before: SWMMWW design storms 2/10/25/50/100

### `vt-state` — design_criteria.approved_bmp_categories — removed

- Before: Pre-Treatment Practices, Non-Structural Practices, Structural Stormwater Treatment Practices

### `wa-wsdot-hr` — design_parameters.wqv_depth_inches — removed

- Before: No water-quality rainfall/runoff depth in inches (e.g. 1.0 in.) stated; western volume-based wetpool uses "91st percentile, 24-hour runoff volume as calculated by MGSFlood."

### `wayne-county-mi` — design_criteria.design_storm_return_periods_years — removed

- Before: 100-year recurrence interval storm; 2-year recurrence interval storm

### `wayne-county-mi` — design_criteria.approved_bmp_categories — removed

- Before: Detention Basins; Underground Detention; Bioretention; Water Quality/Infiltration Systems

### `west-palm-beach-fl` — document_metadata.jurisdiction_name — removed

- Before: City of West Palm Beach is within SFWMD and follows ERP Applicant's Handbook Vol II

### `wi-wisdot-drainage` — document_metadata.document_title — removed

- Before: WisDOT FDM Chapter 13 Drainage

### `wi-wisdot-drainage` — design_criteria.approved_bmp_categories — removed

- Before: Detention Basin

### `wilmington-de` — document_metadata.jurisdiction_name — removed

- Before: City of Wilmington DE MS4 follows DNREC Sediment and Stormwater standards

### `winston-salem-nc` — document_metadata.version_or_edition — removed

- Before: 2020 Revised April 2020

### `winston-salem-nc` — design_criteria.approved_bmp_categories — removed

- Before: Stormwater Management Permit / NCDEQ

### `worcester-ma` — document_metadata.jurisdiction_name — removed

- Before: City of Worcester follows MassDEP Stormwater Handbook / Standards

### `yonkers-ny` — design_criteria.design_storm_return_periods_years — removed

- Before: 1-year, 2-year, 10-year, and 100-year

### `youngstown-oh` — document_metadata.jurisdiction_name — removed

- Before: City of Youngstown MS4 — Ohio Rainwater and Land Development standards

### `yuma-az` — document_metadata.jurisdiction_name — removed

- Before: City adopted Standard Construction Specifications and the Erosion Control Drainage Design Manual for Maricopa County, Arizona

### `yuma-az` — design_criteria.water_quality_volume_method — replaced (PDF p. 37)

- Before: First Flush: retain or treat the first 0.5 inches of direct runoff
- After: This minimum standard is “First Flush”, and consists of retaining or treating the first 0.5 inches of direct runoff from a storm event.
