---
title: Model Stormwater Design Manual
version: Public Review Draft 0.3
date: 2026-11-18
status: Draft for committee review. Not adopted by any agency.
---

## How to read this draft

This is a complete draft of a voluntary model manual that a state could adopt by reference. Every number is a proposal for committee review, not an adopted requirement.

Each provision is numbered (for example **3.2.1**) and tagged with what kind of choice it is:

- **[Default]** a national value. Use it unless a regional adjustment applies.
- **[Regional]** a value a state may replace for its climate (Section 10).
- **[Open]** a value the committee must still choose. The draft gives a starting value and the question.

Each provision also carries an evidence grade, explained in Appendix A:

- **E1** the value most states use, from state manuals read by hand against the source text.
- **E2** the value most manuals use, from Stormwater Atlas records whose quotes were machine-checked against the source PDF.
- **E3** the share of manuals that state the rule at all, from a text search of 253 manuals.
- **E0** common engineering practice with no atlas evidence yet. Treat these as placeholders.

"Shall" marks a requirement and "should" a recommendation. Where a permit, TMDL or local rule is stricter, it controls.

**Changes in Draft 0.3.** Every numeric value in the atlas (1,107) was read by hand against its source quote and labelled as a minimum, maximum or design value; 48 values were corrected and 52 removed (for example, construction sediment basins and pond maintenance drains that had been read as design rules). The atlas now records what each design storm is for, which settles most of the design-storm evidence in 3.4–3.6. Water-quality depths stated as runoff rather than rainfall are now counted separately (3.2). With the corrected values, maximum drawdown again shows a suggestive regional pattern (6.0.1).

**Changes from Draft 0.1 to 0.2.** Hand-checked evidence grew from 147 to 249 values (224 kept) across 39 states, and five more criteria were read by hand. Channel-protection detention time (3.4), the TSS target (3.3), the infiltration safety factor (5.3), the pond length-to-width ratio (6.5.3) and the extended-detention release time (6.6.1) are now E1. With 27 states instead of 21, maximum drawdown no longer shows a regional pattern, so Draft 0.2 drops the regional drawdown table and makes drawdown an open question (6.0.1). Each key provision now has a short rationale.

## 1 Purpose, scope and applicability

This manual sets minimum design standards for permanent stormwater management on new development and redevelopment.

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

**1.5 Relationship to other requirements.** Where an NPDES permit, TMDL, state rule or local ordinance is stricter, the stricter requirement controls. This manual does not cover conveyance design (see ANSI/ASCE/EWRI 45-16) or erosion and sediment control during construction.

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

Seven standards apply together. A site meets them in order of preference: retain first, then treat, then control peaks.

**3.1 Retention first.** [Default, E3] Retain as much of the WQv as site conditions allow (Section 5). Treat any part of the WQv that cannot be retained under 3.3. Retention-hierarchy language appears in most green-infrastructure manuals in the atlas.

**3.2 Water-quality volume.** [Default, E1] The WQv is the runoff from **1.0 in of rainfall** (7 of 15 states that set a rainfall depth; 3 more use 1.2 in), computed by Section 4.2. Four further states set 1.0 in of *runoff* from impervious area instead (Hawaii DOT, Maine, Massachusetts, Rhode Island), which is a slightly larger volume.

> Why: 1.0 in is the most common single value and sits near the 90th-percentile daily rainfall across much of the humid East. States that use another value mostly sit between 0.8 and 1.25 in. Stating the depth as rainfall, not runoff, lets the volume scale with how much of the site is paved (4.2).

- **3.2.1** [Regional] A state may instead adopt a documented 90th-percentile rainfall depth for its climate (Section 10). Connecticut (1.3 in), New York (1.2 in) and Iowa (1.25 in) already do.

**3.3 Treatment of the WQv not retained.** [Default, E1] Remove at least **80% of total suspended solids** (TSS) on an average annual basis (16 of 20 states read by hand; the rest require 85–90%). Use a practice from Section 6 sized for the full WQv, or a verified MTD (6.11).

