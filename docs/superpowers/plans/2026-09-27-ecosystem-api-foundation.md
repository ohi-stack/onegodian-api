# OneGodian Ecosystem API Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the durable `api.onegodian.org` site registry, signed node authentication, product synchronization, aggregate metrics, events, reconciliation status, and auditable ecosystem read APIs required by Gregory's OneGodian Ecosystem Plugin™.

**Architecture:** Add a focused `src/ecosystem/` subsystem to the existing Express service and persist authoritative cross-site state in PostgreSQL through `DATABASE_URL`. WordPress nodes register through a one-time bootstrap credential, receive a node-scoped client secret once, and thereafter authenticate HMAC-signed requests with timestamp and nonce replay protection. Existing local WordPress/WooCommerce systems remain authoritative for local records; the API owns normalized cross-site aggregation state.

**Tech Stack:** Node.js >=20, Express 4, Zod 3, PostgreSQL via `pg`, Node `crypto`, Node `node:test`, existing request-ID/logging middleware.

**Spec:** `docs/superpowers/specs/2026-09-27-onegodian-ecosystem-connector-design.md`

## Global Constraints

- Canonical service is `https://api.onegodian.org`.
- API routes use explicit versioning under `/v1/ecosystem`.
- Local sites remain authoritative for local source records.
- Customer PII is not required for ecosystem product analytics and must not be ingested by default.
- Missing or disconnected source data must return explicit stale/unavailable state, not fabricated values.
- Secrets must never appear in repository history, logs, or client responses after initial credential issuance.
- All replay-sensitive mutations require idempotency or equivalent unique-source protection.
- OpenAPI must document only implemented behavior.
- Node runtime floor remains `>=20.0.0`.
- Existing non-ecosystem routes must continue to start in development/test even when `DATABASE_URL` is absent; ecosystem persistence readiness must report false instead of crashing the app.

## Review Focus

1. **Replayed signed request:** same nonce/signature submitted twice must be rejected with `409 replay_detected`; pinned in Task 3.
2. **Clock-skewed request:** a request outside the five-minute acceptance window must be rejected with `401 stale_request`; pinned in Task 3.
3. **Duplicate product event:** a repeated source product/version must not create a second product row or inflate metrics; pinned in Task 5.
4. **Unexpected customer fields:** sync payloads containing email/name/address keys must be rejected rather than silently persisted; pinned in Task 2 and Task 4.
5. **Disconnected/stale site:** heartbeat older than the configured threshold must surface `stale` in site reads instead of `healthy`; pinned in Task 7.

---

## File Structure

### Create

- `src/db.js` — PostgreSQL pool, query, transaction, health and migration helpers.
- `src/ecosystem/constants.js` — route/security constants and allowed scopes.
- `src/ecosystem/schemas.js` — Zod schemas for registration, products, metrics and events.
- `src/ecosystem/credentials.js` — secret generation, hashing, HMAC canonicalization and verification.
- `src/ecosystem/auth.js` — Express middleware for bootstrap and node-scoped authentication.
- `src/ecosystem/repository.js` — persistence interface for sites, nonces, products, metrics, events and sync runs.
- `src/ecosystem/service.js` — normalization/orchestration logic independent of Express.
- `src/ecosystem/router.js` — `/v1/ecosystem` routes.
- `migrations/001_ecosystem_foundation.sql` — durable ecosystem schema.
- `scripts/migrate.js` — idempotent migration runner.
- `test/ecosystem.credentials.test.js` — signing/replay unit tests.
- `test/ecosystem.service.test.js` — normalization/idempotency unit tests.
- `test/ecosystem.routes.test.js` — HTTP contract tests.
- `test/ecosystem.postgres.test.js` — migration/repository integration tests against PostgreSQL.
- `test/helpers/ecosystemMemoryRepository.js` — deterministic repository double for route/service tests.

### Modify

- `src/app.js` — dependency injection, ecosystem router and readiness state.
- `package.json` — add `pg`, migration script and syntax checks for ecosystem modules.
- `.env.example` — add bootstrap key and security-window settings.
- `.github/workflows/ci.yml` — run PostgreSQL service, migrations and integration tests.
- `docs/openapi.yaml` — document implemented ecosystem foundation routes after route tests pass.
- `docs/onegodian-api-route-map.md` — add production status for implemented routes only.

