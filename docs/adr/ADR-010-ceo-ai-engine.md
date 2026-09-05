# ADR 010: CEO AI Engine — No Hallucination, Evidence Transparency, and Permission Control

- **Status**: ACCEPTED
- **Date**: 2026-09-05
- **Deciders**: Software Architect & Lead Engineer (WillShop OS)

## Context
WillShop OS requires an executive decision-making CEO AI Engine (Build 09). Traditional LLM implementations risk hallucinating financial metrics, generating ungrounded recommendations, or attempting unauthorized operations. A strict architectural contract is mandatory to guarantee zero hallucinations and enforce safety guardrails.

## Decision
We decide that the **CEO AI Engine** must strictly operate under the following architectural rules:

1. **Zero Hallucination Guarantee**: All analytical responses MUST be grounded in real Data Core and BI Engine data. If data is incomplete or unavailable: *"Je n'ai pas suffisamment de données pour confirmer cela."*
2. **Immutable Evidence & Deterministic Confidence**: Every insight or recommendation MUST specify an array of `AIInsightEvidence` objects (source table, metric, period, delta, freshness) and a deterministically calculated `ConfidenceScore`.
3. **Provider-Agnostic AI Gateway Integration**: All LLM queries flow through the provider-agnostic `IAIGateway` abstraction.
4. **3-Tier Permission Hierarchy Enforcement**:
   - 🟢 **GREEN** (Low risk) -> Auto-executed via `AutomationEngineService`.
   - 🟡 **YELLOW** / 🔴 **RED** -> Routed to `ApprovalCenterService` (`PENDING_APPROVAL`). **NEVER auto-executed on timeout**.
5. **Post-Execution Verification (`VerificationEngine`)**: Post-action verification ensures state changes occurred in database tables before reporting success.
6. **Cost Tracking & Safety Guardrails**: All LLM calls log token counts, latency, and estimated costs in `ai_usage_logs`. Input text is scanned for prompt injection attempts, and business/personal scope boundaries are strictly enforced (`scope = 'business'`).

## Consequences
- **Positive**: Complete executive confidence in AI-generated briefings, absolute financial safety, transparency of evidence, and auditable action workflows.
- **Negative**: Dynamic responses require structured prompt contexts and tool registration overhead.
