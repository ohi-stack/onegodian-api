# O-H-I Command Center at api.OneGodian.org

Status: In development
Prepared: 2026-10-04
Runtime owner: ohi-stack/onegodian-api
Design reference: OHI Command Center Sites source, commit 7144b8efa7e00304523bf2d5f67b732a55606cb6

## Implementation boundary

The existing Express API serves the frontend at `/`, `/status`, `/docs`, `/developers`, `/services`, and `/integrations`. `/health` combines the previous root identity fields with the existing health schema. `/manifest` reports implemented route inventory and unknown registry evidence. `/v1/*` aliases existing `/api/v1/*` handlers internally, preserving method, body, headers and queries. No machine API is relocated into the frontend and no wildcard HTML fallback is added.

Human: console → ACC registration / permissioning / approval → API → authorized services.
Machine: health / manifest / versioned APIs → existing API service.

The interface borrows the Sites source's obsidian, gold and violet visual system, cards, monitors, chart treatment and authority diagram. It is a dependency-free Express frontend adaptation, not a second Next/Worker deployment or a full import of the separate ACC backend.

## Evidence and access

- Health, version and runtime cards use actual same-origin JSON responses.
- Chart measurements and observation activity are local to this browser session; they do not represent historical uptime or a platform audit log.
- ACC, tool registry, integrations, platform activity and OIPS compliance remain unknown. There are no fabricated service counts or compliance passes.
- Developer controls are read-only evidence/documentation links. Tool execution authority remains with ACC.
- Existing machine/auth/billing/Quantum-OHI behavior is retained. Existing admin role assignment from email and unchecked passwords are development-only and block a production administration claim.
- New `/admin` HTML requires the existing bearer authorization and admin role. Even with those credentials, it is disabled in production (503) until a separately reviewed production identity implementation exists. Unauthenticated administration requests return JSON 401, never public HTML.
- No database migrations, payments, secret provisioning, DNS changes or live deployment are performed by this candidate.

## Candidate validation

Run `npm run check` and `npm test`. Regression coverage checks HTML public routes, security headers, combined health fields, manifest ownership and unknown OIPS evidence, JSON assets and 404 behavior, canonical aliases including POST validation and Belief Mapper, and administration boundaries. Local verification: `npm run check` passed; `npm test` passed all 15 tests. A Playwright rendering attempt was blocked because Chromium is not installed, so no visual or browser-interaction pass is claimed. A browser smoke test must also check rendered mobile/desktop views, refresh and empty/error behavior before calling the public UI verified live.

## Production acceptance

1. Obtain explicit approval for the exact commit and api.OneGodian.org target.
2. Record the current deployed commit, hosting configuration and restart/redeploy method. Hosting credentials and deployment ownership are not available in this checkout.
3. Deploy through the existing API host, including `public/console/`, and preserve the API environment. The reverse proxy must forward `/`, public console paths, assets and machine/admin paths to this Express service without sending API routes to a separate SPA.
4. Verify HTML at the six public console routes and JSON at `/health`, `/manifest`, `/version`, `/api/status`, existing API routes and canonical `/v1/profile` and `/v1/belief-mapper/questions`.
5. Verify validation errors on canonical POST aliases and JSON 401 on unauthenticated admin requests. Do not exercise mutating development auth or billing flows against production merely for a smoke test.
6. Inspect CSP, mobile/desktop rendering, keyboard access, refresh behavior and unavailable-feed labels. Confirm the served commit matches the approved candidate.
7. Require independent production authentication/RBAC work before enabling the administration UI. Require actual ACC/registry/OIPS telemetry before representing those capabilities as integrated or compliant.

## Rollback

Restore the previously recorded deployed commit through the same hosting workflow, then verify health, version and existing machine API endpoints. This restores the prior JSON root. Clients that read identity from `/` must migrate to `/health` before rollout; rollback should be coordinated with those consumers. This candidate introduces no persistent data changes. Keep production environment values unchanged.
