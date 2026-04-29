# OneGodian API

Node API service for `api.onegodian.org`.

## Current status

Version: `0.3.0`

This repo is the first production-oriented API surface for the OneGodian web/application layer. It is intentionally small and deterministic so it can support paid membership, digital products, AI System Prompt products, Algorithm Starter Kit products, and future Protocol API work without becoming ungoverned infrastructure.

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

## Endpoint summary

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

Legacy paths `/api/verify` and `/api/register` are preserved with `307` redirects to the v1 endpoints.

## Live smoke-check commands

```bash
curl https://api.onegodian.org/health
curl https://api.onegodian.org/ready
curl https://api.onegodian.org/version
curl https://api.onegodian.org/api/products
```

## Billing status

Billing routes are production-shaped but not full Stripe production yet.

Current behavior:

- If `STRIPE_SECRET_KEY` is not set, `/billing/checkout` returns `mock_checkout`.
- If `STRIPE_SECRET_KEY` is set, `/billing/checkout` returns `stripe_configured`.
- Real Stripe Checkout Session creation and webhook signature verification remain next-step tasks.

## Testing coverage

`test/app.test.js` covers:

- health, readiness, version
- member signup/login/profile
- billing checkout/webhook/status
- product catalog/checkout/download token
- admin stats authorization
- JSON 404 behavior

Run:

```bash
npm run check
npm test
```

## Production readiness rule

A feature should not be called operational until it is:

1. implemented,
2. versioned,
3. documented,
4. repeatable,
5. logged,
6. testable.

## Next production tasks

1. Add real Stripe Checkout Session creation through the Stripe SDK.
2. Add Stripe webhook signature verification using `STRIPE_WEBHOOK_SECRET`.
3. Persist members, products, orders, billing events, and download tokens in a database.
4. Add password hashing and real session/JWT handling.
5. Add customer-facing product and membership pages on the front end.
6. Add admin analytics dashboard consuming `/admin/stats`.
7. Add OpenAPI documentation.
8. Add request-level auth for protected mutation endpoints beyond development placeholders.
9. Add deployment runbook for the selected Node host.
