# OneGodian API Security Notes

## Current security posture

This API is an early production-oriented backend surface. It already includes:

- Express security headers through `helmet`
- CORS configuration through `CORS_ORIGIN`
- JSON body size limit of `1mb`
- request ID generation and response header propagation
- Zod validation for public payloads
- bearer-token middleware for protected member routes
- admin middleware for `/admin/stats`
- temporary download-token expiry checks

## Known limitations

The following items must be resolved before calling billing, membership, or protected downloads fully production-grade:

1. Passwords are accepted but not persisted with hashing.
2. Member sessions are in-memory development tokens, not durable JWT/session records.
3. Products, billing events, users, and download tokens are in-memory only.
4. Stripe Checkout Session creation is not implemented yet.
5. Stripe webhook signature verification is not implemented yet.
6. Download URLs are placeholder paths until secured object storage is added.
7. Admin role assignment is currently development-only and based on email containing `admin`.

## Required production controls

### Secrets

- Never commit real `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` values.
- Store secrets only in the hosting provider environment settings.
- Rotate keys after exposure, personnel changes, or production incident.

### Billing

Before live billing:

- add the Stripe SDK
- create real Checkout Sessions server-side
- verify webhook signatures using `STRIPE_WEBHOOK_SECRET`
- persist Stripe customer, session, payment intent, and order IDs
- issue download tokens only after confirmed payment events

### Authentication

Before paid membership:

- hash passwords with a production-grade password hashing library
- issue signed sessions/JWTs
- add session expiration
- replace development admin assignment with explicit RBAC
- rate-limit auth endpoints

### Downloads

Before selling protected downloads:

- store files in private object storage
- issue short-lived signed URLs
- persist download-token records
- enforce expiry
- log redemption events

### Logging

Production logs should include:

- request ID
- timestamp UTC
- route
- response status
- actor/user when authenticated
- billing event IDs
- checkout session IDs
- download-token creation and redemption events

Avoid logging:

- passwords
- full card or payment details
- secret keys
- raw webhook secrets
- long-lived bearer tokens

## Minimum go-live gate

Before public revenue launch, confirm:

```bash
npm run check
npm test
```

Then verify:

```bash
curl https://api.onegodian.org/health
curl https://api.onegodian.org/ready
curl https://api.onegodian.org/version
curl https://api.onegodian.org/api/products
```

## Security principle

A route is not production-secure merely because it responds successfully. It must be authenticated, authorized, validated, logged, repeatable, and tested according to the risk level of the action it performs.
