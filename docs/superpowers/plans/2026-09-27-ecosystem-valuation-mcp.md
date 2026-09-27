# OneGodian Ecosystem Valuation + MCP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add auditable, source-backed ecosystem valuation, immutable valuation history, read-only MCP access, and valuation analytics on top of the completed ecosystem API foundation.

**Architecture:** Extend `src/ecosystem/` with an asset registry and valuation service backed by PostgreSQL. Valuation totals are derived from current source records using explicit classification, legal owner, parent/child rollup and provenance rules; historical snapshots are immutable. MCP is a separate read-only transport at `/mcp`, disabled unless a dedicated service credential is configured, and exposes only service-layer reads rather than direct database access.

**Tech Stack:** Node.js >=20, Express 4, existing Zod 3 for REST, PostgreSQL via `pg`, Node `crypto`, official `@modelcontextprotocol/server` v2 + `@modelcontextprotocol/node` v2, Valibot for MCP Standard Schema tool inputs, Node `node:test`.

**Spec:** `docs/superpowers/specs/2026-09-27-onegodian-ecosystem-connector-design.md`

**Depends on:** `docs/superpowers/plans/2026-09-27-ecosystem-api-foundation.md` completed and passing.

## Global Constraints

- Every live valuation amount must resolve to source/provenance metadata.
- Required headline views are Documented Net Asset Value, Calculated Operating / Enterprise Value, Total Ecosystem Indicated Value, Valuation Coverage, and Unvalued Assets.
- Conceptual / Unvalued records contribute zero to live totals.
- Historical valuation snapshots are immutable.
- Legal-owner separation is preserved in storage and all breakdowns.
- Product retail price × stock may support an inventory retail-value view but is never automatically enterprise value.
- Manual overrides never silently overwrite source-backed records.
- MCP is read-only in V1 and does not move money, change title, modify valuation records, alter credentials, or execute production configuration.
- MCP endpoint remains disabled unless `MCP_SERVICE_TOKEN` is configured.
- MCP transport targets the stable 2026-07-28 protocol line through the official v2 SDK.
- Do not upgrade the app-wide Zod 3 dependency merely for MCP; MCP tool input validation uses Valibot/Standard Schema in its own module.

## Review Focus

1. **Parent/child double counting:** business enterprise value plus included child assets must not both enter Total Ecosystem Indicated Value; pinned in Task 4.
2. **Stale valuation:** expired/stale records remain visible but are excluded or flagged according to the requested view, never silently treated as current; pinned in Task 3.
3. **Mixed legal owners:** a total filtered to one owner must never include another owner's assets; pinned in Task 4.
4. **FX conversion without provenance:** non-base-currency value without rate/source/timestamp must be rejected from normalized base-currency totals; pinned in Task 3.
5. **MCP unauthenticated access:** `/mcp` must be unavailable when token is unconfigured and return 401 for a bad token when configured; pinned in Task 7.

---

## File Structure

### Create

- `migrations/002_ecosystem_valuation.sql` — assets, valuation records, FX provenance, snapshots and snapshot items.
- `src/ecosystem/valuationSchemas.js` — asset/valuation/FX request schemas.
- `src/ecosystem/valuationRepository.js` — valuation persistence.
- `src/ecosystem/valuationService.js` — current-value selection, rollups, coverage and snapshot calculations.
- `src/ecosystem/valuationRouter.js` — `/v1/ecosystem/valuation` REST surface.
- `src/mcp/auth.js` — service-token guard.
- `src/mcp/toolSchemas.js` — Valibot Standard Schema inputs for MCP tools only.
- `src/mcp/tools.js` — read-only OneGodian MCP tool registry.
- `src/mcp/server.js` — official MCP server factory and HTTP handler bridge.
- `test/ecosystem.valuation.test.js` — valuation rules/unit tests.
- `test/ecosystem.valuation.routes.test.js` — valuation HTTP contract tests.
- `test/ecosystem.valuation.postgres.test.js` — valuation migration/repository integration tests.
- `test/mcp.test.js` — MCP auth and tool tests.

### Modify

