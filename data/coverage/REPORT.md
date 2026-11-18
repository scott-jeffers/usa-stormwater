# Coverage gap report

Generated: 2026-11-18T12:09:40.230Z

## Summary

| Metric | Count |
|--------|------:|
| Targets checked | 309 |
| Covered — own manual | 189 |
| Covered — uses state/regional manual | 91 |
| **Covered (total)** | **280** |
| Stand-in only (counted as gap) | 28 |
| Gaps (all tiers) | 29 |
| P1 gaps | 21 |
| P2 gaps | 8 |
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

## P1 gaps (21)

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
| McAllen | TX | ms4_phase1 | `mcallen-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): mcallen-tx |
| Waco | TX | ms4_phase1 | `waco-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): waco-tx |
| Pearland | TX | ms4_phase1 | `pearland-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): pearland-tx |
| Lafayette | LA | ms4_phase1 | `lafayette-la` | stand_in_only | Only a stand-in (another jurisdiction's manual): lafayette-la |
| College Station | TX | ms4_phase1 | `college-station-tx` | stand_in_only | Only a stand-in (another jurisdiction's manual): college-station-tx |
| Palm Bay | FL | ms4_phase1 | `palm-bay-fl` | stand_in_only | Only a stand-in (another jurisdiction's manual): palm-bay-fl |
| Springfield | IL | capital, ms4_phase1 | `springfield-il` | stand_in_only | Only a stand-in (another jurisdiction's manual): springfield-il |
| Las Cruces | NM | ms4_phase1 | `las-cruces-nm` | stand_in_only | Only a stand-in (another jurisdiction's manual): las-cruces-nm |
| Bend | OR | ms4_phase1 | `bend-or` | stand_in_only | Only a stand-in (another jurisdiction's manual): bend-or |
| Santa Fe | NM | capital, ms4_phase2 | `santa-fe-nm` | stand_in_only | Only a stand-in (another jurisdiction's manual): santa-fe-nm |
| Cheyenne | WY | capital, ms4_phase2 | `cheyenne-wy` | stand_in_only | Only a stand-in (another jurisdiction's manual): cheyenne-wy |
| Frankfort | KY | capital, ms4_phase2 | `frankfort-ky` | stand_in_only | Only a stand-in (another jurisdiction's manual): frankfort-ky |
| Pierre | SD | capital, ms4_phase2 | `pierre-sd` | stand_in_only | Only a stand-in (another jurisdiction's manual): pierre-sd |

## P2 gaps (8)

| Jurisdiction | State | Sources | Suggested slug | Reason | Notes |
|--------------|-------|---------|----------------|--------|-------|
| Deltona | FL | ms4_phase2 | `deltona-fl` | stand_in_only | Only a stand-in (another jurisdiction's manual): deltona-fl |
| Palm Coast | FL | ms4_phase2 | `palm-coast-fl` | stand_in_only | Only a stand-in (another jurisdiction's manual): palm-coast-fl |
| Melbourne | FL | ms4_phase2 | `melbourne-fl` | stand_in_only | Only a stand-in (another jurisdiction's manual): melbourne-fl |
| Franklin | TN | ms4_phase2 | `franklin-tn` | stand_in_only | Only a stand-in (another jurisdiction's manual): franklin-tn |
| Flint | MI | ms4_phase2 | `flint-mi` | stand_in_only | Only a stand-in (another jurisdiction's manual): flint-mi |
| Daytona Beach | FL | ms4_phase2 | `daytona-beach-fl` | stand_in_only | Only a stand-in (another jurisdiction's manual): daytona-beach-fl |
| Greenville | SC | ms4_phase2 | `greenville-sc` | stand_in_only | Only a stand-in (another jurisdiction's manual): greenville-sc |
| Casper | WY | ms4_phase2 | `casper-wy` | stand_in_only | Only a stand-in (another jurisdiction's manual): casper-wy |

## P3 gaps (0)

_none_

---

Next step: pick a P1 gap, add a job to `data/queue/manifest.json` with PDF + landing page URLs, then `npm run prepare:queue -- <id>`.
