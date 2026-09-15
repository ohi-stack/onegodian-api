# OMOS Integration Status — 2026-09-15

## Repository role

`ohi-stack/onegodian-api` owns broader OneGodian API and service boundaries. It is not the canonical OMOS runtime.

Canonical OMOS runtime/site source: `ohi-stack/omos-site/main`  
Canonical production target: `https://omos.onegodian.com`

## Integration contract

OMOS may consume OneGodian API services through source-of-record-aware connectors. API records should retain their originating system ownership, identifiers, timestamps, provenance, permissions, sync direction, conflict policy, and audit events.

The normalized boundary is:

`OneGodian API → OMOS connector/adapter → OMOS runtime → Algorithm/Council → Human Gate → authorized action → result/provenance → Decision Record`

Synchronization does not establish truth, ownership, or authority. Read access does not imply write access.

## Current OMOS target

The canonical OMOS repository targets runtime `1.1.0` with normalized provider contracts, durable PostgreSQL Decision Records, strict production preflight, owner isolation, audit chaining, MCP authorization hardening, and OMOS-REF-0001 verification tooling.

## Production boundary

As of September 15, the canonical OMOS host was still observed on runtime `1.0.1` while the repository target is `1.1.0`. API integrations should target the current source contract and must not assume current-main behavior is already live until production parity is verified.
