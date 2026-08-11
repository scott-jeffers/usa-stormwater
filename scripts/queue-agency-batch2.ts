/**
 * Batch 2: queue verified DOT manuals + mark unavailable / accept_partial in registry.
 *   npx tsx scripts/queue-agency-batch2.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "data/queue/manifest.json");
const REGISTRY = path.join(ROOT, "data/agency-targets/registry.json");
const ALIASES = path.join(ROOT, "data/agency-targets/aliases.json");

interface Job {
  id: string;
  jurisdictionHint: string;
  levelHint: string;
  agencyHint: "dot" | "dep_deq";
  scopeHint: string;
  pdfUrl: string;
  landingPageUrl: string;
  cityCoords: null;
  notes: string;
  partial?: boolean;
  acceptPartial?: boolean;
  registryExpectedId: string;
  stateCode: string;
  category: "dot" | "dep_deq";
}

const NEW_JOBS: Job[] = [
  {
    id: "ct-ctdot-drainage",
    jurisdictionHint: "Connecticut",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://portal.ct.gov/dot/-/media/dot/drainage/ctdot-drainage-full-pdf.pdf",
    landingPageUrl:
      "https://portal.ct.gov/dot/bureaus/engineering-and-construction/engineering/facilities-and-transit/soils-foundation-hydraulics-and-drainage",
    cityCoords: null,
    notes: "CTDOT Drainage Manual — full PDF",
    registryExpectedId: "ct-ctdot-drainage",
    stateCode: "CT",
    category: "dot",
  },
  {
    id: "sc-scdot-drainage",
    jurisdictionHint: "South Carolina",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.scdot.org/content/dam/scdot-legacy/business/pdf/stormwater/SCDOT_SWQDM.pdf",
    landingPageUrl: "https://www.scdot.org/",
    cityCoords: null,
    notes: "SCDOT Stormwater Quality Design Manual (SWQDM)",
    registryExpectedId: "sc-scdot-drainage",
    stateCode: "SC",
    category: "dot",
  },
  {
    id: "md-sha-drainage",
    jurisdictionHint: "Maryland",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl: "https://roads.maryland.gov/ohd2/MDOTSHADrainageManual.pdf",
    landingPageUrl: "https://roads.maryland.gov/",
    cityCoords: null,
    notes: "MDOT SHA Drainage Manual",
    registryExpectedId: "md-sha-drainage",
    stateCode: "MD",
    category: "dot",
  },
  {
    id: "ut-udot-drainage",
    jurisdictionHint: "Utah",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://drive.google.com/uc?export=download&id=1sxmhKziSdENiN03kQUhUlu8xyAHMdJol",
    landingPageUrl:
      "https://connect.udot.utah.gov/docs/drainage-design-manual-of-instruction/",
    cityCoords: null,
    notes: "UDOT Drainage Design Manual of Instruction (Google Drive export)",
    registryExpectedId: "ut-udot-drainage",
    stateCode: "UT",
    category: "dot",
  },
  {
    id: "al-aldot-drainage",
    jurisdictionHint: "Alabama",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.dot.state.al.us/publications/Design/pdf/HydraulicManualDraft.pdf",
    landingPageUrl:
      "https://www.dot.state.al.us/publications/Design/HydraulicResources.html",
    cityCoords: null,
    notes: "ALDOT Hydraulic Manual (Draft)",
    registryExpectedId: "al-aldot-drainage",
    stateCode: "AL",
    category: "dot",
  },
  {
    id: "tx-txdot-hydraulic",
    jurisdictionHint: "Texas",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl: "https://www.txdot.gov/content/dam/txdotoms/des/hyd/hyd.pdf",
    landingPageUrl: "https://www.txdot.gov/manuals/des/hyd/index.html",
    cityCoords: null,
    notes: "TxDOT Hydraulic Design Manual (revised Sept 2019)",
    registryExpectedId: "tx-txdot-hydraulic",
    stateCode: "TX",
    category: "dot",
  },
  {
    id: "mn-mndot-drainage",
    jurisdictionHint: "Minnesota",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://edocs-public.dot.state.mn.us/edocs_public/DMResultSet/download?docId=26996068",
    landingPageUrl:
      "https://www.dot.state.mn.us/bridge/hydraulics/drainage-manual-2000.html",
    cityCoords: null,
    notes: "MnDOT Drainage Manual (2000) — complete published PDF",
    registryExpectedId: "mn-mndot-drainage",
    stateCode: "MN",
    category: "dot",
  },
  {
    id: "la-ladotd-drainage",
    jurisdictionHint: "Louisiana",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl: "https://dotd.la.gov/media/gyzjm1fu/hydraulics-manual.pdf",
    landingPageUrl:
      "https://dotd.la.gov/about/office-of-project-delivery/engineering/public-works/hydraulics/",
    cityCoords: null,
    notes: "LADOTD Hydraulics Manual (2011)",
    registryExpectedId: "la-ladotd-drainage",
    stateCode: "LA",
    category: "dot",
  },
  {
    id: "vt-vtrans-drainage",
    jurisdictionHint: "Vermont",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://vtrans.vermont.gov/sites/aot/files/highway/documents/structures/VTrans%20Hydraulics%20Manual.pdf",
    landingPageUrl:
      "https://vtrans.vermont.gov/highway/structures-hydraulics/hydraulics/designcriteria-standards",
    cityCoords: null,
    notes: "VTrans Hydraulics Manual (May 28, 2015)",
    registryExpectedId: "vt-vtrans-drainage",
    stateCode: "VT",
    category: "dot",
  },
  {
    id: "nj-njdot-drainage",
    jurisdictionHint: "New Jersey",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.nj.gov/transportation/eng/documents/SEM/pdf/DrainageDesignManual2006s.pdf",
    landingPageUrl: "https://dot.nj.gov/transportation/eng/documents/RDM/",
    cityCoords: null,
    notes: "NJDOT Drainage Design Manual (August 2006)",
    registryExpectedId: "nj-njdot-drainage",
    stateCode: "NJ",
    category: "dot",
  },
  {
    id: "wv-wvdoh-drainage",
    jurisdictionHint: "West Virginia",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://transportation.wv.gov/highways/engineering/Manuals/Drainage/WVDOH%202007%20Drainage%20Manual%20with%20Addendum%209-23-13.pdf",
    landingPageUrl:
      "https://transportation.wv.gov/highways/engineering/Pages/Manuals.aspx",
    cityCoords: null,
    notes: "WVDOH Drainage Manual 3rd Ed. (2007) with Addendum 9-23-13",
    registryExpectedId: "wv-wvdoh-drainage",
    stateCode: "WV",
    category: "dot",
  },
  {
    id: "ga-gdot-drainage",
    jurisdictionHint: "Georgia",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.dot.ga.gov/PartnerSmart/DesignManuals/Drainage/Drainage%20Design%20Policy%20Manual.pdf",
    landingPageUrl:
      "http://www.dot.ga.gov/GDOT/Pages/designmanualssoftware.aspx",
    cityCoords: null,
    notes: "GDOT Drainage Design Policy Manual",
    registryExpectedId: "ga-gdot-drainage",
    stateCode: "GA",
    category: "dot",
  },
  {
    id: "ma-massdot-drainage",
    jurisdictionHint: "Massachusetts",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.acecma.org/wp-content/uploads/MassDOT_StormwaterDesignGuide_FINAL_508c.pdf",
    landingPageUrl:
      "https://www.mass.gov/info-details/stormwater-management-unit",
    cityCoords: null,
    notes:
      "MassDOT Stormwater Design Guide 2023 Edition (ACEC-MA mirror; mass.gov download often 403 to bots)",
    registryExpectedId: "ma-massdot-drainage",
    stateCode: "MA",
    category: "dot",
  },
  {
    id: "de-deldot-drainage",
    jurisdictionHint: "Delaware",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://deldot.gov/Publications/manuals/road_design/pdfs/06_drainage_stormwater_mgmt.pdf",
    landingPageUrl: "https://roaddesignmanual.deldot.gov/index.php/Home",
    cityCoords: null,
    notes: "DelDOT Road Design Manual Ch.6 Drainage and Stormwater Management",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "de-deldot-drainage",
    stateCode: "DE",
    category: "dot",
  },
  {
    id: "in-indot-drainage",
    jurisdictionHint: "Indiana",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.in.gov/dot/div/contracts/design/Part%202/Chapter%20203%20-%20Hydraulics%20and%20Drainage%20Design.pdf",
    landingPageUrl: "https://www.in.gov/indot/design-manual/",
    cityCoords: null,
    notes: "INDOT Design Manual Chapter 203 — Hydraulics and Drainage Design",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "in-indot-drainage",
    stateCode: "IN",
    category: "dot",
  },
  {
    id: "mi-mdot-drainage",
    jurisdictionHint: "Michigan",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.michigan.gov/mdot/-/media/Project/Websites/MDOT/Business/Design/Drainage-Manual/MDOT-MS4-Chap-07-Drainage-Manual.pdf",
    landingPageUrl:
      "https://www.michigan.gov/mdot/business/design/drainage-manual",
    cityCoords: null,
    notes: "MDOT Drainage Manual Chapter 7 — Road Storm Drainage Systems",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "mi-mdot-drainage",
    stateCode: "MI",
    category: "dot",
  },
  {
    id: "or-odot-drainage",
    jurisdictionHint: "Oregon",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.oregon.gov/odot/hydraulics/Docs_Hydraulics_Manual/Hydraulics-13.pdf",
    landingPageUrl:
      "https://www.oregon.gov/odot/hydraulics/pages/hydraulics-manual.aspx",
    cityCoords: null,
    notes: "ODOT Hydraulics Manual Chapter 13 — Storm Drainage (2014)",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "or-odot-drainage",
    stateCode: "OR",
    category: "dot",
  },
  {
    id: "wi-wisdot-drainage",
    jurisdictionHint: "Wisconsin",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl: "https://wisconsindot.gov/rdwy/fdm/fd-13-10.pdf",
    landingPageUrl:
      "https://wisconsindot.gov/pages/doing-bus/eng-consultants/cnslt-rsrces/rdwy/fdm.aspx",
    cityCoords: null,
    notes: "WisDOT FDM Chapter 13 Drainage — Section 13-10 Hydrology",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "wi-wisdot-drainage",
    stateCode: "WI",
    category: "dot",
  },
  {
    id: "tn-tdot-drainage",
    jurisdictionHint: "Tennessee",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.tn.gov/content/dam/tn/tdot/engineering-production-support/documents/drainage_manual/DM-Chapter_07.pdf",
    landingPageUrl:
      "https://www.tn.gov/tdot/state-engineering-technical-training/production-support/design-standards/drainage-manual.html",
    cityCoords: null,
    notes: "TDOT Drainage Manual Chapter 7 — Storm Drainage Systems",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "tn-tdot-drainage",
    stateCode: "TN",
    category: "dot",
  },
  {
    id: "ny-nysdot-drainage",
    jurisdictionHint: "New York",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.dot.ny.gov/divisions/engineering/design/dqab/hdm/hdm-repository/chapt_08.pdf",
    landingPageUrl:
      "https://www.dot.ny.gov/divisions/engineering/design/dqab/hdm/chapter-8",
    cityCoords: null,
    notes: "NYSDOT Highway Design Manual Chapter 8 — Highway Drainage",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "ny-nysdot-drainage",
    stateCode: "NY",
    category: "dot",
  },
  {
    id: "ky-kytc-drainage",
    jurisdictionHint: "Kentucky",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://transportation.ky.gov/Highway-Design/Drainage%20Manual/DR%20100%20Introduction%20(Draft).pdf",
    landingPageUrl:
      "https://transportation.ky.gov/Highway-Design/Pages/Drainage.aspx",
    cityCoords: null,
    notes: "KYTC Drainage Guidance Manual — DR-100 Introduction (chapter set)",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "ky-kytc-drainage",
    stateCode: "KY",
    category: "dot",
  },
  {
    id: "mt-mdt-drainage",
    jurisdictionHint: "Montana",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.mdt.mt.gov/other/webdata/external/hydraulics/manuals/Chapter-09-Hydrology.pdf",
    landingPageUrl: "https://mdt.mt.gov/publications/manuals.aspx",
    cityCoords: null,
    notes: "MDT Hydraulics Manual Chapter 9 — Hydrology",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "mt-mdt-drainage",
    stateCode: "MT",
    category: "dot",
  },
  {
    id: "ak-dot-drainage",
    jurisdictionHint: "Alaska",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://dot.alaska.gov/stwddes/desbridge/assets/pdf/hwydrnman/hwydrncover.pdf",
    landingPageUrl:
      "https://dot.alaska.gov/stwddes/desbridge/hwy_drainage_manual.shtml",
    cityCoords: null,
    notes:
      "Alaska Highway Drainage Manual — cover/TOC chapter proxy (manual is chaptered PDFs)",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "ak-dot-drainage",
    stateCode: "AK",
    category: "dot",
  },
  {
    id: "co-cwcb-floodplain-stormwater",
    jurisdictionHint: "Colorado",
    levelHint: "state",
    agencyHint: "dep_deq",
    scopeHint: "full_manual",
    pdfUrl:
      "https://dnrweblink.state.co.us/CWCB/0/edoc/211428/Chapter%2015.pdf",
    landingPageUrl:
      "https://cwcb.colorado.gov/public-information/technical-tools/floodplain-stormwater-criteria-manual",
    cityCoords: null,
    notes:
      "CWCB Floodplain and Stormwater Criteria Manual Ch15 Storm Drainage Water Quality (statewide DNR; CDPHE is permit-only)",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "co-cdphe-stormwater",
    stateCode: "CO",
    category: "dep_deq",
  },
  {
    id: "dc-ddot-stormwater",
    jurisdictionHint: "District of Columbia",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://ddot.dc.gov/sites/default/files/dc/sites/ddot/publication/attachments/2014-Final%20DDOT%20Green%20Infrastructure%20Standards.pdf",
    landingPageUrl: "https://ddot.dc.gov/GreenInfrastructure",
    cityCoords: null,
    notes: "DDOT Green Infrastructure Standards (2014)",
    registryExpectedId: "dc-ddot-stormwater",
    stateCode: "DC",
    category: "dot",
  },
  {
    id: "ia-dot-drainage",
    jurisdictionHint: "Iowa",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl: "https://documents.iowa.gov/Home/Download/9592853",
    landingPageUrl: "https://iowadot.gov/design-manual/chapter-4-drainage",
    cityCoords: null,
    notes: "Iowa DOT Design Manual Ch4 Drainage — §4A-01 intro (chapter set)",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "ia-dot-drainage",
    stateCode: "IA",
    category: "dot",
  },
  {
    id: "id-itd-drainage",
    jurisdictionHint: "Idaho",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://apps.itd.idaho.gov/apps/manuals/roadwaydesign/files/RoadwayDesign600.pdf",
    landingPageUrl:
      "https://apps.itd.idaho.gov/apps/manuals/roadwaydesign/files/Roadwaydesignprintable.pdf",
    cityCoords: null,
    notes: "ITD Roadway Design Manual Section 600 Hydraulics",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "id-itd-drainage",
    stateCode: "ID",
    category: "dot",
  },
  {
    id: "il-idot-drainage",
    jurisdictionHint: "Illinois",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl: "https://public.powerdms.com/IDOT/documents/2084523",
    landingPageUrl:
      "https://idot.illinois.gov/doing-business/industry-marketplace/bridges-and-structures-services/specific-scope-of-services.html",
    cityCoords: null,
    notes: "IDOT Drainage Manual (July 2011) via PowerDMS",
    registryExpectedId: "il-idot-drainage",
    stateCode: "IL",
    category: "dot",
  },
  {
    id: "ks-kdot-drainage",
    jurisdictionHint: "Kansas",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.ksdot.gov/home/showpublisheddocument/858/638942965857170000",
    landingPageUrl:
      "https://www.ksdot.gov/doing-business/design-consultants/design-resources/drainage-design-manual",
    cityCoords: null,
    notes: "KDOT Drainage Design Manual (May 2023) Section 1",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "ks-kdot-drainage",
    stateCode: "KS",
    category: "dot",
  },
  {
    id: "me-dot-drainage",
    jurisdictionHint: "Maine",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl: "https://www.maine.gov/tools/whatsnew/attach.php?id=816916&an=1",
    landingPageUrl:
      "https://www.maine.gov/dot/programs-services/highway/highway-engineering",
    cityCoords: null,
    notes:
      "MaineDOT Highway Program §7 Drainage Design Practices & Procedures (2021)",
    partial: true,
    acceptPartial: true,
    registryExpectedId: "me-dot-drainage",
    stateCode: "ME",
    category: "dot",
  },
  {
    id: "nd-nddot-drainage",
    jurisdictionHint: "North Dakota",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.dot.nd.gov/sites/www/files/documents/Design/Chapter%205.pdf",
    landingPageUrl:
      "https://www.dot.nd.gov/construction-and-planning/construction-and-contractor-resources/design-manual",
    cityCoords: null,
    notes: "NDDOT Design Manual Chapter V — Hydraulic Studies and Drainage Design",
    registryExpectedId: "nd-nddot-drainage",
    stateCode: "ND",
    category: "dot",
  },
  {
    id: "nh-nhdot-drainage",
    jurisdictionHint: "New Hampshire",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.dot.nh.gov/sites/g/files/ehbemt811/files/inline-documents/manual-drainage-design.pdf",
    landingPageUrl:
      "https://www.dot.nh.gov/doing-business-nhdot/engineers-consultants/highway-design-manual",
    cityCoords: null,
    notes: "NHDOT Manual on Drainage Design for Highways",
    registryExpectedId: "nh-nhdot-drainage",
    stateCode: "NH",
    category: "dot",
  },
  {
    id: "nm-nmdot-drainage",
    jurisdictionHint: "New Mexico",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://api.realfile.rtsclients.com/PublicFiles/f260a66b364d453e91ff9b3fedd494dc/ae005670-a671-480e-9c33-0e37cf2f6b82/Drainage%20Design%20Manual%202018.pdf",
    landingPageUrl:
      "https://www.dot.nm.gov/infrastructure/program-management/drainage-design/",
    cityCoords: null,
    notes: "NMDOT Drainage Design Manual (July 2018)",
    registryExpectedId: "nm-nmdot-drainage",
    stateCode: "NM",
    category: "dot",
  },
  {
    id: "ri-ridot-drainage",
    jurisdictionHint: "Rhode Island",
    levelHint: "state",
    agencyHint: "dot",
    scopeHint: "drainage",
    pdfUrl:
      "https://www.dot.ri.gov/EnvironmentalDivision/docs/Stormwater/Linearstormwatermanual.pdf",
    landingPageUrl:
      "https://www.dot.ri.gov/EnvironmentalDivision/Office_of_Stormwater.php",
    cityCoords: null,
    notes: "RIDOT Linear Stormwater Manual (February 2019)",
    registryExpectedId: "ri-ridot-drainage",
    stateCode: "RI",
    category: "dot",
  },
];

/** Targets with no public statewide design-manual PDF */
const UNAVAILABLE: Array<{
  expectedId: string;
  stateCode: string;
  category: "dot" | "dep_deq";
  reason: string;
}> = [
  {
    expectedId: "az-adeq-stormwater",
    stateCode: "AZ",
    category: "dep_deq",
    reason:
      "ADEQ publishes AZPDES permits only; no statewide design/BMP manual (municipal manuals)",
  },
  {
    expectedId: "hi-doh-stormwater",
    stateCode: "HI",
    category: "dep_deq",
    reason:
      "Hawaii DOH is NPDES/permit-oriented; design coverage is HDOT + county manuals",
  },
  {
    expectedId: "ks-kdhe-stormwater",
    stateCode: "KS",
    category: "dep_deq",
    reason:
      "KDHE stormwater program is permits/SWPPP only; design uses KDOT SCM + regional MARC/APWA",
  },
  {
    expectedId: "ky-dow-stormwater",
    stateCode: "KY",
    category: "dep_deq",
    reason:
      "KY Division of Water posts KPDES/MS4 materials only; no statewide post-construction design manual",
  },
  {
    expectedId: "la-ldeq-stormwater",
    stateCode: "LA",
    category: "dep_deq",
    reason:
      "LDEQ stormwater resources are permit/SWPPP templates and parish/city BMP links only",
  },
  {
    expectedId: "nd-deq-stormwater",
    stateCode: "ND",
    category: "dep_deq",
    reason:
      "NDDEQ stormwater pages are NDPDES permits and short operational guidance only",
  },
  {
    expectedId: "ne-ndee-stormwater",
    stateCode: "NE",
    category: "dep_deq",
    reason:
      "NDEE/DWEE has no statewide design manual; design is municipal/regional + NDOT",
  },
  {
    expectedId: "nm-nmed-stormwater",
    stateCode: "NM",
    category: "dep_deq",
    reason:
      "NPDES in NM is EPA-administered; NMED has no statewide stormwater design manual",
  },
  {
    expectedId: "nv-ndep-stormwater",
    stateCode: "NV",
    category: "dep_deq",
    reason:
      "NDEP BMP Handbook is an online non-regulatory toolbox, not a design-manual PDF",
  },
  {
    expectedId: "ok-odeq-stormwater",
    stateCode: "OK",
    category: "dep_deq",
    reason:
      "ODEQ stormwater site is OKR10/MSGP/MS4 permits only; BMP catalogs are ODOT or municipal",
  },
  {
    expectedId: "sd-danr-stormwater",
    stateCode: "SD",
    category: "dep_deq",
    reason:
      "SD DANR stormwater hub is permits only; design manuals are SDDOT (DOT track)",
  },
  {
    expectedId: "ut-udeq-stormwater",
    stateCode: "UT",
    category: "dep_deq",
    reason:
      "UDEQ DWQ runs UPDES/MS4 permits; no UDEQ statewide design manual book",
  },
  {
    expectedId: "wy-deq-stormwater",
    stateCode: "WY",
    category: "dep_deq",
    reason:
      "WYDEQ stormwater is WYPDES permits/forms only; BMPs point to municipal manuals",
  },
  {
    expectedId: "co-cdot-drainage",
    stateCode: "CO",
    category: "dot",
    reason:
      "2019 CDOT Drainage Design Manual is contact/request-only while updated; no public current PDF",
  },
  {
    expectedId: "ar-ardot-drainage",
    stateCode: "AR",
    category: "dot",
    reason:
      "ARDOT lists a roadway drainage manual but no public download; hydrology deferred to AASHTO MDM + FHWA",
  },
  {
    expectedId: "ms-mdot-drainage",
    stateCode: "MS",
    category: "dot",
    reason:
      "Contracts cite an MDOT Roadway Design Drainage Manual, but no public statewide drainage PDF on the engineering portal",
  },
  {
    expectedId: "nv-ndot-drainage",
    stateCode: "NV",
    category: "dot",
    reason:
      "NDOT Drainage Manual is contact Hydraulics only; historical document URLs return 403 to automated fetch",
  },
];

