/**
 * Rewrite all 18 national draft sections to narrative chapter voice.
 * Preserves citations and guidance_tables; strips DRAFT RECOMMENDATION banners.
 *
 *   npx tsx scripts/national/rewrite-voice.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { clearNationalCache } from "../../lib/national";
import { DRAFT_DIR } from "../../lib/pipeline/paths";
import {
  draftSectionSchema,
  type DraftSection,
} from "../../lib/pipeline/types";

type Voice = {
  practice_survey: string;
  draft_recommendation: string;
  regional_variants: string | null;
  open_issues: string;
};

const VOICE: Record<string, Voice> = {
  intro: {
    practice_survey:
      "U.S. stormwater design manuals almost always open by stating purpose, audience, and how the manual relates to permits and local codes. Across this atlas (~299 manuals; ~76 Tier A anchors), roughly half of corpora carry general “purpose/scope” framing in their structure tags. This practice synthesis follows that pattern: it summarizes common practice for research and committee use, while making clear that state and local criteria control when they are more stringent.",
    draft_recommendation:
      "Use this synthesis as a survey of common U.S. post-construction practice, not as a design manual or regulation. Name the design purpose (water quality, channel protection, or flood control) before selecting criteria. Treat practice notes and guidance tables as evidence-backed starting points, and always cite the controlling state, regional, or MS4 manual for project decisions.",
    regional_variants: null,
    open_issues:
      "Confirm public-facing disclaimer language. Decide whether a short navigation flowchart belongs here or under submittals.",
  },
  applicability: {
    practice_survey:
      "Manuals typically define when criteria apply to new development versus redevelopment, often with disturbed-area or impervious-cover thresholds tied to MS4 permits. About two-fifths of atlas corpora are tagged for applicability-style topics. Local codes frequently allow stricter thresholds than state minimums; exemptions (for example routine maintenance) appear widely but vary in scope.",
    draft_recommendation:
      "State when criteria apply to new development and redevelopment, including disturbed-area or impervious thresholds. Clarify how this guidance relates to NPDES MS4 permits, construction general permits, and local codes. Allow agencies to adopt stricter thresholds. List common exemptions carefully so they do not undermine water-quality goals.",
    regional_variants:
      "MS4 Phase I and Phase II programs often use different triggers. Some arid and cold-climate localities exempt small projects from retention but still require treatment or erosion controls.",
    open_issues:
      "Choose default national thresholds versus guidance-only ranges. Align the exemption list with typical MS4 permits without undercutting WQ goals.",
  },
  hydrology: {
    practice_survey:
      "Hydrology chapters in U.S. manuals almost always separate storms by purpose: water-quality or treatment capture, channel or overbank protection, and flood or emergency conveyance. Among manuals that list return periods (~81% of the atlas; ~91% of Tier A), the 100-, 10-, and 2-year events appear most often. Peak-flow methods are dominated by NRCS/SCS and Rational Method families, with continuous or event models required for more complex sites.",
    draft_recommendation:
      "Require designers to name the design purpose before selecting a storm or method. Present return periods and water-quality depths as guidance with jurisdiction footnotes; more-stringent local criteria control. Match methods to site scale—Rational with documented area limits, NRCS for most site design, continuous simulation where permits require volume control. Address arid West, coastal, and cold-climate forks explicitly. Use the child sections for storms, methods, and software detail.",
    regional_variants:
      "Arid West: larger capture depths and infiltration limits. Coastal: tide and surge interactions. Cold climate: frozen ground and snowmelt hydrographs. Karst and high groundwater may disallow infiltration assumptions.",
    open_issues:
      "Which return periods belong in a national MOP versus guidance-only. Single national WQ depth versus climate bands. Software: prescribe versus allow-list.",
  },
  "hydrology.design-storms": {
    practice_survey:
      "Design storms are selected by purpose rather than collapsed into one number. Water-quality sizing is often a rainfall or runoff depth (or a percentile storm), while channel protection and detention use short-to-medium return periods, and flood conveyance commonly uses the 100-year event. Atlas extracts show 100-, 10-, and 2-year storms as the most frequently listed return periods among manuals that publish a list.",
    draft_recommendation:
      "Select storms by purpose: water quality (depth or percentile), channel/overbank protection (commonly in the 1–10 year range), detention or peak matching (commonly a 2–25 year suite, sometimes through 100), and flood/emergency conveyance (commonly 100-year with freeboard). Prefer NOAA Atlas 14 or successor precipitation where available. Document any climate adjustments required locally.",
    regional_variants:
      "Arid West manuals often emphasize retention of a larger capture depth. Humid East manuals emphasize multi-storm peak matching. Coastal projects may need tide or surge checks beyond inland Atlas 14 depths.",
    open_issues:
      "Whether to publish a single national WQ storm depth or climate-banded ranges. How to reference climate-change precipitation adjustments without prescribing one method.",
  },
  "hydrology.methods": {
    practice_survey:
      "Peak-flow and runoff methods in atlas extracts cluster into Rational Method for small catchments, NRCS/SCS curve-number and hydrograph methods for most site design, and continuous or multi-event models where volume control or complex routing is required. Unit hydrograph and Green-Ampt variants also appear. Local manuals often set maximum drainage areas for Rational Method.",
    draft_recommendation:
      "Match methods to site scale and purpose. Allow Rational Method only for small, largely impervious catchments with documented time-of-concentration limits. Use NRCS/SCS methods for most site design. Require continuous or multi-event simulation where permits demand runoff reduction or complex routing. Document CN, Tc, and rainfall distribution assumptions. Defer to stricter local method rules.",
    regional_variants:
      "Some West Coast and cold-climate manuals restrict Rational Method more tightly or require continuous simulation for LID volume credit.",
    open_issues:
      "National area limit for Rational Method. Whether continuous simulation is guidance or a requirement for volume-based standards.",
  },
  "hydrology.software": {
    practice_survey:
      "Manuals rarely mandate a single product. They more often list acceptable tools that implement approved methods and can export reviewable inputs and outputs. Named families in the atlas frequently include HEC-HMS, EPA SWMM, HydroCAD, and HEC-RAS for open-channel or floodplain checks.",
    draft_recommendation:
      "Treat software as an allow-list of capabilities, not a single mandated product. Accept tools that implement approved hydrologic methods and export reproducible inputs and outputs. Require version disclosure and input files with submittals. Defer to more restrictive local agency lists.",
    regional_variants: null,
    open_issues:
      "Prescribe versus allow-list posture. How to handle proprietary and cloud-only tools in public-records submittals.",
  },
  "water-quality": {
    practice_survey:
      "Water-quality volume or treatment criteria appear in a large share of atlas manuals (field populated in roughly half overall and a majority of Tier A). Common framings include a fixed rainfall or runoff depth, a percentile storm, pollutant-load reduction targets, and retention-first hierarchies before manufactured treatment. Numeric depths and methods vary by climate and permit program.",
    draft_recommendation:
      "Define water-quality volume (or equivalent treatment volume) with an explicit rainfall or runoff basis and clear new versus redevelopment rules. Prefer retention and runoff reduction before treatment-only BMPs where soils and groundwater allow. Publish presumed pollutant-removal rates only as guidance with jurisdiction footnotes. Apply the stricter of this guidance or the controlling MS4 or state manual.",
    regional_variants:
      "Arid West often uses larger capture depths or retention standards. Cold climates adjust for frozen soils and snowmelt. Coastal and karst settings may limit infiltration credits.",
    open_issues:
      "Single national WQ depth versus climate bands. Whether nutrient criteria belong in the MOP. Relationship to CGP and MS4 minimum measures.",
  },
  "water-quality.sizing": {
    practice_survey:
      "Sizing practice varies: first-inch or similar depth standards, 90th-percentile or other statistical storms, and pollutant-load approaches that couple volume with treatment performance. Atlas Tier A exemplars illustrate all three families. Designers typically size SCMs to the adopted WQv and then check drawdown, media, and pretreatment rules in the BMP chapter.",
    draft_recommendation:
      "State the WQv basis (depth, percentile storm, or load-based) and how new versus redevelopment differ. Size permanent SCMs to that volume with documented assumptions. Prefer retention where feasible; require pretreatment for sediment-laden inflows. Do not invent a single national depth without climate context—present a guidance range keyed to regional practice until committee defaults are set.",
    regional_variants:
      "Arid West capture depths and retention standards; cold-climate drawdown and underdrain rules; coastal and karst infiltration limits.",
    open_issues:
      "Default national depth or climate bands. Media and drawdown minimums: national floor versus deferral to state BMP manuals.",
  },
  "channel-flood": {
    practice_survey:
      "Channel and flood criteria separate erosive-flow control from flood conveyance. Manuals that list return periods commonly include short storms for channel protection and the 100-year event for flood or emergency design. Coordination with floodplain managers and FEMA mapping is routine for larger conveyances.",
    draft_recommendation:
      "Separate channel-protection storms from flood conveyance. Limit post-development increases in erosive flows where stable channels are a goal. Size conveyance and freeboard for the flood design storm with emergency overflow paths. Coordinate with floodplain managers and FEMA mapping where applicable. Prefer local channel-stability methods when published.",
    regional_variants:
      "Arid ephemeral channels and coastal tidally influenced systems need region-specific velocity and freeboard checks.",
    open_issues:
      "Default channel-protection return period (1- versus 2- versus 10-year). National freeboard guidance versus deferral to local floodplain ordinances.",
  },
  "channel-flood.release": {
    practice_survey:
      "Release-rate or peak-matching criteria typically require post-development peaks not to exceed pre-development for a specified storm suite, unless a regional facility provides equivalent control. Some manuals replace multi-storm peak matching with volume reduction or duration control, especially where LID retention is the primary standard.",
    draft_recommendation:
      "Match or reduce post-development peaks to pre-development for the specified storm suite unless a regional facility provides equivalent control. Document pre- versus post-hydrographs and routing assumptions. Avoid over-detention that worsens downstream peak timing without analysis. Allow alternative volume-based compliance where local manuals endorse it.",
    regional_variants:
      "Some manuals emphasize volume reduction or duration control over multi-storm peak matching. Arid regions may emphasize retention over release-rate matching.",
    open_issues:
      "Which storm suite belongs in national guidance. How to treat redevelopment sites with no reliable pre-development condition.",
  },
  bmps: {
    practice_survey:
      "Post-construction SCM catalogs group practices as green infrastructure or LID, conventional detention and retention, filtration, and manufactured treatment. Many manuals use a selection hierarchy: avoid and minimize imperviousness, then reduce runoff, then treat, then detain. Category signals in atlas approved-BMP lists commonly include bioretention, infiltration, detention, and manufactured treatment.",
    draft_recommendation:
      "Publish a core menu of post-construction SCM categories with a clear selection hierarchy. Point sizing back to hydrology and WQv chapters. Treat manufactured devices as conditionally allowed with verification-program references. Require O&M plans and inspection access as design deliverables. Present the menu as guidance with jurisdiction footnotes—not a mandatory national list.",
    regional_variants:
      "Karst and high groundwater restrict infiltration. Arid West emphasizes retention and dust or TSS. Cold climate needs freeze-thaw detailing. Coastal salinity and tide affect wetland and outfall design.",
    open_issues:
      "How to reference proprietary MTD approval programs. Whether green-infrastructure-first is a requirement or guidance. Separation of ESC versus permanent SCMs.",
  },
  "bmps.selection": {
    practice_survey:
      "Selection screens typically combine pollutant of concern, soils, groundwater, utilities, and climate constraints. Hierarchy language (avoid, minimize, treat, detain) is widespread. Manufactured devices are often allowed only after upstream hierarchy steps or when infiltration is infeasible.",
    draft_recommendation:
      "Follow a hierarchy: avoid and minimize imperviousness; prefer source control and runoff reduction; select treatment SCMs matched to pollutants and site constraints; use manufactured devices only where approved and where hierarchy steps are met. Publish selection screens for soils, groundwater, karst, and cold climate.",
    regional_variants:
      "Karst and high-groundwater screens; arid retention emphasis; cold-climate plant and underdrain constraints.",
    open_issues:
      "Whether green-infrastructure-first is a national requirement. How tightly to couple screens to local soils maps.",
  },
  "bmps.sizing": {
    practice_survey:
      "Permanent SCM sizing is usually tied to WQv or peak-flow criteria from the hydrology chapter. Drawdown windows, media depth, underdrains, and pretreatment appear repeatedly in design criteria. Construction ESC practices are often catalogued nearby but should not be credited as permanent treatment.",
    draft_recommendation:
      "Tie surface area, storage, and media depth to the WQv from the water-quality chapter. Meet drawdown and underdrain criteria appropriate to climate and soils. Provide pretreatment for sediment-laden inflows. Document infiltration rate, porosity, and orifice assumptions. Do not duplicate hydrology storms here—reference those chapters.",
    regional_variants:
      "Cold-climate underdrains and insulation; arid media and mulch specifications; coastal salt tolerance for plantings.",
    open_issues:
      "Default drawdown windows (24–72 h). Media specification: national minimums versus state BMP manuals.",
  },
  "bmps.manufactured": {
    practice_survey:
      "Manufactured treatment devices appear in many approved-BMP lists and are commonly conditioned on independent verification (for example TAPE, NJCAT, or state lists). Agencies differ on offline versus online configurations and on whether MTDs may replace runoff-reduction steps.",
    draft_recommendation:
      "Allow manufactured devices conditionally with reference to recognized verification programs or state approval lists. Size for the water-quality peak or volume per manufacturer and agency rules. Require inspection access and O&M commitments. Do not use MTDs to bypass runoff-reduction hierarchy where infiltration is feasible. Prefer verified performance data over marketing claims.",
    regional_variants:
      "State approval lists differ; some localities ban proprietary devices or require offline configuration.",
    open_issues:
      "Which verification programs to cite nationally. Offline versus online configurations and bypass design.",
  },
  "construction-esc": {
    practice_survey:
      "Construction erosion and sediment control is nearly universal in stormwater programs but is often published as a separate handbook or CGP companion. Atlas corpora include many ESC-tagged manuals; those should not inflate post-construction BMP counts. Sequencing, perimeter controls, and inspection after qualifying rain events are standard themes.",
    draft_recommendation:
      "Keep construction ESC distinct from permanent SCMs. Require an ESC plan consistent with the construction general permit and local grading rules. Sequence grading to limit exposed area and stabilize promptly. Provide perimeter controls, inlet protection, and concrete-washout BMPs. Inspect after qualifying rain events and before final stabilization. Do not credit temporary ESC as permanent treatment.",
    regional_variants:
      "Arid dust control and cold-weather stabilization timing differ from humid-season ESC defaults.",
    open_issues:
      "How much ESC detail belongs in a post-construction national manual versus a pointer to CGP and state ESC handbooks.",
  },
  om: {
    practice_survey:
      "Operation and maintenance requirements commonly appear as design deliverables: named responsible parties, inspection frequencies, and access provisions. Green infrastructure manuals emphasize vegetation, sediment removal, and underdrain maintenance. Bond release or occupancy is sometimes tied to as-built acceptance.",
    draft_recommendation:
      "Require an O&M plan naming the responsible party, inspection frequency, and performance indicators. Design for access (easements, ramps, cleanouts). Document vegetation, sediment removal, and underdrain maintenance for GI practices. Tie certificates of occupancy or bond release to as-built acceptance where local codes allow.",
    regional_variants: null,
    open_issues:
      "Minimum inspection frequencies by SCM type. Whether national language should address long-term funding mechanisms.",
  },
  regional: {
    practice_survey:
      "Climate and geologic forks appear throughout U.S. manuals: arid West capture and infiltration rules, humid East multi-storm peak matching, cold-climate freeze-thaw detailing, coastal freeboard and salinity, and karst or high-groundwater infiltration limits. Presenting humid-East defaults as universal national numbers misrepresents practice.",
    draft_recommendation:
      "Treat regional variants as first-class content. Identify arid West, humid East, cold climate, coastal, and karst or high-groundwater packages for capture volume, infiltration feasibility, and plantings. Require designers to document which regional package applies. Prefer local and state manuals when they define climate-specific criteria.",
    regional_variants:
      "arid_west, humid_east, cold_climate, coastal, karst — each may change WQ depth, infiltration credit, freeze-thaw detailing, and outfall freeboard.",
    open_issues:
      "How many climate bands to publish. Map or lookup method for assigning a site to a band.",
  },
  submittals: {
    practice_survey:
      "Plan-review packages typically include a drainage report, plans and details, calculation sheets or model files, an O&M plan, and as-built or certification materials. Local agencies add checklists; digital submittal expectations are increasing but inconsistent.",
    draft_recommendation:
      "Require a reproducible, reviewable package: drainage report covering hydrology, WQv, SCM selection and sizing, and downstream impacts; plans showing drainage areas, SCM details, and access; model input and output files; O&M plan; and as-built or certification materials. Provide a national checklist baseline and allow local agencies to add items.",
    regional_variants: null,
    open_issues:
      "National checklist length versus deferral to local plan-review manuals. Digital submittal and model-file retention requirements.",
  },
};

clearNationalCache();

let updated = 0;
for (const [id, voice] of Object.entries(VOICE)) {
  const filePath = path.join(DRAFT_DIR, `${id}.json`);
  if (!existsSync(filePath)) {
    console.warn(`missing ${id}`);
    continue;
  }
  const raw = draftSectionSchema.parse(
    JSON.parse(readFileSync(filePath, "utf-8"))
  );
  const next: DraftSection = {
    ...raw,
    generated_at: new Date().toISOString(),
    model: "heuristic+editorial",
    editorial_status: "reviewed",
    practice_survey: voice.practice_survey,
    draft_recommendation: voice.draft_recommendation,
    regional_variants: voice.regional_variants,
    open_issues: voice.open_issues,
  };
  writeFileSync(filePath, JSON.stringify(next, null, 2) + "\n", "utf-8");
  console.log(`voice → ${id}`);
  updated += 1;
}

console.log(`Rewrote voice for ${updated} sections`);
