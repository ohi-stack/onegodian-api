# OneGodian API

Shared Node API and application-service layer for `api.onegodian.org`, operated by ONEGODIAN, LLC.

## Current status

Version: `0.4.0`
Status: production upgrade in progress
Canonical service: `https://api.onegodian.org`

The repository is the shared API gateway for OneGodian commercial software. It is intentionally versioned and constrained so OneGodian applications can consume common identity, entitlement, commerce, verification, Algorithm and OLLM services without creating incompatible product-specific backends.

The current runtime already exposes early membership, product, billing, Algorithm and verification surfaces. The September 2026 upgrade adds OLLM as a first-class API domain and establishes the production architecture required for durable authentication, persistence, usage metering, billing and developer access.

## Platform domains

- **Platform:** health, readiness, status and versioning
- **Identity:** accounts, sessions, roles and entitlements
- **Commerce:** products, subscriptions, checkout, billing and digital delivery
- **OLLM:** model catalog, multi-model execution, OHI governed synthesis, conversations and usage
- **Algorithm:** versioned alignment/evaluation interfaces
- **Verification:** versioned verification/registration interfaces
- **Operations:** audit, metrics, provider health, webhooks and admin statistics
- **Quantum-OHI™:** admin-protected platform intelligence, health analysis, anomalies, dependencies, recommendations, events, forecasts and audit

See `docs/API-ONEGODIAN-ORG-PLATFORM-ARCHITECTURE-2026-09.md` for the canonical September 2026 architecture and `docs/QUANTUM-OHI-PLATFORM-INTELLIGENCE-2026-09-17.md` for the Quantum-OHI execution boundary.

## OLLM integration

Canonical product architecture:

- Marketing: `onegodian.org/ollm`
- Application: `llm.onegodian.org`
- Shared API: `api.onegodian.org`

Canonical OLLM processing pipeline:

`collect → normalize → analyze → synthesize → validate → output`

The API must preserve individual provider outputs separately from the OHI-governed synthesis and represent partial provider failures explicitly.

Target OLLM interfaces:

- `POST /v1/ollm/synthesize`
- `GET /v1/ollm/models`
- `GET /v1/ollm/conversations`
- `GET /v1/ollm/conversations/:id`
- `GET /v1/ollm/usage`
- `GET /v1/ollm/plan`

These are production targets unless already implemented and tested; documentation must not be treated as proof of runtime availability.

## Runtime requirements

- Node.js `>=20`
- npm

## Local development

```bash
npm install
npm run dev
```

Default port: `3000`.

## Production start

```bash
npm install --omit=dev
npm start
```

## Scripts

```bash
npm start      # run production server
npm run dev    # run watch mode
npm test       # run Node test runner
npm run check  # syntax-check server/app/test entrypoints
npm run health # call /health on a running server
```

## Environment variables

| Variable | Purpose | Default |
| --- | --- | --- |
| `PORT` | HTTP port | `3000` |
| `NODE_ENV` | runtime environment | `development` |
| `APP_URL` | base URL used to generate checkout URLs | `http://localhost:3000` |
| `CORS_ORIGIN` | allowed CORS origin | `*` |
| `HEALTHCHECK_URL` | optional base URL for `npm run health` | `http://127.0.0.1:$PORT` |
| `STRIPE_SECRET_KEY` | enables `stripe_configured` billing posture when present | unset |
| `STRIPE_WEBHOOK_SECRET` | reserved for real Stripe webhook signature verification | unset |

Production deployments must replace permissive development defaults with explicit origin allowlists and approved secret-management practices.