> Why: 80% TSS is the most widely shared performance target in U.S. manuals. A state with impaired waters may set a higher target or add phosphorus and nitrogen targets.

**3.4 Channel protection.** [Open, E1] Provide **24 hours of extended detention** of the runoff from the 1-year, 24-hour storm (12 of 19 states read by hand use 24 hours; range 12–48 h). Retention of the WQv counts toward this volume.

> Why: holding the 1-year storm for a day keeps flows below the level that erodes most stream beds for longer than the storm itself lasts.

- *Open question:* which storm. Classified by purpose (E2), 13 of 45 state manuals use the 1-year storm for channel protection, while 20 use the 2-year storm for peak control; 6 do both. The committee should choose between 1-year extended detention, 2-year peak matching, or both.

**3.5 Peak-flow control.** [Default, E2] Post-development peak discharge shall not exceed pre-development peak discharge for the **2-year and 10-year, 24-hour storms**. Classified by purpose, 20 of 45 state manuals use the 2-year storm and 15 the 10-year storm for peak control; the 25-year storm is used by 8.

**3.6 Extreme flood.** [Default, E2] Pass the **100-year, 24-hour storm** safely, without flooding buildings and with an emergency spillway sized for it (28 of 45 state manuals use the 100-year storm for flood safety, the most common purpose for that storm).

**3.7 Redevelopment.** [Open, E0] On redevelopment sites, meet 3.1–3.3 for at least **50% of the replaced impervious area** and 100% of new impervious area, or reduce site impervious area by 20%.

- *Open question:* the atlas has no structured redevelopment data. These figures are common-practice placeholders.

## 4 Hydrology and calculation methods

Use current published rainfall and a method suited to the drainage area.

**4.1 Rainfall data.** [Default, E3] Use NOAA Atlas 14 (or its successor) depths and distributions for the site. 87 of 253 manuals cite Atlas 14.

**4.2 Water-quality volume.** [Default, E3] Compute the WQv as

```
WQv = (P × Rv × A) / 12        Rv = 0.05 + 0.009 × I
```

where WQv is in acre-feet, P is the rainfall depth from 3.2 (in), A is the drainage area (acres) and I is impervious cover (%). This is the unified sizing formula used in 28 of 253 manuals.

**4.3 Peak-flow methods.** [Default, E3]

| Drainage area | Method |
| --- | --- |
| 20 acres or less | Rational method (176 of 253 manuals) or NRCS TR-55 |
| More than 20 acres | NRCS TR-55 / TR-20 unit hydrograph (133 of 253 manuals cite TR-55) |
| Any size, complex systems | Continuous simulation (48 of 253 manuals) or another method the reviewing agency accepts |

- *Open question:* the 20-acre limit for the rational method is a placeholder (E0). Manuals in the atlas use limits from 10 to 200 acres.

**4.4 Routing.** [Default, E0] Route storage practices with a level-pool or equivalent method. Start each design storm with the WQv and any permanent pool full, and infiltration set to zero.

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

- **6.0.1 Maximum drawdown.** [Open, Regional, E1] Practices that hold water after a storm shall drain within **72 hours** (12 of 27 states read by hand). *Open question:* 10 states use 48 hours, most of them in the Northeast (median 48 h), while the arid Southwest and West allow 72–96 h. That regional pattern is suggestive only (p = 0.09) and has moved with each round of corrections (p = 0.05, 0.36, 0.09), so this draft keeps one national value and lets a state in the arid West adopt up to 96 h (10.4).
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

## 7 Pretreatment, outlets and safety

Every practice needs a way to drop sediment before it clogs, and a safe way to pass large storms.

**7.1 Pretreatment.** [Default, E3] Provide one of the following ahead of each practice:

| Practice | Minimum pretreatment |
| --- | --- |
| Wet ponds, wetlands, ED basins | Forebay holding 10% of the WQv (45 of 253 manuals) |
| Infiltration trenches and basins | 25% of the WQv (19 of 253 manuals) |
| Bioretention, swales, filters | Grass filter strip, gravel diaphragm or sediment chamber sized for the contributing area (E0) |

**7.2 Outlets.** [Default, E0] Orifices for extended detention shall be at least 1 in in diameter and protected by a trash rack or reverse-slope pipe.

**7.3 Emergency spillways.** [Default, E3] Embankment practices shall pass the 100-year storm through an emergency spillway with at least **1 ft of freeboard** to the top of the embankment (87 of 253 manuals state 1 ft).

**7.4 Side slopes.** [Default, E3] Side slopes of ponds and basins shall be **3:1** or flatter (106 of 253 manuals), with a 10 ft safety bench around permanent pools deeper than 4 ft (E0).

**7.5 Dam safety.** Embankments that meet state dam-safety thresholds shall also meet the state dam-safety rules.

## 8 Construction, inspection and maintenance

A practice only works if it is built as designed and kept working.

**8.1 Protection during construction.** [Default, E0] Keep construction traffic and sediment off infiltration areas. Do not build infiltrating practices until the contributing area is stabilized.

**8.2 Construction inspection.** [Default, E0] A qualified inspector shall check excavation depth, subgrade, media, underdrain and outlet elevations before each is covered.

**8.3 As-built certification.** [Default, E0] A licensed engineer shall certify the as-built practice against the approved plan before final approval.

**8.4 Maintenance agreement.** [Default, E3] The owner shall record a maintenance agreement or easement that runs with the land (stated in 125 of 253 manuals).

**8.5 Inspection frequency.** [Default, E3] Inspect each practice at least **annually** and after major storms, and keep records for the reviewing agency (120 of 253 manuals).

**8.6 Maintenance triggers.** [Default, E0] Remove sediment when it fills 50% of a forebay or 25% of a pond's permanent pool, and restore infiltration when drawdown exceeds 6.0.1.

## 9 Plans and submittals

A stormwater management plan shall show how each standard in Section 3 is met, in one place.

**9.1 Concept plan.** [Default, E0] Before detailed design, submit a concept plan showing drainage areas, soils, the SHWT, proposed practices, and how retention (3.1) was maximized.

**9.2 Final plan contents.** [Default, E0]

1. Pre- and post-development drainage area maps, with impervious cover by area.
2. WQv, channel-protection and peak-flow calculations (Sections 3 and 4), with rainfall sources.
3. Infiltration test results and locations (5.1).
4. Practice plans, sections and details showing every dimension in Section 6.
5. Outlet and spillway calculations (Section 7).
6. A maintenance plan and the recorded agreement (8.4).

**9.3 Review.** [Default, E0] The reviewing agency should complete its first review within 30 days of a complete submittal.

## 10 Regional adjustments

Of the eleven hand-checked criteria, only maximum drawdown varies with NOAA climate region more than chance would readily explain, and only suggestively (p = 0.09; Appendix A). Regional values are therefore limited to the cases below.

**10.1 Adopting a regional value.** [Default] A state may replace a [Regional] value only with a documented local analysis, such as a 90th-percentile rainfall depth computed from at least 30 years of daily records, published with the state's adoption.

**10.2 Water-quality depth (3.2.1).** [Regional] A state may adopt a documented 90th-percentile depth in place of 1.0 in. Arid and Plains states may find a lower depth (Nebraska DOT uses 0.5 in of runoff); this draft does not set one.

**10.3 Cold climates.** [Regional, E0] In the Upper Midwest, Alaska and mountain areas, a state may also require a snowmelt water-quality volume and frost-protected outlets, as Minnesota and Alaska do.

**10.4 Maximum drawdown (6.0.1).** [Regional, E1] A state in the NOAA Southwest or West climate regions may allow up to 96 hours, as California and New Mexico do.

