# OneGodian API Deployment Runbook

Production service: `https://api.onegodian.org`

## 1. Required runtime

- Node.js `>=20`
- npm
- HTTPS-capable host or reverse proxy
- Environment variable support

## 2. Environment variables

Use `.env.example` as the source template.

Required:

```bash
PORT=3000
NODE_ENV=production
APP_URL=https://api.onegodian.org
CORS_ORIGIN=https://onegodian.org
```

Optional / next-step billing:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
HEALTHCHECK_URL=https://api.onegodian.org
```

## 3. Install and start

```bash
npm install --omit=dev
npm start
```

For local verification before deployment:

```bash
npm install
npm run check
npm test
npm start
```

## 4. Post-deploy verification

Run these after every deployment:

```bash
curl https://api.onegodian.org/health
curl https://api.onegodian.org/ready
curl https://api.onegodian.org/version
curl https://api.onegodian.org/api/products
```

Expected `/ready` checks:

```json
{
  "routes": true,
  "billing": true,
  "products": true,
  "members": true
}
```

## 5. Customer-path smoke test

1. Create a member through `POST /api/members/signup`.
2. Use the returned bearer token against `GET /api/members/me`.
3. Create a billing checkout through `POST /billing/checkout`.
4. Confirm `/api/products` returns available digital products.
5. Create a product checkout through `POST /api/products/checkout`.
6. Confirm returned download token works at `GET /api/products/downloads/:token`.
7. Create an admin user using an email containing `admin` and confirm `/admin/stats` works.

## 6. Billing limitation

Current billing is production-shaped but not yet full Stripe production.

- Without `STRIPE_SECRET_KEY`, checkout returns `mock_checkout`.
- With `STRIPE_SECRET_KEY`, checkout returns `stripe_configured`.
- Real Stripe Checkout Session creation is still required.
- Stripe webhook signature verification is still required.

## 7. Rollback guidance

Rollback should restore the last known working commit and redeploy.

Before major billing or database changes:

- export production environment variables
- back up database records if persistence has been added
- preserve prior commit SHA
- verify `/health`, `/ready`, `/version`, and `/api/products` after rollback

## 8. Current production standard

Do not call a feature operational until it is:

1. implemented
2. versioned
3. documented
4. repeatable
5. logged
6. testable
