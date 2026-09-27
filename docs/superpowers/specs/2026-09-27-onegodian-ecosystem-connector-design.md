# Gregory's OneGodian Ecosystem Plugin™ + api.OneGodian.org Ecosystem Data Architecture

Date: 2026-09-27
Status: Design specification for implementation planning
Operator: ONEGODIAN, LLC
Canonical API authority: `https://api.onegodian.org`
Primary WordPress edge component: Gregory's OneGodian Ecosystem Plugin™

## 1. Purpose

Build a reusable OneGodian ecosystem data layer that allows authorized WordPress properties to securely report product, commerce, operational, integration, health and valuation-source data to `api.onegodian.org`.

The API is the cross-site synchronization, aggregation, analytics and MCP authority. Each WordPress installation remains authoritative for its own local source records. The system must not fabricate missing data or convert conceptual projects into measured economic value.

## 2. Architectural decision

Use an API-first edge-connector model.

```text
WordPress / WooCommerce properties
        ↓
Gregory's OneGodian Ecosystem Plugin™
        ↓ signed HTTPS + webhooks + reconciliation
api.onegodian.org
        ↓
registry + products + metrics + events + valuation + MCP
        ↓
operator dashboards / ACC / O-H-I™ / authorized applications
```

Rejected alternatives:

1. Site-to-site mesh: difficult to secure, audit, version and operate.
2. Central direct database reads: overexposes WordPress databases and couples the platform to local schemas.

## 3. System boundaries

### WordPress plugin responsibilities

- register the site/node;
- detect and expose supported adapters;
- normalize approved local records;
- collect WooCommerce product/catalog data;
- collect approved aggregate commerce statistics;
- emit signed ecosystem events;
- maintain local sync queue and retry state;
- report plugin/site/system health;
- provide local admin status, settings and audit visibility;
- never expose WordPress database credentials to the central API.

### api.onegodian.org responsibilities

- authenticate registered nodes;
- maintain canonical site registry;
- ingest normalized product records and metrics;
- maintain cross-site product and asset indexes;
- persist ecosystem events and sync state;
- aggregate analytics;
- calculate source-backed valuation views;
- maintain historical valuation snapshots;
- expose authorized MCP tools and dashboard APIs;
- preserve provenance and prevent double-counting.

## 4. WordPress plugin identity

Product name: Gregory's OneGodian Ecosystem Plugin™
Technical name: OneGodian Ecosystem Connector
Suggested slug: `gregory-onegodian-ecosystem`
PHP namespace: `OneGodian\\Ecosystem`
WordPress REST namespace: `/wp-json/onegodian-ecosystem/v1/`

The existing `onegodian-platform-plugin` remains the shared infrastructure parent/plugin framework. The ecosystem connector should consume its reusable REST, registry, system-health, dashboard and audit primitives where practical rather than duplicate them.

## 5. Adapter model

The connector must expose a stable adapter contract so integrations can be added without modifying the core collector.

Minimum adapter interface:

- `identify()`
- `capabilities()`
- `health()`
- `collect()`
- `normalize()`
- `sync()`
- `handle_event()`

Initial adapters:

1. WordPress Core
2. WooCommerce
3. OneGodian Platform Plugin registry/system health

Future adapters may include OneGodian Members, U-OneGodian LMS, ALLATYME, ODIN, OBP-1, OneGodian Time, ODeFi, Algonquian Engine, KeyAura, QR-V and other approved services.

## 6. Node registration and authentication

Each installation receives a durable node identity:

- `site_id`
- `installation_uuid`
- `client_id`
- secret or key material
- public key/fingerprint where asymmetric signing is used
- environment
- scopes
- registration status

Signed requests should carry:

- `X-OneGodian-Site`
- `X-OneGodian-Timestamp`
- `X-OneGodian-Nonce`
- `X-OneGodian-Signature`

Server validation order:

`signature → timestamp → nonce → scope → node status → payload integrity`

Required controls:

- TLS;
- replay protection;
- key rotation and revocation;
- rate limiting;
- secret redaction;
- audit logs;
- WordPress capability checks;
- no secrets exposed to browser JavaScript.

## 7. Product synchronization

WooCommerce remains the local authority for local commerce records.

Normalized product representation should support:

