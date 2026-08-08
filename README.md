# USA Stormwater Manual Extractor

A zero-cost, one-stop shop for U.S. stormwater design manual requirements. A local CLI uses Google's free Gemini API to extract structured, evidence-cited data from PDF manuals; a statically-exported Next.js dashboard (hosted free on GitHub Pages) lets you search, filter, and browse everything that's been ingested.

The project is intentionally split into two decoupled halves:

1. **Local ingestion CLI** (`scripts/ingest.ts`) — runs only on your machine, reads a PDF, calls Gemini, validates the result, and writes a JSON file into `data/documents/`. This never runs in a browser or on a server, so there's no timeout risk from processing a large document.
2. **Static web dashboard** (`app/`) — reads every JSON file in `data/documents/` at build time and renders a searchable, filterable, map-based dashboard plus a detail page per manual. It's exported as plain HTML/CSS/JS via `output: 'export'` and can be hosted for free on GitHub Pages.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Get a free Gemini API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

3. Copy `.env.example` to `.env.local` and paste in your key:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   GEMINI_API_KEY=your_free_google_ai_studio_key
   ```

## Operational flow

1. Download a state/county/municipal stormwater manual PDF to your computer.
2. Run the ingestion CLI, pointing it at the PDF:

   ```bash
   npm run ingest -- path/to/manual.pdf "--url=https://agency.gov/manual.pdf" "--landing-page=https://agency.gov/stormwater-manual"
   ```

   On Windows PowerShell, prefer the `--url=...` form (quoted) so flags are not stripped. `--url` / `--landing-page` are optional but recommended — they are stored on the record so the dashboard can link back to the official document.

   This extracts the PDF's text, sends it to Gemini (`gemini-3.5-flash`) with a strict JSON schema, validates the response with Zod (retrying once on validation failure), and writes `data/documents/<slug>.json`. Expect this to take 1-2 minutes for a large manual — it's a single long-lived local Node process, not a web request, so there's no timeout to worry about.
3. Review the new entry locally:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) and check the dashboard — search for the jurisdiction, open its detail page, and confirm each extracted field's evidence excerpt actually supports the value. If `needs_human_review` is true or `fields_not_found` is non-empty, double check those before trusting the entry.
4. Once satisfied, commit and push:

   ```bash
   git add data/documents
   git commit -m "Add <jurisdiction> manual"
   git push
   ```

   Pushing to `main` triggers `.github/workflows/deploy.yml`, which rebuilds the static site and redeploys it to GitHub Pages automatically.

## One-time GitHub Pages setup

GitHub Pages needs to be told to deploy from GitHub Actions (this is a one-time repo setting, not something the workflow can do for you):

1. On GitHub, go to the repo's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Push to `main` (or re-run the workflow manually from the **Actions** tab) — the site will publish at `https://<your-username>.github.io/usa-stormwater/`.

## Dashboard features

- **Search** by jurisdiction name or document title.
- **Filters** by jurisdiction level, state, confidence, and a "needs review only" toggle.
- **Coverage map** — a clickable US map showing which states have been ingested; clicking a state is the same as picking it from the state filter.
- **Group by state** — toggle the table between a flat sortable list and state-grouped sections.
- **Detail pages** — every extracted field shown side-by-side with the verbatim excerpt and page/section it came from, plus links to the source PDF / agency page and to other ingested manuals in the same state.

## Project structure

```
app/                    Next.js App Router pages (dashboard + detail view)
components/             Shared React components (table, map, badges, evidence panel)
lib/schema.ts           Zod schema — single source of truth for AI output + UI
lib/data.ts             Reads/validates data/documents/*.json at build time
lib/evidence.ts         Matches evidence entries back to schema fields
lib/usStates.ts         US state / FIPS lookup tables for the coverage map
scripts/ingest.ts       CLI-only ingestion script (never run in a browser)
data/documents/         Committed JSON output — the "database"
.github/workflows/      GitHub Actions static-site deploy to Pages
```

## Notes on model/SDK choices

The Gemini API and its SDKs move fast. This project uses:

- **`@google/genai`** — the current unified Google GenAI SDK (the older `@google/generative-ai` package is deprecated).
- **`gemini-3.5-flash`** — the current GA flash model with a large free tier and long context window. If this model is retired in the future, update `MODEL` in `scripts/ingest.ts`.
- **Zod's native `z.toJSONSchema()`** (Zod 4+) to convert `stormwaterSchema` into the OpenAPI-3-flavored schema Gemini's `responseSchema` expects, instead of the now-unmaintained `zod-to-json-schema` package.
