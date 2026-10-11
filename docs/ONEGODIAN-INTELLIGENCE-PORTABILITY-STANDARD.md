# OneGodian Intelligence Portability Standard (OIPS)

**Status:** Shared architecture contract  
**Canonical runtime relationship:** OMOS / O-H-I / ACC / api.OneGodian.org  
**Updated:** 2026-10-03

OIPS prevents OneGodian intelligence from becoming dependent on a provider-specific assistant format.

## Canonical capability chain

```text
Instructions / Rules
  -> Knowledge / RAG
  -> Skills
  -> Tools / Actions
  -> Tests / Verification
```

### Instructions / Rules
Versioned identity, purpose, policy, behavioral, formatting, permission, and human-authority requirements.

### Knowledge / RAG
Canonical OneGodian knowledge remains under OneGodian control. Retrieval selects relevant authoritative context at runtime using provenance, version, permission, and authority metadata. Provider-native file stores are adapters/caches, not the source of truth.

### Skills
Reusable task capabilities compose instructions, retrieval requirements, tools, approval rules, and expected outputs. Provider-native skill formats are representations of the canonical skill.

### Tools / Actions
Models may request actions but do not own the authoritative action layer. Tool execution routes through OneGodian API/MCP connectors with scope checks, authorization, audit, and ACC/Human Gate controls where required.

Minimum Tool Registry fields: tool_id, name, provider, category, action class, scopes, schemas, approval_required, audit_required, environment, status, connector/adapter, authoritative target.

### Tests / Verification
Canonical tests verify instruction adherence, retrieval provenance, permissions, tool behavior, Human Gate enforcement, expected output, failure behavior, and audit evidence. A provider migration is incomplete until applicable tests pass.

## Platform boundary

```text
OneGodian Source
  -> OIPS
  -> api.OneGodian.org
  -> OneGodian MCP Gateway
  -> Provider Adapter
  -> OpenAI / Gemini / Claude / xAI / Local or future runtime
```

api.OneGodian.org is the shared platform/API authority for cross-property services. MCP is the controlled interoperability/tool interface, not the system of record. OMOS provides governed orchestration. ACC remains the authorized execution-control plane for consequential actions.

## Portability rule

When a provider changes or retires an assistant format, replace or update the adapter. Do not rebuild canonical OneGodian instructions, knowledge, skills, tools, permissions, tests, or provenance inside the provider.

## Maturity rule

This document defines architecture. It does not establish that every RAG, registry, adapter, skill, or tool is deployed. Production status requires operational, documented, repeatable evidence under the applicable repository acceptance contract.
