# OneGodian API

Node API service for `api.OneGodian.org`.

## Ecosystem connector and valuation work

Approved architecture and implementation planning for Gregory's OneGodian Ecosystem Plugin™ is tracked in:

- `docs/superpowers/specs/2026-09-27-onegodian-ecosystem-connector-design.md`
- `docs/superpowers/plans/2026-09-27-ecosystem-api-foundation.md`
- `docs/superpowers/plans/2026-09-27-ecosystem-valuation-mcp.md`

The architecture keeps `api.onegodian.org` as the cross-site synchronization, aggregation, valuation and MCP authority while connected WordPress/WooCommerce sites remain authoritative for their own source records. Live valuation totals must be source-backed, auditable and protected against parent/child double counting.

## Current implementation status

The ecosystem connector, valuation engine and MCP additions described above are approved for implementation planning but are not production runtime features until their plan tasks, tests, persistence, security controls, OpenAPI updates and deployment gates are completed.

See the existing project documentation under `docs/` for the current API platform, deployment, security, OLLM, Quantum-OHI and route contracts.
