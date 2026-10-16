# O-H-I Command Center: Responsive UI & Protected Admin Dashboard

Record date: 2026-10-11
Repository: ohi-stack/onegodian-api
Status: Implementation candidate; not deployed or production-authenticated.

## Public console upgrade

The existing public routes (/, /status, /docs, /developers, /services, /integrations) now use a compact, accessible mobile menu, improved cards, clearer responsive metrics, keyboard Escape behavior and a skip link. The six public destinations continue to be served by Express. The machine endpoints /health, /manifest, /version, /api/status, and /v1/* retain their existing JSON contracts.

## New protected administrative pages

/admin (overview dashboard), /admin/health, /admin/sites, /admin/plugins, /admin/services, /admin/tools, /admin/mcp, /admin/adapters, /admin/events, /admin/audit, /admin/oips, /admin/security, and /admin/settings.

The admin interface offers responsive sidebar navigation, runtime KPI widgets, session-local latency chart, recent browser observations, evidence-based registry status cards, a registry filter, and read-only platform references.

The browser reads same-origin /health, /version, /api/status, /ready and /manifest. Browser observations are NOT platform audit records. Unconnected sites, plugins, ACC, MCP, tools, events, OIPS and other services show Unknown / Not reported rather than fabricated data or operational counts.

## Security / production restriction

The existing API authentication is in-memory, development-only and cannot support production authorization. Every admin page is explicitly protected using the existing requireAuth + requireAdmin middleware. Anonymous returns JSON 401; non-admin 403; and NODE_ENV=production returns JSON 503 even for a development admin bearer token. Administrator HTML is private/no-store with Vary: Authorization, noindex headers, and CSP-compliant external JavaScript. No new credential storage or administrative mutation is introduced.

Production activation of the admin dashboard requires independently verified persistent authentication/session management, human-reviewed RBAC, MFA, CSRF protection where cookie sessions are used, revocation, scoped actions, audit recording and production browser/site acceptance. ACC and human-approval boundaries remain mandatory for action execution.

## Required verification

1. Run npm install --no-audit --no-fund, npm run check and npm test.
2. Inspect public mobile layouts at 375, 430, 768, 1024 and 1440 CSS-pixel widths, including keyboard Tab, Enter and Escape.
3. Confirm public routes, console assets and machine JSON endpoints still resolve correctly.
4. Confirm administrator routes return 401/403 for unauthorized callers and 503 in production.
5. Confirm authorized development administrator sections display only read-only authoritative observations.
6. Verify unavailable upstream observations never become fabricated health, compliance or audit outcomes.
7. Validate the deployed commit, TLS/reverse proxy routing and browser rendering after approved merge and release.

This change is source control only and does not itself deploy the website. For rollback, redeploy the previously recorded live commit and reverify /health, /manifest, /version, machine APIs, public navigation and admin access restrictions.
