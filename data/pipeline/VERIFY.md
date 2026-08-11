# Verify report

Updated: 2026-08-11T01:54:07.257Z

Resume with: `npm run pipeline:verify-report` or force-verify selected IDs.

## Summary

| Status | Count |
|--------|------:|
| passed (done) | 298 |
| failed | 0 |
| skipped | 6 |
| pending | 0 |
| running | 0 |

Design-criteria mismatches (any of the five design fields): **0** failed slugs.

## Field histogram

| Field | Failures |
|-------|--------:|
_none_

## Failed slugs (worst first)

| Id | Mismatches | Design | Failed fields | Document | Corpus |
|----|----------:|-------:|---------------|----------|--------|
_none_

## Triage notes

- Prefer fixing `design_criteria.*` excerpts before `document_metadata.*` (national strawman depends on design fields).
- `va-state` and chapter-only corpora may lack metadata date text — mark review-only rather than inventing excerpts.
- After repairs: `$env:PIPELINE_STAGE='verify'; $env:PIPELINE_FORCE='1'; npx tsx scripts/pipeline/run.ts <ids...>`
