# OneGodian API Route Map

**API Base URL:** `https://api.onegodian.org/`

This document defines the public route structure for the OneGodian API ecosystem. It is intended to guide implementation, documentation, service routing, dashboard integration, and future app bridge coordination.

## Core Services

```text
https://api.onegodian.org/
├── auth/
│   ├── login
│   ├── logout
│   ├── refresh
│   ├── verify
│   └── me
│
├── registry/
│   ├── identities
│   ├── members
│   ├── products
│   ├── organizations
│   ├── apps
│   ├── certificates
│   └── odin
│
├── certificates/
│   ├── verify
│   ├── generate
│   ├── download
│   ├── revoke
│   └── history
│
├── dashboard/
│   ├── stats
│   ├── notifications
│   ├── profile
│   ├── memberships
│   ├── apps
│   └── settings
│
├── bridge/
│   ├── connect
│   ├── sync
│   ├── heartbeat
│   └── manifest
│
├── media/
├── forms/
├── payments/
├── search/
├── members/
├── products/
└── health
```

## Service Purpose

### `/auth/`
Handles authentication, session validation, token refresh, account verification, and current-user profile access.

### `/registry/`
Provides registry access for identities, members, products, organizations, apps, certificates, and ODIN-related records.

### `/certificates/`
Handles certificate verification, generation, download, revocation, and certificate history.

### `/dashboard/`
Supports the unified dashboard layer, including statistics, notifications, user profile, memberships, apps, and settings.

### `/bridge/`
Supports app bridge connectivity, synchronization, heartbeat monitoring, and manifest discovery.

### `/media/`
Supports the Media Center, media assets, public content feeds, press materials, and platform media records.

### `/forms/`
Supports form submissions, intake workflows, contact forms, development inquiries, business inquiries, membership inquiries, contributor forms, and future sync workflows.

### `/payments/`
Supports product payments, membership payments, contribution records, and integration with commerce systems.

### `/search/`
Supports search across public content, registry records, products, media, documentation, and future OneGodian search services.

### `/members/`
Supports member records, member profiles, membership access checks, and membership-related dashboard functions.

### `/products/`
Supports product listings, product metadata, digital downloads, membership products, and ecosystem product records.

### `/health`
Provides a basic service health check endpoint for uptime monitoring, deployment checks, and app bridge status validation.

## Implementation Notes

- Use `https://api.onegodian.org/` as the canonical API base URL.
- Keep all service routes lowercase and stable.
- Use JSON responses unless a route explicitly returns a file download.
- Protect sensitive routes through authentication and authorization checks.
- Keep `/health` lightweight, public-safe, and suitable for automated monitoring.
- Store App Bridge keys and service credentials as environment variables, not in committed source code.
- Use versioned API paths later if breaking changes are introduced, for example: `/v1/auth/login`.

## Suggested Environment Variables

```env
ONEGODIAN_API_BASE_URL=https://api.onegodian.org/
ONEGODIAN_AUTH_SERVICE_URL=https://api.onegodian.org/auth
ONEGODIAN_REGISTRY_SERVICE_URL=https://api.onegodian.org/registry
ONEGODIAN_CERTIFICATE_SERVICE_URL=https://api.onegodian.org/certificates
ONEGODIAN_DASHBOARD_SERVICE_URL=https://api.onegodian.org/dashboard
ONEGODIAN_APP_BRIDGE_KEY=replace_with_secure_secret
```

## Status

This file is an architecture and routing standard. It does not confirm that every route is live in production. Each endpoint should be implemented, tested, documented, and monitored before being treated as operational.
