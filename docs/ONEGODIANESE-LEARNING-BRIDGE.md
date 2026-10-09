# OneGodianese Authorized Learning Bridge

**Status:** scaffold / fail-closed. The route is mounted at `GET /api/v1/onegodianese/access?slug={term-slug}` and responds `503 onegodianese_bridge_unconfigured` until audited adapters are deliberately injected. It does **not** yet provide live enrollment synchronization, account federation, or SSO.

## Required production adapters

- `authenticate(req)`: validate a signed, unexpired, audience-bound session/token with `onegodianese:access:read` permission; return a stable `subject` and `scopes`. Never trust client-supplied account IDs.
- `getMembership(subject)`: obtain only an authoritative active flag from OneGodian Members; refuse stale or unverifiable assertions.
- `getCourseMapping(termSlug)`: return the editorially approved LMS course ID from a trusted mapping, not from caller-controlled request parameters.
- `getCourseAccess(subject, courseId)`: query the University LMS, which MUST enforce enrollment, payment provenance, revoked entitlement and course access server-side. Membership does not grant enrollment by implication.

These adapters must use approved authenticated service endpoints through api.OneGodian.org or properly scoped server-side provider interfaces. Cross-property subject correlation needs an explicit consent/security design. Avoid leaking member status into public lexicon endpoints, tokens, query strings, page HTML, or caches. Successful read responses include only member active status and the LMS's authorized enrolled/access flags. No actions mutate Members, WooCommerce, or LMS records.

## Next release acceptance

Implement real adapters, authenticate and authorize their service accounts, rate-limit reads, establish cross-site identity correlation, set secret rotation and audit strategy, test paid/free/refund scenarios and membership expiration, verify revocation latency and failure modes, and stage against real OneGodian Members and University LMS installations. Do not mark it production prior to passing exact-head CI and deployment acceptance.

## Tests

`node --test test/onegodianeseBridge.test.js`. Existing `npm test` glob already includes this test file.
