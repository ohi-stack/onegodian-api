# Console authoritative feed integration

Status: In development
Runtime owner: ohi-stack/onegodian-api

The API performs read-only GET requests to fixed `https://acc.onegodian.com` paths. `/manifest` and `/v1/platform/feeds` return sanitized observations; legacy `/api/v1/platform/feeds` is also supported. The console renders these same-origin observations. Requests never accept browser-selected upstream URLs or forward caller credentials. Redirects are refused; JSON is limited to 1 MiB and a two-second request timeout. Refreshes are coalesced and cached for 30 seconds per process.

## Existing ACC sources

- `/health`: validated ACC identity and liveness. Responding does not imply readiness.
- `/ready`: validated readiness; a valid `503 not_ready` response remains not-ready evidence.
- `/api/v1/agents`: private agent registry summary. This is not a tool inventory.
- `/api/v1/connections`: private integration registry summary. A registered connection is not proof of connectivity.
- `/api/v1/audit?limit=1`: private audit total. No record payloads or personal activity are published.

Only record counts are projected from private responses. Private requests require both `ACC_READ_KEY` in the server secret store and `ACC_PUBLIC_SUMMARIES=true`, explicitly authorizing publication of those counts. Use a dedicated ACC observer identity; no write requests are made. Without both settings, these feeds are not configured. Credentials and raw upstream error bodies are never returned. Tool registry status remains unknown because current ACC source has no dedicated permissioned tool inventory endpoint.

ACC liveness/readiness probes are enabled by default. `ACC_FEEDS_ENABLED=false` disables all upstream reads, including OIPS. Schema mismatch, HTML, oversized JSON, authorization failure and network failure do not become healthy or zero-count claims. Observations include source, check time and successful observation time. On refresh failure, the previous successful observation is explicitly stale; after a process restart there is no retained history. This cache is not an audit database or historical uptime service.

## Optional OIPS assessment contract — not implemented in current ACC

`OIPS_FEED_ENABLED=false` remains the default. Enable only after ACC deploys an authenticated `GET /api/v1/oips/evidence` endpoint and validates its evidence. This consumer does not create that upstream endpoint, inspect evidence targets, verify signatures, or certify compliance.

Expected JSON:

```json
{
  "standard": "OIPS",
  "scope": "acc-runtime",
  "evaluatedAt": "2026-10-04T17:00:00Z",
  "checks": [
    {"capability":"instructions","status":"pass","evidenceRef":"assessment-record-1"},
    {"capability":"knowledge","status":"pass","evidenceRef":"assessment-record-2"},
    {"capability":"skills","status":"pass","evidenceRef":"assessment-record-3"},
    {"capability":"tools","status":"pass","evidenceRef":"assessment-record-4"},
    {"capability":"verification","status":"pass","evidenceRef":"assessment-record-5"}
  ]
}
```

Require exactly one check for each capability, `pass`, `fail` or `unknown`, nonempty evidence references and scope, and an evaluation timestamp no more than 24 hours old or 60 seconds in the future. Evidence references stay upstream; the public projection contains capability results, scope and time only. All passes produce `reported_pass`, any failure `reported_fail`, otherwise `unknown`; every result states `certified:false`. A malformed or unsupported compliance assertion is rejected. Even a reported pass is an upstream assertion, not independent verification or external recognition.

## Validation and deployment

Run `npm run check` and `npm test`. Tests cover projection, credential isolation, publication opt-in, cache coalescing, stale observations, response validation, authorization failure, size limits, readiness and OIPS assessment requirements, plus existing route/access regressions.

Deploy the approved API commit through the existing Hostinger Node application workflow. Preserve existing API environment, routes and administration controls. Configure the dedicated server credential and explicit count-publication setting through the host secret/environment controls. Current access does not provide those controls. Smoke-check `/manifest`, `/v1/platform/feeds`, public HTML and unauthenticated `/admin` rejection; verify no key or raw records appear. Test actual canonical upstream access before claiming integration operational. Roll back to the previous deployed commit and restore previous feed settings; no data migrations are introduced.

Current boundary: connector code can be verified locally. Live integration remains blocked until ACC is reachable and the private server credential is provisioned; OIPS requires a separately implemented authoritative upstream assessment endpoint.
