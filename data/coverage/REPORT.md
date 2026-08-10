# Coverage gap report

Generated: 2026-08-10T10:45:05.063Z

## Summary

| Metric | Count |
|--------|------:|
| Targets checked | 309 |
| Covered (locality doc) | 309 |
| Gaps (all tiers) | 0 |
| P1 gaps | 0 |
| P2 gaps | 0 |
| P3 gaps | 0 |
| Queue gaps (no document) | 5 |

## Queue gaps

| ID | Jurisdiction | Status | Reason | Notes |
|----|--------------|--------|--------|-------|
| `mn-state` | Minnesota | skipped | skipped | superseded_by mn-state-2008 |
| `albuquerque-nm` | Albuquerque | skipped | skipped | superseded_by albuquerque-nm-gsi |
| `wisconsin-technical` | Wisconsin | skipped | skipped | superseded_by wi-dnr-1001 |
| `delaware-esc` | Delaware | skipped | skipped | superseded_by de-wet-ponds-draft (partial wet-ponds coverage) |
| `tempe-az` | Tempe | skipped | skipped | Wrong PDF (Historic Preservation memo); need real Tempe drainage/stormwater manual URL |

## P1 gaps (0)

_none_

## P2 gaps (0)

_none_

## P3 gaps (0)

_none_

---

Next step: pick a P1 gap, add a job to `data/queue/manifest.json` with PDF + landing page URLs, then `npm run prepare:queue -- <id>`.