/** Existing chapter proxies to accept as best available */
const ACCEPT_PARTIAL_IDS = [
  "va-vdot-drainage",
  "wa-wsdot-hr",
  "il-iepa-stormwater",
  "ok-odot-drainage",
  "ne-ndot-stf",
  "ky-kytc-bmp",
  "ca-caltrans-construction",
  "ar-adeq-stormwater",
  "fl-fdep-design",
  "ia-iswmm",
  "id-deq-catalog",
  "in-idem-manual",
  "ma-massdep-handbook",
  "mi-egle-bmp",
  "mo-dnr-gi",
  "ms-mdeq-vol2",
  "mt-deq8",
  "nc-deq-design",
  "nj-dep-bmp",
  "or-deq-stormwater",
  "tx-tceq-edwards",
  "va-deq-handbook",
  "vt-vsmm",
];

interface ExpectedManual {
  id: string;
  known_slugs: string[];
  partial?: boolean;
  accept_partial?: boolean;
  unavailable?: boolean;
  unavailable_reason?: string | null;
}

interface Agency {
  state_code: string;
  agency_category: string;
  expected_manuals: ExpectedManual[];
}

const manifest = JSON.parse(readFileSync(MANIFEST, "utf-8")) as Array<{
  id: string;
}>;
const existing = new Set(manifest.map((j) => j.id));
let added = 0;

