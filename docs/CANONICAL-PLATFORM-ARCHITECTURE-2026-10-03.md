# OneGodian Canonical Digital Architecture — 2026-10-03

This document is the current cross-repository architecture contract for the OneGodian digital platform.

## Governing hierarchy

```text
ONEGODIAN, LLC
      ↓
OneGodian Platform
      ↓
api.OneGodian.org
      ↓
Plugins • Connections • Adapters • MCP
      ↓
Specialized OneGodian Properties
```

The former standalone **OneGodian App / `app.onegodian.com` is retired**. It is not an active deployment target, navigation destination, synchronization authority, manifest dependency, or platform requirement.

## Canonical properties

| Layer | Canonical domain | Primary role |
|---|---|---|
| ORGANIZATION | `OneGodian.org` | Public identity, mission, history, membership, records, educational explanations, institutional/public information |
| STORE | `OneGodian.com` | Products, digital downloads, merchandise, certificates, services, campaigns, member purchases |
| EDUCATION | `u.OneGodian.com` | University, courses, lessons, learning paths, books, OneGodianese Dictionary, digital e-learning products, student merchandise, onboarding, training certificates |
| GALAXY | `galaxy.OneGodian.com` | Galaxy map, planets, world stores, lore, characters, media, planetary navigation |
| CAPITAL | `ODeFi.OneGodian.com` | ONEGODIAN, LLC finance materials, capital strategy, disclosure center, contributor information, approved financial-platform functions |
| PROTOCOL | `OMOS.OneGodian.com` | OMOS protocol/specification, alignment tools, developer documentation, integrations, API framework |
| SHARED PLATFORM CORE | `api.OneGodian.org` | Cross-site API, authentication, connectors, adapters, MCP, data/product synchronization, analytics, valuation, webhooks, registries, shared plugin services |

## Shared platform services

`api.OneGodian.org` is the technical backbone for:

- authentication and identity handoffs;
- site/plugin registration;
- connectors and provider integrations;
- adapter contracts;
- event delivery and webhooks;
- product/data synchronization;
- analytics and health;
- valuation services;
- ODIN / QR-V / OBP-1 registry and verification integration;
- Knowledge / RAG retrieval services;
- tool registry and approved actions;
- OneGodian MCP Gateway™.

## OneGodian MCP Gateway™

**OneGodian MCP Gateway™** is the central MCP entry point through `api.OneGodian.org`.

Specialized WordPress properties and plugins do not become independent ecosystem-wide MCP servers. They expose approved capabilities, manifests, health, events, and tool metadata to the shared core. The gateway applies authentication, permissions/scopes, policy, approval requirements, and auditability before routing approved operations through connectors/adapters.

```text
Runtime / Model / ACC
        ↓
OneGodian MCP Gateway™
        ↓
api.OneGodian.org
        ↓
Tool Registry + Permission/Scope Check
        ↓
Connector / Adapter
        ↓
Authorized Target System
        ↓
Result + Verification + Audit
```

Write-capable or consequential operations require stronger scopes and human approval where defined by the target system's policy.

## Gregory’s OneGodian Ecosystem Plugin™

Gregory’s OneGodian Ecosystem Plugin™ is the distributed WordPress integration layer of the OneGodian Platform.

Its role is to connect authorized WordPress properties to `api.OneGodian.org` for:

- site registration and signed API communication;
- WordPress / WooCommerce normalization;
- product and commerce synchronization;
- operational analytics and health;
- events, webhooks, retry, and reconciliation;
- adapters and connection status;
- registry metadata;
- valuation-source submission;
- MCP gateway status/capability metadata;
- shared platform services.

Local systems remain authoritative for their local domain data. The Ecosystem Plugin observes, normalizes, synchronizes, and reports; it does not replace WooCommerce, Members, the LMS, Galaxy, ODeFi, OMOS, or their source repositories.

## Knowledge / RAG

Knowledge/RAG is a first-class shared service. Canonical OneGodian knowledge remains source-controlled or registry-backed; authorized runtimes retrieve relevant context through the platform rather than treating a vendor assistant's file store as the source of truth.

Portable runtime model:

```text
Instructions / Rules
      ↓
Knowledge / RAG
      ↓
Skills
      ↓
Tools / Actions
      ↓
Tests / Verification
```

## Repository rules

1. Remove active dependencies on `app.onegodian.com`.
2. Use `u.OneGodian.com` for current education architecture.
3. Use `ODeFi.OneGodian.com` for active finance architecture.
4. Use `OMOS.OneGodian.com` as protocol/developer infrastructure.
5. Route cross-property integration through `api.OneGodian.org`.
6. Prefer adapters/connectors over point-to-point site meshes.
7. Preserve specialized repositories as authorities for their own runtime/data.
8. Do not describe a conceptual or unverified capability as live.
9. Keep write-capable MCP/tool operations scoped, auditable, and approval-gated where consequential.
