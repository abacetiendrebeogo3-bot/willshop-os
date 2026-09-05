# WillShop OS — System Health Center Specification

This document details the observability architecture and diagnostics criteria of the **System Health Center**.

## 1. System Health Pillars & Status Criteria

System health is evaluated across 6 core pillars. The global status is set to:
- `HEALTHY` (🟢): All 6 pillars operating normally with 0 critical anomalies.
- `DEGRADED` (🟡): 1 or more pillars experiencing non-blocking warnings or pending queue backlog.
- `CRITICAL` (🔴): 1 or more pillars experiencing database connectivity issues, event failures, or data inconsistencies.

### Pillar 1: DATABASE
- Checks: PostgreSQL connectivity, migration version matching, primary key & foreign key integrity, index availability.
- Triggers: Connection drop $\to$ `CRITICAL`.

### Pillar 2: EVENTS
- Checks: Event queue backlog, dead-letter queue / orphan events, retries, handler error rates.
- Triggers: Dead-letter queue $> 0$ or orphan events $\to$ `DEGRADED` / `CRITICAL`.

### Pillar 3: AUTOMATION
- Checks: Failed workflow executions, pending executive approvals, stuck automation runs.
- Triggers: Failed workflows $> 0$ $\to$ `DEGRADED`.

### Pillar 4: AI ENGINE
- Checks: Failed AI provider calls, token budget overflow, invalid JSON output schemas, action loop execution failures.
- Triggers: AI provider error rate $> 5\%$ $\to$ `DEGRADED`.

### Pillar 5: BUSINESS DATA CONSISTENCY
- Checks: Invokes `DataConsistencyEngine` to detect discrepancy anomalies:
  - Order total vs Payment total mismatch
  - Stock movements vs Stock balance mismatch
  - Financial transaction ledger vs Payment mismatch
  - Marketing revenue vs Financial revenue mismatch
  - Goal current value vs BI KPI source mismatch
- Triggers: High severity inconsistency $\to$ `CRITICAL`.

### Pillar 6: INTEGRATIONS
- Checks: Health status of external APIs: WhatsApp Webhooks, Meta Ads API, Delivery Providers (e.g. La Poste/FedEx/Local Drivers), Payment Gateways, AI Providers (Google Gemini/OpenAI).
- Triggers: Integration API endpoint unreachable $\to$ `DEGRADED`.

## 2. Executive Dashboard Integration

The CEO Cockpit features a dedicated System Health widget rendering live pillar indicators, inconsistency alerts, and trigger controls for manual consistency re-scans.
