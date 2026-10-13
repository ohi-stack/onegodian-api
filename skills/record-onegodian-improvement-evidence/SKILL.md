---
name: record-onegodian-improvement-evidence
description: Use when asked to document OneGodian recursive-improvement decisions, prepare release records, reconcile OBP-1 provenance with ODIN identifiers, or record promotion and rollback evidence.
---

# OneGodian Improvement Evidence

## Preserve distinctions
Use OBP-1 for provenance and ODIN for identification/classification in the proposed architecture. Do not substitute ODIN for provenance, invent canonical codes or series, or imply local drafts are registered remotely. Verify schemas and integrations before writing. If unavailable, prepare an explicitly unregistered draft with a local reference.
Treat component responsibilities as architectural intent until implementation evidence verifies integrations. Use authorized ACC execution where the contract applies; never bypass it.

## Build the record
Capture local reference and canonical identifier only if issued; UTC timestamp; author/operator; objective; hypothesis; scope; preserved contracts; baseline/candidate revisions and hashes; separately observed installed version; evaluation version and environment; commands and redacted evidence references; metrics and negative results; unresolved checks; decision and reasoning; evaluator and independence limitations; authorization scope; release target and actual result; rollback revision/artifact and database compatibility; recovery procedure and tested versus untested status.
Keep secrets, member data, and protected evaluations out of public records. Use existing access controls for private evidence.
Where OMOS Decision Records apply, preserve input references, alignment/hard gates, provider/model provenance, Council findings and dissent, synthesis/confidence, human disposition, Algorithm/runtime versions, timestamps/hashes, ownership, and revision history. Reference sensitive inputs securely rather than copying them to public GitHub.

## Represent state honestly
Use draft workflow labels such as proposed, testing, rejected, inconclusive, verified-in-test, approved-for-release, deployed-unverified, verified-in-production, or rolled-back. Map to actual schemas before submission; do not invent API enums. Keep these distinct from capability maturity: Conceptual, Prototype, Functional, Verified, Production.
Tests do not confer approval; approval does not prove deployment; deployment does not prove production verification. Append evidence and retain prior failures.

## Prepare promotion
Present exact candidate, evaluation, remaining gates, target, and rollback procedure. Honor existing approval for the exact scope; request only genuinely missing authorization. The candidate cannot approve itself or change permissions. Check data-loss and migration consequences before treating code rollback as sufficient.
After authorized release, verify deployed identity and required contracts. Record failures and use only authorized recovery. Do not mark unobserved systems healthy.

## Deliver
Return decision, evidence, confirmed state, unresolved gates, next action, and actual persistence/registration outcome. A local draft is not a saved remote record.

## Source and API boundary
Based on the user's October 13, 2026 recursive-improvement request and the inspected repository README. Attribute Observe → Distill → Align → Select → Execute → Verify to the OneGodian Algorithm; OMOS provides runtime/orchestration and OHI provides comparison, critique, and synthesis. Read current repository instructions before work.
In ohi-stack/onegodian-api, preserve the shared-service boundary at api.onegodian.org. Quantum-OHI recommendations remain analysis-only; approved actions go through ACC authorization. Do not add a second authoritative OMOS runtime. Documentation, placeholder verification/registration routes, development tokens, and readiness flags do not establish production capability. Keep provider keys server-side. These skills are instructions, not runtime endpoints or automatic deployment.
