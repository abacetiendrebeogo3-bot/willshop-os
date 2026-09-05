# ADR 009: Deterministic Automation Engine vs AI Decision Making

- **Status**: ACCEPTED
- **Date**: 2026-09-05
- **Deciders**: Software Architect & Lead Engineer (WillShop OS)

## Context
WillShop OS requires an automation engine to turn operational system events (orders, stock, delivery, payments, BI anomalies) into background workflows. As WillShop OS moves toward the CEO AI Engine in Build 09, a crucial architectural boundary must be established between **Deterministic Automation Rules** and **AI Reasoned Decision Making**.

## Decision
We decide that the **Automation Engine (Build 08)** must be **100% deterministic, auditable, and rule-based**:

1. **Pure AST Condition Evaluation**: All conditions are evaluated via a pure TypeScript tree evaluator without using `eval` or dynamic code execution.
2. **3-Tier Permission Hierarchy**:
   - 🟢 **GREEN** (Low risk: notify, create task, tag, internal alert) -> Auto-executed in background if rule is enabled.
   - 🟡 **YELLOW** (Medium risk: external WhatsApp message, modify order/delivery, create expense) -> Routed to **Approval Center** (`PENDING_APPROVAL`). **NEVER auto-executed on timeout**.
   - 🔴 **RED** (High risk: financial transfer, owner draw, refund, bulk delete) -> Requires multi-step explicit confirmation.
3. **Strict AI Boundary**:
   - **Automation Engine**: Executes predictable, deterministic, auditable workflows.
   - **AI Agent**: Proposes plans and recommendations, but MUST NEVER bypass the Automation Permission System or execute YELLOW/RED actions without approval.
4. **Idempotency Guarantee**: Every execution uses a deterministic key `automation_id + event_id + action_id` preventing duplicate execution.
5. **Emergency Kill Switch**: Override mechanism with immediate stopping priority across Global, Org, Category, and Rule levels.

## Consequences
- **Positive**: Zero risk of unguided AI agents making unauthorized financial or external customer actions. Complete auditability and deterministic safety.
- **Negative**: Complex dynamic workflows must be structured into explicit condition trees rather than free-form script execution.
