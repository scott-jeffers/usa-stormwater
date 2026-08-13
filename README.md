# Stormwater Atlas

**[stormwateratlas.com](https://stormwateratlas.com)** — a zero-cost, one-stop shop for U.S. stormwater design manual requirements. **Cursor agents** extract structured, evidence-cited data from PDF manuals (no Gemini / cloud API key). A statically-exported Next.js dashboard on **Netlify** lets you search, filter, and browse everything that's been ingested.

The project is intentionally split into two decoupled halves:

1. **Local prepare + Cursor extract** — download a PDF, extract plain text locally (`unpdf`), then have a Cursor agent write validated JSON into `data/documents/`.
2. **Static web dashboard** (`app/`) — reads every JSON file in `data/documents/` at build time and renders a searchable, filterable, map-based dashboard plus a detail page per manual (`output: 'export'` → Netlify).

## Setup

```bash
npm install
npm run export:data   # sync public/data/ after clone or data changes
npm run dev           # Next.js only — does not re-export on every start
```

When documents or national drafts change, either re-run `npm run export:data` or use `npm run dev:sync` (export + dev). Production builds still run `prebuild` → `export:data` automatically.

Open [http://localhost:3000](http://localhost:3000). No API keys required for the site.

## Secrets / API keys

- The published site is a **static export**. Builds on Netlify need **no** environment variables.
- Keep any local secrets in `.env.local` (gitignored). Never commit `.env` / `.env.local`.
- Do **not** add `GEMINI_API_KEY`, `CURSOR_API_KEY`, or any AI key in Netlify → Site settings → Environment variables.
- Never name a secret `NEXT_PUBLIC_*` — that prefix embeds the value in client JavaScript.
- For local Cursor SDK automation, run `npm run pipeline:cursor-login` once (paid Cursor account browser login). No Integrations API key required.

## Operational flow (Cursor agents)

1. Add a job to `data/queue/manifest.json` (PDF URL + landing page + optional city coords), or use an existing pending id.
2. Prepare local text (download + PDF extract, no AI):

   ```bash
   npm run prepare:queue -- portland-or
   # or prepare all pending:
   npm run prepare:queue
   ```

   Writes `samples/queue/<id>.pdf` and `samples/queue/<id>.txt` (gitignored).
3. Ask Cursor to extract: read `samples/queue/<id>.txt` (and `lib/schema.ts`), write `data/documents/<id>.json` with verbatim evidence excerpts. Only report values explicitly in the text; leave missing fields null and list them in `fields_not_found`.
4. Optional validate/save helper if the agent wrote a draft elsewhere:

   ```bash
   npm run save -- path/to/draft.json --slug=portland-or "--url=https://..." "--landing-page=https://..."
   ```
5. For cities, add coords to `lib/cityCoords.generated.ts` so map dots appear.
6. Commit and push `data/documents/` (and queue notes) when ready — Netlify redeploys from `main`.

## Overnight / batch download

```bash
npm run prepare:queue
# same as: npm run overnight
```

This only downloads PDFs and extracts text. Structured extraction is always done by Cursor agents (resume-safe via `data/queue/progress.json`).

## Automated pipeline (set and forget)

After manuals are in the queue (and ideally many atlas JSON files exist), run the resume-safe automation pipeline. It tracks every stage in `data/pipeline/progress.json` and regenerates `data/pipeline/STATUS.md`.

```bash
# one-time: npm run pipeline:cursor-login  (paid Cursor account, browser sign-in)
npm run pipeline:status          # bootstrap + show where you are
npm run pipeline:run             # prepare → corpus → extract → verify → outline → draft
npm run pipeline:corpus -- portland-or   # one manual, corpus only (preferred on Windows)
npx tsx scripts/pipeline/run.ts --stage=corpus --dry-run portland-or
npx tsx scripts/pipeline/run.ts --force portland-or
```

### Practice parameters (overnight enrich)

Leave-running Cursor enrich → bioretention + permeable pavement matrices → export:

```powershell
npm run pipeline:cursor-login   # once
npm run overnight:enrich
# offline fallback: npx tsx scripts/pipeline/overnight-enrich.ts --heuristic
```

Fills missing / stale (schema v1) / heuristic `design_parameters`, rebuilds bioretention + permeable pavement, writes `data/pipeline/OVERNIGHT.md`. Resume-safe. Morning: `/national/practices/bioretention/`, `/national/practices/permeable_pavement/`.

### Full overnight go (the sleep command)

One leave-running command over the **existing** queue only (never auto-adds manuals). Uses **Cursor** (`composer-2.5` by default) for enrich + practice synthesis — same account/usage pool as the IDE, not a separate API product.

```powershell
npm run pipeline:cursor-login   # once, browser; skip if already logged in
npm run overnight:go            # then sleep
# offline fallback: npx tsx scripts/pipeline/overnight-go.ts --heuristic
```

Runs prepare → pipeline → repair-excerpts → force-verify → schema-v2 enrich → matrix/synthesize for every canonical practice → export. Status: `data/pipeline/GO.md`. Resume-safe — re-run the same command after a crash.

Hard-fail: missing Cursor login, enrich failures, export failure, practice matrix/synth failure. Pipeline/verify leftover failures (exit 2) are **warnings**, not overnight hard-fails. Dead PDF URLs (HTTP 404/410) are skipped, not retried. Existing `data/documents/` extracts are **not** `--force` overwritten.

Morning checks: `data/pipeline/GO.md` should show Cursor `enrich_model` (not `heuristic`); practice matrices should differ by practice-specific fields (ponding, pool depth, swale slope, etc.), not just the same WQv/drawdown/SHWT stats.

On Windows PowerShell, prefer the stage shortcuts (`pipeline:corpus`, etc.) or `npx tsx ... --stage=corpus` — bare `--flags` after `npm run` are often stripped.
Stage shortcuts: `pipeline:corpus`, `pipeline:extract`, `pipeline:verify`, `pipeline:outline`, `pipeline:draft`.

| Stage | What it does |
|-------|----------------|
| prepare | Download PDF to `samples/queue/` |
| corpus | Per-page text + AI structure/chunks/tags → `data/corpus/{slug}/` (gitignored) |
| extract | Atlas JSON from chunks → `data/documents/` |
| verify | Fuzzy-match evidence excerpts against corpus |
| outline | National outline → `data/national/outline.json` |
| draft | Section drafts → `data/national/draft/{section_id}.json` |

Crash mid-run? Re-run the same command — completed substeps are skipped. Existing `data/documents/` records are bootstrapped as `extract: done` so curated atlas data is not overwritten unless you pass `--force`.

By default the corpus stage runs **offline heuristics** (`PIPELINE_LLM=heuristic`). `npm run overnight:go` forces Cursor unless you pass `--heuristic`. For a one-off richer corpus/tagging pass, set `PIPELINE_LLM=cursor` after `pipeline:cursor-login`. Model default: `composer-2.5` (`PIPELINE_MODEL`). Delay between AI calls: `PIPELINE_DELAY_MS` (default 2000).

## Finding missing manuals (coverage gaps)

The ingest queue is hand-curated. To find jurisdictions that should have a stormwater manual but are not in the atlas yet (e.g. San Francisco):

```bash
npm run coverage:report
# optional: only priority gaps
npm run coverage:report -- --tier p1
```

Writes `data/coverage/REPORT.md` and `data/coverage/gaps.json`. Targets are top-100 cities, state capitals, and MS4 permittees under `data/coverage/`. Refresh those lists occasionally with:

```bash
npm run coverage:fetch-targets
# optional: merge a local EPA/NMSA CSV export
npm run coverage:fetch-targets -- --epa-csv=path/to/export.csv
```

Pick a P1 gap, add a manifest job with PDF + landing page URLs, then run `prepare:queue`.

## Agency manuals (DOT + DEP/DEQ)

Coverage above is **jurisdiction-centric** (cities/capitals). To find missing **statewide agency** manuals (DOT drainage manuals, DEP/DEQ design handbooks):

```bash
npm run agency:report
npm run agency:report -- --category dot
npm run agency:report -- --state VA

npm run agency:discover -- --state TX --category dot
npm run agency:discover -- --limit 10 --dry-run
```

Writes `data/agency-targets/REPORT.md`, `gaps.json`, and (for discover) `candidates.json`. Review candidates, then add approved URLs to `data/queue/manifest.json` with optional `agencyHint` (`dot` | `dep_deq`) and `scopeHint`. Do **not** auto-ingest.

Cursor agents: use the project skill `.cursor/skills/agency-manual-discovery/SKILL.md` for the state-by-state research loop.

Backfill agency tags on existing documents:

```bash
npm run agency:backfill -- --dry-run
npm run agency:backfill
```

DOT manuals show an amber highway badge in the dashboard; filter with **Agency → DOT**.

## One-time Netlify setup (custom domain)

`netlify.toml` is already in the repo, so connecting GitHub is enough for builds.

1. In [Netlify](https://app.netlify.com): **Add new site → Import an existing project → GitHub** → select this repo.
2. Confirm build settings (auto-detected from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `out`
   - **Node version:** 22
3. Deploy. You get a `*.netlify.app` URL immediately.
4. **Domain management → Add custom domain** → `stormwateratlas.com` (and optionally `www`).
5. At your domain registrar, use the DNS records Netlify shows (typically Netlify DNS nameservers, or an apex `A`/`ALIAS` + `www` `CNAME` to your Netlify site).
6. Enable **HTTPS** (Netlify provisions the certificate automatically once DNS is verified).
7. Push to `main` — each push rebuilds and publishes `https://stormwateratlas.com/`.

Do not paste API keys into Netlify env settings for this project.

## Dashboard features

- **Search** by jurisdiction name or document title.
- **Filters** by jurisdiction level, agency (DOT / DEP·DEQ), state, confidence, and "needs review only".
- **Coverage map** — clickable US map; city dots for municipalities with coords.
- **Group by state** — flat table or state-grouped sections.
- **Detail pages** — each field with verbatim evidence, source PDF / agency links, related manuals in-state.

## Project structure

```
app/                    Next.js App Router (dashboard + detail)
components/             Table, map, badges, evidence panel
lib/schema.ts           Zod schema — agent output + UI
lib/pipeline/           Pipeline types + resume progress store
scripts/prepare.ts      Download + local PDF text extract
scripts/pipeline/       Automated corpus → extract → outline → draft
scripts/save.ts         Validate JSON → data/documents/
data/documents/         Committed JSON "database"
data/queue/             Manifest, progress, NOTES for the scrub
data/pipeline/          Automation progress.json + STATUS.md
data/corpus/            Per-manual pages/chunks (gitignored)
data/national/          Outline + draft sections
data/coverage/          Target jurisdictions + gap reports
samples/                Local PDFs/text (gitignored)
netlify.toml            Netlify build + publish config
```

## License

Software is [MIT](LICENSE). Original structured data is [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Verbatim excerpts and source manuals remain copyright of the issuing agencies. See [NOTICE](NOTICE) for the split, attribution, and the reminder that this atlas is a research aid — not official regulatory text.
