# OLLM Account, Usage & Billing API Contract v1

Updated: 2026-09-03
Status: implementation contract

## Account endpoints

- `GET /v1/ollm/account` — current account profile and entitlements
- `PATCH /v1/ollm/account` — supported profile updates
- `GET /v1/ollm/usage` — current usage period, limits and consumption
- `GET /v1/ollm/plans` — plans available in the current environment
- `GET /v1/ollm/models` — supported provider/model catalog and availability

## Conversation endpoints

- `GET /v1/ollm/conversations`
- `POST /v1/ollm/conversations`
- `GET /v1/ollm/conversations/:id`
- `DELETE /v1/ollm/conversations/:id`
- `POST /v1/ollm/conversations/:id/save`

## Entitlement model

Canonical plans:
- `free`
- `professional`
- `business`

Entitlements must be enforced server-side. UI labels alone never grant model access, execution volume, export capability or API privileges.

## Usage envelope

```json
{
  "period_start": "ISO-8601",
  "period_end": "ISO-8601",
  "plan": "free|professional|business",
  "executions_used": 0,
  "executions_limit": 0,
  "provider_units_used": 0,
  "provider_units_limit": 0
}
```

## Model catalog response

```json
{
  "models": [
    {
      "provider": "string",
      "model": "string",
      "available": true,
      "plans": ["free", "professional", "business"]
    }
  ]
}
```

Only configured and operational models should return `available: true`.

## Billing boundary

Final pricing, payment-provider implementation, refunds and subscription lifecycle behavior require separate approved billing implementation. This contract defines plan/entitlement state and does not imply that checkout is already deployed.

## Security

All private account, conversation, usage and billing endpoints require authenticated authorization. An account may access only records it owns or records explicitly available to its business workspace role.
