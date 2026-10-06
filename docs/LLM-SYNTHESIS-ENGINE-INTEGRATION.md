# OneGodian LLM Synthesis Engine™

**Repository:** `ohi-stack/onegodian-llm`  
**Classification:** Specialized OneGodian Intelligence Software / Integration Package  
**Maturity:** Production upgrade in progress; runtime capabilities require implementation/test/deployment evidence.

## Canonical purpose

The OneGodian LLM Synthesis Engine™ is the model-agnostic synthesis and integration layer for coordinating language-model capabilities inside the OneGodian intelligence architecture. Provider APIs are adapters, not the architecture.

It keeps OneGodian instructions, knowledge/RAG, skills, tools/actions, verification, policy, provenance, and governance portable across approved external and locally hosted models.

## Canonical pipeline

```text
Input
→ Context / Retrieval
→ Model Selection
→ Prompt / Instruction Assembly
→ Multi-Model Execution
→ Synthesis
→ Verification
→ Policy / Authority Checks
→ Structured Output
```

## OIPS capability chain

```text
Instructions / Rules
→ Knowledge / RAG
→ Skills
→ Tools / Actions
→ Tests / Verification
```

Provider-native assistant formats, file stores, tool schemas, and model APIs are representations/adapters of these canonical capabilities. They must not become the OneGodian source of truth.

## Principal modules

1. Provider Adapters
2. Model Registry
3. Synthesis Router
4. Context / RAG Bridge
5. Instruction Compiler
6. Skill Runtime Bridge
7. Tool / Action Bridge
8. Response Synthesizer
9. Verification / Evaluation Engine
10. Safety & Permission Layer
11. Provenance / Audit Logging
12. Usage / Cost Telemetry
13. API / MCP Integration

## Authority boundary

```text
LLMs generate / infer
        ↓
LLM Synthesis Engine coordinates
        ↓
O-H-I evaluates / contextualizes
        ↓
ACC governs authorized actions
        ↓
OneGodian API executes authorized operations
        ↓
ODIN / QR-V preserve authoritative records and provenance
        ↓
Humans retain final authority where required
```

The Synthesis Engine is not the authority for OneGodian identity, canonical knowledge, registry records, verification status, legal conclusions, financial actions, or human decisions.

## Cross-repository contract

- `onegodian-llm` — code authority for provider-neutral model execution and synthesis.
- `onegodian-api` — shared gateway/service boundary and approved public/internal API exposure.
- `omos-site` — governed runtime/orchestration, decision records, human gate, and O-H-I contextualization.
- `acc` — permissioning, approvals, operational control, authorized action supervision, and audit.
- `onegodian-platform-plugin` — WordPress integration/client contract; never a duplicate synthesis runtime.
- ODIN / QR-V / OBP-1 — canonical registry/verification/provenance boundaries where applicable.

## Production rule

A named capability is not Production merely because it is documented or present in source. Production status requires it to be operational, documented, tested, repeatable, deployed, and supported by runtime evidence.
