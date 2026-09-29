# OneGodian Members v2.2.0 — API Integration Boundary

Updated: September 29, 2026

## Repository roles

`ohi-stack/onegodian-platform-plugin` is the canonical source repository for the OneGodian Members WordPress plugin.

`ohi-stack/onegodian-api` owns broader shared API and service boundaries for `api.onegodian.org`.

The Members plugin remains the source of record for its WordPress member-state implementation until a specific synchronization interface is implemented, tested, authenticated, authorized, observable, and deployed.

## Current Members v2.2.0 WordPress REST surfaces

The plugin currently documents these WordPress REST routes:

- `GET /wp-json/onegodian/v1/members/me`
- `GET /wp-json/onegodian/v1/members/status`
- `POST /wp-json/onegodian/v1/members/sync/{id}`
- `GET|POST|DELETE /wp-json/onegodian/v1/members/belief-mapper`
- `GET /wp-json/onegodian/v1/time/current`
- `GET /wp-json/onegodian/v1/time/convert?date=YYYY-MM-DD`

These are plugin runtime interfaces. They are not automatically aliases for `api.onegodian.org` routes.

## Synchronization direction

Preferred architecture:

`OneGodian Members → authenticated event/adapter → api.onegodian.org → authorized consumers`

The inverse direction may be supported only for explicitly owned fields and documented conflict rules.

## Domain ownership

- OneGodian Members: general membership, WordPress member profile, member identity state, OneGodian Ally state, private member Mapper state, member-facing OTS-V5 presentation
- University LMS: learning, enrollment, progress, course completion, learning certificates
- WooCommerce: checkout, orders, customer commerce state
- OneGodian API: shared interoperability, identity normalization, service contracts, event routing, cross-system aggregation where implemented

## Identity key

A future cross-system bridge should use one immutable normalized identifier such as `onegodian_user_id` and map local IDs around it rather than using mutable display fields as the universal key.

Potential mappings include WordPress user ID, WooCommerce customer ID, BuddyPress member ID, LMS student ID, OneGodian member ID, QRV identifier, and certificate IDs.

## Mapper privacy boundary

Raw Identity & Belief Mapper answers are sensitive member data.

They must not be copied into ordinary member summaries, public profiles, analytics feeds, advertising systems, or generic platform events.

The plugin's outbound Mapper event is intended to remain summary-only:

- `member.belief_mapper.updated`

A bridge may synchronize non-sensitive fields such as completion/progress state, self-selected journey stage, visibility preference, and timestamps where authorized.

Raw answers require a separate explicit purpose, authorization model, consent basis, and access policy.

## OneGodian Time boundary

OTS-V5 companion dates may be calculated or exposed for experience-layer use, but Gregorian timestamps remain source-of-record values for external/institutional interoperability unless a later approved contract establishes otherwise.

## Event model

Current OneGodian Members event concepts include:

- `member.updated`
- `member.ally.updated`
- `member.belief_mapper.updated`

Production event envelopes should include event ID, timestamp, schema version, source system, subject ID, idempotency key, correlation ID, processing status, and verification/audit metadata where applicable.

## Non-operational targets

The following are architectural targets until separately implemented and tested in `onegodian-api`:

- normalized `/api/v1/users/{id}/membership`
- normalized `/api/v1/users/{id}/identity`
- normalized `/api/v1/users/{id}/learning`
- normalized `/api/v1/users/{id}/entitlements`
- `/api/v1/sync/members`
- `/api/v1/sync/lms`
- member/LMS/WooCommerce webhook ingestion
- aggregated `GET /api/v1/me/dashboard`

Documentation does not make these endpoints operational.

## Production rule

Do not represent a Members ↔ OneGodian API bridge as live until authentication, authorization, idempotency, persistence, conflict handling, observability, tests, deployment configuration, and rollback are all documented and verified.