**10.5 Other values.** Water-table separation, media depth and infiltration rate show no regional pattern. They stay national values until the evidence says otherwise.

## 11 Alternative compliance and variances

Where a site cannot meet Section 3 on site, the owner may meet it elsewhere or pay, but not skip it.

**11.1 Off-site compliance.** [Default, E3] The reviewing agency may accept treatment or retention at another site in the same watershed, provided it is at least equal to the shortfall and is in place before the project is occupied. 59 of 253 manuals allow off-site compliance or a fee in lieu.

**11.2 Fee in lieu.** [Open, E3] The reviewing agency may accept a payment, set by a published formula based on the cost of the volume not managed. The fund shall be spent on stormwater projects in the same watershed.

**11.3 Variances.** [Default, E0] A variance from a specific provision may be granted where the applicant shows the provision cannot be met, the alternative achieves the same performance standard, and the variance is the minimum needed. Each variance and its basis shall be recorded.

## Appendix A: Evidence behind each provision

The grade counts above are computed from this text. Every provision marked E0 is a placeholder for the committee.

- **E1** state-level manuals whose values were read by hand against their source text: 249 values read, 216 kept, from 39 states ([hand-checks.json](https://github.com/scott-jeffers/usa-stormwater/blob/main/data/national/hand-checks.json); [classification](/national/model-manual/)).
- **E2** values from all atlas manuals whose quote was found word-for-word in the source PDF. Numeric values were also read by hand against their quotes (data/qa/value-review.json); design-storm purposes are assigned automatically from requirement sentences (in a spot check of 30 storms, 21 got a purpose and 16 of those were right).
- **E3** the number of the 253 distinct manuals whose text states the rule, by text search. This shows how common a rule is, not that the manual requires exactly that value.
- **E0** common engineering practice with no atlas evidence yet.

| Provision | Value | Grade | Evidence |
| --- | --- | --- | --- |
| 3.2 WQ rainfall depth | 1.0 in | E1 | 7 of 15 states that set a rainfall depth; range 0.5–1.25 in; 4 more set 1.0 in of runoff |
| 3.3 TSS removal | 80% | E1 | 16 of 20 states; range 80–90% |
| 3.4 Channel-protection detention | 24 h | E1 | 12 of 19 states; range 12–48 h |
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
| 7.3 Freeboard | 1 ft | E3 | 87 of 253 manuals |
| 7.4 Side slopes | 3:1 | E3 | 106 of 253 manuals |
| 8.4–8.5 Maintenance | agreement, annual inspection | E3 | 125 and 120 of 253 manuals |

The state-level evidence still leans on the Northeast, which supplies 8–10 of the states for most E1 values. Arkansas and Nevada have no state manual in the atlas, and most western and Plains states are represented only by DOT drainage manuals, which rarely set post-construction criteria.

## Appendix B: Open questions for the committee

These decisions set the size and cost of most practices. Each is marked [Open] in the text.

1. **Channel-protection storm (3.4):** 24-hour extended detention of the 1-year storm (13 state manuals), 2-year peak matching (20), or both (6)?
2. **Redevelopment (3.7):** is 50% of replaced impervious area the right target, and should an impervious-reduction alternative remain?
3. **Water-table separation (5.4):** keep 24 in for all practices, or require 36 in for infiltration basins and trenches?
4. **Maximum drawdown (6.0.1):** 72 hours or 48 hours nationally? States split 12 to 10, and the Northeast leans to 48 h; confirm whether a regional value (10.4) is warranted.
5. **Bioretention media (6.1.1):** 18 in or 24 in as the default minimum? States split 8 to 8.
6. **Wet-pond depth (6.5.2):** confirm 4–8 ft once more states are read.
7. **Rational-method limit (4.3):** 20 acres, or another limit?
8. **Fee in lieu (11.2):** require a published, cost-based rate formula?
9. **Evidence gaps:** before adoption, replace each E0 placeholder with E1 or E2 evidence, and add the western and southern state manuals missing from the atlas.