- `src/ecosystem/repository.js` — expose site/product read interfaces needed by valuation/MCP.
- `src/ecosystem/service.js` — expose ecosystem analytics reads consumed by MCP.
- `src/ecosystem/router.js` — mount valuation router.
- `src/app.js` — mount authenticated `/mcp` transport.
- `package.json` — add MCP server/node + Valibot dependencies and syntax checks.
- `.env.example` — add `MCP_SERVICE_TOKEN`, valuation base currency and stale-day defaults.
- `.github/workflows/ci.yml` — run migration 002 and valuation PostgreSQL integration test.
- `docs/openapi.yaml` — valuation REST only; MCP protocol remains documented separately.
- `docs/onegodian-api-route-map.md` — valuation + MCP implementation status.
- `README.md` — operator-facing configuration and read-only MCP statement.

---

### Task 1: Valuation Persistence Schema

**Files:**
- Create: `migrations/002_ecosystem_valuation.sql`
- Create: `src/ecosystem/valuationRepository.js`
- Test: `test/ecosystem.valuation.test.js`

**Interfaces:**
- Tables: `ecosystem_assets`, `ecosystem_valuation_records`, `ecosystem_fx_rates`, `ecosystem_valuation_snapshots`, `ecosystem_valuation_snapshot_items`.
- Produces repository methods: `upsertAsset(asset)`, `getAsset(id)`, `listAssets(filters)`, `insertValuationRecord(record)`, `listValuationRecords(filters)`, `insertFxRate(rate)`, `getFxRate(base, quote, at)`, `insertSnapshot(snapshot, items)`, `getSnapshot(id)`, `listSnapshots(filters)`.

- [ ] **Step 1: Write the failing repository contract test**

Assert the repository exports each method and the memory test double can represent parent asset, legal owner, classification, source record, current/stale state and immutable snapshots.

- [ ] **Step 2: Run test and verify failure**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: FAIL because valuation repository/schema do not exist.

- [ ] **Step 3: Implement migration and repository**

`ecosystem_assets` fields include `asset_id`, `asset_name`, `asset_type`, `legal_owner`, `source_site`, `source_system`, `source_record_id`, `parent_asset_id`, `rollup_mode`, `status`, timestamps and metadata. `rollup_mode` is one of `standalone`, `included_in_parent`, `informational`.

`ecosystem_valuation_records` is append-only with `classification`, `value_dimension`, `valuation_amount`, `currency`, `valuation_method`, `valuation_basis`, `valuation_source`, `valuation_date`, `effective_date`, `stale_after`, `verification_status`, `confidence_level`, `gross_value`, `associated_liabilities`, `net_value`, manual-override metadata, provenance JSON, `supersedes_record_id` and creation timestamp.

- [ ] **Step 4: Enforce immutability at repository level**

No update/delete method is exposed for valuation records or snapshots; corrections create a new record with `supersedes_record_id`.

- [ ] **Step 5: Run tests and commit**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: PASS.

```bash
git add migrations/002_ecosystem_valuation.sql src/ecosystem/valuationRepository.js test/ecosystem.valuation.test.js
git commit -m "feat: persist ecosystem valuation records"
```

### Task 2: Valuation Schemas and Source Provenance

**Files:**
- Create: `src/ecosystem/valuationSchemas.js`
- Modify: `test/ecosystem.valuation.test.js`

**Interfaces:**
- Produces: `AssetSchema`, `ValuationRecordSchema`, `FxRateSchema`, `ValuationQuerySchema`.
- `classification`: `documented|calculated|owner_estimated|third_party_appraisal|historical|conceptual_unvalued`.
- `value_dimension`: `net_asset|enterprise|inventory_retail|informational`.
- `rollup_mode`: `standalone|included_in_parent|informational`.

- [ ] **Step 1: Write failing provenance/schema tests**

Assert non-conceptual valuations require amount, currency, method, source, source record/reference and valuation/effective dates; conceptual/unvalued records require no positive amount and cannot claim verification merely from registry existence.

- [ ] **Step 2: Write failing product-value classification test**

Assert inventory price × quantity input can only enter `inventory_retail` unless a separately supplied valuation method supports another dimension.

- [ ] **Step 3: Run tests**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: FAIL.

- [ ] **Step 4: Implement schemas**