for (const job of NEW_JOBS) {
  if (existing.has(job.id)) {
    console.log(`skip existing: ${job.id}`);
    continue;
  }
  const {
    registryExpectedId,
    stateCode,
    category,
    partial,
    acceptPartial,
    ...manifestJob
  } = job;
  void registryExpectedId;
  void stateCode;
  void category;
  void partial;
  void acceptPartial;
  manifest.push(manifestJob);
  existing.add(job.id);
  added += 1;
  console.log(`+ ${job.id}`);
}

writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf-8");

const registry = JSON.parse(readFileSync(REGISTRY, "utf-8")) as {
  agencies: Agency[];
};

function findExpected(
  stateCode: string,
  category: string,
  expectedId: string
): ExpectedManual | null {
  const agency = registry.agencies.find(
    (a) => a.state_code === stateCode && a.agency_category === category
  );
  if (!agency) return null;
  return agency.expected_manuals.find((e) => e.id === expectedId) ?? null;
}

for (const job of NEW_JOBS) {
  const expected = findExpected(
    job.stateCode,
    job.category,
    job.registryExpectedId
  );
  if (!expected) {
    console.warn(
      `registry miss: ${job.stateCode}/${job.category}/${job.registryExpectedId}`
    );
    continue;
  }
  if (!expected.known_slugs.includes(job.id)) {
    expected.known_slugs.push(job.id);
  }
  if (job.partial) expected.partial = true;
  else delete expected.partial;
  if (job.acceptPartial) expected.accept_partial = true;
}

for (const u of UNAVAILABLE) {
  const expected = findExpected(u.stateCode, u.category, u.expectedId);
  if (!expected) {
    console.warn(`unavailable miss: ${u.expectedId}`);
    continue;
  }
  expected.unavailable = true;
  expected.unavailable_reason = u.reason;
  console.log(`unavailable: ${u.expectedId}`);
}

for (const id of ACCEPT_PARTIAL_IDS) {
  for (const agency of registry.agencies) {
    const expected = agency.expected_manuals.find((e) => e.id === id);
    if (expected) {
      expected.accept_partial = true;
      if (expected.partial === undefined && expected.known_slugs.length > 0) {
        expected.partial = true;
      }
    }
  }
}

writeFileSync(REGISTRY, JSON.stringify(registry, null, 2) + "\n", "utf-8");

const aliases = JSON.parse(readFileSync(ALIASES, "utf-8")) as {
  slug_to_category: Record<string, string>;
};
for (const job of NEW_JOBS) {
  aliases.slug_to_category[job.id] = job.agencyHint;
}
writeFileSync(ALIASES, JSON.stringify(aliases, null, 2) + "\n", "utf-8");

console.log(`Added ${added} jobs. Manifest now ${manifest.length} entries.`);