- ecosystem/global product UUID;
- local product ID;
- site ID and source URL;
- SKU;
- name;
- product type;
- publication/status state;
- regular and sale price;
- currency;
- stock quantity and stock status;
- categories and tags;
- canonical product URL;
- media references;
- created/modified timestamps;
- aggregate units sold;
- aggregate gross sales;
- aggregate refunds;
- aggregate net sales;
- aggregate order count;
- source checksum/version.

Customer PII is not required for ecosystem product analytics and must not be ingested by default.

## 8. Sync strategy

Use event-driven sync plus scheduled reconciliation.

### Event-driven

Local WordPress/WooCommerce event → normalize → enqueue → sign → POST to API → acknowledge → mark synchronized.

Initial events:

- `site.registered`
- `site.heartbeat`
- `adapter.activated`
- `product.created`
- `product.updated`
- `product.deleted`
- `order.completed.aggregate`
- `inventory.changed`
- `sync.failed`
- `sync.recovered`

### Reconciliation

Run scheduled reconciliation to compare source timestamps/checksums and transmit only changed records. Reconciliation must repair missed events without requiring a full catalog resend on every run.

## 9. API route family

Proposed durable routes:

- `POST /v1/ecosystem/sites/register`
- `POST /v1/ecosystem/sites/heartbeat`
- `GET /v1/ecosystem/sites`
- `GET /v1/ecosystem/sites/:site_id`
- `POST /v1/ecosystem/products/sync`
- `GET /v1/ecosystem/products`
- `GET /v1/ecosystem/products/:product_id`
- `POST /v1/ecosystem/metrics/sync`
- `GET /v1/ecosystem/metrics`
- `POST /v1/ecosystem/events`
- `GET /v1/ecosystem/events`
- `GET /v1/ecosystem/adapters`
- `POST /v1/ecosystem/sync/run`
- `GET /v1/ecosystem/sync/status`
- `POST /v1/ecosystem/webhooks/register`
- `POST /v1/ecosystem/webhooks/test`

Routes are not considered production until implemented, authenticated/authorized, persisted, tested, observable and represented accurately in OpenAPI.

## 10. OneGodian Ecosystem Valuation Engine™

Valuation is a first-class platform service, but no single headline value may exist without its underlying records and methodology.

### Required headline views

The dashboard should distinguish at minimum:

1. Documented Net Asset Value
2. Calculated Operating / Enterprise Value
3. Total Ecosystem Indicated Value
4. Valuation coverage percentage
5. Unvalued registered assets count

### Valuation record schema

Each valued asset requires:

- `asset_id`
- `asset_name`
- `asset_type`
- `legal_owner`
- `source_site`
- `source_system`
- `source_record_id`
- `valuation_amount`
- `currency`
- `valuation_method`
- `valuation_basis`
- `valuation_source`
- `valuation_date`
- `effective_date`
- `verification_status`
- `confidence_level`
- `gross_value`
- `associated_liabilities`
- `net_value`
- manual override flag, reason, actor and timestamp where applicable
- record timestamps and version/provenance metadata

### Valuation classifications

- Documented Value
- Calculated Value
- Owner-Estimated Value
- Third-Party Appraisal
- Historical Value
- Conceptual / Unvalued

Conceptual / Unvalued records may appear in the registry but must contribute zero to live valuation totals until a supported valuation basis exists.

### Valuation categories

The engine may aggregate approved values across:

- operating businesses;
- real estate equity;
- cash and financial assets;
- inventory;
- equipment;
- vehicles;
- domains;
- websites/platforms;
- software/plugins;
- intellectual property;
- media catalogs;
- digital products;
- recurring/contracted revenue rights where appropriately valued;
- other documented assets;
- applicable liabilities.

### Required valuation controls

- source provenance for every amount;
- no double counting across parent/company/platform/asset views;
- legal-owner separation;
- gross and net values kept distinct;
- liabilities deducted only where applicable to the represented asset/value method;
- currency conversion records source FX rate, rate timestamp and base currency;
- valuation methods are explicit and inspectable;
- historical snapshots are immutable audit records;
- manual overrides never silently replace source-backed records;
- stale values are flagged;
- unsupported historical declarations remain historical claims, not live measured valuation.

A product price multiplied by stock quantity may support inventory retail-value views but must not automatically be treated as business enterprise value.

## 11. Valuation API

Proposed routes:

