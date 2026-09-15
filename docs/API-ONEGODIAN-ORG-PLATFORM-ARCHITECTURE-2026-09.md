# api.OneGodian.org — Platform Architecture

Updated: 2026-09-15
Status: Production-upgrade specification
Operator: ONEGODIAN, LLC
Canonical service: `https://api.onegodian.org`

## Mission

`api.onegodian.org` is the shared commercial API gateway and application-service layer for the OneGodian software ecosystem. It must provide stable, versioned, authenticated and observable interfaces that products can consume without duplicating core account, entitlement, billing, product, verification and OLLM contracts.

It is infrastructure, not a marketing website and not an internal governance body.

## Canonical architecture

```text
OneGodian applications / websites
          ↓
    api.onegodian.org
          ↓
┌──────────────────────────────────────────┐
│ Identity & Access                       │
│ Accounts / Sessions / Roles             │
├──────────────────────────────────────────┤
│ Products / Plans / Entitlements         │
│ Billing / Usage / Checkout              │
├──────────────────────────────────────────┤
│ OLLM API                                │
│ Multi-model execution                   │
│ OHI governed synthesis                  │
├──────────────────────────────────────────┤
│ Verification / Registry interfaces      │
│ Algorithm evaluation                    │
├──────────────────────────────────────────┤
│ Audit / Health / Metrics / Versioning   │
└──────────────────────────────────────────┘
          ↓
 Databases / approved provider services
```

## v1 route families

### Platform
- `GET /health`
- `GET /ready`
- `GET /version`
- `GET /api/status`
- `GET /api/v1/profile`

### Identity and accounts
- account creation and login
- authenticated account profile
- session lifecycle
- roles and entitlements
- OAuth-backed identity where supported

### OLLM
- `POST /v1/ollm/synthesize`
- `GET /v1/ollm/models`
- `GET /v1/ollm/conversations`
- `GET /v1/ollm/conversations/:id`
- `GET /v1/ollm/usage`
- `GET /v1/ollm/plan`

OLLM processing contract:

`collect → normalize → analyze → synthesize → validate → output`

Provider outputs must remain distinguishable from the OHI-governed synthesis. Partial provider failures must be represented explicitly rather than silently discarded.

### Algorithm / verification
- `POST /api/v1/alignment/evaluate`
- versioned verification endpoints
- versioned registration endpoints

These interfaces must not imply external legal, governmental, financial, patent, or institutional recognition merely because a record exists in a OneGodian system.

### Commerce
- products
- subscriptions
- checkout
- billing status
- webhook ingestion
- protected digital-delivery authorization

Production billing requires real processor session creation, verified webhooks, durable persistence and idempotency. Mock checkout behavior is development-only.

## Authentication standard

Launch identity requirements for consumer applications:

1. Email authentication.
2. Google OAuth where configured.
3. Secure session lifecycle.
4. Role-based authorization.
5. Plan and entitlement enforcement server-side.

OpenAI account authentication is not a required launch dependency. OpenAI model access is a provider/API integration concern unless a supported identity flow is separately implemented.

## API key architecture

Business/developer access should support scoped API credentials after the underlying auth and persistence layers are production-ready.

Recommended scopes:
- `ollm:execute`
- `ollm:read`
- `usage:read`
- `products:read`
- `verification:read`

Mutation scopes should be narrowly granted and separately documented.

Never expose upstream model-provider credentials to clients.

## Versioning

New durable interfaces should use explicit API versioning. Breaking contract changes require a new version or documented migration path. Legacy routes may redirect during a published compatibility period.

## Security baseline

- TLS at the deployment edge.
- Secrets stored only in approved server-side environment/secret infrastructure.
- No secrets in repository history, logs or client responses.
- Input validation and schema enforcement.
- Authentication for protected routes.
- Authorization and entitlement checks for paid or privileged functions.
- Rate limiting and abuse controls.
- Request/execution IDs.
- Structured logs with sensitive-field redaction.
- Webhook signature verification.
- Idempotency for billing and other replay-sensitive mutations.
- CORS allowlist in production; do not rely on `*` for authenticated browser applications.

## Observability

Every production service should expose or internally capture:
- service/version identifier;
- health/readiness state;
- request ID;
- execution duration;
- route status code;
- provider status for OLLM executions;
- safe error classification;
- usage/metering event where applicable.

## Dashboard requirement

A future operator-facing API dashboard should consume these interfaces rather than maintain a second source of truth. Recommended dashboard modules:

- API Health
- Applications
- Users
- API Keys
- OLLM Executions
- Provider Health
- Usage
- Billing
- Products
- Verification
- Audit Logs
- Webhooks
- Documentation
- Settings

## Documentation portal

The public developer surface should eventually provide:
- Getting Started
- Authentication
- API Reference
- OLLM
- Algorithm
- Verification
- Products
- Webhooks
- Errors
- Rate Limits
- Changelog
- Status

An OpenAPI document should be generated from or validated against implemented routes. Documentation must not advertise endpoints that are not implemented.

## Organizational boundary

`api.onegodian.org` is operated as commercial/software infrastructure of ONEGODIAN, LLC. Software responses do not independently create religious membership, governmental status, sovereign status, financial authority, title, ownership, or third-party legal recognition. Any INO religious or internal-governance functions remain organizationally separate unless an explicitly documented interface is authorized for that purpose.

## Production Definition of Done

A route family is production only when it is implemented, versioned, documented, authenticated/authorized where required, persistently backed where required, observable, tested and repeatable.

`api.onegodian.org` as a platform should not be designated fully production-ready until:

- durable database persistence is operational;
- production authentication/session handling is operational;
- Stripe or other approved billing integration uses real sessions and verified webhooks;
- OLLM provider execution and governed synthesis are implemented;
- rate limiting and production CORS policy are enabled;
- OpenAPI reflects implemented routes;
- CI tests pass;
- deployment and rollback are documented;
- monitoring is active;
- secrets and privileged operations have been reviewed.

## Immediate implementation order

1. Durable persistence.
2. Production authentication and sessions.
3. Stripe checkout + verified webhook + idempotency.
4. OLLM model catalog and `/v1/ollm/synthesize` runtime integration.
5. Conversation/history and usage persistence.
6. Rate limiting, CORS allowlist and audit logging.
7. OpenAPI and developer documentation.
8. Operator dashboard integration.

This order prioritizes operational capability and recurring-revenue infrastructure over expansion of unimplemented API concepts.
