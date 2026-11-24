---
title: Model Stormwater Design Manual
version: Public Review Draft 0.8
date: 2026-11-24
status: Draft for committee review. Not adopted by any agency.
---

## How to read this draft

This is a complete draft of a voluntary model manual that a state could adopt by reference. Every number is a proposal for committee review, not an adopted requirement.

Each provision is numbered (for example **3.2.1**) and tagged with what kind of choice it is:

- **[Default]** a national value. Use it unless a regional adjustment applies.
- **[Regional]** a value a state may replace for its climate (Section 11).
- **[Open]** a value the committee must still choose. The draft gives a starting value and the question.

Each provision also carries an evidence grade, explained in Appendix A:

- **E1** the value most states use, from state manuals read by hand against the source text.
- **E2** the value most manuals use, from Stormwater Atlas records whose quotes were machine-checked against the source PDF.
- **E3** the share of manuals that state the rule at all, from a text search of 253 manuals.
- **E0** common engineering practice with no atlas evidence yet. Treat these as placeholders.

**Versions.** This manual is numbered like software: it stays at version 0.x (Draft 0.6, 0.7 and so on) through every round of community and professional review, and each release lists what changed. No version 1 will be published until reviewers outside the project have checked it.

"Shall" marks a requirement and "should" a recommendation. Where a permit, TMDL or local rule is stricter, it controls.

**Changes in Draft 0.8.** Adds site design and volume credits to Section 3. Site design (3.8) sets when roofs count as disconnected (1,000 sq ft per downspout, a 40 ft flow path at 5% or less), how compacted soils are restored (12 in tilled, top 8 in amended), and a tree credit of 100 sq ft per tree capped at 25%. A national credit table (3.9) says how much of each practice's storage, or of the runoff from each measure's drainage area, counts as retained toward 3.1. Its numbers come from 97 values read by hand in 38 manuals across 24 states; only four states publish a credit for each practice, so the credits are graded thin. Adds Appendix F, a worked example the site's compliance calculator reproduces.

**Changes in Draft 0.7.** Rewrites Section 4 as a full hydrology standard: rainfall source, temporal distribution and duration (4.1), the choice between the rational method, NRCS hydrographs and continuous simulation (4.3, 4.8), time of concentration by segments with a 100 ft sheet-flow limit and a 5-minute minimum (4.4), rational-method coefficients and frequency factors (4.5), and curve numbers, separate impervious and pervious runoff and unit hydrographs (4.6). Its numbers come from 229 values read by hand in 122 manuals across 44 states. Future rainfall waits for NOAA Atlas 15 (4.1.1), with the rules states already use recorded for the committee. Adds Appendix E, a worked hydrology example the site's hydrology calculator reproduces.

**Changes in Draft 0.6.** Adds Section 8, conveyance: design storms for storm drains, inlets, culverts and channels (8.1), gutter spread and inlets (8.2), storm drain pipes (8.3), the hydraulic grade line by the FHWA access-hole method (8.4), culverts (8.5), open channels (8.6) and outfalls (8.7). Its numbers come from 379 values read by hand in 119 manuals across 44 states. Adds Appendix D, a worked storm drain, culvert and channel design, which the site's hydraulics calculator reproduces. Former Sections 8–16 are now 9–17.

**Changes in Draft 0.5.** Rewrites Section 7 as a full detention standard: what detention must achieve and against what baseline (7.2), downstream analysis (7.3), sizing and routing (7.4), multi-stage outlets and barrels (7.5), the orifice and weir equations and coefficients (7.6–7.7), emergency spillways (7.8), basin geometry (7.9) and underground and parking-lot storage (7.10). Its numbers come from 309 values read by hand in 135 manuals across 45 states and DC. Adds Appendix C, a worked detention design checked by routing, which the site's detention calculator reproduces.

**Changes in Draft 0.4.** Adds Part B, construction-phase erosion and sediment control (Sections 13–17). Its numbers come from 154 values read by hand in 68 state and local manuals across 33 states, set against the federal construction permit, which every site of 1 acre or more must already meet.

**Changes in Draft 0.3.** Every numeric value in the atlas (1,107) was read by hand against its source quote and labelled as a minimum, maximum or design value; 48 values were corrected and 52 removed (for example, construction sediment basins and pond maintenance drains that had been read as design rules). The atlas now records what each design storm is for, which settles most of the design-storm evidence in 3.4–3.6. Water-quality depths stated as runoff rather than rainfall are now counted separately (3.2). With the corrected values, maximum drawdown again shows a suggestive regional pattern (6.0.1).

**Changes from Draft 0.1 to 0.2.** Hand-checked evidence grew from 147 to 249 values (224 kept) across 39 states, and five more criteria were read by hand. Channel-protection detention time (3.4), the TSS target (3.3), the infiltration safety factor (5.3), the pond length-to-width ratio (6.5.3) and the extended-detention release time (6.6.1) are now E1. With 27 states instead of 21, maximum drawdown no longer shows a regional pattern, so Draft 0.2 drops the regional drawdown table and makes drawdown an open question (6.0.1). Each key provision now has a short rationale.

## 1 Purpose, scope and applicability

This manual sets minimum design standards for permanent stormwater management on new development and redevelopment (Part A, Sections 1–12) and for erosion and sediment control while sites are under construction (Part B, Sections 13–17).

**1.1 Purpose.** Protect water quality, stream channels and property from the effects of development, using consistent criteria that designers can apply across state lines.

**1.2 Applicability.** [Default, E3] These standards apply to projects that:

1. disturb 1 acre or more (192 of 253 manuals use a 1-acre threshold), or
2. create or replace 5,000 sq ft or more of impervious surface, whatever area is disturbed (83 of 253 manuals use 5,000 sq ft).

> Why: 1 acre matches the federal construction-permit threshold, so the same projects are already in front of a reviewer. The impervious-area trigger catches small, highly paved sites that disturb less than an acre.

**1.3 Redevelopment.** [Open, E0] On redevelopment sites, the standards apply to the impervious area created or replaced. Section 3.7 sets reduced targets.

**1.4 Exemptions.** [Default, E0] The standards do not apply to:

- agriculture and silviculture under an approved conservation plan,
- routine maintenance that keeps the original line, grade and hydraulic capacity, or
- emergency work, which must be brought into compliance once the emergency ends.

**1.5 Relationship to other requirements.** Where an NPDES permit, TMDL, state rule or local ordinance is stricter, the stricter requirement controls. Section 8 sets conveyance standards for storm drains, inlets, culverts and channels; ANSI/ASCE/EWRI 45-16 remains a reference for storm sewer design. Part B (Sections 13–17) covers erosion and sediment control during construction.

## 2 Definitions

| Term | Meaning in this manual |
| --- | --- |
| Drawdown time | Time for a practice to drain from full to empty after inflow stops. |
| Extended detention (ED) | Temporary storage released slowly through a small outlet to protect stream channels. |
| Hotspot | A land use with higher pollutant loads (fueling, vehicle service, outdoor storage, salt storage), where infiltration is restricted. |
| Impervious area (I) | Surfaces that prevent infiltration, including roofs, pavement and compacted gravel, as a percentage of site area in formulas. |
| Infiltration rate | Rate at which water enters native soil, in in/hr, measured by a field test at the practice bottom. |
| Manufactured treatment device (MTD) | A proprietary device verified by a recognized testing program. |
| Practice | A permanent stormwater control measure (SCM or BMP). |
| Pretreatment | A device or zone that removes coarse sediment before runoff enters a practice. |
| Retention | Runoff kept on site by infiltration, evapotranspiration or reuse, and not discharged. |
| Seasonal high water table (SHWT) | The highest level groundwater reaches in a normal year, from soil mottling or monitoring. |
| Water-quality volume (WQv) | The runoff volume a site must retain or treat (Section 3.2). |

## 3 Performance standards

Nine standards apply together. A site meets them in order of preference: design the site to generate less runoff (3.8), retain (3.1, credited by 3.9), then treat (3.3), then control peaks.

**3.1 Retention first.** [Default, E3] Retain as much of the WQv as site conditions allow (Section 5). Treat any part of the WQv that cannot be retained under 3.3. Retention-hierarchy language appears in most green-infrastructure manuals in the atlas.

**3.2 Water-quality volume.** [Default, E1] The WQv is the runoff from **1.0 in of rainfall** (7 of 15 states that set a rainfall depth; 3 more use 1.2 in), computed by Section 4.2. Four further states set 1.0 in of *runoff* from impervious area instead (Hawaii DOT, Maine, Massachusetts, Rhode Island), which is a slightly larger volume.

> Why: 1.0 in is the most common single value and sits near the 90th-percentile daily rainfall across much of the humid East. States that use another value mostly sit between 0.8 and 1.25 in. Stating the depth as rainfall, not runoff, lets the volume scale with how much of the site is paved (4.2).

- **3.2.1** [Regional] A state may instead adopt a documented 90th-percentile rainfall depth for its climate (Section 11). Connecticut (1.3 in), New York (1.2 in) and Iowa (1.25 in) already do.

**3.3 Treatment of the WQv not retained.** [Default, E1] Remove at least **80% of total suspended solids** (TSS) on an average annual basis (16 of 20 states read by hand; the rest require 85–90%). Use a practice from Section 6 sized for the full WQv, or a verified MTD (6.11).

> Why: 80% TSS is the most widely shared performance target in U.S. manuals. A state with impaired waters may set a higher target or add phosphorus and nitrogen targets.

**3.4 Channel protection.** [Open, E1] Provide **24 hours of extended detention** of the runoff from the 1-year, 24-hour storm (12 of 19 states read by hand use 24 hours; range 12–48 h). Retention of the WQv counts toward this volume.

> Why: holding the 1-year storm for a day keeps flows below the level that erodes most stream beds for longer than the storm itself lasts.

- *Open question:* which storm. Classified by purpose (E2), 13 of 45 state manuals use the 1-year storm for channel protection, while 20 use the 2-year storm for peak control; 6 do both. The committee should choose between 1-year extended detention, 2-year peak matching, or both.
- *Evidence for the choice:* in the worked example (Appendix C), the storage needed for 24 hours of 1-year detention brings the routed 2-year peak to 1.5 cfs against a pre-development 8.1 cfs. Where 3.4 applies, 2-year peak control is usually met without a separate stage; the reverse is not true.

**3.5 Peak-flow control.** [Default, E2] Post-development peak discharge shall not exceed pre-development peak discharge for the **2-year and 10-year, 24-hour storms**, at each point of discharge and against the baseline in 7.2.1. Classified by purpose, 20 of 45 state manuals use the 2-year storm and 15 the 10-year storm for peak control; the 25-year storm is used by 8.

**3.6 Extreme flood.** [Default, E1] Pass the **100-year, 24-hour storm** safely, without flooding buildings, through an emergency spillway sized by 7.8 (28 of 30 states that set a spillway storm use the 100-year storm; by purpose, 28 of 45 state manuals use the 100-year storm for flood safety).

**3.7 Redevelopment.** [Open, E0] On redevelopment sites, meet 3.1–3.3 for at least **50% of the replaced impervious area** and 100% of new impervious area, or reduce site impervious area by 20%.

- *Open question:* the atlas has no structured redevelopment data. These figures are common-practice placeholders.

**3.8 Site design.** [Default, E3] Before sizing any practice, the concept plan (10.1) shall show how the layout avoids and reduces runoff: which natural areas, stream buffers, steep slopes and permeable soils are kept undisturbed; how impervious cover was kept to what the use needs; and where roof and pavement runoff is spread over pervious ground rather than piped. Measures that meet 3.8.1–3.8.5 earn the volume credits of 3.9.

- **3.8.1 Conservation areas.** [Default, E0] An area counts as a conservation area only if it is kept undisturbed during construction (14.4, 17.2), protected by a recorded easement or covenant, and receives runoff as sheet flow.
- **3.8.2 Rooftop disconnection.** [Default, E1] Roof runoff counts as disconnected where no more than **1,000 sq ft** of roof drains to each downspout (9 of 15 states; Pennsylvania and Oregon use 500 sq ft, Washington, Nevada and Idaho 700 sq ft, and Tennessee 300 sq ft), and the downspout discharges away from the building to a pervious area that meets 3.8.3.
- **3.8.3 Disconnection flow path.** [Open, E1] The receiving pervious area shall be at least **40 ft long** in the direction of flow and at a slope of **5% or less**, on soils that are uncompacted or restored under 3.8.4. *Evidence:* 12 states set a length from 10 to 75 ft (median 40 ft): New York and West Virginia use 40 ft; Washington, Oregon and Nevada 50 ft; Minnesota recommends 75 ft; Philadelphia gives full credit only at 75 ft and partial credit from 15 ft. Eight states set a slope limit from 2% to 8%, with 5% in three (Maryland, Massachusetts, Minnesota). *Open question:* one length, or a length that grows with soil group and slope, as Vermont's and Philadelphia's do?
- **3.8.4 Soil restoration.** [Open, E1] Where construction has compacted soils that will count as pervious, till the subsoil to **12 in** and amend the top **8 in** with at least 3 in of compost. *Evidence:* 13 states give a depth from 5 to 18 in, in two clusters: deep tilling to 12 in (New York, North Carolina, Tennessee, DC) and amended topsoil of 8 in (Washington: 4 in of compost into the top 8 in; Vermont and Tacoma: 3 in into 5 in, for about 9.5 in amended). Four more use 6 in. This draft combines the two clusters.
- **3.8.5 Trees.** [Open, E1 (thin)] Each new tree planted in uncompacted soil, and each retained tree of 3 in trunk diameter or more, may offset **100 sq ft** of impervious area in the WQv calculation, with total tree credit no more than **25%** of the impervious area that requires it. *Evidence:* five states give a credit per tree: 100 sq ft in New York (and New York City) and Portland, 144 sq ft in Lancaster, 200 sq ft in Grand Rapids, and 20 sq ft (50 for evergreens) for newly planted trees in Washington, whose state, Seattle and Tacoma manuals cap tree credit at 25%.