All money is decimal string + three-letter currency. Reject negative gross/net unless the record explicitly represents a liability. Manual overrides require `override_reason`, `override_actor` and `override_at`.

- [ ] **Step 5: Run tests and commit**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: PASS.

```bash
git add src/ecosystem/valuationSchemas.js test/ecosystem.valuation.test.js
git commit -m "feat: validate valuation provenance"
```

### Task 3: Current Record Selection, Staleness, and FX

**Files:**
- Create: `src/ecosystem/valuationService.js`
- Modify: `test/ecosystem.valuation.test.js`

**Interfaces:**
- Produces: `selectCurrentRecord(records, asOf) -> record|null`.
- Produces: `isValuationStale(record, asOf) -> boolean`.
- Produces: `convertMoney({ amount, currency }, { baseCurrency, rate, source, rateAt }) -> normalizedMoney`.
- Produces: `createValuationService({ repository, baseCurrency, now })`.

- [ ] **Step 1: Write failing supersession/current-record tests**

Assert latest effective non-superseded current record is selected; historical and conceptual records never become a live amount merely because they are newest.

- [ ] **Step 2: Write failing staleness tests**

Assert `stale_after` before `asOf` marks a record stale and summary output includes its amount only when the requested view explicitly includes stale records.

- [ ] **Step 3: Write failing FX provenance tests**

Assert same-currency values require no FX; foreign currency requires positive rate, source and rate timestamp; missing provenance returns `uncomputed_fx` rather than guessed conversion.

- [ ] **Step 4: Run tests**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: FAIL.

- [ ] **Step 5: Implement service helpers**

Base currency defaults to `USD` through `ECOSYSTEM_VALUATION_BASE_CURRENCY`. Do not fetch live FX in the valuation calculation path; rates must be explicit persisted inputs.

- [ ] **Step 6: Run tests and commit**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: PASS.

```bash
git add src/ecosystem/valuationService.js test/ecosystem.valuation.test.js
git commit -m "feat: resolve current valuation records"
```

### Task 4: Headline Valuation Rollups and Double-Count Prevention

**Files:**
- Modify: `src/ecosystem/valuationService.js`
- Modify: `test/ecosystem.valuation.test.js`

**Interfaces:**
- Produces: `calculateSummary({ assets, records, asOf, owner, includeStale=false })` returning `{ documentedNetAssetValue, calculatedEnterpriseValue, totalEcosystemIndicatedValue, coverage, unvaluedAssets, exclusions }`.
- Produces: `calculateBreakdown({ groupBy, owner, asOf })` where `groupBy` is `legal_owner|asset_type|business|source_site|classification`.

- [ ] **Step 1: Write failing documented-NAV tests**

Assert current `documented` and `third_party_appraisal` records in `net_asset` dimension contribute to Documented NAV; liabilities use `net_value`; conceptual/historical/informational records do not.

- [ ] **Step 2: Write failing enterprise-value tests**

Assert current `calculated` enterprise records contribute to Calculated Operating / Enterprise Value and owner-estimated enterprise records are shown separately unless explicitly included by query.

- [ ] **Step 3: Write failing double-count test**

Fixture: Business A enterprise value = $1,000,000; child equipment = $100,000 marked `included_in_parent`; independent property = $500,000 `standalone`. Total Ecosystem Indicated Value must equal $1,500,000, not $1,600,000.

- [ ] **Step 4: Write failing legal-owner partition test**

Fixture with assets owned by `ONEGODIAN, LLC` and another owner; owner-filtered summary includes only exact matching legal-owner records and reports excluded counts.

- [ ] **Step 5: Run tests**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: FAIL.

- [ ] **Step 6: Implement rollups**

Indicated total selects only current, non-stale, non-informational economic units. A parent with a current enterprise record suppresses children marked `included_in_parent`; `standalone` children remain separate; `informational` never contributes.

- [ ] **Step 7: Run tests and commit**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: PASS.

```bash
git add src/ecosystem/valuationService.js test/ecosystem.valuation.test.js
git commit -m "feat: calculate auditable ecosystem valuation"
```

### Task 5: Immutable Valuation Snapshots and History

