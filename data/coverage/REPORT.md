# Coverage gap report

Generated: 2026-11-18T13:59:10.696Z

## Summary

| Metric | Count |
|--------|------:|
| Targets checked | 309 |
| Covered — own manual | 191 |
| Covered — uses state/regional manual | 96 |
| **Covered (total)** | **287** |
| Stand-in only (counted as gap) | 21 |
| Gaps (all tiers) | 22 |
| P1 gaps | 18 |
| P2 gaps | 4 |
| P3 gaps | 0 |
| Queue gaps (no document) | 6 |

## Queue gaps

| ID | Jurisdiction | Status | Reason | Notes |
|----|--------------|--------|--------|-------|
| `mn-state` | Minnesota | skipped | skipped | superseded_by mn-state-2008 |
| `albuquerque-nm` | Albuquerque | skipped | skipped | superseded_by albuquerque-nm-gsi |
| `wisconsin-technical` | Wisconsin | skipped | skipped | superseded_by wi-dnr-1001 |
| `delaware-esc` | Delaware | skipped | skipped | superseded_by de-wet-ponds-draft (partial wet-ponds coverage) |
| `tempe-az` | Tempe | skipped | skipped | EXCLUDED: no Tempe drainage design manual; PDF was Historic Preservation memo. Use Maricopa/Mesa/Chandler for AZ local practice. |
| `vt-vtrans-drainage` | Vermont | skipped | skipped | HTTP 403 Forbidden |

## P1 gaps (18)

| Jurisdiction | State | Sources | Suggested slug | Reason | Notes |
|--------------|-------|---------|----------------|--------|-------|
| Hillsborough County | FL | ms4_phase1 | `hillsborough-county-fl` | not_in_manifest | Not in manifest |
| Colorado Springs | CO | top50, ms4_phase1 | `colorado-springs-co` | stand_in_only | Only a stand-in (another jurisdiction's manual): colorado-springs-co |
| Chula Vista | CA | top100, ms4_phase1 | `chula-vista-ca` | stand_in_only | Only a stand-in (another jurisdiction's manual): chula-vista-ca |
| Laredo | TX | top100, ms4_phase1 | `laredo-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): laredo-tx |
| Sioux Falls | SD | ms4_phase1 | `sioux-falls-sd` | stand_in_only | Only a stand-in (another jurisdiction's manual): sioux-falls-sd |
| Brownsville | TX | ms4_phase1 | `brownsville-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): brownsville-tx |
| Fort Collins | CO | ms4_phase1 | `fort-collins-co` | stand_in_only | Only a stand-in (another jurisdiction's manual): fort-collins-co |
| Pasadena | TX | ms4_phase1 | `pasadena-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): pasadena-tx |
| Waco | TX | ms4_phase1 | `waco-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): waco-tx |
| Pearland | TX | ms4_phase1 | `pearland-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): pearland-tx |
| Lafayette | LA | ms4_phase1 | `lafayette-la` | stand_in_only | Only a stand-in (another jurisdiction's manual): lafayette-la |
| College Station | TX | ms4_phase1 | `college-station-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): college-station-tx |
| Springfield | IL | capital, ms4_phase1 | `springfield-il` | stand_in_only | Only a stand-in (another jurisdiction's manual): springfield-il |
| Las Cruces | NM | ms4_phase1 | `las-cruces-nm` | stand_in_only | Only a stand-in (another jurisdiction's manual): las-cruces-nm |
| Bend | OR | ms4_phase1 | `bend-or` | stand_in_only | Only a stand-in (another jurisdiction's manual): bend-or |
| Santa Fe | NM | capital, ms4_phase2 | `santa-fe-nm` | stand_in_only | Only a stand-in (another jurisdiction's manual): santa-fe-nm |
| Cheyenne | WY | capital, ms4_phase2 | `cheyenne-wy` | stand_in_only | Only a stand-in (another jurisdiction's manual): cheyenne-wy |
| Pierre | SD | capital, ms4_phase2 | `pierre-sd` | stand_in_only | Only a stand-in (another jurisdiction's manual): pierre-sd |

## P2 gaps (4)

| Jurisdiction | State | Sources | Suggested slug | Reason | Notes |
|--------------|-------|---------|----------------|--------|-------|
| Franklin | TN | ms4_phase2 | `franklin-tn` | stand_in_only | Only a stand-in (another jurisdiction's manual): franklin-tn |
| Flint | MI | ms4_phase2 | `flint-mi` | stand_in_only | Only a stand-in (another jurisdiction's manual): flint-mi |
| Greenville | SC | ms4_phase2 | `greenville-sc` | stand_in_only | Only a stand-in (another jurisdiction's manual): greenville-sc |
| Casper | WY | ms4_phase2 | `casper-wy` | stand_in_only | Only a stand-in (another jurisdiction's manual): casper-wy |

## P3 gaps (0)

_none_

---

Next step: pick a P1 gap, add a job to `data/queue/manifest.json` with PDF + landing page URLs, then `npm run prepare:queue -- <id>`.
