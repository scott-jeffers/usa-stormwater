/** Practice keys used by the design archive beyond the permanent-practice ontology. */
export type Practice = { label: string; aliases: string[] };

/** Construction-phase controls (Part B), not in the permanent-practice ontology. */
export const ESC_PRACTICES: Record<string, Practice> = {
  silt_fence: { label: "Silt fence", aliases: ["silt fence", "sediment fence", "filter fabric fence", "super silt fence"] },
  sediment_trap: { label: "Sediment trap", aliases: ["sediment trap", "sediment traps"] },
  sediment_basin: { label: "Sediment basin", aliases: ["sediment basin", "sediment basins", "sediment pond", "skimmer"] },
  construction_entrance: { label: "Construction entrance", aliases: ["construction entrance", "construction exit", "stabilized construction", "rock construction entrance", "tracking pad"] },
  inlet_protection: { label: "Inlet protection", aliases: ["inlet protection", "inlet filter", "drop inlet protection", "curb inlet protection"] },
  check_dam: { label: "Check dam", aliases: ["check dam", "check dams", "rock check dam"] },
  erosion_blanket: { label: "Erosion control blanket", aliases: ["erosion control blanket", "erosion control matting", "turf reinforcement mat", "rolled erosion control"] },
  outlet_structure: { label: "Outlet and spillway", aliases: ["riser", "outlet structure", "emergency spillway", "anti-seep collar", "trash rack", "orifice plate"] },
};