**Files:**
- Modify: `src/ecosystem/valuationService.js`
- Modify: `src/ecosystem/valuationRepository.js`
- Modify: `test/ecosystem.valuation.test.js`

**Interfaces:**
- Produces: `createSnapshot({ asOf, owner=null }) -> snapshot`.
- Produces: `listHistory(filters) -> snapshots`.
- Snapshot stores headline totals plus one immutable item per contributing/excluded asset with source valuation record ID and exclusion reason.

- [ ] **Step 1: Write failing snapshot tests**

Assert snapshot includes base currency, calculated-at timestamp, headline totals, source record IDs and exclusion reasons; later valuation records do not mutate prior snapshot output.

- [ ] **Step 2: Run test and verify failure**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement snapshot creation/history**

Use one database transaction to persist snapshot header/items. Reject duplicate snapshot ID; never update snapshot rows.

- [ ] **Step 4: Run tests and commit**

Run: `node --test test/ecosystem.valuation.test.js`
Expected: PASS.

```bash
git add src/ecosystem/valuationService.js src/ecosystem/valuationRepository.js test/ecosystem.valuation.test.js
git commit -m "feat: preserve valuation history snapshots"
```

### Task 6: Valuation REST API

**Files:**
- Create: `src/ecosystem/valuationRouter.js`
- Modify: `src/ecosystem/router.js`
- Create: `test/ecosystem.valuation.routes.test.js`

**Interfaces:**
- Implements `GET /v1/ecosystem/valuation/summary`.
- Implements `GET /v1/ecosystem/valuation/breakdown`.
- Implements `GET /v1/ecosystem/valuation/assets` and `GET /assets/:asset_id`.
- Implements `GET /v1/ecosystem/valuation/history`, `GET /unvalued`, `GET /sources`.
- Implements privileged `POST /v1/ecosystem/valuation/records` and `POST /recalculate`; `recalculate` creates a snapshot, not a fabricated value.

- [ ] **Step 1: Write failing route tests**

Assert read routes require `valuation:read`; write routes require `valuation:write`; malformed values return 400; owner filters preserve separation; response includes `asOf`, `baseCurrency`, provenance/exclusion counts.

- [ ] **Step 2: Run tests**

Run: `node --test test/ecosystem.valuation.routes.test.js`
Expected: FAIL.

- [ ] **Step 3: Implement valuation router and mount it**

Use only service interfaces; no SQL in route handlers.

- [ ] **Step 4: Run tests and commit**

Run: `node --test test/ecosystem.valuation.routes.test.js`
Expected: PASS.

```bash
git add src/ecosystem/valuationRouter.js src/ecosystem/router.js test/ecosystem.valuation.routes.test.js
git commit -m "feat: expose ecosystem valuation API"
```

### Task 7: Read-Only MCP Authentication, Schemas, and Transport

**Files:**
- Create: `src/mcp/auth.js`
- Create: `src/mcp/toolSchemas.js`
- Create: `src/mcp/tools.js`
- Create: `src/mcp/server.js`
- Create: `test/mcp.test.js`
- Modify: `src/app.js`
- Modify: `package.json`
- Modify: `.env.example`

**Interfaces:**
- Produces: `authenticateMcpRequest(req) -> { allowed, principal }` using `Authorization: Bearer <MCP_SERVICE_TOKEN>` with timing-safe comparison.
- Produces Valibot schemas for tool arguments without changing REST Zod 3 schemas.
- Produces: `createOneGodianMcpServer({ ecosystemService, valuationService })`.
- Produces HTTP handler mounted at `/mcp` using official v2 `createMcpHandler` plus Node adapter.

- [ ] **Step 1: Write failing MCP auth tests**

Assert unconfigured token makes `/mcp` return `503 mcp_disabled`; configured token + missing/wrong bearer returns 401; valid token reaches protocol handler.

- [ ] **Step 2: Write failing tool-list tests**

Assert only read tools are registered: `onegodian.ecosystem.list_sites`, `onegodian.ecosystem.get_site`, `onegodian.products.search`, `onegodian.products.get`, `onegodian.products.stats`, `onegodian.analytics.overview`, `onegodian.analytics.timeseries`, `onegodian.connections.list`, `onegodian.connections.status`, `onegodian.events.search`, `onegodian.sync.status`, `onegodian.adapters.list`, `onegodian.system.health`, `onegodian.valuation.total`, `onegodian.valuation.breakdown`, `onegodian.valuation.asset`, `onegodian.valuation.business`, `onegodian.valuation.history`, `onegodian.valuation.unvalued_assets`, `onegodian.valuation.sources`.