> Why (3.8): the cheapest retention is runoff that is never generated. Credits make site design count in the same units as practices, so a designer who keeps a wooded buffer or disconnects roofs sees it in the size of what must still be built.

**3.9 Volume credits.** [Default, E1 (thin)] Credit retention toward 3.1 and 3.2 as follows, separately for each drainage area. The credited retention of a drainage area may not exceed its own WQv, credit may not be moved from one drainage area to another, and no area may be counted twice.

| Measure | Credit | Applied to | Evidence |
| --- | --- | --- | --- |
| Infiltrating practice without an underdrain (bioretention, permeable pavement, trench, dry well), on soils meeting 5.2 | **100%** | Storage provided | New York, Georgia coastal and West Virginia; the Runoff Reduction Method gives 75–80% of inflow |
| The same with an underdrain | **40%**, plus 100% of any stone sump below the underdrain | Storage above the underdrain | New York 40%, Runoff Reduction Method 40–45%, Georgia coastal 50%, West Virginia 45–60% |
| Green roof | **100%** | Retention tested under 6.9.3 | New York and West Virginia 100%; Georgia coastal 60%; Runoff Reduction Method 45–60% |
| Rainwater harvesting | **100%** | Volume used between storms (6.10.1) | New York 100%; Georgia coastal 75%; Runoff Reduction Method 40% |
| Disconnection meeting 3.8.2–3.8.3 | **25%** (C, D soils) or **50%** (A, B or restored soils) | WQv from the disconnected area | Runoff Reduction Method, lawn 25–50% |
| Sheet flow to a conservation area (3.8.1) | **50%** (C, D) or **75%** (A, B) | WQv from the contributing area | Runoff Reduction Method 50–75%; Georgia coastal 60% on C, D soils; New York 100% |
| Grass channel | **10%** (C, D) or **20%** (A, B) | WQv conveyed | New York and Missouri |
| Wet pond, constructed wetland, extended detention, lined filter | **0%** | — | Treatment practices: they count toward 3.3, not 3.1 |

```
Retention credited
  = Σ storage × credit
  + Σ WQv of contributing area × credit
Remainder to treat (3.3)
  = WQv of the site − retention credited
```

- **3.9.1 Sump credit.** [Default, E0] Storage in clean stone below the underdrain invert of a practice on soils that infiltrate at 0.1 in/hr or more drains only to the soil, so it is credited at 100%, provided it drains within the limit of 6.0.1.
- **3.9.2 Treatment by the flow path.** [Open, E0] The part of the WQv from a disconnected or conservation area that is not credited as retained has crossed the pervious flow path of 3.8.3 and needs no further treatment under 3.3. *Open question:* should this treatment credit require a vegetated filter strip designed to its own standard, which this draft does not yet set?

*Evidence and open question:* only four states in the atlas publish a credit for each practice, and they measure it two ways. New York, Georgia's coastal supplement and West Virginia credit a share of the **storage** a practice provides, while the Runoff Reduction Method (Hirschman, Collins and Schueler, 2008, as Springfield, Missouri reproduces it) credits a share of the **runoff entering** it. This draft uses storage-based credits for practices that hold water, because storage can be checked on the plans, and runoff-based credits for measures that only slow it. The committee should confirm the underdrained credit (40%) once more states are read.

> Why (3.9): a practice with an underdrain still loses water to the soil and the air, but most of what it holds leaves through the pipe. Crediting all of its storage would count treated water as retained; crediting none would remove the reason to build underdrained practices where infiltration is poor.

## 4 Hydrology and calculation methods

Every number in Sections 3, 7 and 8 depends on the rainfall, runoff and timing used to compute it. This section sets where rainfall comes from, which method computes peak flows and hydrographs, and how its inputs are chosen, so that two engineers given the same site get the same answer.

Its numbers come from 229 values read by hand in 122 state, local and federal manuals: 119 from 44 states and three FHWA manuals (Appendix A), plus a text search of the 243 atlas manuals with their own rules for methods and rainfall sources. The methods are those of NRCS TR-55 and the National Engineering Handbook (NEH 630), and FHWA HEC-22 and HDS-2. The atlas's [hydrology calculator](/tools/hydrology/) applies this section and reproduces the worked example in Appendix E.

**4.1 Rainfall data.** [Default, E3] Use the NOAA Atlas 14 partial-duration point estimates (the mean values) for the site, or a state product that the state has adopted in their place. 87 of 253 manuals cite Atlas 14.

- **4.1.1 Future rainfall.** [Open, E0] This draft sets no factor for future rainfall. NOAA is preparing Atlas 15, whose Volume 1 will replace Atlas 14 with current estimates and whose Volume 2 will give estimates projected into the future. The committee will take up future-rainfall design once Atlas 15 is published, rather than adopt an interim factor that Atlas 15 would soon replace. Until then, a state or local rule that already sets a factor controls (1.5). *Evidence for the committee:* New Jersey (2023) multiplies Atlas 14 depths by county factors projecting 2050–2099 rainfall; Pittsburgh designs to future 24-hour depths and multiplies 10-year conveyance intensities by 1.15; Massachusetts uses the upper 90% confidence limit of Atlas 14 times 0.9, and Lancaster, Pennsylvania the upper confidence limit itself. Four manuals (Aurora, Caltrans, Connecticut, Maryland SHA) say they will move to Atlas 15 when it is published.
- **4.1.2 Temporal distribution.** [Default, E3] For hydrograph methods, use a 24-hour storm with the NRCS distribution for the site: Type II or Type III (96 and 65 of 243 manuals), Type IA in the Pacific Northwest (5 manuals, in Washington, Oregon and two other states), or the Atlas 14-based distributions NRCS has published for many states (21 manuals already name one). Do not use a distribution with a shorter peak than the Tc can resolve.
- **4.1.3 Duration.** [Default, E0] Use the 24-hour storm for runoff volume, detention and infiltration practices, and a duration equal to the time of concentration for rational-method peaks.

> Why (4.1): Atlas 14's confidence limits describe sampling error, not a design margin. Adopting the upper limit raises design depths substantially without saying what risk is being bought: in Massachusetts's own example the 10-year depth rises from 4.75 in to 5.91 in, 24%. Where a state wants a margin, it should say so as a factor it can explain, which is the question the committee will take up with Atlas 15.

**4.2 Water-quality volume.** [Default, E3] Compute the WQv as

```
WQv = (P × Rv × A) / 12        Rv = 0.05 + 0.009 × I
```

where WQv is in acre-feet, P is the rainfall depth from 3.2 (in), A is the drainage area (acres) and I is impervious cover (%). This is the unified sizing formula used in 28 of 253 manuals.

**4.3 Choosing a method.** [Open, E1]

| Purpose | Method |
| --- | --- |
| Peak flow for conveyance (Section 8), drainage area up to **200 acres** | Rational method (4.5) or an NRCS hydrograph (4.6) |
| Peak flow, larger areas | NRCS hydrograph (TR-20, HEC-HMS or equivalent), or USGS regression equations for rural watersheds |
| Storage, detention and infiltration practices (Sections 6 and 7), any size | A runoff hydrograph (4.6). The modified rational method may be used only for sites of **20 acres** or less |
| Flow-duration and continuous standards | Continuous simulation (4.8) |

*Open question:* 13 of 34 states that set a limit allow the rational method up to 200 acres, the limit HEC-22 and HDS-2 recommend, but the limits range from 10 to 320 acres, and the differences follow region more than chance would suggest (p = 0.10): Washington, Oregon and Idaho allow only 10 acres, and Florida's water management districts 10–40 acres, while most of the South and Southwest allow 160–200 acres. A state may adopt a lower limit (Section 11).

**4.4 Time of concentration.** [Default, E1] Compute the time of concentration (Tc) as the sum of travel times along the hydraulically longest path, by the segment method of TR-55 chapter 3 and NEH 630 chapter 15:

```
Sheet flow (TR-55 eq. 3-3):        Tt = 0.007 (n L)^0.8 / (P2^0.5 S^0.4)     hours
Shallow concentrated (eq. 3-1):    V = 16.13 S^0.5 unpaved, 20.33 S^0.5 paved   ft/s
Channels and pipes:                V by Manning's equation at bankfull or full flow; Tt = L / V
```

where n is the sheet-flow roughness of TR-55 Table 3-1, L the segment length (ft), P2 the 2-year, 24-hour rainfall (in) and S the slope (ft/ft).