---

### Task 1: PostgreSQL Foundation and Migration Runner

**Files:**
- Create: `src/db.js`
- Create: `migrations/001_ecosystem_foundation.sql`
- Create: `scripts/migrate.js`
- Modify: `package.json`
- Modify: `.env.example`
- Test: `test/ecosystem.service.test.js`

**Interfaces:**
- Produces: `createDatabase({ connectionString })` returning `query(text, params)`, `withTransaction(callback)`, `close()`, `health()`.
- Produces tables: `ecosystem_sites`, `ecosystem_node_credentials`, `ecosystem_nonces`, `ecosystem_products`, `ecosystem_metrics`, `ecosystem_events`, `ecosystem_sync_runs`, `schema_migrations`.

- [ ] **Step 1: Write the failing database-interface test**

Add `test('database adapter exposes query, transaction, health and close')` asserting `createDatabase()` returns those four callable interfaces without opening a connection until one is used.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test test/ecosystem.service.test.js`
Expected: FAIL because `src/db.js` does not exist.

- [ ] **Step 3: Implement the database adapter and migration SQL**

Use `pg.Pool`; keep SQL parameterized. `001_ecosystem_foundation.sql` defines service-supplied text/UUID identifiers, UTC timestamps, unique `(site_id, local_product_id)`, unique event IDs, unique `(client_id, nonce)`, JSONB metadata/payload columns where normalization does not justify separate columns, and indexes for site status, product source, event time and metric time.

- [ ] **Step 4: Implement `scripts/migrate.js`**

Read `DATABASE_URL`, apply unapplied `migrations/*.sql` in filename order inside transactions, record filenames in `schema_migrations`, redact connection details from errors, and exit non-zero on failure.

- [ ] **Step 5: Update configuration and scripts**

Add dependency `pg`; add `npm run migrate`; add `ECOSYSTEM_BOOTSTRAP_KEY`, `ECOSYSTEM_SIGNATURE_WINDOW_SECONDS=300`, and `ECOSYSTEM_STALE_AFTER_SECONDS=900` to `.env.example`.

- [ ] **Step 6: Run checks**

Run: `npm install && npm test && npm run check`
Expected: PASS; migration script parses without connecting when not invoked.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json .env.example src/db.js migrations/001_ecosystem_foundation.sql scripts/migrate.js test/ecosystem.service.test.js
git commit -m "feat: add ecosystem persistence foundation"
```

### Task 2: Ecosystem Schemas and PII Guardrails

**Files:**
- Create: `src/ecosystem/constants.js`
- Create: `src/ecosystem/schemas.js`
- Test: `test/ecosystem.service.test.js`

**Interfaces:**
- Produces: `SiteRegistrationSchema`, `HeartbeatSchema`, `ProductSyncSchema`, `MetricSyncSchema`, `EcosystemEventSchema`.
- Produces: `NODE_SCOPES`, `SIGNATURE_WINDOW_SECONDS`, `STALE_AFTER_SECONDS`.
- Produces: `assertNoCustomerPii(value)` for recursive reserved-key rejection.

- [ ] **Step 1: Write failing schema tests**

Add tests proving a normalized WooCommerce product with site/local IDs, SKU, prices, stock, aggregate units/gross/refunds/net/order count and timestamps passes; payloads containing `customer_email`, `billing_address`, `shipping_address`, or `customer_name` at any nesting level fail validation.

- [ ] **Step 2: Run the focused tests**

Run: `node --test test/ecosystem.service.test.js`
Expected: FAIL because schemas/constants are missing.

- [ ] **Step 3: Implement schemas and constants**

Product money fields are decimal strings plus uppercase three-letter currency. Aggregate counts are non-negative integers. Event payloads permit documented metadata but reject reserved customer-PII keys recursively.

- [ ] **Step 4: Run tests**

Run: `node --test test/ecosystem.service.test.js`
Expected: PASS for schema and PII cases.

- [ ] **Step 5: Commit**

```bash
git add src/ecosystem/constants.js src/ecosystem/schemas.js test/ecosystem.service.test.js
git commit -m "feat: define ecosystem sync contracts"
```

### Task 3: Node Registration and HMAC Authentication

**Files:**
- Create: `src/ecosystem/credentials.js`
- Create: `src/ecosystem/auth.js`
- Create: `test/ecosystem.credentials.test.js`
- Create: `test/helpers/ecosystemMemoryRepository.js`

**Interfaces:**
- Produces: `generateClientSecret() -> string`.
- Produces: `hashClientSecret(secret) -> string` using SHA-256 for stored secret fingerprinting.
- Produces: `canonicalRequest({ method, path, timestamp, nonce, bodyBytes }) -> string` exactly as `METHOD\nPATH\nTIMESTAMP\nNONCE\nSHA256_BODY_HEX`.
- Produces: `signCanonical(canonical, secret) -> lowercase hex HMAC-SHA256`.
- Produces: `createNodeAuth({ repository, now }) -> Express middleware`.
- Consumes repository methods: `findCredential(clientId)`, `consumeNonce(clientId, nonce, expiresAt)`.

- [ ] **Step 1: Write the fixed cross-language signing-vector test**

Fixture values are exact:

```text
method: POST
path: /v1/ecosystem/products/sync
timestamp: 1790539200
nonce: nonce-test-001
body bytes: {"products":[]}
secret: test-secret-123
body SHA-256: 86d8b086af0fc30d06856e218fcfdb6b803f91b45f50b1b753d8deac627fc054
expected HMAC-SHA256: 46a4fc71a03109edf5d5577f1a95601f14a4481b48b5c29d41ac759cc58cd2be
```

Assert exact canonical string layout and expected HMAC. This same vector is used by the PHP connector plan.

- [ ] **Step 2: Write failing security-window tests**

Assert a timestamp older/newer than 300 seconds returns `stale_request`; first nonce use succeeds; second use returns `replay_detected` with HTTP 409.

- [ ] **Step 3: Run tests and verify failure**

Run: `node --test test/ecosystem.credentials.test.js`
Expected: FAIL because credentials/auth modules are missing.

- [ ] **Step 4: Implement credential helpers and middleware**

Read headers `X-OneGodian-Site`, `X-OneGodian-Client`, `X-OneGodian-Timestamp`, `X-OneGodian-Nonce`, `X-OneGodian-Signature`; reject missing scope, revoked credentials, site mismatch, stale timestamp, bad signature and replayed nonce with stable error codes.

- [ ] **Step 5: Run tests**

Run: `node --test test/ecosystem.credentials.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ecosystem/credentials.js src/ecosystem/auth.js test/ecosystem.credentials.test.js test/helpers/ecosystemMemoryRepository.js
git commit -m "feat: secure ecosystem node requests"
```

### Task 4: Site Registration, Heartbeats, and App Injection

**Files:**
- Create: `src/ecosystem/repository.js`
- Create: `src/ecosystem/service.js`
- Create: `src/ecosystem/router.js`
- Create: `test/ecosystem.routes.test.js`
- Modify: `src/app.js`

**Interfaces:**
- Produces service methods: `registerSite(input)`, `recordHeartbeat(principal, input)`, `listSites()`, `getSite(siteId)`.
- `registerSite(input)` returns `{ site, clientId, clientSecret }`; `clientSecret` is returned exactly once and only a hash is persisted.
- Bootstrap route requires header `X-OneGodian-Bootstrap-Key` equal to `ECOSYSTEM_BOOTSTRAP_KEY` using timing-safe comparison.
- `createApp(options = {})` accepts optional `database`, `ecosystemRepository`, and `now` injections for deterministic tests. With no `DATABASE_URL` and no injected repository, existing routes still start while ecosystem mutation routes return `503 ecosystem_persistence_unavailable`.

- [ ] **Step 1: Write failing HTTP tests for registration**

Assert missing/wrong bootstrap key returns 401; valid `POST /v1/ecosystem/sites/register` returns 201, site ID, client ID and one-time client secret; a subsequent site read never exposes stored secret material.

- [ ] **Step 2: Write failing heartbeat tests**

Using signed headers from Task 3, assert `POST /v1/ecosystem/sites/heartbeat` records WordPress/PHP/plugin versions, adapter capability summary and heartbeat timestamp; payload containing customer PII fails with 400.

- [ ] **Step 3: Write failing no-database startup test**

Call `createApp()` with `DATABASE_URL` absent; assert `/health` still responds and ecosystem registration returns 503 rather than crashing process startup.

- [ ] **Step 4: Run focused route tests**

Run: `node --test test/ecosystem.routes.test.js`
Expected: FAIL because repository/service/router are missing.

- [ ] **Step 5: Implement repository/site service/router and mount it**

`createEcosystemRepository(db)` uses parameterized PostgreSQL queries/upserts. `createEcosystemService({ repository, now })` owns IDs/state transitions. `createEcosystemRouter(deps)` mounts under `/v1/ecosystem` from `src/app.js`.

- [ ] **Step 6: Run tests**

Run: `node --test test/ecosystem.routes.test.js`
Expected: PASS for registration, heartbeat and no-database startup cases.

- [ ] **Step 7: Commit**

```bash
git add src/ecosystem/repository.js src/ecosystem/service.js src/ecosystem/router.js src/app.js test/ecosystem.routes.test.js
git commit -m "feat: register and monitor ecosystem sites"
```

### Task 5: Product Synchronization and Idempotent Upserts

**Files:**
- Modify: `src/ecosystem/repository.js`
- Modify: `src/ecosystem/service.js`
- Modify: `src/ecosystem/router.js`
- Modify: `test/ecosystem.service.test.js`
- Modify: `test/ecosystem.routes.test.js`

**Interfaces:**
- Produces: `syncProducts(principal, { products }) -> { accepted, created, updated, unchanged }`.
- Produces repository methods: `upsertProduct(siteId, product)`, `listProducts(filters)`, `getProduct(globalProductId)`.

- [ ] **Step 1: Write failing product idempotency tests**

Assert first `(site_id, local_product_id, source_checksum)` creates one row; same checksum is `unchanged`; new checksum updates that row; repeated request does not increase record count or cumulative units.

- [ ] **Step 2: Write failing product route tests**

Assert signed `POST /v1/ecosystem/products/sync`, `GET /v1/ecosystem/products`, and `GET /v1/ecosystem/products/:product_id` enforce `products:write`/`products:read` scopes and return normalized product data without customer fields.

- [ ] **Step 3: Run focused tests**

Run: `node --test test/ecosystem.service.test.js test/ecosystem.routes.test.js`
Expected: FAIL on missing product methods/routes.

- [ ] **Step 4: Implement product upsert and reads**

Use unique `(site_id, local_product_id)` plus checksum/version comparison; never sum product-level cumulative aggregates during repeated syncs.

- [ ] **Step 5: Run tests**

Run: `node --test test/ecosystem.service.test.js test/ecosystem.routes.test.js`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ecosystem/repository.js src/ecosystem/service.js src/ecosystem/router.js test/ecosystem.service.test.js test/ecosystem.routes.test.js
git commit -m "feat: synchronize ecosystem products"
```

### Task 6: Aggregate Metrics, Events, and Sync Status

**Files:**
- Modify: `src/ecosystem/repository.js`
- Modify: `src/ecosystem/service.js`
- Modify: `src/ecosystem/router.js`
- Modify: `test/ecosystem.routes.test.js`

**Interfaces:**
- Produces: `syncMetrics(principal, batch)`, `recordEvent(principal, event)`, `getSyncStatus(siteId)`, `listEvents(filters)`.
- Event input requires globally unique `event_id`, `event_type`, source timestamp and source checksum/version where available.

- [ ] **Step 1: Write failing event/metric tests**

Assert duplicate `event_id` is acknowledged as already processed rather than inserted twice; metric batches use `(site_id, metric_key, period_start, period_end)` upsert semantics; invalid negative counts fail.

- [ ] **Step 2: Write failing sync-status tests**

Assert successful and failed sync-run records expose last success, last failure, pending/failed counts and a non-fabricated state.

- [ ] **Step 3: Run tests**

Run: `node --test test/ecosystem.routes.test.js`
Expected: FAIL.

- [ ] **Step 4: Implement metric/event/sync routes**

Implement `POST /metrics/sync`, `GET /metrics`, `POST /events`, `GET /events`, `GET /sync/status`; reserve `POST /sync/run` for privileged orchestration and return `501 not_implemented` until the API actually has a runnable central job.

- [ ] **Step 5: Run tests**

Run: `node --test test/ecosystem.routes.test.js`
Expected: PASS and confirms `/sync/run` is not advertised as active behavior.

- [ ] **Step 6: Commit**

```bash
git add src/ecosystem/repository.js src/ecosystem/service.js src/ecosystem/router.js test/ecosystem.routes.test.js
git commit -m "feat: ingest ecosystem metrics and events"
```

### Task 7: Site Staleness, Readiness, and Operational Health

**Files:**
- Modify: `src/ecosystem/service.js`
- Modify: `src/ecosystem/router.js`
- Modify: `src/app.js`
- Modify: `test/ecosystem.routes.test.js`

**Interfaces:**
- Produces: `siteOperationalState(site, now, staleAfterSeconds) -> 'healthy'|'stale'|'disabled'|'never_connected'`.
- Extends `/ready` checks with `ecosystemPersistence` and `ecosystemRoutes` without claiming database readiness when DB health fails.

- [ ] **Step 1: Write failing stale-site tests**

With a fixed clock, assert heartbeat age <=900 seconds is `healthy`, >900 seconds is `stale`, no heartbeat is `never_connected`, disabled site is `disabled` regardless of heartbeat.

- [ ] **Step 2: Write failing readiness tests**

Assert DB health failure yields `ready:false` for ecosystem persistence rather than reporting success.

- [ ] **Step 3: Run tests**

Run: `node --test test/ecosystem.routes.test.js`
Expected: FAIL.

- [ ] **Step 4: Implement state/readiness logic**

Keep current API health response backwards-compatible while adding explicit ecosystem details.

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: all existing and ecosystem tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/ecosystem/service.js src/ecosystem/router.js src/app.js test/ecosystem.routes.test.js
git commit -m "feat: expose ecosystem operational health"
```

### Task 8: OpenAPI and Route Contract

**Files:**
- Modify: `docs/openapi.yaml`
- Modify: `docs/onegodian-api-route-map.md`
- Modify: `package.json`
- Test: `test/ecosystem.routes.test.js`

**Interfaces:**
- Documents only the route/status/error contracts implemented in Tasks 1-7.

- [ ] **Step 1: Add documentation contract assertions**

Read `docs/openapi.yaml` and assert implemented `/v1/ecosystem` paths are present while valuation routes and active MCP transport are absent from this foundation stage.

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node --test test/ecosystem.routes.test.js`
Expected: FAIL until OpenAPI is updated.

- [ ] **Step 3: Update OpenAPI and route map**

Document auth headers, bootstrap registration, product/metric/event schemas, stable error codes, staleness state and scope requirements.

- [ ] **Step 4: Expand `npm run check`**

Include syntax checks for all new ecosystem JS modules and migration runner.

- [ ] **Step 5: Run verification**

Run: `npm test && npm run check`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add docs/openapi.yaml docs/onegodian-api-route-map.md package.json test/ecosystem.routes.test.js
git commit -m "docs: publish ecosystem API foundation contract"
```

### Task 9: PostgreSQL Integration Test and CI Gate

**Files:**
- Create: `test/ecosystem.postgres.test.js`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Integration tests consume `TEST_DATABASE_URL` and run only in the explicit `test:postgres` script; ordinary `npm test` remains repository-double/unit HTTP coverage.

- [ ] **Step 1: Write failing PostgreSQL integration test**

Test applies migration 001 to an empty PostgreSQL database, registers a site/retrieves it through `createEcosystemRepository`, consumes a nonce twice to prove unique replay enforcement, upserts the same product twice to prove one row, writes duplicate event ID to prove one event, then rolls back/cleans test data.

- [ ] **Step 2: Add CI PostgreSQL service**

Use a pinned PostgreSQL major supported by the deployment environment, expose `TEST_DATABASE_URL`, run `npm run migrate`, `npm run test:postgres`, then normal `npm test && npm run check`.

- [ ] **Step 3: Run CI-equivalent commands locally against a test database**

Run: `TEST_DATABASE_URL=... DATABASE_URL=... npm run migrate && npm run test:postgres && npm test && npm run check`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add test/ecosystem.postgres.test.js .github/workflows/ci.yml package.json
git commit -m "test: verify ecosystem persistence on postgres"
```

## Plan Completion Gate

This plan is complete when a registered test node can obtain one-time credentials, sign requests, heartbeat, idempotently sync products/metrics/events into durable PostgreSQL storage, read normalized cross-site state with scope enforcement, surface truthful readiness/staleness, and pass both repository-double tests and a real PostgreSQL CI gate. Valuation and MCP begin only after this foundation is green.