- [ ] **Step 3: Run tests**

Run: `node --test test/mcp.test.js`
Expected: FAIL.

- [ ] **Step 4: Add MCP dependencies without upgrading Zod**

Add `@modelcontextprotocol/server` v2, `@modelcontextprotocol/node` v2, and `valibot`. Existing `zod` remains on major 3.

- [ ] **Step 5: Implement transport and representative tools**

Build a fresh MCP server per request. Tool handlers call service methods only. Tests call at least `list_sites`, `products.search`, `valuation.total`, and `valuation.sources` and assert structured fixture output. No mutation tool is registered.

- [ ] **Step 6: Run tests and commit**

Run: `npm install && node --test test/mcp.test.js`
Expected: PASS.

```bash
git add src/mcp src/app.js package.json package-lock.json .env.example test/mcp.test.js
git commit -m "feat: expose read-only ecosystem MCP"
```

### Task 8: OpenAPI, Documentation, and Public Contract

**Files:**
- Modify: `docs/openapi.yaml`
- Modify: `docs/onegodian-api-route-map.md`
- Modify: `README.md`
- Modify: `package.json`
- Test: all valuation/MCP test files

**Interfaces:**
- REST OpenAPI documents valuation endpoints/scopes.
- README documents MCP endpoint, token requirement, read-only contract and disabled-by-default behavior.

- [ ] **Step 1: Add documentation contract tests**

Assert implemented valuation REST paths are in OpenAPI; README contains `/mcp`, `MCP_SERVICE_TOKEN`, and `read-only`; no write MCP tool names are documented.

- [ ] **Step 2: Run test and verify failure**

Run: `npm test`
Expected: FAIL until docs are updated.

- [ ] **Step 3: Update OpenAPI/route map/README**

Document classifications, value dimensions, staleness, base currency, manual override provenance and snapshot semantics. Distinguish MCP protocol transport from REST routes.

- [ ] **Step 4: Expand syntax checks**

Add valuation and MCP modules to `npm run check`.

- [ ] **Step 5: Run verification and commit**

Run: `npm test && npm run check`
Expected: PASS.

```bash
git add docs/openapi.yaml docs/onegodian-api-route-map.md README.md package.json test
git commit -m "docs: publish valuation and MCP contracts"
```

### Task 9: PostgreSQL Valuation Integration and CI Gate

**Files:**
- Create: `test/ecosystem.valuation.postgres.test.js`
- Modify: `.github/workflows/ci.yml`
- Modify: `package.json`

**Interfaces:**
- Extends the foundation `test:postgres` flow so migrations 001 and 002 run on a clean PostgreSQL service.

- [ ] **Step 1: Write failing integration test**

Create parent business, included child asset and standalone asset; append current valuation records; calculate and persist snapshot; read snapshot back; assert $1,500,000 indicated total fixture, legal-owner partition, immutable snapshot items and FX provenance persistence.

- [ ] **Step 2: Update CI command**

Run valuation integration after all migrations using existing PostgreSQL service and `TEST_DATABASE_URL`.

- [ ] **Step 3: Run CI-equivalent verification**

Run: `DATABASE_URL=... TEST_DATABASE_URL=... npm run migrate && npm run test:postgres && npm test && npm run check`
Expected: PASS including valuation integration and MCP tests.

- [ ] **Step 4: Commit**

```bash
git add test/ecosystem.valuation.postgres.test.js .github/workflows/ci.yml package.json
git commit -m "test: verify valuation persistence on postgres"
```

## Plan Completion Gate

This plan is complete when source-backed valuation records can be persisted, validated, rolled up without parent/child double counting, filtered by legal owner, converted only with explicit FX provenance, snapshotted immutably, exposed through authenticated REST reads/writes, consumed through a disabled-by-default authenticated read-only MCP endpoint, and verified against real PostgreSQL in CI.