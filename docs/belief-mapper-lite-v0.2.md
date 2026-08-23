# Belief Mapper Lite API Contract

Version: `belief-mapper-lite-v0.2`
Updated: August 23, 2026

## Scope

This contract supports the public OneGodian Belief Mapper Lite experience. It returns an educational alignment result only. It does not assign identity, create membership, or establish any legal/religious status.

## Proposed Endpoint

`POST /v1/belief-mapper/evaluate`

## Request

```json
{
  "version": "belief-mapper-lite-v0.2",
  "answers": [2, 2, 1, 1, 2]
}
```

Rules:

- `answers` MUST contain exactly 5 values.
- Each value MUST be integer `0`, `1`, or `2`.
- No name, email, date of birth, location, tradition, or account identifier is required for evaluation.

## Response

```json
{
  "version": "belief-mapper-lite-v0.2",
  "score": 8,
  "max_score": 10,
  "classification": "strong_alignment",
  "identity_assigned": false,
  "membership_created": false
}
```

Classification ranges:

- `0–4` → `explorer`
- `5–7` → `aligned`
- `8–10` → `strong_alignment`

## Privacy Boundary

Belief responses are sensitive data. The public Lite endpoint SHOULD be stateless and MUST NOT persist raw responses by default. Logging should be limited to operational telemetry that cannot reconstruct an individual's belief profile.

The endpoint MUST NOT:

- create advertising audiences;
- perform behavioral targeting;
- infer religion or another sensitive attribute beyond the explicit, limited educational result;
- create a OneGodian or INO member record;
- automatically enroll a user in courses, products, communities, or mailing lists;
- expose raw answers to third parties.

## Separation of Functions

`evaluate` is an educational experience function operated within the ONEGODIAN, LLC software layer. Any future declaration, membership, community-governance, or INO process must be separate, affirmative, and independently documented.

## Error Model

- `400 invalid_request` — malformed JSON or missing answers
- `422 invalid_answers` — wrong count or values outside 0/1/2
- `429 rate_limited` — request limit exceeded
- `500 internal_error` — unexpected service failure

## Production Requirements

Do not publish this endpoint as production until validation tests, rate limiting, security headers, privacy logging rules, monitoring, and deployment documentation are operational and repeatable.