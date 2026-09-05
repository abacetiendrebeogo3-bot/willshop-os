# WILLShop OS — Build 09: CEO AI Engine Architecture

## 1. Executive Summary
The **CEO AI Engine** is the decision-making brain of WillShop OS. It operates as an augmented Chief Executive Officer, running the pipeline:
`OBSERVE -> COMPREHEND -> MEMORIZE -> DETECT -> REASON -> RECOMMEND -> PLAN -> REQUEST APPROVAL -> EXECUTE -> VERIFY -> LEARN`.

---

## 2. Core Architecture
`Experience -> CEO AI -> AI Gateway -> Application Services -> Business Engines -> Data Core`

- **IntentEngine**: Classifies user intents (`DAILY_BRIEFING`, `ANALYZE_FINANCE`, `ANALYZE_SALES`, `RECOMMEND_ACTION`, `FORECAST`, etc.).
- **ContextEngine**: Builds minimal, scoped `BusinessSnapshot` representations without transferring entire database tables.
- **EvidenceEngine**: Attaches immutable `AIInsightEvidence` metadata (source, period, metric, delta, freshness) to insights.
- **ConfidenceEngine**: Deterministically computes confidence scores (`HIGH`, `MEDIUM`, `LOW`).
- **CEOBriefingService**: Produces daily executive briefings categorized by URGENT 🔴, ATTENTION 🟠, OPPORTUNITÉS 🟢, PRIORITÉS 🎯.
- **VerificationEngine**: Post-execution verification confirming entity creation, stock movement, transaction posting, or delivery status.
- **SafetyGuardrails**: Scans for prompt injections, enforces role permissions, and locks operations to `scope = 'business'`.

---

## 3. Approval & Permission Rules
- 🟢 **GREEN**: Auto-executed via `AutomationEngineService`.
- 🟡 **YELLOW** / 🔴 **RED**: Routed to `ApprovalCenterService` (`PENDING_APPROVAL`).
- **Hard Rule**: Expired approval requests transition to `EXPIRED` without auto-executing.

---

## 4. Cost Control & Logging
All LLM usage is tracked in `ai_usage_logs` capturing `provider`, `model`, `promptTokens`, `completionTokens`, `estimatedCost`, and `latencyMs`.