## Currently documented runtime endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | service identity |
| `GET` | `/health` | healthcheck |
| `GET` | `/ready` | readiness checks for routes, billing, products, and members |
| `GET` | `/version` | service name and version |
| `GET` | `/api/status` | runtime status |
| `GET` | `/api/v1/profile` | OneGodian API profile |
| `POST` | `/api/v1/alignment/evaluate` | evaluate candidate options under the OneGodian Algorithm decision rule |
| `POST` | `/api/v1/verify` | development verification placeholder |
| `POST` | `/api/v1/register` | development registration placeholder |
| `POST` | `/api/members/signup` | create development member token |
| `POST` | `/api/members/login` | create development member token for existing or new email |
| `GET` | `/api/members/me` | return authenticated member profile |
| `POST` | `/billing/checkout` | subscription checkout route; mock mode until Stripe sessions are implemented |
| `POST` | `/billing/webhook` | billing webhook ingestion route |
| `GET` | `/billing/status` | authenticated billing status route |
| `GET` | `/api/products` | digital product catalog |
| `POST` | `/api/products/checkout` | digital product checkout route with temporary download token |
| `GET` | `/api/products/downloads/:token` | temporary protected download authorization |
| `GET` | `/admin/stats` | admin-only operational stats |
| `GET` | `/admin/quantum-ohi` | Quantum-OHI module identity and route discovery |
| `GET` | `/admin/quantum-ohi/overview` | platform intelligence overview |
| `GET` | `/admin/quantum-ohi/platform-health` | health dimensions and current snapshot |
| `GET` | `/admin/quantum-ohi/anomalies` | evidence-backed anomaly results |
| `GET` | `/admin/quantum-ohi/dependencies` | platform dependency map |
| `GET` | `/admin/quantum-ohi/recommendations` | analysis-only recommendations |
| `GET` | `/admin/quantum-ohi/events` | intelligence event view |
| `GET` | `/admin/quantum-ohi/forecasts` | forecast interface |
| `GET` | `/admin/quantum-ohi/audit` | audit contract and records |
| `GET` | `/admin/quantum-ohi/settings` | read-only intelligence-layer settings |

Legacy paths `/api/verify` and `/api/register` are preserved with `307` redirects to the v1 endpoints.

## Authentication direction

Production identity should support email authentication, Google OAuth where configured, secure session lifecycle, role-based authorization and server-side entitlement enforcement. OpenAI model access is a provider/API integration concern and should not be represented as consumer OpenAI account login unless a supported identity flow is separately implemented.

## Developer/API-key direction

After production auth and persistence are complete, business/developer credentials should be scoped rather than universal. Candidate scopes include `ollm:execute`, `ollm:read`, `usage:read`, `products:read` and `verification:read`.

Upstream provider keys must remain server-side.

## Live smoke-check commands

```bash
curl https://api.onegodian.org/health
curl https://api.onegodian.org/ready
curl https://api.onegodian.org/version
curl https://api.onegodian.org/api/products
```

## Billing status

Billing routes are production-shaped but not full Stripe production yet.

Current documented behavior:

- If `STRIPE_SECRET_KEY` is not set, `/billing/checkout` returns `mock_checkout`.
- If `STRIPE_SECRET_KEY` is set, `/billing/checkout` returns `stripe_configured`.
- Real Stripe Checkout Session creation, durable order persistence, idempotency and webhook signature verification remain production requirements.

## Security baseline

Production API behavior must include input/schema validation, protected-route authentication, authorization/entitlement checks, rate limiting, request IDs, structured/redacted logs, production CORS allowlists, verified webhooks, idempotency for replay-sensitive mutations and server-side secret isolation.

## Testing coverage

Current `test/app.test.js` coverage includes:

- health, readiness, version
- member signup/login/profile
- billing checkout/webhook/status
- product catalog/checkout/download token
- admin stats authorization
- Quantum-OHI admin authorization and analysis-only boundary
- JSON 404 behavior

Run:

```bash
npm run check
npm test
```

OLLM runtime tests must be added as its routes are implemented, including full success, partial provider failure, timeout, validation failure, authorization and plan-limit cases.

## Production readiness rule

A feature should not be called operational until it is:

1. implemented,
2. versioned,
3. documented,
4. repeatable,
5. logged/observable,
6. testable,
7. authenticated/authorized where required,
8. persistently backed where required.

## Immediate production tasks

1. Add durable database persistence for accounts, products, orders, billing events, OLLM conversations, executions, usage and download authorizations.
2. Replace development member tokens with production authentication/session handling and Google OAuth where configured.
3. Add real Stripe Checkout Session creation, webhook signature verification and idempotency.
4. Implement OLLM model catalog and `/v1/ollm/synthesize` integration with the `onegodian-llm` runtime.
5. Persist OLLM conversation/history and usage metering.
6. Add rate limiting, production CORS allowlist and structured audit logging.
7. Add OpenAPI documentation validated against implemented routes.
8. Connect real telemetry feeds to Quantum-OHI™, then expose evidence-backed health, anomaly, dependency and recommendation data to the operator dashboard.
9. Bridge approved Quantum-OHI recommendations into ACC workflows without granting Quantum-OHI direct mutation authority.
10. Keep deployment and rollback documentation synchronized with the actual hosting environment.

## Organizational boundary

`api.onegodian.org` is commercial/software infrastructure of ONEGODIAN, LLC. API responses do not independently create religious membership, governmental or sovereign status, financial authority, title, ownership, patent rights, or third-party legal/institutional recognition. INO religious and internal-governance functions remain organizationally separate unless a specific interface is expressly documented and authorized.