- **4.4.1 Path.** [Default, E0] Use the path with the longest travel time, which is not always the longest distance. Compute Tc separately for pre- and post-development conditions, and for each subarea.
- **4.4.2 Sheet flow.** [Default, E1] Limit sheet flow to **100 ft** (16 of 25 states; NRCS's current guidance, NEH 630 chapter 15, gives the same limit); beyond it flow is shallow concentrated. Six states still use 300 ft, the limit in TR-55 (1986).
- **4.4.3 Minimum.** [Default, E1] Use no Tc shorter than **5 minutes** (19 of 32 states; seven use 10 minutes). Hydrograph models that run at a 0.1-hour step may use 6 minutes.
- **4.4.4 Other formulas.** [Default, E3] Kirpich, kinematic-wave and lag equations (13, 39 and several manuals) may be used for undeveloped watersheds where the segment method's inputs cannot be defined, with the method and its range of validity stated in the report.

> Why (4.4.2): sheet flow becomes shallow concentrated flow within a few hundred feet at most, and usually well under 100 ft. Long sheet-flow segments make Tc long and peaks low, which undersizes conveyance; NRCS lowered its limit for that reason.

**4.5 Rational method.** [Default, E1] Compute peak flow as `Q = Cf · C · i · A` (cfs, with A in acres and i in in/h) where i is the intensity for a duration equal to Tc from the rainfall of 4.1.

- **4.5.1 Runoff coefficient.** [Default, E1 (thin)] Use **C = 0.90** for pavement and roofs (5 of 8 states that give one value; HEC-22 Table 4.1 gives 0.70–0.95), the HEC-22 Table 4.1 values for other covers, and area-weight them (HEC-22 eq. 4.2). Pervious covers on disturbed or compacted soil take the next higher value in the range.
- **4.5.2 Frequency factor.** [Default, E0] Multiply C by **Cf = 1.1, 1.2 and 1.25** for the 25-, 50- and 100-year storms (the AASHTO Model Drainage Manual values as PennDOT gives them), with the product never greater than 1.0.
- **4.5.3 Systems.** [Default, E0] For each point in a storm drain, use the longest Tc of the areas draining to it and the sum of their C·A, unless a highly impervious part alone gives a larger peak (HEC-22 9.2.2); check both.

**4.6 Curve numbers and unit hydrographs.** [Default, E1]

- **4.6.1 Impervious areas.** [Default, E1] Use **CN = 98** for directly connected impervious area (26 of 26 states that state one). Take pervious curve numbers from TR-55 Table 2-2 for the cover and hydrologic soil group, in good condition for lawns and open space, and in poor or fair condition where soils are compacted by construction.
- **4.6.2 Mixed areas.** [Default, E0] Where impervious area is more than 10% of a subarea, compute impervious and pervious runoff separately and add them, rather than using one weighted CN. For a 1 in storm on the worked example's site, a weighted CN gives 0.14 in of runoff and separate areas 0.33 in (Appendix E): a weighted CN understates small-storm runoff, which is what water-quality and channel-protection practices are sized for.
- **4.6.3 Initial abstraction.** [Default, E0] Use Ia = 0.2 S, the basis of the published curve numbers, unless the state adopts the 0.05 S relationship with curve numbers converted to match.
- **4.6.4 Unit hydrograph.** [Regional, E0] Use the NRCS dimensionless unit hydrograph (peak rate factor 484), with lag = 0.6 Tc. On flat coastal-plain watersheds a state may prescribe the Delmarva unit hydrograph (peak rate factor 284), as the Delaware, Maryland and New Jersey manuals in the atlas do.
- **4.6.5 Time step.** [Default, E0] Use a computation step no longer than 0.1 hour or one-fifth of Tc, whichever is smaller (7.4.2).

**4.7 Routing.** [Default, E3] Route storage practices with a level-pool (storage-indication) or equivalent method, using the starting conditions, time step and tailwater in 7.4.

**4.8 Continuous simulation.** [Regional, E3] Where a state sets flow-duration or continuous performance standards, compute them with a continuous model (HSPF, SWMM, WWHM or equivalent) driven by a long local rainfall record at an hourly or finer step (51 of 243 manuals describe continuous simulation; Washington and California manuals most often require it).

## 5 Site assessment and infiltration feasibility

Infiltration is required wherever the tests below allow it, and prohibited where they show a risk to groundwater or structures.

**5.1 Soil testing.** [Default, E0] Measure the infiltration rate at the proposed practice bottom by a field test, with at least one test per practice and one per 5,000 sq ft of practice footprint.

**5.2 Minimum infiltration rate.** [Default, E1] Infiltration without an underdrain is allowed where the tested rate is **0.5 in/hr or more** (12 of 24 states read by hand use 0.5–0.52 in/hr). Below 0.5 in/hr, use an underdrain. Below 0.1 in/hr, use a lined practice (E0).

> Why: at 0.5 in/hr a typical practice drains its design depth within the drawdown limit in 6.0.1 even after the safety factor in 5.3. Slower soils still infiltrate some water, so they keep the practice but add an underdrain.

**5.3 Design infiltration rate.** [Default, E1] Divide the tested rate by a **safety factor of 2** (7 of 8 states read by hand; Ohio DOT uses 1.5).

> Why: infiltration rates fall as fines collect and as tests overstate long-term rates; a factor of 2 is the value most manuals settle on.

**5.4 Separation from the seasonal high water table.** [Open, E1] The bottom of an infiltrating practice shall be at least **24 in** above the SHWT and bedrock (8 of 24 states; the most common single value).

- *Open question:* 15 states require 30–60 in, mostly for infiltration basins and trenches. The committee should decide whether basins and trenches need 36 in.

> Why: 24 in is the most common single value and leaves room for filtration through unsaturated soil. The spread across states does not follow climate (Appendix A), so it is a policy choice rather than a regional one.

**5.5 Setbacks.** [Default, E3] Infiltrating practices shall be at least:

| From | Distance | Manuals stating it |
| --- | --- | --- |
| Building foundations | 10 ft | 68 of 253 |
| Water-supply wells | 100 ft | 55 of 253 |
| Septic systems | 50 ft | E0 placeholder |

**5.6 Hotspots and contaminated soils.** [Default, E3] Do not infiltrate runoff from hotspots, or into contaminated soils, without pretreatment approved by the reviewing agency. 69 of 253 manuals restrict hotspot infiltration.

**5.7 Karst and steep slopes.** [Default, E0] In karst areas or on slopes over 15%, infiltration requires a geotechnical evaluation.

## 6 Practice design standards

Each practice below may count toward 3.1–3.3 when designed to these minimums. The common rules come first, then each practice.

**6.0 Rules for every practice.**

- **6.0.1 Maximum drawdown.** [Open, Regional, E1] Practices that hold water after a storm shall drain within **72 hours** (12 of 27 states read by hand). *Open question:* 10 states use 48 hours, most of them in the Northeast (median 48 h), while the arid Southwest and West allow 72–96 h. That regional pattern is suggestive only (p = 0.09) and has moved with each round of corrections (p = 0.05, 0.36, 0.09), so this draft keeps one national value and lets a state in the arid West adopt up to 96 h (11.4).
- **6.0.2 Pretreatment.** [Default] Every practice shall have pretreatment as set out in Section 7.
- **6.0.3 Overflow.** [Default] Every practice shall have an overflow that passes the 10-year storm without damage, and a safe path for the 100-year storm (3.6).

> Why (6.0.1): drawdown sets how much storage a site can rely on before the next storm. 48 h favours mosquito control and plant health; 72 h allows smaller practices on slow soils. Longer limits in dry climates reflect long gaps between storms.

**6.1 Bioretention.**

- **6.1.1** [Open, E1] Engineered media at least **18 in** deep, and 24 in where trees are planted. *Open question:* states split evenly: 8 of 20 use 18 in and 8 use 24 in; 4 more require 30–48 in.
- **6.1.2** [Default, E2] Ponding depth **12 in** maximum (19 of 45 manuals use 12 in; range 3–24 in; 3 of 7 states read by hand). 6 in is recommended next to sidewalks and play areas.
- **6.1.3** [Default, E0] Media permeability 1–4 in/hr after placement.
- **6.1.4** [Default] An underdrain is required where 5.2 is not met.

> Why (6.1.1): 18 in is enough depth for filtration and most herbaceous roots; deeper media adds nitrogen removal and tree rooting depth at higher cost. That cost trade-off is why 6.1.1 is open.

**6.2 Permeable pavement.**

- **6.2.1** [Default, E2] Aggregate storage at least **9 in** deep below the bedding course (median of 12 manuals; range 4–18 in), sized to store the WQv.
- **6.2.2** [Default, E0] Run-on from impervious areas no more than 2 times the pavement area.
- **6.2.3** [Default, E0] Subgrade slope 1% maximum, or terraced with check dams.

**6.3 Infiltration trenches and basins.**

- **6.3.1** [Default] Size for the WQv, draining by 6.0.1 at the design rate from 5.3.
- **6.3.2** [Default, E3] Pretreatment shall capture at least **25% of the WQv** (stated in 19 of 253 manuals).
- **6.3.3** [Open] Water-table separation by 5.4. Committee to decide on 36 in for basins.

**6.4 Swales (dry swales and grass channels).**

- **6.4.1** [Default, E2] Bottom width **2 ft minimum** (19 of 23 manuals use 24 in) and 8 ft maximum.
- **6.4.2** [Default, E2] Longitudinal slope **0.5% to 4%** (27 of 34 manuals fall in this range; median 2%). Use check dams above 4%.
- **6.4.3** [Default, E3] Side slopes **3:1** or flatter (106 of 253 manuals).
- **6.4.4** [Default, E0] Flow velocity 1 ft/s or less for the WQv peak.

**6.5 Wet ponds.**

- **6.5.1** [Default, E0] Permanent pool volume at least equal to the WQv.
- **6.5.2** [Open, E1 (thin)] Permanent pool depth **4 ft minimum and 8 ft maximum**. Only 7 states state a minimum (36–72 in; two each use 36, 48 and 60 in), so this is a starting value.
- **6.5.3** [Default, E1] Flow-path length-to-width ratio **2:1 minimum** (11 of 21 states read by hand; 6 require 3:1 and 4 accept 1.5:1), and 3:1 preferred.
- **6.5.4** [Default, E3] Forebay holding at least **10% of the WQv** (45 of 253 manuals).

> Why (6.5.2–6.5.3): a long flow path keeps inflow from short-circuiting to the outlet, and a deep pool keeps settled sediment from being stirred up. 2:1 is the value most states require; 3:1 is where they say performance improves.

**6.6 Extended detention basins.**

- **6.6.1** [Default, E1] Release the WQv over at least **24 hours** (12 of 19 states read by hand; range 12–48 h). This closes Draft 0.1's open question: with more states read, 24 hours is a clear majority.
- **6.6.2** [Default, E0] Micropool at the outlet to limit clogging.

**6.7 Constructed wetlands.**

- **6.7.1** [Default, E2] Detain the WQv for at least **24 hours** (8 of 15 manuals).
- **6.7.2** [Default, E0] At least 35% of the surface area 6–18 in deep, and a deep pool at inlet and outlet.

**6.8 Sand and media filters.**

- **6.8.1** [Default, E0] Sand bed 18 in deep, over an underdrain.
- **6.8.2** [Default] Drain by 6.0.1, and pretreat by Section 7.

**6.9 Green roofs.**

- **6.9.1** [Default, E2] Growing media **3 in minimum** (5 of 10 manuals; range 2.5–12 in).
- **6.9.2** [Default, E2] Roof slope **25% maximum** without added slope restraint (from 5 manuals).
- **6.9.3** [Default] Count retention by the media's tested water-holding capacity.

**6.10 Rainwater harvesting.**

- **6.10.1** [Default, E0] Count only the volume with a demonstrated year-round use, and drain the tank between storms by that use.

**6.11 Manufactured treatment devices.**

- **6.11.1** [Default, E2] Accept a device for 3.3 only with a current verification from a recognized program such as Washington TAPE or NJCAT. These are the programs the atlas manuals name.
- **6.11.2** [Default] Size the device to treat the WQv peak flow at its verified rate.

## 7 Detention, outlets and spillways

Detention holds runoff and lets it out slowly through a controlled outlet. This section sets what a detention facility must do, how its storage and outlet are sized and checked, and how it passes floods larger than it was designed for. It applies to every practice with an outlet structure: dry and extended detention basins, wet ponds, wetlands, underground tanks and vaults, and rooftop and parking-lot storage.

Its numbers come from 309 values read by hand in 135 state, local and federal manuals across 45 states and DC (Appendix A). One value per state is counted, so a state with many local manuals does not outweigh one with a single manual. The atlas's [detention calculator](/tools/detention/) applies this section and checks a design against it.

**7.1 Pretreatment.** [Default, E3] Provide one of the following ahead of each practice:

| Practice | Minimum pretreatment |
| --- | --- |
| Wet ponds, wetlands, ED basins | Forebay holding 10% of the WQv (45 of 253 manuals) |
| Infiltration trenches and basins | 25% of the WQv (19 of 253 manuals) |
| Bioretention, swales, filters | Grass filter strip, gravel diaphragm or sediment chamber sized for the contributing area (E0) |

**7.2 What detention must achieve.** [Default, E1] Each detention facility shall meet, at every point where the site discharges, the channel-protection and peak-control standards of 3.4 and 3.5, and pass the extreme flood under 3.6 and 7.8. Peak control is checked separately for each design storm; a facility designed for one storm controls the others poorly (HEC-22, 10.1.1), so the outlet shall have one stage for each storm it controls (7.5).

- **7.2.1 Pre-development condition.** [Open, E1] Compute pre-development peaks with all pervious areas on the site modeled as **meadow in good condition** (or woods in good condition where the site is wooded), and with 20% of existing impervious area modeled as meadow on redevelopment sites. *Open question:* states define the baseline three ways. Ten manuals in four states (Washington, New Jersey, Maryland, North Carolina) assume forest; Pennsylvania, Michigan, Rhode Island and Vermont use meadow or woods in good condition; five states use the land cover that exists before the project. The draft takes the middle path: it removes the incentive to over-graze or clear a site before applying, without holding every site to a forest it may never have had.
- **7.2.2 Release at each outfall.** [Default, E0] Meet the peak limits at each point of discharge, not only for the site as a whole. Flow shall not be shifted from one outfall to another to meet the limits unless the receiving system downstream of both is shown to be adequate (7.3).
- **7.2.3 Reduced release rates.** [Regional, E1] A state or watershed plan may set release rates below the pre-development peak. Eight manuals in eight states do: New Jersey limits the 2-, 10- and 100-year post-development peaks to 50, 75 and 80% of pre-development; Connecticut and Washington DOT limit the 2-year peak to 50%; Tucson's critical basins and the Denver area (Aurora) limit peaks to 90%; Madison, San Francisco and Charleston require reductions of 15, 25 and 10%.

> Why (7.2.1): detention sized to an already-developed or degraded baseline locks in today's flooding. A meadow baseline is the most common middle ground, and the one most hydrologic tables (TR-55) define clearly.

**7.3 Downstream analysis.** [Default, E1] Where a facility controls peaks, show that the post-development peaks and velocities do not exceed pre-development values at each downstream confluence and constriction to the point where the site makes up **10% of the total drainage area** (the "10 percent rule"; 12 of 16 states that set a limit). King County and Salem use 15%; Virginia uses 1%.

> Why: matching peaks at the property line does not guarantee they match downstream, because detention delays and lengthens the outflow and can stack it on the main-stem peak (HEC-22, 10.1.2). Beyond the 10% point the site's effect on the combined hydrograph is generally small.

**7.4 Sizing and routing.** [Default, E3]

- **7.4.1 Preliminary volume.** [Default] A first estimate of storage may use the TR-55 chapter 6 relationship, `Vs/Vr = C0 + C1·(qo/qi) + C2·(qo/qi)² + C3·(qo/qi)³` (Type II and III: 0.682, −1.43, 1.64, −0.804), or the triangular-hydrograph method. These estimates are for layout only: HEC-22 reports they can under- or over-size a basin.
- **7.4.2 Final design by routing.** [Default, E3] (118 of 253 manuals describe routing.) Final storage and outlet sizes shall be confirmed by routing each design storm's inflow hydrograph through the stage-storage-discharge relationship with the storage-indication (modified Puls) method or an equivalent hydrograph model (HEC-HMS, TR-20, SWMM). The computation step shall not exceed 0.1 hour or one-fifth of the post-development time of concentration, whichever is smaller.
- **7.4.3 Starting conditions.** [Default, E0] Start each routing with any permanent pool at its normal level, any WQv or channel-protection storage full where it does not drain within 24 hours, and infiltration in the facility set to zero unless measured rates support it (5.3).
- **7.4.4 Tailwater.** [Default, E0] Use the receiving water's water surface for the same storm when it would submerge the outlet; otherwise assume free outfall.
- **7.4.5 Drawdown.** [Default, E1] Storage above any permanent pool shall drain within the time set by 6.0.1.

> Why (7.4.2): the preliminary methods average many basins; routing is the only check that the specific outlet and storage meet the specific targets. In the worked example (Appendix C) the average-head estimate of the channel-protection orifice gives 3.6 in, while routing shows 2.25 in is needed for 24 hours of detention.

**7.5 Outlet structures.** [Default, E3]

- **7.5.1 Multi-stage outlets.** [Default, E3] (53 of 253 manuals.) Provide one control for each storm in 3.4–3.5, lowest first: an orifice for channel protection, then orifices or weirs for each peak-control storm, then an overflow for larger storms. Set each stage's invert at or above the maximum water surface of the storm below it, and check every stage with all lower stages flowing (HEC-22, 10.3.3.5).
- **7.5.2 Barrel.** [Default] Size the outlet pipe so that it does not control the discharge for any storm up to the largest peak-control storm: its outlet-control capacity (HDS-5) at each stage shall exceed the combined flow of the stages above it, and its headwater inside the riser shall stay below the lowest stage it would submerge. The pipe should be at least **15 in** in diameter where it passes through an embankment, for cleaning (E1, thin: Kentucky manuals require 15 in, Detroit 12 in, Denton 18 in and El Paso 24 in).
- **7.5.3 Riser and barrel construction.** [Default, E3] Risers shall be designed against flotation with a safety factor of at least 1.25 (flotation is addressed in 117 of 253 manuals), and every pipe through an embankment shall have a filter diaphragm or anti-seep collars and watertight joints (66 of 253).
- **7.5.4 Access.** [Default, E0] Outlet structures shall be reachable for inspection and cleaning without entering the water, and shall have a lockable or bolted access opening.

**7.6 Orifices.** [Default, E1]

```
Q = C · A · √(2 g h)
```

where Q is the discharge (cfs), A the orifice area (sf), g = 32.2 ft/s², and h the head (ft) from the water surface to the orifice centroid, or to the downstream water surface when the orifice is submerged.

- **7.6.1 Coefficient.** [Default, E1] Use **C = 0.60** for sharp-edged orifices in plates thinner than the orifice diameter (11 of 22 states that give a value; Washington manuals use 0.62), 0.80 for orifices in walls thicker than the diameter, and 0.40 for ragged edges such as torch-cut holes in corrugated pipe (HEC-22).
- **7.6.2 Minimum size.** [Regional, E1] No orifice shall be smaller than **3 in** in diameter unless it is protected by internal control (a hood, reverse-slope pipe, perforated riser in a gravel jacket, or screened chamber), in which case the minimum is **1 in**. *Evidence:* 3 in is the most common minimum (14 of 44 manuals; 9 of 24 states), but values range from 0.5 in to 6 in and divide by region. Washington manuals allow 0.5 in, and King County and Seattle 0.25 in, for flow-duration control, while several cities in the Midwest and South require 4–6 in for maintenance.
- **7.6.3 Partly full orifices.** [Default, E0] Below the crown of the opening, compute flow from the wetted area with the head to its mid-depth, or as a weir, so the rating curve is continuous.
- **7.6.4 Trash racks.** [Default, E3] Protect every orifice smaller than 6 in with a trash rack or internal protection (131 of 253 manuals call for trash racks). The rack's open area should be at least 10 times the area it protects (Connecticut and Rhode Island), with bars spaced no wider than one-third of the orifice diameter (New Jersey).

> Why (7.6.2): small orifices clog, and a clogged orifice turns a detention basin into a pond that spills more often. But orifices larger than the target allows cannot meet small-storm and flow-duration standards on small sites. Internal protection is how most manuals reconcile the two.

**7.7 Weirs.** [Default, E1] Compute weir flow as `Q = C · L · h^1.5` (US units; h is the head above the crest in ft), with:

| Weir | C (US units) | Notes |
| --- | --- | --- |
| Sharp-crested rectangular, no end contractions | 3.33 | HEC-22 Cw = 0.415 when h/height < 0.3; use L − 0.1·n·h for n end contractions |
| Riser rim (open-top riser) | 3.33 on the circumference | flow is the lesser of rim weir flow and orifice flow through the top area (HEC-22 ex. 10.11) |
| V-notch | 2.49 · tan(θ/2), with h^2.5 | HEC-22 Cw = 0.31 |
| Broad-crested (spillways, wide crests) | 2.6–3.1 | use 2.6 unless the crest breadth and head justify more (HEC-22 table 10.7) |

- **7.7.1 Submergence.** [Default, E0] When tailwater rises above a weir crest, reduce the flow by the Villemonte relation, `Qs = Q · (1 − (h2/h1)^1.5)^0.385`.

**7.8 Emergency spillways.** [Default, E1] Every embankment or berm that impounds water shall have an emergency (auxiliary) spillway or overflow path that:

- **7.8.1** [Default, E1] passes the peak inflow of the **100-year, 24-hour storm** (28 of 30 states; 59 of 62 manuals) without overtopping the embankment;
- **7.8.2** [Default, E1] does so **with the principal outlet assumed fully blocked** and the facility full to the spillway crest at the start of the storm (at least 12 manuals in 8 states state this; most others size the spillway for the 100-year flow without saying whether the outlet works);
- **7.8.3** [Default, E1] leaves at least **1 ft of freeboard** between the spillway design water surface and the settled top of the embankment (31 of 33 states; 65 of 73 manuals);
- **7.8.4** [Default, E0] has its crest no lower than the maximum water surface of the largest storm the principal outlet is designed to control, and is built in undisturbed ground or armored where it crosses fill, with a stable outlet to the receiving channel.

> Why (7.8.2): the spillway is the facility's last line of defence. Outlets clog most often in the large storms that carry the most debris, so a spillway that only works when the outlet works protects little. HEC-22 and Illinois DOT prefer 2 ft of freeboard for larger impoundments, and Fairfax County requires 2 ft for its larger dam classes.

**7.9 Basin geometry and safety.** [Default, E3]

- **7.9.1 Side slopes.** [Default, E3] Side slopes of ponds and basins shall be **3:1** or flatter (106 of 253 manuals), with a 10 ft safety bench around permanent pools deeper than 4 ft (E0).
- **7.9.2 Bottom slope.** [Default, E1] Dry basin bottoms shall slope at least **0.5%** toward the outlet or a paved low-flow channel (7 of 11 states).
- **7.9.3 Depth.** [Open, E1] Where the public can reach a dry basin, the 100-year depth should not exceed 3–6 ft without a fence or safety bench. *Evidence:* only Arizona jurisdictions set a maximum (3 ft for the 100-year, 2-hour storm in Phoenix, Mesa, Scottsdale and Prescott Valley; 6 ft in Tucson).
- **7.9.4 Access.** [Default, E0] Provide a maintenance access at least 12 ft wide with a slope no steeper than 15% to the basin bottom and outlet.

**7.10 Underground, rooftop and parking-lot storage.** [Default, E1]

- **7.10.1 Parking lots.** [Default, E1] Parking-lot detention shall not exceed **1 ft** of depth at any point for the largest design storm (4 of 5 manuals; Tacoma 6 in), and shall be posted.
- **7.10.2 Underground tanks and vaults.** [Default, E0] Provide access over the inlet and the outlet, a sediment sump, ventilation, and a bypass or overflow for storms above the design storm. Size the orifice by 7.6, with a 0.5 in minimum where the orifice is inside a screened, accessible control structure.

**7.11 Dam safety.** [Default] Embankments that meet state dam-safety thresholds shall also meet the state dam-safety rules, which govern where they are stricter than this section.

> Why (Section 7): most manuals agree on the safety numbers (100-year spillway, 1 ft freeboard, 10% downstream point) and disagree on the hydraulics only in the details. The outlet and weir equations above are the ones in HEC-22 and in nearly every state manual that gives them, so a designer working in any state uses the same calculations.

## 8 Conveyance: storm drains, inlets, culverts and channels

Conveyance carries runoff from where it lands to where it is released: gutters and inlets collect it, storm drains and culverts carry it under streets and embankments, and open channels carry it on the surface. This section sets the storms each part is sized for, the limits it must meet, and the methods used to show it does. It applies to new and replaced public conveyance and to private conveyance that serves more than one lot or crosses a public right-of-way.

Every system has two parts. The **minor system** (gutters, inlets, pipes and small channels) carries the design storms of 8.1.1–8.1.5 without surcharge or nuisance flooding. The **major system** (streets, swales, overflow paths and the minor system together) carries the 100-year storm without flooding buildings. Both are designed; the major system is not whatever happens when the minor system is full.

Its numbers come from 379 values read by hand in 119 state, local and federal manuals: 116 from 44 states and three FHWA manuals (Appendix A). One value per state is counted. The methods are those of FHWA HEC-22 (*Urban Drainage Design Manual*, 4th edition, 2024) and HDS-5 (*Hydraulic Design of Highway Culverts*, 3rd edition, 2012), which nearly every manual in the atlas cites. The atlas's [hydraulics calculator](/tools/hydraulics/) applies this section and reproduces the worked example in Appendix D.

**8.1 Design storms.** [Default, E1]

- **8.1.1 Storm drains and inlets.** [Default, E1] Size storm drains to carry the **10-year** peak flow within the HGL limit of 8.4.3, and size inlets so that gutter spread for the **10-year** storm stays within 8.2.1 (storm drains: 15 of 25 states; inlets and spread: 7 of 11 states). Four states use 5 years (some only on residential streets) and six use 25 years or more.
- **8.1.2 Sag points.** [Default, E0] Where water can leave a low point only through the storm drain (a depressed roadway or underpass, or a sag with no overflow path), size the inlets and the pipe leaving the sag for the **50-year** storm, as HEC-22 9.2.1 recommends and the Alabama, Georgia, Delaware, Maryland, Illinois and Mississippi DOT manuals require.
- **8.1.3 Major system.** [Default, E0] Show a continuous overflow path for the **100-year** storm from every sag and every inlet to a receiving water, in streets, swales or easements, that floods no building and keeps the depth in streets at or below the top of curb, with at least one lane free of water on arterials. Where no surface path is possible, the minor system shall carry the 100-year storm.
- **8.1.4 Culverts.** [Open, E1] Size culverts under local and collector roads for the **25-year** storm and under arterials and freeways for the **50-year** storm, within the headwater limits of 8.5.2, and check the **100-year** storm for building flooding and road overtopping. *Open question:* states split three ways: of 18, five use 10 years, five use 25 years and five use 100 years. The draft takes the middle value and makes the 100-year check universal.
- **8.1.5 Open channels.** [Default, E1] Size constructed channels for the **10-year** storm with the freeboard of 8.6.2 (11 of 18 states). A channel that is part of the major system, or that drains more than one development, shall carry the **100-year** storm within its easement (4 states use 100 years for all channels).

> Why (8.1.1): a 10-year minor system is the most common standard by a wide margin, and HEC-22 9.2.1 calls it the usual minimum. What protects people and buildings from larger storms is the overflow path of 8.1.3, which costs little when it is planned with the street grades and a great deal when it is not.

**8.2 Gutter spread and inlets.** [Default]

- **8.2.1 Allowable spread.** [Open, E0] For the design storm of 8.1.1, spread beyond the parking lane or shoulder shall not exceed **half of one driving lane** on local streets and on collectors with design speeds under 45 mph, and **3 ft** on arterials under 45 mph; on roads designed for 45 mph or more, spread shall stay within the shoulder. These are the limits of HEC-22 Table 5.1, and they apply at sags to the storm of 8.1.2. *Open question:* manuals state spread limits in too many forms (by lane, by width, by depth at the curb) for the atlas to compare them yet.
- **8.2.2 Gutter flow.** [Default] Compute gutter flow and spread with HEC-22 equations 5.2 to 5.8 (Izzard's modification of Manning's equation) with Manning's n from HEC-22 Table 5.3 (0.016 for asphalt or concrete pavement with a concrete gutter is typical):

```
Uniform gutter (HEC-22 eq. 5.2):
  Q = (0.56 / n) · Sx^1.67 · SL^0.5 · T^2.67
Share of flow over width W (eq. 5.7):
  Eo = 1 / {1 + (Sw/Sx) / [(1 + (Sw/Sx)/(T/W − 1))^2.67 − 1]}
```

where Q is the gutter flow (cfs), T the spread (ft), Sx the cross slope, SL the longitudinal slope, W the width of a depressed gutter (ft) and Sw its cross slope (Sx + a/W for a depression a).
- **8.2.3 Inlets on grade.** [Default] Compute interception with HEC-22 equations 7.3 to 7.13: for grates, frontal and side flow efficiency with the grate's splash-over velocity from HEC-22 Figure 7.8; for curb openings, `LT = 0.6 Q^0.42 SL^0.3 (1/(n Se))^0.6` and `E = 1 − (1 − L/LT)^1.8`. Carry each inlet's bypass to the next inlet downstream and add it to that inlet's flow. Locate inlets so the spread limit of 8.2.1 is met at each one.
- **8.2.4 Inlets in sags.** [Default, E0] Compute sag inlets as weirs at low depth and orifices at greater depth (HEC-22 equations 7.14–7.21), and use the greater of the two depths. Assume grates in sags are **50% clogged**, and curb openings 10% clogged, unless a combination inlet's curb opening alone carries the flow. Provide flanking inlets on both sides of a sag on any street where ponding would reach a travel lane.
- **8.2.5 Safety.** [Default, E0] Use bicycle-safe grates wherever bicycles may travel, and avoid grates in crosswalks and pedestrian routes.

> Why (8.2.4): sag inlets fail by clogging, and when they fail all the water that reaches them stays in the street. HEC-22's own sag example assumes 50%, and so do the manuals of Arlington (Texas), Aurora, Frankfort and Lexington for low-point inlets.

**8.3 Storm drain pipes.** [Default, E1]

- **8.3.1 Minimum diameter.** [Open, E1] Public storm drains shall be at least **15 in** in diameter; inlet leads shorter than 50 ft may be **12 in**. *Open question:* 8 of 22 states require 12 in, 6 require 15 in and 7 require 18 in (Houston 24 in). The draft takes the median.
- **8.3.2 Capacity.** [Default, E1 (thin)] Size pipes with Manning's equation for full flow, `Q = (0.463/n) · D^2.67 · S^0.5` (HEC-22 eq. 9.2, D in ft), using **n = 0.013** for concrete and smooth-interior plastic pipe and 0.024 for 2⅔ × ½ in corrugated metal. The pipe may run partly full or surcharged only as the HGL of 8.4 allows. *Evidence:* only six states give a design n for concrete pipe: four use 0.012 and two 0.013. HEC-22's worked examples use 0.013, which allows for joints, structures and aging.
- **8.3.3 Minimum velocity.** [Default, E1] Each pipe shall reach at least **3 ft/s** flowing full (or at the design flow) so that it cleans itself (16 of 33 states; 10 use 2.5 ft/s). Where the grade cannot give 3 ft/s, the reviewing agency may accept **2.5 ft/s**.
- **8.3.4 Maximum velocity.** [Open, E1] Velocity at the design flow shall not exceed **15 ft/s** in concrete pipe, or the manufacturer's limit for other materials if lower, unless the pipe is designed for abrasion and the outlet has an energy dissipator (8.7). *Open question:* states range from 8 to 20 ft/s; 6 of 21 use 10 ft/s, 5 use 15 and 5 use 20.
- **8.3.5 Minimum cover.** [Open, E1] Provide at least **2 ft** of cover from finished grade to the outside crown, or the manufacturer's minimum for the design live load if greater. Less cover, to an absolute minimum of 1 ft below the pavement subgrade, needs a structural design. *Open question:* states range from 1 to 4 ft. Six use 1 ft, five of them DOT manuals measuring below the pavement subgrade, and four use 2 ft, all city or county manuals measuring from finished grade: the two are not the same measurement.
- **8.3.6 Alignment and size.** [Default, E0] Lay pipes straight between structures. Do not decrease pipe size downstream, even where a smaller pipe would carry the flow, so debris that enters a pipe can pass through it. Where pipe size increases at a structure, match the crowns or the 0.8-diameter points, and drop the outlet invert at each structure by at least the loss of HEC-22 equation 9.10.
- **8.3.7 Access structures.** [Open, E1] Provide a manhole, inlet or junction box at every change in size, slope or direction, at every junction, and at intervals of no more than **300 ft** for pipes smaller than 36 in and **500 ft** for larger pipes. *Open question:* 7 of 16 states use 300 ft; three use 400 ft and the rest range from 250 to 500 ft, most of them longer for larger pipes.

> Why (8.3.3): sediment that settles in a storm drain reduces its capacity a little more after every storm. Three feet per second flowing full is the velocity HEC-22 recommends and the one the largest group of states requires.

**8.4 Hydraulic grade line.** [Default]

- **8.4.1 Method.** [Default, E0] Compute the energy and hydraulic grade lines for the design storm from the outfall upstream: friction losses with HEC-22 equation 9.4, the outfall's exit loss with equation 9.5, bends with equation 9.6, and the losses in each access hole and inlet with the FHWA access-hole method of HEC-22 section 9.1.6.7 (equations 9.13–9.31), which accounts for benching, angled inflows and plunging flow. HEC-22's approximate method (`H = K V²/2g`) may be used for preliminary layout only. At the downstream end of each pipe use HEC-22 Table 9.6, and in partly full pipes compute the water surface profile.
- **8.4.2 Tailwater.** [Default, E0] At the outfall, start from the water surface of the receiving water for a storm whose frequency is consistent with the design storm (FHWA HEC-19 gives coincident frequencies for a storm drain and its receiving stream), or from the outlet pipe's critical depth where the outfall is free.
- **8.4.3 Clearance.** [Default, E1] For the design storm, the energy level in every structure (EGLa, HEC-22 eq. 9.29, used as its water level) shall stay at least **1 ft** below the rim, grate or curb-inlet opening, and below the ground surface over the pipe (11 of 14 states).
- **8.4.4 Check storm.** [Default, E0] For the 100-year storm (or the 50-year storm at sags under 8.1.2), the HGL may reach the rim only where the overflow it releases follows the path of 8.1.3.

```
Friction (eq. 9.4):
  Hf  = L · [Q n / (1.486 A R^0.67)]²
Access hole (eq. 9.13–9.18):
  DI  = Q / (A √(g D))
  Eai = max(Ei + 0.2 V²/2g,  D·DI²,  1.6 D·DI^0.67)
Benching, angled and plunging inflow (eq. 9.27):
  Ea  = Eai + (Eai − Ei)(CB + Cθ + CP)
```

> Why (8.4.1): energy lost in access holes is often larger than the friction in the pipes between them, and the simple coefficient methods misjudge it most where it matters: at junctions, bends and drops. FHWA's laboratory method fixes this and can still be checked by hand, as Appendix D shows.

**8.5 Culverts.** [Default]

- **8.5.1 Method.** [Default, E0] Compute headwater for both inlet control and outlet control and use the higher (HDS-5), with the HDS-5 inlet-control equations and coefficients for the inlet type (Appendix A of HDS-5) or the FHWA HY-8 program. Outlet control is `HW = ho + [1 + ke + 29 n² L / R^1.33] V²/2g − S L`, with ho the greater of the tailwater depth and (dc + D)/2.
- **8.5.2 Allowable headwater.** [Default, E1] At the design storm of 8.1.4, headwater shall not exceed **1.5 times the culvert rise** (HW/D ≤ 1.5; 10 of 13 states), shall stay below the edge of the road shoulder, and shall not raise water on another property above what that property can safely accept. Culverts larger than 30 sq ft in area should be held to HW/D ≤ 1.2, as Pennsylvania and Flagstaff require.
- **8.5.3 Minimum diameter.** [Default, E1] Culverts under public roads shall be at least **18 in** in diameter (10 of 22 states; six use 24 in). Driveway culverts may be 15 in.
- **8.5.4 Outlet velocity.** [Default, E0] Where the culvert's outlet velocity exceeds what the downstream channel can withstand, provide outlet protection or an energy dissipator designed with FHWA HEC-14 (8.7).
- **8.5.5 Streams and debris.** [Default, E0] Culverts in streams that support fish or other aquatic organisms shall meet the state's passage requirements, which may govern size. Where debris is expected, size for partial blockage or provide debris control (FHWA HEC-9).

```
Inlet control, submerged (Q/(A D^0.5) ≥ 4.0; HDS-5 eq. A.3):
  HW/D = c [Q/(A D^0.5)]² + Y − 0.5 S
Inlet control, unsubmerged (≤ 3.5, form 1; interpolate between):
  HW/D = Hc/D + K [Q/(A D^0.5)]^M − 0.5 S
```

> Why (8.5.2): an HW/D of 1.5 keeps a culvert out of deep pressure flow at its design storm and leaves headroom for the larger storm, and it is the value that most manuals that state a ratio have chosen.

**8.6 Open channels.** [Default]

- **8.6.1 Capacity.** [Default] Compute normal depth with Manning's equation and Manning's n for the channel lining as maintained, not as built (HDS-4 or HEC-15 tables). Check critical depth; where the Froude number of the design flow is between 0.8 and 1.2, change the section or slope, because flow near critical depth is unstable.
- **8.6.2 Freeboard.** [Default, E1] Provide at least **1 ft** of freeboard above the design water surface (7 of 10 states), or 0.5 ft for channels carrying less than 10 cfs. At bends, add the superelevation of the water surface.
- **8.6.3 Lining.** [Default, E0] Size the lining so the design shear stress, `τ = 62.4 · d · S` (lb/sq ft, d the maximum depth in ft), does not exceed the lining's permissible shear from FHWA HEC-15 or the product's tested value.
- **8.6.4 Side slopes and access.** [Default, E0] Mowed grass channels shall have side slopes of 3:1 or flatter, and every channel shall have maintenance access along its length.

**8.7 Outfalls and energy dissipation.** [Default, E0] At every outfall, compare the exit velocity with the permissible velocity of the receiving channel and provide riprap aprons, stilling basins or other dissipators designed with FHWA HEC-14 where it is exceeded. Outfalls to streams shall not be placed where they direct flow into the opposite bank.

> Why (8.7): an outfall is where a well-designed system most often does its damage, by eroding the stream it discharges to. HEC-14 sizes the protection from the exit velocity and the tailwater, both of which the calculations above already produce.

## 9 Construction, inspection and maintenance

A practice only works if it is built as designed and kept working.

**9.1 Protection during construction.** [Default, E0] Keep construction traffic and sediment off infiltration areas. Do not build infiltrating practices until the contributing area is stabilized.

**9.2 Construction inspection.** [Default, E0] A qualified inspector shall check excavation depth, subgrade, media, underdrain and outlet elevations before each is covered.

**9.3 As-built certification.** [Default, E0] A licensed engineer shall certify the as-built practice against the approved plan before final approval.

**9.4 Maintenance agreement.** [Default, E3] The owner shall record a maintenance agreement or easement that runs with the land (stated in 125 of 253 manuals).

**9.5 Inspection frequency.** [Default, E3] Inspect each practice at least **annually** and after major storms, and keep records for the reviewing agency (120 of 253 manuals).

**9.6 Maintenance triggers.** [Default, E0] Remove sediment when it fills 50% of a forebay or 25% of a pond's permanent pool, and restore infiltration when drawdown exceeds 6.0.1.

## 10 Plans and submittals

A stormwater management plan shall show how each standard in Section 3 is met, in one place.

**10.1 Concept plan.** [Default, E0] Before detailed design, submit a concept plan showing drainage areas, soils, the SHWT, proposed practices, and how retention (3.1) was maximized.

**10.2 Final plan contents.** [Default, E0]

1. Pre- and post-development drainage area maps, with impervious cover by area.
2. WQv, channel-protection and peak-flow calculations (Sections 3 and 4), with rainfall sources.
3. Infiltration test results and locations (5.1).
4. Practice plans, sections and details showing every dimension in Section 6.
5. Stage-storage, stage-discharge and routing calculations for each design storm, outlet and spillway details, and the downstream analysis (Section 7).
6. A maintenance plan and the recorded agreement (9.4).

**10.3 Review.** [Default, E0] The reviewing agency should complete its first review within 30 days of a complete submittal.

## 11 Regional adjustments

Of the eleven hand-checked criteria, only maximum drawdown varies with NOAA climate region more than chance would readily explain, and only suggestively (p = 0.09; Appendix A). Regional values are therefore limited to the cases below.

**11.1 Adopting a regional value.** [Default] A state may replace a [Regional] value only with a documented local analysis, such as a 90th-percentile rainfall depth computed from at least 30 years of daily records, published with the state's adoption.

**11.2 Water-quality depth (3.2.1).** [Regional] A state may adopt a documented 90th-percentile depth in place of 1.0 in. Arid and Plains states may find a lower depth (Nebraska DOT uses 0.5 in of runoff); this draft does not set one.

**11.3 Cold climates.** [Regional, E0] In the Upper Midwest, Alaska and mountain areas, a state may also require a snowmelt water-quality volume and frost-protected outlets, as Minnesota and Alaska do.

**11.4 Maximum drawdown (6.0.1).** [Regional, E1] A state in the NOAA Southwest or West climate regions may allow up to 96 hours, as California and New Mexico do.

**11.5 Other values.** Water-table separation, media depth and infiltration rate show no regional pattern. They stay national values until the evidence says otherwise.

## 12 Alternative compliance and variances

Where a site cannot meet Section 3 on site, the owner may meet it elsewhere or pay, but not skip it.

**12.1 Off-site compliance.** [Default, E3] The reviewing agency may accept treatment or retention at another site in the same watershed, provided it is at least equal to the shortfall and is in place before the project is occupied. 59 of 253 manuals allow off-site compliance or a fee in lieu.

**12.2 Fee in lieu.** [Open, E3] The reviewing agency may accept a payment, set by a published formula based on the cost of the volume not managed. The fund shall be spent on stormwater projects in the same watershed.

**12.3 Variances.** [Default, E0] A variance from a specific provision may be granted where the applicant shows the provision cannot be met, the alternative achieves the same performance standard, and the variance is the minimum needed. Each variance and its basis shall be recorded.

## 13 Part B: construction scope and plans

Part B sets the minimum controls for keeping soil on a site while it is being built. It adds design numbers to the federal construction permit (EPA's Construction General Permit and the construction and development rule, 40 CFR 450), which already applies to every site Part B covers; where that permit or a state permit is stricter, it controls.

**13.1 Applicability.** [Default, E3] Part B applies to land disturbance of 1 acre or more, or less than 1 acre when part of a larger common plan of development, the federal permit threshold (192 of 253 manuals use a 1-acre threshold).

**13.2 Erosion and sediment control plan.** [Default, E0] Before disturbance, prepare a plan showing limits of disturbance, phasing, drainage areas to each control, the controls of Sections 14–16 with their sizes, the stabilization schedule, and the inspection schedule of Section 16. The plan may be part of the permit's stormwater pollution prevention plan.

**13.3 Install controls first.** [Default, E0] Install perimeter and sediment controls downslope of each area before it is disturbed, and keep them until the area is stabilized.

**13.4 Limit and phase disturbance.** [Default, E0] Disturb only what can be stabilized under Section 14, and phase large sites so that exposed areas are as small as practical at any one time.

## 14 Erosion prevention and stabilization

Keeping soil in place is cheaper and more reliable than catching it afterwards, so stabilization comes first.

**14.1 Stabilization deadline.** [Default, E1] Begin stabilizing a disturbed area immediately once work there stops and will not resume for 14 days or more, or once it reaches final grade, and complete stabilization **within 14 days** (9 of 15 states read by hand; 5 states require 5–7 days).

> Why: 14 days matches the federal permit, so sites face one deadline rather than two. A shorter deadline helps most on steep or highly erodible sites and in wet seasons.

- *Open question:* should sites draining to impaired or high-quality waters, or working through the wet season, stabilize within 7 days, as Virginia, Ohio and Florida require for all sites and Spokane requires in its wet season?

**14.2 Stockpiles.** [Default, E0] Cover or stabilize soil stockpiles not used for 14 days, and keep them out of drainage paths and away from inlets and waters.

**14.3 Slopes and channels.** [Default, E0] Protect slopes steeper than 3:1 and all concentrated-flow channels with erosion control blankets, matting or equivalent within the deadline of 13.1.

**14.4 Natural buffer.** [Default, E1 (thin)] Keep an undisturbed natural buffer of **50 ft** from surface waters, or install controls that achieve the same sediment reduction (all 5 states that state a buffer use 50 ft, as the federal permit does).

**14.5 Final stabilization.** [Default, E0] Final stabilization means permanent vegetation over at least 70% of the natural cover density, or permanent non-vegetative cover, on all disturbed areas.

## 15 Sediment controls

Where soil does move, catch it on site. The right control depends on how much area drains to it.

| Drainage area to one point | Minimum sediment control |
| --- | --- |
| Sheet flow from small areas | Silt fence or equivalent perimeter control (15.4) |
| Up to 5 acres | Sediment trap (15.2) |
| More than 5 acres | Sediment basin (15.1–15.3) |

**15.1 Sediment basin threshold.** [Default, E1] Where more than **5 acres** drain to one point, provide a sediment basin; below that a sediment trap may be used (12 of 19 states read by hand use 5 acres; 5 use the federal 10 acres; Washington and Virginia use 3 acres).

> Why: 5 acres is the most common limit for traps, which lose efficiency on larger areas. The federal permit requires basins only from 10 acres, so this is a stricter, evidence-based default; a state may keep 10 acres if it relies on the federal permit alone.

**15.2 Storage volume.** [Default, E1] Sediment traps and basins shall provide at least **3,600 cubic feet of storage per acre drained** (134 cubic yards), or the runoff from the 2-year, 24-hour storm if that is calculated (8 of 16 states read by hand use 3,600 cf/acre; 7 states give 1,800–2,000 cf/acre, mostly for one of the two zones of a basin or for small traps).

- **15.2.1** [Default, E0] In basins, split the storage equally between a wet sediment-storage zone and a dry dewatering zone (1,800 cf per acre each).

**15.3 Basin outlets and dewatering.** [Default, E1 (thin)] Withdraw water from the surface (a skimmer or equivalent) and dewater the dry zone over no less than **48 hours** (Ohio and PennDOT; PennDOT caps it at 7 days). Provide an emergency spillway for the 10-year storm (E0).

**15.4 Silt fence.** [Default, E1 (thin)] Limit the drainage area to **0.25 acre per 100 ft** of fence (5 of 7 states use 0.23–0.25 acre) and the slope length above the fence to **100 ft** (4 of 5 states use 100–110 ft), shorter on steeper slopes. Install fence on the contour, with the ends turned upslope, and never across concentrated flow.

**15.5 Construction entrances.** [Default, E1 (thin)] Stabilize every vehicle exit with an aggregate pad at least **50 ft long** (4 of 6 states; Ohio uses 70 ft and Fairfax County 75 ft) and 6 in thick, and remove any sediment tracked onto paved roads by the end of each work day (E0).

**15.6 Inlet protection.** [Default, E0] Protect every storm drain inlet that receives runoff from disturbed areas, without causing flooding of roads or buildings.

**15.7 Dewatering discharges.** [Default, E0] Do not discharge water pumped from excavations unless it is treated to remove sediment first, as the federal rule requires.

## 16 Inspection, maintenance and closeout

Controls fail quietly, so they must be checked on a fixed schedule and after storms.

**16.1 Inspection frequency.** [Default, E1] A qualified person shall inspect all controls at least **every 7 days** (21 of 23 states read by hand) and **within 24 hours after 0.5 in of rain** or more (9 of 10 states that set a trigger).

> Why: weekly inspection is close to universal. The 0.5 in trigger catches the storms that overtop or undercut controls.

**16.2 Corrective action.** [Default, E0] Repair or replace a failed control by the end of the next work day where feasible, and within 7 days at the latest; record what was found and done.

**16.3 Sediment removal.** [Default, E0] Remove sediment from traps and basins when it fills half of the wet storage, and from behind silt fence when it reaches one third of the fence height.

**16.4 Records.** [Default, E0] Keep inspection reports on site, or available electronically, until final stabilization.

**16.5 Closeout.** [Default, E0] Remove temporary controls only after final stabilization (14.5), and stabilize the areas they occupied.

## 17 Part B and Part A together

Some construction controls become permanent practices, so the two parts must be designed together.

**17.1 Converting basins.** [Default, E0] A sediment basin may become a permanent wet pond or extended detention basin only if it is cleaned out, regraded and brought to the standards of Section 6 before final approval.

**17.2 Protecting infiltration areas.** [Default, E0] Do not use areas planned for infiltration (Section 5) as sediment traps, basins or staging areas, and keep construction traffic off them (9.1).

**17.3 Sequencing.** [Default, E0] Build permanent infiltrating practices last, after their drainage area is stabilized.

## Appendix A: Evidence behind each provision

The grade counts above are computed from this text. Every provision marked E0 is a placeholder for the committee.

- **E1** state-level manuals whose values were read by hand against their source text: 249 values read, 216 kept, from 39 states ([hand-checks.json](https://github.com/scott-jeffers/usa-stormwater/blob/main/data/national/hand-checks.json); [classification](/manual/evidence/)).
- **E2** values from all atlas manuals whose quote was found word-for-word in the source PDF. Numeric values were also read by hand against their quotes (data/qa/value-review.json); design-storm purposes are assigned automatically from requirement sentences (in a spot check of 30 storms, 21 got a purpose and 16 of those were right).
- **E3** the number of the 253 distinct manuals whose text states the rule, by text search. This shows how common a rule is, not that the manual requires exactly that value.
- **E0** common engineering practice with no atlas evidence yet.

In 3.8–3.9, Sections 4, 7 and 8 and Part B, E1 means values read by hand in every atlas manual with its own rules (state and local), because many states publish their construction handbooks separately from the manuals in the atlas: 154 values from 68 manuals in 33 states for Part B ([esc-checks.json](https://github.com/scott-jeffers/usa-stormwater/blob/main/data/national/esc-checks.json)) 309 values from 135 manuals in 45 states and DC for Section 7 ([det-checks.json](https://github.com/scott-jeffers/usa-stormwater/blob/main/data/national/det-checks.json)); 229 values from 122 manuals in 44 states for Section 4 ([hyd-checks.json](https://github.com/scott-jeffers/usa-stormwater/blob/main/data/national/hyd-checks.json)); 379 values from 119 manuals in 44 states for Section 8 ([conv-checks.json](https://github.com/scott-jeffers/usa-stormwater/blob/main/data/national/conv-checks.json)), where DOT drainage manuals, which the atlas holds for most states, supply much of the evidence; and 97 values from 38 manuals in 24 states for 3.8–3.9 ([sd-checks.json](https://github.com/scott-jeffers/usa-stormwater/blob/main/data/national/sd-checks.json)).

| Provision | Value | Grade | Evidence |
| --- | --- | --- | --- |
| 3.2 WQ rainfall depth | 1.0 in | E1 | 7 of 15 states that set a rainfall depth; range 0.5–1.25 in; 4 more set 1.0 in of runoff |
| 3.3 TSS removal | 80% | E1 | 16 of 20 states; range 80–90% |
| 3.4 Channel-protection detention | 24 h | E1 | 12 of 19 states; range 12–48 h |
| 3.8.2 Roof area per downspout | 1,000 sq ft | E1 | 9 of 15 states; range 300–1,000 sq ft |
| 3.8.3 Disconnection flow path | 40 ft | E1 | 12 states, median 40 ft; range 10–75 ft; no consensus |
| 3.8.3 Disconnection slope | 5% max | E1 | 8 states, median 5%; range 2–8% |
| 3.8.4 Soil restoration depth | 12 in tilled, 8 in amended | E1 | 13 states, median 8 in; clusters at 6, 8 and 12 in |
| 3.8.5 Tree credit | 100 sq ft per tree | E1 (thin) | 5 states; range 20–200 sq ft |
| 3.9 Credit, infiltrating practice | 100% of storage | E1 (thin) | 3 of 4 states |
| 3.9 Credit, underdrained practice | 40% of storage | E1 (thin) | 4 states; range 40–60% |
| 4.3 Rational-method limit | 200 acres (conveyance) | E1 | 13 of 34 states; 10–320 acres; regional pattern (p = 0.10) |
| 4.4.2 Sheet-flow length | 100 ft | E1 | 16 of 25 states; 6 use 300 ft |
| 4.4.3 Minimum Tc | 5 min | E1 | 19 of 32 states; 7 use 10 min |
| 4.5.1 Rational C, impervious | 0.90 | E1 (thin) | 5 of 8 states |
| 4.6.1 Impervious CN | 98 | E1 | 26 of 26 states |
| 5.2 Min soil infiltration rate | 0.5 in/hr | E1 | 12 of 24 states within 10%; range 0.09–2 in/hr |
| 5.3 Infiltration safety factor | 2 | E1 | 7 of 8 states |
| 5.4 Water-table separation | 24 in | E1 | 8 of 24 states; range 18–60 in |
| 6.0.1 Max drawdown | 72 h | E1 | 12 of 27 states; 10 use 48 h; suggestive climate pattern (p = 0.09) |
| 6.1.1 Bioretention media | 18 in | E1 | 8 of 20 states; 8 more use 24 in |
| 6.5.2 Pool depth | 4–8 ft | E1 (thin) | 7 states state a minimum; 36–72 in |
| 6.5.3 Pond length:width | 2:1 min | E1 | 11 of 21 states; range 1.5–3 |
| 6.6.1 ED release time | 24 h | E1 | 12 of 19 states |
| 3.4 Channel-protection storm | 1-yr | E2 | 13 of 45 state manuals; 20 use 2-yr peak control instead |
| 3.5–3.6 Design storms | 2-, 10-, 100-yr | E2 | by purpose: 2- and 10-yr peak control in 20 and 15 of 45 state manuals; 100-yr flood safety in 28 |
| 6.1.2 Ponding depth | 12 in max | E2 | 19 of 45 manuals; range 3–24 in |
| 6.2.1 Pavement storage | 9 in | E2 | median of 12 manuals; range 4–18 in |
| 6.4.1 Swale bottom width | 2 ft min | E2 | 19 of 23 manuals |
| 6.4.2 Swale slope | 0.5–4% | E2 | 27 of 34 manuals |
| 6.7.1 Wetland detention | 24 h | E2 | 8 of 15 manuals |
| 6.9.1 Green roof media | 3 in min | E2 | 5 of 10 manuals |
| 1.2 Thresholds | 1 acre / 5,000 sq ft | E3 | 192 and 83 of 253 manuals |
| 4.1 Rainfall source | NOAA Atlas 14 | E3 | 87 of 253 manuals |
| 4.2 WQv formula | Rv = 0.05 + 0.009 I | E3 | 28 of 253 manuals |
| 5.5 Setbacks | 10 ft / 100 ft | E3 | 68 and 55 of 253 manuals |
| 7.1 Forebay | 10% of WQv | E3 | 45 of 253 manuals |
| 7.1 Infiltration pretreatment | 25% of WQv | E3 | 19 of 253 manuals |
| 7.2.1 Pre-development baseline | meadow, good condition | E1 | forest in 4 states, meadow or woods in 4, existing cover in 5 |
| 7.3 Downstream analysis | 10% point | E1 | 12 of 16 states; 15% in 2, 1% in Virginia |
| 7.6.1 Orifice coefficient | 0.60 | E1 | 11 of 22 states; Washington 0.62; 0.66/0.80 for thin/thick plates in 6 manuals |
| 7.6.2 Minimum orifice | 3 in (1 in protected) | E1 | 9 of 24 states; range 0.5–6 in |
| 7.8.1 Spillway storm | 100-yr | E1 | 28 of 30 states; 59 of 62 manuals |
| 7.8.2 Spillway with outlet blocked | required | E1 | 12 manuals in 8 states say so explicitly |
| 7.8.3 Freeboard | 1 ft | E1 | 31 of 33 states; 65 of 73 manuals |
| 7.9.1 Side slopes | 3:1 | E3 | 106 of 253 manuals |
| 7.9.2 Basin bottom slope | 0.5% min | E1 | 7 of 11 states |
| 7.10.1 Parking-lot depth | 1 ft max | E1 (thin) | 4 of 5 manuals |
| 8.1.1 Storm drain and inlet storms | 10-yr | E1 | storm drains 15 of 25 states; inlets and spread 7 of 11 |
| 8.1.4 Culvert storm | 25-yr (50-yr arterials), 100-yr check | E1 | divided: of 18 states, 5 use 10-yr, 5 use 25-yr, 5 use 100-yr |
| 8.1.5 Channel storm | 10-yr (100-yr major system) | E1 | 11 of 18 states; 4 use 100-yr |
| 8.3.1 Minimum storm drain | 15 in | E1 | divided: of 22 states, 8 use 12 in, 6 use 15 in, 7 use 18 in |
| 8.3.2 Manning's n, concrete pipe | 0.013 | E1 (thin) | 6 states: 4 use 0.012, 2 use 0.013 |
| 8.3.3 Minimum velocity | 3 ft/s | E1 | 16 of 33 states; 10 use 2.5 ft/s |
| 8.3.4 Maximum velocity | 15 ft/s | E1 | divided: 21 states, 8–20 ft/s; 6 use 10, 5 use 15, 5 use 20 |
| 8.3.5 Minimum cover | 2 ft | E1 | divided: 16 states, 1–4 ft; 6 use 1 ft, 4 use 2 ft |
| 8.3.7 Access structure spacing | 300 ft (< 36 in) | E1 | 7 of 16 states; 3 use 400 ft |
| 8.4.3 HGL clearance | 1 ft | E1 | 11 of 14 states |
| 8.5.2 Culvert headwater | HW/D ≤ 1.5 | E1 | 10 of 13 states |
| 8.5.3 Minimum culvert | 18 in | E1 | 10 of 22 states; 6 use 24 in |
| 8.6.2 Channel freeboard | 1 ft | E1 | 7 of 10 states |
| 9.4–9.5 Maintenance | agreement, annual inspection | E3 | 125 and 120 of 253 manuals |
| 14.1 Stabilization deadline | 14 days | E1 | 9 of 15 states; 5 use 5–7 days |
| 14.4 Natural buffer | 50 ft | E1 (thin) | all 5 states that state one |
| 15.1 Sediment basin threshold | 5 acres | E1 | 12 of 19 states; 5 use 10 acres |
| 15.2 Trap and basin storage | 3,600 cf/acre | E1 | 8 of 16 states; 7 give 1,800–2,000 cf/acre for one zone or small traps |
| 15.3 Basin dewatering | 48 h minimum | E1 (thin) | 2 states |
| 15.4 Silt fence | 0.25 acre per 100 ft; 100 ft slope | E1 (thin) | 5 of 7 states (0.23–0.25 acre) and 4 of 5 (100–110 ft) |
| 15.5 Construction entrance | 50 ft | E1 (thin) | 4 of 6 states |
| 16.1 Inspections | every 7 days; after 0.5 in of rain | E1 | 21 of 23 and 9 of 10 states |

The state-level evidence still leans on the Northeast, which supplies 8–10 of the states for most E1 values. Arkansas and Nevada have no state manual in the atlas, and most western and Plains states are represented only by DOT drainage manuals, which rarely set post-construction criteria. Part B evidence is thinner still: many states publish their construction erosion and sediment control handbooks separately, and most of those are not yet in the atlas.

## Appendix B: Open questions for the committee

These decisions set the size and cost of most practices. Each is marked [Open] in the text.

1. **Channel-protection storm (3.4):** 24-hour extended detention of the 1-year storm (13 state manuals), 2-year peak matching (20), or both (6)?
2. **Redevelopment (3.7):** is 50% of replaced impervious area the right target, and should an impervious-reduction alternative remain?
3. **Water-table separation (5.4):** keep 24 in for all practices, or require 36 in for infiltration basins and trenches?
4. **Maximum drawdown (6.0.1):** 72 hours or 48 hours nationally? States split 12 to 10, and the Northeast leans to 48 h; confirm whether a regional value (11.4) is warranted.
5. **Bioretention media (6.1.1):** 18 in or 24 in as the default minimum? States split 8 to 8.
6. **Wet-pond depth (6.5.2):** confirm 4–8 ft once more states are read.
7. **Rational-method limit (4.3):** 200 acres nationally for conveyance peaks (13 of 34 states), with lower regional limits where states use them (10 acres in the Pacific Northwest), or one lower national limit?
8. **Pre-development baseline (7.2.1):** meadow in good condition, forest, or the land cover that exists before the project?
9. **Minimum orifice (7.6.2):** keep a 3 in default with a 1 in protected minimum, or allow 0.5 in nationally to make flow-duration control possible on small sites?
10. **Basin depth (7.9.3):** set a national maximum depth for dry basins open to the public, or leave it to fencing and safety-bench rules?
11. **Future rainfall (4.1.1):** once NOAA Atlas 15 is published, adopt its Volume 1 estimates as the default, and decide whether and how to use the Volume 2 projections for design.
12. **Culvert design storm (8.1.4):** 10, 25 or 100 years for local roads? States divide evenly among the three.
13. **Minimum storm drain (8.3.1):** 12, 15 or 18 in? States divide 8, 6 and 7.
14. **Maximum pipe velocity and cover (8.3.4–8.3.5):** set one national value for each, or a value by pipe material and a common way of measuring cover?
15. **Access structure spacing (8.3.7):** 300 ft for pipes smaller than 36 in, or 400 ft, as three states allow?
16. **Gutter spread (8.2.1):** adopt the HEC-22 Table 5.1 limits, and collect state spread criteria in a comparable form?
17. **Fee in lieu (12.2):** require a published, cost-based rate formula?
18. **Construction stabilization (14.1):** 14 days for all sites, with 7 days for sensitive waters or wet seasons?
19. **Sediment basin threshold (15.1):** 5 acres (most states) or the federal 10 acres?
20. **Disconnection flow path (3.8.3):** one national length of 40 ft, or a length that grows with soil group and slope, as Vermont and Philadelphia use?
21. **Credit basis (3.9):** credit a share of the storage a practice provides (New York, Georgia coastal, West Virginia) or a share of the runoff entering it (Runoff Reduction Method)? And is 40% right for underdrained practices?
22. **Treatment by the flow path (3.9.2):** does runoff that crosses a disconnection or conservation area need no further treatment, or must the flow path meet a filter-strip standard?
23. **Evidence gaps:** before adoption, replace each E0 placeholder with E1 or E2 evidence, and add the western and southern state manuals missing from the atlas.

## Appendix C: Worked example, detention basin

This example applies Sections 3, 4 and 7 to one site. Every number below is computed by the routing engine behind the site's [detention calculator](/tools/detention/), which loads this example, and the calculation is part of the atlas's automated tests. Rainfall depths are illustrative; use NOAA Atlas 14 for a real site (4.1).

**Site.** 10 acres, hydrologic soil group C, NRCS Type II rainfall. Before development the site is meadow in good condition (CN 71, Tc 0.40 h; 7.2.1). After development it is half impervious (CN 85, Tc 0.15 h).

| Storm | 24-h rainfall | Pre-development peak | Post-development peak (no detention) | Post-development runoff |
| --- | --- | --- | --- | --- |
| 1-year | 2.6 in | 4.6 cfs | 17.7 cfs | 1.26 in |
| 2-year | 3.2 in | 8.1 cfs | 24.7 cfs | 1.76 in |
| 10-year | 4.9 in | 20.4 cfs | 45.5 cfs | 3.28 in |
| 100-year | 7.6 in | 42.9 cfs | 78.9 cfs | 5.83 in |

**Targets.** Hold the 1-year runoff for 24 hours, measured between the centroids of the inflow and outflow hydrographs (3.4); keep the routed 2- and 10-year peaks at or below 8.1 and 20.4 cfs (3.5); pass the 100-year storm with 1 ft of freeboard, including with the principal outlet blocked (7.8).

**Step 1. Preliminary volume (7.4.1).** For the 10-year storm, qo/qi = 20.4/45.5 = 0.45, so Vs/Vr = 0.682 − 1.43(0.45) + 1.64(0.45)² − 0.804(0.45)³ = 0.30, and Vs = 0.30 × 3.28 in × 10 ac × 3,630 = 35,500 cf for peak control alone. The 1-year channel-protection volume is 1.26 in × 10 ac = 45,700 cf. A basin 120 ft by 60 ft at the bottom with 3:1 side slopes (storage V = L·W·h + (L+W)·z·h² + 4/3·z²·h³) holds 38,200 cf at 4 ft and 65,200 cf at 6 ft.

**Step 2. Channel-protection orifice (7.6).** Releasing 45,700 cf over 24 hours at half its 4.6 ft depth suggests a 3.6 in orifice. Routing the 1-year storm shows that orifice releases too fast; a **2.25 in orifice** at the basin floor gives a centroid detention time of **27.4 hours**, with the 1-year water surface at 3.71 ft and a peak release of 0.25 cfs. Because 2.25 in is below the 3 in minimum, it is placed inside the riser behind a reverse-slope pipe (7.6.2).

**Step 3. 10-year stage (7.5.1, 7.7).** A rectangular notch **3.5 ft wide** with its crest at **3.8 ft**, just above the 1-year water surface, cut in the riser wall (C = 3.33). Routing gives a 10-year peak of **19.6 cfs** (target 20.4) at 5.20 ft, and a 2-year peak of **1.5 cfs** (target 8.1) at 4.02 ft. No separate 2-year stage is needed (see 3.4).

**Step 4. Overflow and spillway (7.8).** The riser is 48 in in diameter with its open top at **5.3 ft**, above the 10-year water surface. The emergency spillway is a broad-crested weir **20 ft wide** (C = 2.6) with its crest at **6.0 ft**, cut in undisturbed ground. The top of the embankment is at **8.5 ft**.

**Step 5. Stage-storage-discharge (7.4.2).**

| Stage (ft) | Storage (cf) | 2.25 in orifice | 3.5 ft notch | Riser top | Spillway | Total (cfs) |
| --- | --- | --- | --- | --- | --- | --- |
| 0.0 | 0 | 0 | 0 | 0 | 0 | 0 |
| 1.0 | 7,750 | 0.13 | 0 | 0 | 0 | 0.13 |
| 2.0 | 16,660 | 0.18 | 0 | 0 | 0 | 0.18 |
| 3.0 | 26,780 | 0.23 | 0 | 0 | 0 | 0.23 |
| 4.0 | 38,210 | 0.26 | 1.04 | 0 | 0 | 1.31 |
| 4.5 | 44,430 | 0.28 | 6.83 | 0 | 0 | 7.10 |
| 5.0 | 51,000 | 0.29 | 15.32 | 0 | 0 | 15.62 |
| 5.5 | 57,930 | 0.31 | 25.83 | 3.74 | 0 | 29.89 |
| 6.0 | 65,230 | 0.32 | 38.03 | 24.51 | 0 | 62.86 |
| 6.5 | 72,910 | 0.34 | 51.71 | 55.01 | 18.38 | 123.2 (barrel limits the riser to 104.9) |
| 7.0 | 80,980 | 0.35 | 66.72 | 78.89 | 52.00 | 160.8 (barrel limits the riser to 108.8) |

**Step 6. Route every storm (7.4.2).** Storage-indication routing at a 1-minute step:

| Storm | Inflow peak | Routed peak | Target | Maximum water surface | Freeboard to 8.5 ft |
| --- | --- | --- | --- | --- | --- |
| 1-year | 17.7 cfs | 0.25 cfs | 24 h centroid detention (27.4 h) | 3.71 ft | 4.8 ft |
| 2-year | 24.7 cfs | 1.5 cfs | 8.1 cfs | 4.02 ft | 4.5 ft |
| 10-year | 45.5 cfs | 19.6 cfs | 20.4 cfs | 5.20 ft | 3.3 ft |
| 100-year | 78.9 cfs | 71.0 cfs | pass safely | 6.09 ft | 2.4 ft |
| 100-year, principal outlet blocked, basin full to the spillway crest | 78.9 cfs | 72.7 cfs | 1 ft freeboard | 7.25 ft | 1.25 ft |

**Step 7. Barrel (7.5.2).** A 36 in concrete pipe 60 ft long (n = 0.013, entrance loss 0.5) with a free outfall at −1.6 ft carries 101 cfs in outlet control with the pond at the 100-year level (6.09 ft), more than the 71 cfs the riser passes then; a 30 in pipe would carry only 70 cfs and would control the outflow. Above about 6.4 ft the 36 in barrel does limit the riser, which is why the spillway, not the riser, carries flows above the 100-year storm.

**Step 8. Riser flotation (7.5.3).** An empty 48 in riser rising 6.3 ft above its footing displaces 4,940 lb of water, so the riser and its base must weigh at least 6,180 lb (safety factor 1.25).

**Result.** All targets are met, with 1.25 ft of freeboard in the most severe case (outlet blocked). The binding requirement is channel protection: the 1-year detention sets the orifice and most of the storage, and the 2-year peak control in 3.5 then comes for free.

## Appendix D: Worked example, storm drain, culvert and channel

This example applies Section 8 to a residential street, the storm drain under it, a culvert downstream and the channel between them. Every number below is computed by the engine behind the site's [hydraulics calculator](/tools/hydraulics/), which loads this example, and the calculation is part of the atlas's automated tests. The engine reproduces the worked examples of HEC-22 chapters 5, 7 and 9 and the HDS-5 examples it is tested against. Flows are given rather than computed, to keep the example on hydraulics.

**Street.** A local street with an 8 ft parking lane and 12 ft driving lanes, longitudinal slope 2%, cross slope 2%, n = 0.016, and a 2 ft gutter depressed 2 in. The allowable spread (8.2.1) is the parking lane plus half a driving lane: **14 ft**.

**Step 1. Inlet on grade (8.2.3).** The 10-year gutter flow at inlet 1 is 3.0 cfs, spread **7.8 ft**, velocity 3.8 ft/s. A 10 ft curb opening in the depressed gutter (Eo = 0.73, Se = 0.081) needs 15.9 ft to capture everything, so it captures 83%: **2.50 cfs**, with 0.50 cfs passing to the sag.

**Step 2. Inlet in the sag (8.1.2, 8.2.4).** Inlet 2, a 10 ft curb opening with a 6 in opening height at the low point, receives its own 2.9 cfs plus the 0.50 cfs bypass, 3.40 cfs. It runs as a weir with 0.23 ft of water above the cross slope (0.39 ft at the curb, below the opening height), a spread of **11.3 ft**. The street has no overflow path at the sag, so 8.1.2 applies: for the 50-year flow of 4.4 cfs the spread is **13.4 ft**, still within 14 ft.

**Step 3. Pipe sizes (8.3).** Each pipe carries all the flow its inlets capture, with n = 0.013:

| Pipe | Flow | Slope | Diameter for full flow | Pipe used | Full-flow capacity | Full-flow velocity | Velocity at design flow |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1–2 | 2.5 cfs | 1.20% | 10.2 in | 15 in (8.3.1 minimum) | 7.1 cfs | 5.8 ft/s | 5.3 ft/s |
| 2–3 | 5.9 cfs | 0.77% | 15.2 in | 18 in | 9.2 cfs | 5.2 ft/s | 5.5 ft/s |
| 3–outfall | 5.9 cfs | 0.95% | 14.6 in | 18 in (8.3.6: no size decrease) | 10.2 cfs | 5.8 ft/s | 6.0 ft/s |

Every pipe exceeds the 3 ft/s minimum and stays well below 15 ft/s (8.3.3–8.3.4). The last pipe could be 15 in, but 8.3.6 keeps it at 18 in. The outlet crowns drop 0.22 ft through inlet 2 and the inverts 0.08 ft through manhole 3, at least the losses HEC-22 equation 9.10 gives for a straight run through an inlet (K = 0.5) and a manhole (K = 0.15). Cover is at least 2.0 ft everywhere (8.3.5).

**Step 4. Hydraulic grade line (8.4).** The outfall discharges to a channel whose 10-year water surface is at elevation 96.30, below the crown of the outlet pipe (96.62), so the pipe flows partly full and backwater from the channel sets the depth at its outlet (HEC-22 Table 9.6, case B). Working upstream with the FHWA access-hole method:

| Structure | Rim | Energy level in structure (EGLa) | Clearance (8.4.3, at least 1 ft) |
| --- | --- | --- | --- |
| Manhole 3 (full bench) | 100.80 | 97.18 | 3.62 ft |
| Inlet 2 (half bench; 3.40 cfs falls in from the street) | 101.50 | 98.66 | 2.84 ft |
| Inlet 1 (flat floor; 2.50 cfs falls in from the street) | 104.00 | 101.93 | 2.07 ft |

At inlet 1 the access-hole method adds 0.15 ft for the water plunging in from the curb opening (CP = 1.77) to the 1.03 ft energy level of the outlet pipe's entrance; at manhole 3 the full bench removes the loss altogether. All three structures keep the required 1 ft of clearance.

**Step 5. Culvert (8.1.4, 8.5).** Downstream, a collector road crosses the channel on a culvert 90 ft long at 1.2% slope (concrete, groove end with headwall, n = 0.012). The 25-year flow is 110 cfs with 2.6 ft of tailwater; the road shoulder is 8.0 ft above the inlet invert.

| Culvert | Inlet-control HW | Outlet-control HW | HW/D | Result |
| --- | --- | --- | --- | --- |
| 42 in, 25-year | 6.39 ft | 5.61 ft | 1.83 | Fails 8.5.2 (HW/D > 1.5) |
| 48 in, 25-year | 5.17 ft | 4.38 ft | 1.29 | Meets 8.5.2; inlet control |
| 48 in, 100-year check (150 cfs) | 7.10 ft | 6.21 ft | 1.77 | Below the 8.0 ft shoulder: no overtopping |

The 48 in culvert's outlet velocity at the 25-year flow is 14.4 ft/s, so its outlet needs protection designed with HEC-14 (8.5.4, 8.7).

**Step 6. Channel (8.1.5, 8.6).** The outfall channel is grass-lined (n = 0.035), trapezoidal with a 4 ft bottom and 3:1 side slopes, at 0.5% slope. It carries flow from more than one development, so it is sized for the 100-year storm (8.1.5).

| Storm | Flow | Normal depth | Velocity | Froude number | Shear stress |
| --- | --- | --- | --- | --- | --- |
| 10-year | 45 cfs | 1.65 ft | 3.0 ft/s | 0.52 | 0.51 lb/sq ft |
| 100-year | 80 cfs | 2.16 ft | 3.5 ft/s | 0.54 | 0.67 lb/sq ft |

Flow is well below critical (8.6.1). With 1 ft of freeboard above the 100-year depth (8.6.2), the channel must be at least **3.2 ft** deep, and the lining must resist 0.67 lb/sq ft (8.6.3).

**Result.** All requirements are met with a 15 in and two 18 in pipes, a 48 in culvert and a 3.2 ft channel. The binding requirements are the sag spread (8.1.2), which sets the length of inlet 2, and the culvert headwater ratio (8.5.2), which rules out the 42 in culvert.

## Appendix E: Worked example, site hydrology

This example applies Section 4 to one site before and after development. Every number below is computed by the engine behind the site's [hydrology calculator](/tools/hydrology/), which loads this example, and the calculation is part of the atlas's automated tests. The intensities are HEC-22's illustrative Table 9.8 and the 24-hour depths those of Appendix C; use NOAA Atlas 14 for a real site (4.1).

**Site.** 25 acres, hydrologic soil group C. Before development it is meadow (C = 0.25, CN 71). After development 10 acres are impervious (C = 0.90, CN 98; 4.5.1, 4.6.1) and 15 acres are lawn in good condition (C = 0.22, CN 74). The 2-year, 24-hour rainfall is 3.2 in.

**Step 1. Time of concentration (4.4).**

| Condition | Sheet flow | Shallow concentrated | Channel or pipe | Tc |
| --- | --- | --- | --- | --- |
| Before | 100 ft of dense grass at 2% (n = 0.24): 14.3 min | 900 ft of short-grass pasture at 2%: 15.2 min | 800 ft of swale at 2.0 ft/s: 6.7 min | **36.1 min** |
| After | 75 ft of pavement at 2% (n = 0.011): 1.0 min | 400 ft of paved gutter at 1.5%: 2.7 min | 900 ft of pipe at 5.0 ft/s: 3.0 min | **6.6 min** |

Neither sheet-flow segment exceeds 100 ft (4.4.2), and both times exceed the 5-minute minimum (4.4.3). Development cuts Tc to a fifth.

**Step 2. Rational-method peaks (4.3, 4.5).** The site is under 200 acres, so the rational method may be used for conveyance. For the 10-year storm (Cf = 1.0):

| Condition | Weighted C | Intensity at Tc | Peak |
| --- | --- | --- | --- |
| Before | 0.25 | 3.17 in/h | 19.8 cfs |
| After | 0.49 | 6.58 in/h | 81.0 cfs |

**Step 3. NRCS hydrograph peaks (4.6).** Type II, 24-hour storms, with the post-development area computed both ways:

| Storm | Before | After, weighted CN 83.6 | After, impervious and lawn separate |
| --- | --- | --- | --- |
| 2-year (3.2 in) | 15.7 cfs | 61.6 cfs | 61.4 cfs |
| 10-year (4.9 in) | 39.9 cfs | 116.6 cfs | 111.8 cfs |
| 100-year (7.6 in) | 84.9 cfs | 205.8 cfs | 197.0 cfs |
| 1 in (small storm) | — | 0.14 in of runoff, 4.3 cfs | 0.33 in of runoff, 11.3 cfs |

**Result.** For design storms the two curve-number approaches agree within 5%, but for the 1 in storm that water-quality and channel-protection practices are sized for, the weighted CN gives less than half the runoff (4.6.2). The rational and NRCS 10-year peaks after development differ (81 and 112–117 cfs) because the methods distribute rainfall differently: either may size the site's pipes (4.3), but any storage on the site must be sized from the hydrograph (Section 7).

## Appendix F: Worked example, site design and volume credits

This example applies 3.1–3.3, 3.8 and 3.9 to one site. Every number below is computed by the engine behind the site's [compliance calculator](/tools/compliance/), which loads this example, and the calculation is part of the atlas's automated tests.

**Site.** 2.0 acres (87,120 sq ft) of commercial development on HSG C soils: 0.5 acre of roof, 0.9 acre of parking and 0.6 acre of lawn, so impervious cover is 70%. The water-quality rainfall is 1.0 in (3.2).

**Step 1. Water-quality volume (4.2).** Rv = 0.05 + 0.009 × 70 = 0.68, so WQv = 1.0 in × 0.68 × 87,120 sq ft / 12 = **4,937 cf**.

**Step 2. Site design (3.8).** Four downspouts, each draining 1,000 sq ft of roof, discharge to lawn restored under 3.8.4, over flow paths at least 40 ft long at 3% (3.8.2–3.8.3). The rest of the roof drains to a 2,000 cf cistern whose irrigation demand uses 1,000 cf between typical storms (6.10.1); its overflow is piped to the stone base of the permeable pavement.

**Step 3. Practices and credits (3.9).**

| Measure | Area draining to it | Its WQv | Credit | Applied to | Retention credited |
| --- | --- | --- | --- | --- | --- |
| Roof to restored lawn | 4,000 sq ft | 317 cf | 50% | WQv from the roof | 158 cf |
| Roof to cistern | 17,780 sq ft | 1,408 cf | 100% | 1,000 cf used | 1,000 cf |
| Parking to infiltrating permeable pavement (1,800 cf of stone) | 13,068 sq ft | 1,035 cf | 100% | 1,800 cf of storage | 1,035 cf (capped at its WQv) |
| Parking to underdrained bioretention (1,800 cf above the underdrain, 600 cf sump) | 26,136 sq ft | 2,069 cf | 40%, sump 100% | 1,800 cf and 600 cf | 1,320 cf |
| **Total** | | | | | **3,513 cf (71%)** |

**Step 4. Treatment of the remainder (3.3).** 1,424 cf of the WQv is not credited as retained:

- 749 cf passes through the bioretention media and leaves by the underdrain; bioretention meets 80% TSS removal (6.1).
- 408 cf overflows the cistern into the permeable pavement's stone, which has 765 cf of storage left after its own WQv. It is held there, but it is not credited, because credit may not be moved between drainage areas (3.9).
- 158 cf from the disconnected roofs crosses 40 ft of restored lawn (3.9.2), and 109 cf is runoff from the lawn itself.

**Result.** Site design (the disconnected roofs and the cistern) provides a third of the retention on the site and lets the permeable pavement and bioretention stay at the sizes shown. Without the cistern the site would retain 51% of its WQv; without the sump under the bioretention, 59%.
