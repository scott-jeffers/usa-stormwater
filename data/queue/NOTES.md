# Overnight queue notes

Updated: 2026-08-07T21:23:04.218Z

## Tally

| Status | Count |
|--------|------:|
| done | 20 |
| pending | 0 |
| skipped | 28 |
| deferred | 11 |
| other | 0 |

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

## Failed / skipped

- `va-state`: skipped_no_single_pdf — VA handbook is chapter/web EncodePlus, not one PDF
- `nc-state`: skipped_no_single_pdf — NC design manual is chapter portal
- `nj-state`: skipped_no_single_pdf — NJ BMP manual is chapter PDFs
- `mn-state`: skipped_no_single_pdf — live wiki; 2008 PDF outdated
- `ca-casqa-municipal`: skipped_no_single_pdf — CASQA municipal handbook free but multi-file; Construction requires subscription
- `baltimore-md`: HTTP 404 Not Found
- `boston-ma`: HTTP 404 Not Found
- `houston-tx`: fetch failed
- `san-diego-ca`: HTTP 404 Not Found
- `los-angeles-ca`: HTTP 404 Not Found
- `atlanta-ga`: HTTP 404 Not Found
- `miami-fl`: skipped_no_single_pdf — need verified city manual PDF
- `minneapolis-mn`: skipped_no_single_pdf — need verified city manual PDF
- `detroit-mi`: skipped_no_single_pdf
- `phoenix-az`: skipped_no_single_pdf
- `salt-lake-city-ut`: skipped_no_single_pdf
- `boise-id`: skipped_no_single_pdf
- `albuquerque-nm`: skipped_no_single_pdf
- `honolulu-hi`: skipped_no_single_pdf
- `anchorage-ak`: skipped_no_single_pdf
- `wisconsin-technical`: HTTP 404 Not Found
- `indiana-manual`: HTTP 404 
- `missouri-manual`: HTTP 404 Not Found
- `arkansas-manual`: HTTP 404 Not Found
- `kentucky-bmp`: HTTP 404 NOT FOUND
- `delaware-esc`: HTTP 404 Not Found
- `oregon-manual`: HTTP 404 Not Found
- `idaho-bmp-catalog`: URL 404 on verify

## Deferred (quota / hard stop)

- `portland-or`: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.5-flash\nPlease retry in 42.87350591s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"42s"}]}}
- `denver-co`: {"error":{"code":429,"message":"You exceeded your current quota, please check your plan and billing details. For more information on this error, head to: https://ai.google.dev/gemini-api/docs/rate-limits. To monitor your current usage, head to: https://ai.dev/rate-limit. \n* Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.5-flash\nPlease retry in 56.642851685s.","status":"RESOURCE_EXHAUSTED","details":[{"@type":"type.googleapis.com/google.rpc.Help","links":[{"description":"Learn more about Gemini API quotas","url":"https://ai.google.dev/gemini-api/docs/rate-limits"}]},{"@type":"type.googleapis.com/google.rpc.QuotaFailure","violations":[{"quotaMetric":"generativelanguage.googleapis.com/generate_content_free_tier_requests","quotaId":"GenerateRequestsPerDayPerProjectPerModel-FreeTier","quotaDimensions":{"location":"global","model":"gemini-3.5-flash"},"quotaValue":"20"}]},{"@type":"type.googleapis.com/google.rpc.RetryInfo","retryDelay":"56s"}]}}
- `dc-guidebook`: Deferred due to Gemini quota / rate limit
- `ohio-rainwater`: Deferred due to Gemini quota / rate limit
- `michigan-manual`: Deferred due to Gemini quota / rate limit
- `alabama-handbook`: Deferred due to Gemini quota / rate limit
- `south-carolina-manual`: Deferred due to Gemini quota / rate limit
- `west-virginia-manual`: Deferred due to Gemini quota / rate limit
- `maine-manual`: Deferred due to Gemini quota / rate limit
- `kansas-city-marc-bmp`: Deferred due to Gemini quota / rate limit
- `tx-edwards-rg348`: Deferred due to Gemini quota / rate limit

See `run-log.jsonl` for per-attempt detail.
