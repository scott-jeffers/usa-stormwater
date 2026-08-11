# Practice synthesis data

Evidence and draft assets for the U.S. Stormwater Practice Synthesis reader at `/national/`.

## Evidence policy (Tier A)

Section citations prefer **Tier A** manuals in [`tier-a-slugs.json`](tier-a-slugs.json) (~60–80 anchors), not the full ~298-manual atlas.

| Rationale | Role |
|-----------|------|
| `state_manual` | State / statewide handbooks — primary for national defaults |
| `p1_metro` | Large metro / county exemplars — geographic diversity |
| `regional_anchor` | Clean-extraction fillers for under-covered states |

**Chapter proxies** (`chapter_proxy: true`, e.g. `va-state`, `nj-state`, `ia-state-ch1`): partial PDFs. Include for coverage; do **not** use alone as a national numeric default.

**Excluded:** `tempe-az` — no drainage design manual; SWMP/MS4 reports only.

Rebuild proposal:

```powershell
npx tsx scripts/national/build-tier-a.ts --write
```

## Files

| Path | Purpose |
|------|---------|
| `outline.json` | 18-section committee outline |
| `draft/*.json` | Per-section practice survey + recommendation + citations |
| `tier-a-slugs.json` | Frozen Tier A evidence list |

## Pipeline

```powershell
$env:PIPELINE_LLM='heuristic'
npm run pipeline:outline
npm run pipeline:draft
npm run national:guidance-tables
npm run national:curate-citations
npm run national:refresh-core
npm run pipeline:verify-report
npm run export:data
```

Guidance tables and citation curation target the core chapters (intro, hydrology, water quality, BMPs).

After pipeline/draft changes, run `npm run export:data` (or `npm run dev:sync`) so `public/data/` stays current. Plain `npm run dev` no longer re-exports on every start.

**Performance note:** Atlas and verify lookups are cached in-process for fast national section rendering. Citation enrichment at export time (embedding jurisdiction name / state / verify status into draft JSON) is a future option so static pages need zero atlas reads at build.