- `GET /v1/ecosystem/valuation/summary`
- `GET /v1/ecosystem/valuation/breakdown`
- `GET /v1/ecosystem/valuation/assets`
- `GET /v1/ecosystem/valuation/assets/:asset_id`
- `GET /v1/ecosystem/valuation/businesses/:business_id`
- `GET /v1/ecosystem/valuation/history`
- `GET /v1/ecosystem/valuation/unvalued`
- `GET /v1/ecosystem/valuation/sources`
- `POST /v1/ecosystem/valuation/records`
- `POST /v1/ecosystem/valuation/recalculate`

Mutation routes require privileged scopes and auditable authorization.

## 12. MCP surface

`api.onegodian.org` is the primary MCP authority. WordPress sites should not independently expose unrestricted MCP servers to external clients.

Read-oriented tools:

- `onegodian.ecosystem.list_sites`
- `onegodian.ecosystem.get_site`
- `onegodian.products.search`
- `onegodian.products.get`
- `onegodian.products.stats`
- `onegodian.analytics.overview`
- `onegodian.analytics.timeseries`
- `onegodian.connections.list`
- `onegodian.connections.status`
- `onegodian.events.search`
- `onegodian.sync.status`
- `onegodian.adapters.list`
- `onegodian.system.health`
- `onegodian.valuation.total`
- `onegodian.valuation.breakdown`
- `onegodian.valuation.asset`
- `onegodian.valuation.business`
- `onegodian.valuation.history`
- `onegodian.valuation.unvalued_assets`
- `onegodian.valuation.sources`

Write tools must use separate privileged scopes and explicit authorization. Financial movement, legal title changes, final transaction execution and other high-impact actions remain outside automatic MCP authority unless separately implemented with human approval controls.

## 13. Dashboard requirements

Operator dashboard modules:

- Total Ecosystem Indicated Value
- Documented Net Asset Value
- Calculated Operating / Enterprise Value
- Valuation coverage
- connected sites
- site health
- products
- orders and aggregate commerce metrics
- valuation by legal owner
- valuation by business/platform
- valuation by asset class
- valuation history
- unvalued/stale assets
- adapters/connections
- event feed
- sync queue/failures
- API/webhook health
- audit log

Every total must drill down to its component records and provenance.

## 14. Error handling

- queue transient failures;
- exponential retry with bounded attempts;
- dead-letter/failed-event visibility;
- idempotency keys on replay-sensitive mutations;
- partial-sync status must be explicit;
- stale or disconnected sites must not be represented as current;
- missing valuation evidence returns unvalued/uncomputed state, not synthetic numbers.

## 15. Testing strategy

Minimum test layers:

- adapter contract tests;
- WooCommerce normalization tests;
- signing and replay-protection tests;
- idempotency tests;
- reconciliation tests;
- valuation formula/unit tests;
- duplicate-prevention tests;
- legal-owner partition tests;
- currency-conversion provenance tests;
- stale-data tests;
- API schema/OpenAPI contract tests;
- MCP authorization tests;
- WordPress capability/security tests.

## 16. V1 scope

V1 is complete when one authorized WordPress/WooCommerce property can:

1. register with `api.onegodian.org`;
2. authenticate with signed requests;
3. report heartbeat/system health;
4. sync normalized products;
5. send aggregate commerce metrics without default customer PII;
6. emit/retry ecosystem events;
7. expose adapter and sync status in WordPress admin;
8. create source-backed valuation records;
9. calculate documented, calculated and indicated valuation views without double counting;
10. expose valuation/product/site read APIs and MCP tools;
11. retain immutable valuation history/audit provenance;
12. pass the defined test and security gates.

## 17. Non-goals for V1

- direct site-to-site database access;
- automatic legal appraisal designation;
- automatic securities valuation or investment recommendation;
- automatic transfer of funds or title;
- unrestricted customer-level personal-data ingestion;
- arbitrary MCP write authority;
- treating conceptual OneGodian projects as measured assets without valuation evidence.

## 18. Production definition of done

The ecosystem/valuation feature family is production-ready only when persistence, authentication, signing, scopes, rate limits, event retry/idempotency, WooCommerce normalization, valuation provenance, duplicate prevention, historical snapshots, OpenAPI, tests, monitoring, audit logs, rollback documentation and deployment instructions are operational.

Implementation should proceed from this specification only after written review and an implementation plan are approved.
