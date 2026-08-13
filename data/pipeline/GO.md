# Overnight go

- Finished: 2026-08-13T10:44:48.856Z
- LLM: cursor (model=composer-2.5)
- Prepare exit: 0
- Pipeline exit: 2 (warning, not hard-fail)
- Repair-excerpts exit: 0
- Verify exit: 0
- Enrich: done=349 failed=1 skipped=0 noop=0
- Export exit: 0

## Practices (11)
- **bioretention**: matrix exit 0, synthesize exit 0 → `/national/practices/bioretention/`
- **constructed_wetland**: matrix exit 0, synthesize exit 0 → `/national/practices/constructed_wetland/`
- **extended_detention**: matrix exit 0, synthesize exit 0 → `/national/practices/extended_detention/`
- **green_roof**: matrix exit 0, synthesize exit 0 → `/national/practices/green_roof/`
- **infiltration_basin**: matrix exit 0, synthesize exit 0 → `/national/practices/infiltration_basin/`
- **infiltration_trench**: matrix exit 0, synthesize exit 0 → `/national/practices/infiltration_trench/`
- **manufactured_treatment**: matrix exit 0, synthesize exit 0 → `/national/practices/manufactured_treatment/`
- **permeable_pavement**: matrix exit 0, synthesize exit 0 → `/national/practices/permeable_pavement/`
- **sand_filter**: matrix exit 0, synthesize exit 0 → `/national/practices/sand_filter/`
- **swale**: matrix exit 0, synthesize exit 0 → `/national/practices/swale/`
- **wet_pond**: matrix exit 0, synthesize exit 0 → `/national/practices/wet_pond/`

## Logs
- `C:\Users\smj46\Code\USA-Stormwater\data\pipeline\overnight-go.log`
- `data/pipeline/enrich-parameters-progress.json`
- `data/pipeline/progress.json`
- `data/queue/progress.json`

## Notes
- Does **not** auto-add manuals to the queue.
- Does **not** `--force` overwrite existing `data/documents/` extracts.
- Cursor enrich uses schema v2 (practice-specific numeric fields). Resume skips v2 Cursor-done slugs.
- HTTP 404/410 corpus URLs are skipped, not retried.
- Pipeline/verify exit 2 (leftover stage failures) is a warning, not an overnight hard-fail.
- Re-run `npm run overnight:go` — completed work is skipped where safe.
