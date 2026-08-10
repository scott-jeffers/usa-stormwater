# Overnight queue notes

Updated: 2026-08-10T06:10:45.857Z

Extraction is done by **Cursor agents** (not Gemini). After `npm run prepare:queue`, ask Cursor to read `samples/queue/<id>.txt` and write `data/documents/<id>.json` matching `lib/schema.ts`, then `npm run save -- samples/queue/<id>.extraction.json --slug=<id>` (or have the agent write the document JSON directly).

## Tally

| Status | Count |
|--------|------:|
| done | 81 |
| prepared (awaiting agent) | 0 |
| pending | 0 |
| skipped | 10 |
| deferred | 0 |

## Ready for Cursor extract

_none_

## Worked

- `md-state` → `md-state`
- `pa-state` → `pa-state`
- `philadelphia-pa` → `philadelphia-pa`
- `ga-state` → `ga-state`
- `ct-state` → `ct-state`
- `ny-state` → `ny-state`
- `ny-bluebook` → `ny-bluebook`
- `tn-state` → `tn-state`
- `ri-state` → `ri-state`
- `vt-state` → `vt-state`
- `nh-state` → `nh-state`
- `wa-state-western` → `wa-state-western`
- `fl-fsesci-tier1` → `fl-fsesci-tier1`
- `ma-state-draft` → `ma-state-draft`
- `ia-state-ch1` → `ia-state-ch1`
- `nyc-ny` → `nyc-ny`
- `seattle-wa` → `seattle-wa`
- `seattle-wa-2026` → `seattle-wa-2026`
- `chicago-il` → `chicago-il`
- `austin-tx-ecm` → `austin-tx-ecm`
- `portland-or` → `portland-or`
- `denver-co` → `denver-co`
- `va-state` → `va-state`
- `nc-state` → `nc-state`
- `nj-state` → `nj-state`
- `ca-casqa-municipal` → `ca-casqa-municipal`
- `dc-guidebook` → `dc-guidebook`
- `boston-ma` → `boston-ma`
- `houston-tx` → `houston-tx`
- `san-diego-ca` → `san-diego-ca`
- `los-angeles-ca` → `los-angeles-ca`
- `miami-fl` → `miami-fl`
- `minneapolis-mn` → `minneapolis-mn`
- `detroit-mi` → `detroit-mi`
- `phoenix-az` → `phoenix-az`
- `salt-lake-city-ut` → `salt-lake-city-ut`
- `boise-id` → `boise-id`
- `honolulu-hi` → `honolulu-hi`
- `anchorage-ak` → `anchorage-ak`
- `ohio-rainwater` → `ohio-rainwater`
- `michigan-manual` → `michigan-manual`
- `indiana-manual` → `indiana-manual`
- `alabama-handbook` → `alabama-handbook`
- `south-carolina-manual` → `south-carolina-manual`
- `kentucky-bmp` → `kentucky-bmp`
- `west-virginia-manual` → `west-virginia-manual`
- `maine-manual` → `maine-manual`
- `kansas-city-marc-bmp` → `kansas-city-marc-bmp`
- `tx-edwards-rg348` → `tx-edwards-rg348`
- `south-salt-lake-ut` → `south-salt-lake-ut`
- `hawaii-dot-pcbmp` → `hawaii-dot-pcbmp`
- `albuquerque-nm-gsi` → `albuquerque-nm-gsi`
- `ca-caltrans-construction` → `ca-caltrans-construction`
- `mn-state-2008` → `mn-state-2008`
- `bismarck-nd` → `bismarck-nd`
- `reno-nv` → `reno-nv`
- `oklahoma-odot-ch10` → `oklahoma-odot-ch10`
- `ak-state` → `ak-state`
- `wi-dnr-1001` → `wi-dnr-1001`
- `mt-deq8` → `mt-deq8`
- `billings-mt` → `billings-mt`
- `north-little-rock-ar` → `north-little-rock-ar`
- `ms-state-vol2` → `ms-state-vol2`
- `new-orleans-jefferson-la` → `new-orleans-jefferson-la`
- `baton-rouge-la` → `baton-rouge-la`
- `wichita-ks-vol2` → `wichita-ks-vol2`
- `wy-wydot-field` → `wy-wydot-field`
- `de-wet-ponds-draft` → `de-wet-ponds-draft`
- `sd-dot-esc` → `sd-dot-esc`
- `ne-ndot-stf` → `ne-ndot-stf`
- `beatrice-ne` → `beatrice-ne`
- `norfolk-va` → `norfolk-va`
- `chesapeake-va` → `chesapeake-va`
- `lacey-wa` → `lacey-wa`
- `nashville-tn-vol4` → `nashville-tn-vol4`
- `charlotte-nc` → `charlotte-nc`
- `savannah-ga-css` → `savannah-ga-css`
- `tucson-az` → `tucson-az`
- `tucson-az-detention` → `tucson-az-detention`
- `tampa-fl` → `tampa-fl`
- `gainesville-fl` → `gainesville-fl`

## Skipped

- `mn-state`: skipped_no_single_pdf — live wiki; 2008 PDF outdated
- `baltimore-md`: HTTP 404 Not Found
- `atlanta-ga`: HTTP 404 Not Found
- `albuquerque-nm`: skipped_no_single_pdf
- `wisconsin-technical`: HTTP 404 Not Found
- `missouri-manual`: HTTP 404 Not Found
- `arkansas-manual`: HTTP 404 Not Found
- `delaware-esc`: HTTP 404 Not Found
- `oregon-manual`: HTTP 404 Not Found
- `idaho-bmp-catalog`: URL 404 on verify
