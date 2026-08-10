# Pipeline status

Updated: 2026-08-10T08:01:16.676Z

Resume with: `npm run pipeline:run` or `npm run pipeline:status`

## Per-manual stages

| Stage | done | running | pending | failed | skipped |
|-------|-----:|--------:|--------:|-------:|--------:|
| prepare | 111 | 0 | 0 | 0 | 5 |
| corpus | 0 | 0 | 110 | 1 | 5 |
| extract | 102 | 0 | 9 | 0 | 5 |
| verify | 1 | 0 | 110 | 0 | 5 |

## Global stages

| Stage | Status |
|-------|--------|
| outline | pending |
| draft | pending (0/0 sections done) |

## Currently running

_none_

## Failed (retry with `npm run pipeline:run -- <id> --force`)

- `portland-or` — corpus: CURSOR_API_KEY is not set. Add it to .env.local (see .env.example).

## Corpus substeps in progress

_none_

## Log

Append-only: `data/pipeline/run-log.jsonl`
Progress state: `data/pipeline/progress.json`
