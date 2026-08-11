---
name: agency-manual-discovery
description: >-
  Find and queue missing statewide DOT and DEP/DEQ/DNR stormwater manuals.
  Use when the user asks to discover agency manuals, fill DOT/DEP gaps, run
  agency:report / agency:discover, or research state transportation or
  environmental design manuals for the Stormwater Atlas queue.
---

# Agency Manual Discovery

Systematic workflow to close statewide **DOT** and **DEP/DEQ/DNR** manual gaps.
Candidates are never auto-added to the queue — always review before editing
`data/queue/manifest.json`.

## Commands

```bash
npm run agency:report
npm run agency:report -- --category dot
npm run agency:report -- --category dep_deq
npm run agency:report -- --state VA

npm run agency:discover -- --state TX --category dot
npm run agency:discover -- --limit 10
npm run agency:discover -- --dry-run
```

Outputs:

- `data/agency-targets/REPORT.md` — human summary
- `data/agency-targets/gaps.json` — machine-readable gaps
- `data/agency-targets/candidates.json` — discovered PDF/URL candidates

Registry source of truth: `data/agency-targets/registry.json`  
Aliases: `data/agency-targets/aliases.json`

## Agent workflow (per batch)

1. **Report** — `npm run agency:report -- --category dot` (or `dep_deq`). Read `gaps.json`.
2. **Pick gaps** — Prefer `reason: missing`, then `partial` (chapter proxies). Cap at 3–5 states per session.
3. **Discover** — `npm run agency:discover -- --state XX --category dot` (or without `--state` for a small batch with `--limit`).
4. **Triage candidates** in `candidates.json`:
   - Prefer `confidence: high` and `fetch_ok: true`
   - Confirm title/edition matches the expected manual (not a random ESC brochure)
   - Prefer **full manuals** over single chapters when available
   - Note bot-blocks (403), TLS failures, Word/ZIP-only packages
5. **Add manifest job** to `data/queue/manifest.json`:

```json
{
  "id": "va-vdot-drainage",
  "jurisdictionHint": "Virginia",
  "levelHint": "state",
  "agencyHint": "dot",
  "scopeHint": "drainage",
  "pdfUrl": "https://...",
  "landingPageUrl": "https://...",
  "cityCoords": null,
  "notes": "VDOT Drainage Manual — full or chapter note"
}
```

Slug convention: `{state}-{agency}-...` e.g. `va-vdot-drainage`, `la-ldeq-stormwater`, `tx-txdot-hydraulic`.

6. **Prepare** — `npm run prepare:queue -- <id>`
7. **Extract** — Cursor agent writes `data/documents/<id>.json` with `issuing_agency_category` set (`dot` or `dep_deq`).
8. **Confirm** — Re-run `npm run agency:report -- --state XX` and verify the gap closed or moved to `partial`/`covered`.

## Per-state research checklist

For each state, look for:

| Track | What to find |
|-------|----------------|
| DEP/DEQ/DNR | Stormwater design / BMP / post-construction manual (full preferred) |
| DOT | Drainage manual, Highway Runoff Manual, or stormwater design guide |
| Construction | ESC / construction BMP field guides (secondary; mark `scopeHint: construction_esc`) |
| MS4 | Statewide MS4 post-construction guidance if no design manual exists |

Landing pages often live under:

- `*.gov` stormwater / water quality / MS4 program pages
- DOT manuals & publications / hydraulics / environmental compliance
- Regional proxies only when statewide docs truly do not exist (document in `notes`)

## Known failure modes

From `data/queue/NOTES.md` and registry notes:

- **NJDEP / some DEP hosts** — HTTP 403 to bots; use municipal mirrors or rebuild PDF from prepared text
- **OR DEQ** — Western OR LID template removed; CWS LIDA is a regional proxy
- **MN PCA** — live wiki; no good single current PDF (`mn-state` skipped)
- **Chapter portals** — NCDEQ, ISWMM, IDEM, ODOT Ch10 — ingest best available chapter but keep `partial` until full set exists
- **TLS / broken hosts** — VA handbook mirrors; prefer local `samples/queue` rebuild when needed
- **Wrong document type** — SWMP annual reports, permit text, training decks — reject these

## Partial vs covered

- Registry `partial: true` on `known_slugs` means chapter proxies already exist — still a gap until a fuller PDF is queued **unless** `accept_partial: true` (best available public PDF).
- Registry `unavailable: true` + `unavailable_reason` closes a target when no public statewide design-manual PDF exists (permit-only, contact-only, web EPG-only, bot-blocked with no mirror). These are **not** actionable gaps.
- Do **not** mark national Tier A defaults from chapter proxies alone.

## Closing the scan (zero actionable gaps)

1. Ingest every verified PDF (full preferred; chapter + `accept_partial` when that is the published form).
2. Mark remaining targets `unavailable` with a concrete reason in `registry.json`.
3. Re-run `npm run agency:report` until **Gaps (actionable) = 0**.

## UI note

DOT manuals show an amber **DOT** highway badge when `issuing_agency_category` is `dot` (or inferred from slug/name). Keep `jurisdiction_level: "state"`.
