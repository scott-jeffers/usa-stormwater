/**
 * Apply editorial prose to national draft sections (preserves citations).
 * Marks editorial_status: reviewed and model: heuristic+editorial.
 *
 * Usage: npx tsx scripts/national/apply-editorial.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import {
  buildPracticeSurveyFromStats,
  computeAtlasStats,
} from "../lib/atlasStats";
import { DRAFT_DIR, OUTLINE_PATH } from "../../lib/pipeline/paths";
import {
  draftSectionSchema,
  nationalOutlineSchema,
  type DraftSection,
  type NationalOutline,
} from "../../lib/pipeline/types";

type Editorial = {
  practice_survey?: string;
  draft_recommendation: string;
  regional_variants: string | null;
  open_issues: string;
};

const EDITORIAL: Record<string, Editorial> = {
  intro: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] This manual synthesizes common U.S. post-construction stormwater design practice for research and committee use. It should: (1) State that controlling state, regional, and MS4 criteria prevail when more stringent; (2) Separate descriptive practice surveys from draft recommendations in every chapter; (3) Require designers to name the design purpose (water quality, channel protection, flood control) before selecting criteria; (4) Cite jurisdiction manuals for any numeric default used on a project. This document is not regulation and is not a substitute for the local design manual.",
    regional_variants: null,
    open_issues:
      "Confirm disclaimer language for public release. Decide whether a short “how to navigate” flowchart belongs in the intro or in submittals.",
  },
  applicability: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Applicability language should: (1) Define when criteria apply to new development vs redevelopment and any disturbed-area or impervious thresholds; (2) Clarify relationship to NPDES MS4 permits, construction general permits, and local codes; (3) Allow local authorities to adopt stricter thresholds; (4) Identify common exemptions (e.g., maintenance of existing facilities) without creating loopholes that defeat water-quality goals. Thresholds remain placeholders pending jurisdiction review.",
    regional_variants:
      "MS4 Phase I vs Phase II programs often use different disturbed-area triggers. Some arid and cold-climate localities exempt small projects from retention but not from treatment or erosion controls.",
    open_issues:
      "Choose default national disturbed-area / impervious thresholds vs guidance-only ranges. Align exemption list with typical MS4 permits without undercutting WQ goals.",
  },
  "hydrology.design-storms": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Design storms must be selected by purpose: (1) Water-quality / treatment storm (often a depth or percentile event, not a long return period); (2) Channel / overbank protection (commonly 1- to 10-year); (3) Detention / peak matching (often 2- through 25- or 100-year); (4) Flood / emergency conveyance (typically 100-year, sometimes with freeboard). Do not collapse all purposes into a single return period. Prefer NOAA Atlas 14 (or successor) precipitation where available; document climate adjustments when required locally.",
    regional_variants:
      "Arid West manuals often emphasize retention of a larger capture depth; humid East manuals emphasize peak matching for multiple return periods. Coastal projects may need tide/surge interaction checks beyond inland Atlas 14 depths.",
    open_issues:
      "Whether to publish a single national WQ storm depth vs climate-banded ranges. How to reference climate-change precipitation adjustments without prescribing a single method.",
  },
  "hydrology.methods": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Acceptable methods should be matched to site scale and purpose: (1) Rational Method only for small, largely impervious catchments with documented time-of-concentration limits; (2) NRCS/SCS curve-number and hydrograph methods for most site design; (3) Continuous or multi-event simulation where permits require runoff reduction, volume control, or complex routing. Require documentation of parameters (CN, Tc, rainfall distribution) and state that more-stringent local method requirements control.",
    regional_variants:
      "Some West Coast and cold-climate manuals restrict Rational Method more tightly or require continuous simulation for LID volume credit.",
    open_issues:
      "National area limit for Rational Method. Whether continuous simulation is guidance or a requirement for volume-based standards.",
  },
  "hydrology.software": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Treat software as an allow-list / capability statement, not a single mandated product: (1) Accept tools that implement approved hydrologic methods and can export inputs/outputs for review; (2) Commonly referenced families include HEC-HMS, EPA SWMM, HydroCAD, and HEC-RAS for open-channel / floodplain checks; (3) Require version disclosure and reproducible input files with submittals; (4) Defer to local agency lists when they are more restrictive.",
    regional_variants: null,
    open_issues:
      "Prescribe vs allow-list posture. How to handle proprietary models and cloud-only tools in public-records submittals.",
  },
  "water-quality.sizing": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Water-quality sizing should: (1) Define WQv (or treatment volume) with an explicit rainfall/runoff basis and new vs redevelopment rules; (2) Prefer retention and runoff reduction before treatment-only BMPs where soils and groundwater allow; (3) Document presumed pollutant-removal rates only as guidance with jurisdiction footnotes; (4) Apply the stricter of this guidance or the controlling MS4/state manual. Numeric national depths remain placeholders until excerpt review is complete.",
    regional_variants:
      "Arid West often uses larger capture depths or retention standards; cold climates adjust for frozen soils and snowmelt; coastal and karst settings may limit infiltration credits.",
    open_issues:
      "Single national WQ depth vs climate bands. Whether nutrient criteria belong in the MOP or remain guidance.",
  },
  "channel-flood": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Channel and flood criteria should: (1) Separate channel-protection storms from flood conveyance; (2) Limit post-development increases in erosive flows where stable channels are a goal; (3) Size conveyance and freeboard for the flood design storm with emergency overflow paths; (4) Coordinate with floodplain managers and FEMA mapping where applicable. Prefer local channel-stability methods when published.",
    regional_variants:
      "Arid ephemeral channels and coastal tidally influenced systems need region-specific velocity and freeboard checks.",
    open_issues:
      "Default channel-protection return period (1- vs 2- vs 10-year). National freeboard guidance vs deferral to local floodplain ordinances.",
  },
  "channel-flood.release": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Release-rate / peak-matching criteria should: (1) Match or reduce post-development peaks to pre-development for the specified storm suite unless a regional facility provides equivalent control; (2) Document pre- vs post-hydrographs and routing assumptions; (3) Avoid over-detention that worsens downstream peak timing without analysis; (4) Allow alternative volume-based compliance where local manuals endorse it.",
    regional_variants:
      "Some manuals replace multi-storm peak matching with volume reduction or duration control; arid regions may emphasize retention over release-rate matching.",
    open_issues:
      "Which storm suite belongs in national guidance. How to treat redevelopment sites with no reliable pre-development condition.",
  },
  "bmps.selection": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] BMP selection should follow a hierarchy: (1) Avoid and minimize imperviousness and disturbance; (2) Prefer source control and runoff reduction; (3) Select treatment SCMs matched to pollutants of concern and site constraints (soils, groundwater, karst, cold climate, utilities); (4) Use manufactured devices only where approved and where upstream pretreatment or hierarchy steps are met. Publish a core menu, not a mandatory single list.",
    regional_variants:
      "Karst and high-groundwater areas restrict infiltration; arid West emphasizes retention and dust/TSS; cold climate needs freeze-thaw detailing.",
    open_issues:
      "Whether green-infrastructure-first is a national requirement or guidance. How tightly to couple selection screens to local soils maps.",
  },
  "bmps.sizing": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Permanent SCM sizing should: (1) Tie surface area, storage, and media depth to the WQv / treatment volume from the water-quality chapter; (2) Meet drawdown and underdrain criteria appropriate to climate and soils; (3) Provide pretreatment for sediment-laden inflows; (4) Document design assumptions (infiltration rate, porosity, orifice sizing) in the report. Do not duplicate hydrology storms here — reference those chapters.",
    regional_variants:
      "Cold-climate underdrains and insulation details; arid media and mulch specifications; coastal salt tolerance for plantings.",
    open_issues:
      "Default drawdown windows (24–72 h). Media specification: national minimums vs deferral to state BMP manuals.",
  },
  "bmps.manufactured": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Manufactured treatment devices (MTDs) should be: (1) Conditionally allowed with reference to recognized verification programs (e.g., TAPE, NJCAT, or state approval lists); (2) Sized for the water-quality peak or volume per manufacturer and agency rules; (3) Paired with inspection access and O&M commitments; (4) Not used to bypass runoff-reduction hierarchy where infiltration is feasible. Prefer agency-verified performance data over marketing claims.",
    regional_variants:
      "State approval lists differ; some localities ban proprietary devices or require offline configuration.",
    open_issues:
      "Which verification programs to cite nationally. Offline vs online configurations and bypass design.",
  },
  "construction-esc": {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Construction ESC should remain distinct from permanent SCMs: (1) Require an ESC plan consistent with the construction general permit and local grading rules; (2) Sequence grading to limit exposed area and stabilize promptly; (3) Provide perimeter controls, inlet protection, and concrete-washout BMPs; (4) Inspect after qualifying rain events and before final stabilization. Do not credit temporary ESC practices as permanent post-construction treatment.",
    regional_variants:
      "Arid dust control and cold-weather stabilization timing differ from humid-season ESC defaults.",
    open_issues:
      "How much ESC detail belongs in a post-construction national manual vs a pointer to CGP / state ESC handbooks.",
  },
  om: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Operation and maintenance should be a design deliverable: (1) Require an O&M plan naming the responsible party, inspection frequency, and performance indicators; (2) Design for access (easements, ramps, cleanouts); (3) Document vegetation, sediment removal, and underdrain maintenance for GI practices; (4) Tie certificates of occupancy or bond release to as-built acceptance where local codes allow.",
    regional_variants: null,
    open_issues:
      "Minimum inspection frequencies by SCM type. Whether national language should address long-term funding mechanisms.",
  },
  regional: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Regional variants are first-class, not footnotes: (1) Identify arid West, humid East, cold climate, coastal, and karst/high-groundwater forks for capture volume, infiltration feasibility, and plantings; (2) Require designers to document which regional package applies; (3) Prefer local/state manuals when they define climate-specific criteria; (4) Avoid presenting humid-East defaults as universal national numbers.",
    regional_variants:
      "arid_west, humid_east, cold_climate, coastal, karst — each may change WQ depth, infiltration credit, freeze-thaw detailing, and outfall freeboard.",
    open_issues:
      "How many climate bands to publish. Map or lookup method for assigning a site to a band.",
  },
  submittals: {
    draft_recommendation:
      "[DRAFT RECOMMENDATION — national manual draft, not adopted practice] Submittals should be reproducible and reviewable: (1) Drainage report covering hydrology, WQv, SCM selection/sizing, and downstream impacts; (2) Plans showing drainage areas, SCM details, and access; (3) Model input/output files and calculation sheets; (4) O&M plan and as-built / certification package. Provide a checklist; allow local agencies to add items.",
    regional_variants: null,
    open_issues:
      "National checklist length vs deferral to local plan-review manuals. Digital submittal and model-file retention requirements.",
  },
};

function loadOutline(): NationalOutline {
  return nationalOutlineSchema.parse(
    JSON.parse(readFileSync(OUTLINE_PATH, "utf-8"))
  );
}

function main(): void {
  const outline = loadOutline();
  const atlas = computeAtlasStats();
  let updated = 0;

  for (const section of outline.sections) {
    const ed = EDITORIAL[section.id];
    if (!ed) {
      // Already reviewed parents (hydrology, water-quality, bmps) — ensure flag
      const p = path.join(DRAFT_DIR, `${section.id}.json`);
      if (!existsSync(p)) continue;
      const raw = draftSectionSchema.parse(JSON.parse(readFileSync(p, "utf-8")));
      if (raw.editorial_status === "reviewed") continue;
      if (
        String(raw.model ?? "").includes("committee-edit") ||
        String(raw.model ?? "").includes("editorial")
      ) {
        const next: DraftSection = {
          ...raw,
          editorial_status: "reviewed",
        };
        writeFileSync(p, JSON.stringify(next, null, 2) + "\n", "utf-8");
        updated += 1;
      }
      continue;
    }

    const p = path.join(DRAFT_DIR, `${section.id}.json`);
    if (!existsSync(p)) {
      console.warn(`missing draft ${section.id}`);
      continue;
    }
    const raw = draftSectionSchema.parse(JSON.parse(readFileSync(p, "utf-8")));
    const stats = atlas.forSection(section);
    const practice =
      ed.practice_survey ??
      buildPracticeSurveyFromStats({ section, stats });

    const next: DraftSection = {
      ...raw,
      generated_at: new Date().toISOString(),
      model: "heuristic+editorial",
      editorial_status: "reviewed",
      practice_survey: practice,
      draft_recommendation: ed.draft_recommendation,
      regional_variants: ed.regional_variants,
      open_issues: ed.open_issues,
    };
    writeFileSync(p, JSON.stringify(next, null, 2) + "\n", "utf-8");
    console.log(`editorial → ${section.id}`);
    updated += 1;
  }

  console.log(`Updated ${updated} sections`);
}

main();
