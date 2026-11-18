# Design archive

Three indexes of design material from U.S. stormwater agencies, built for the
atlas and published at <https://www.stormwateratlas.com/archive/>.

| File | What it is | How it is built |
|---|---|---|
| `libraries.json` | Agency libraries of standard drawings (CAD and PDF), by practice | Curated by hand from web searches, 2026-11-18 |
| `drawings.json` | Drawings printed inside atlas manuals: typical sections, plans, profiles, details | `npm run archive:build`, from each manual's page text |
| `examples.json` | Worked design examples, sample plans and plan-review checklists inside atlas manuals | `npm run archive:build` |
| `sample-plans-external.json` | Sample plan sets agencies publish separately | Curated by hand |

**Ownership.** The drawings and examples belong to the agencies that publish
them. The atlas links to the agency's file or to the page of the source PDF
(`<document_url>#page=N`) and hosts no copies. The indexes themselves are CC BY 4.0
like the rest of the atlas data.

**How drawings are found.** A page counts as a drawing when its text has a
"not to scale" mark with a drawing label (typical section, plan view, profile,
detail...), two or more drawing labels with dimensions or mostly capital
lettering, or a figure caption that names a drawing ("Figure 3.12 Typical
section of ...") on a page with little prose. Practices come from the alias
list in `data/ontology/bmp-aliases.json` plus the construction controls in
`scripts/archive/practices.ts`. Drawings that are pure images, with no text,
are missed.

**How examples are found.** A worked example is a page with an example heading
("Design Example", "Example Problem", "Sizing Example", "Example 4.2" ...) and
calculations (three or more "=" or two "Step" markers); following calculation
pages are merged into one entry. Sample plans and checklists need the phrase in
the page heading. Examples with no practice get a topic (culverts, open
channels, storm drains and inlets, detention and routing, water quality volume,
hydrology, erosion and sediment control).

## Spot checks (2026-11-18)

| Sample | Right | Partly right | Wrong |
|---|---:|---:|---:|
| 30 random drawings | 25 | 4 (practice tag off, or a diagram rather than a detail) | 1 (a table of roughness coefficients) |
| 30 random examples | 26 | 3 | 1 (a sanitary-sewer checklist) |
