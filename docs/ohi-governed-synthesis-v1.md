# OHI Governed Synthesis Contract v1

Status: implementation contract
Updated: 2026-09-03

## Purpose

Define the API boundary for a multi-model OLLM execution that preserves raw provider responses while producing a separately identified OHI-governed synthesis.

## Request

`POST /v1/ollm/synthesize`

```json
{
  "prompt": "string",
  "models": ["provider:model"],
  "conversation_id": "optional-string",
  "options": {
    "save": true
  }
}
```

## Required processing stages

1. collect — execute requested supported model adapters.
2. normalize — map provider results to the canonical response envelope.
3. analyze — identify agreement, divergence, uncertainty and provider failures.
4. synthesize — construct a governed response from supported signal.
5. validate — run output policy, evidence and consistency checks.
6. output — return raw model envelopes plus the governed synthesis.

## Response envelope

```json
{
  "execution_id": "string",
  "status": "complete|partial|failed",
  "models": [
    {
      "provider": "string",
      "model": "string",
      "status": "complete|failed|timeout",
      "content": "string|null",
      "latency_ms": 0
    }
  ],
  "governance": {
    "pipeline": ["collect", "normalize", "analyze", "synthesize", "validate", "output"],
    "warnings": [],
    "validation": {
      "passed": true
    }
  },
  "synthesis": {
    "content": "string",
    "status": "complete|degraded"
  }
}
```

## Failure behavior

A single provider failure must not silently invalidate successful provider results. Return `partial` when synthesis can safely continue. Return `failed` when no valid synthesis can be produced. Provider errors must never be exposed with secrets or sensitive upstream payloads.

## Security requirements

- Provider credentials remain server-side.
- Authenticate protected endpoints.
- Apply request size and rate limits.
- Generate an execution identifier for observability.
- Do not log secrets or full authentication tokens.
- Persist only data permitted by the product privacy policy and user controls.

## Product boundary

This contract is a software interface operated by ONEGODIAN, LLC. It does not itself create religious membership, legal status, governmental status, or institutional recognition.
