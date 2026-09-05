# WILLShop OS — Build 08: Automation Engine Architecture

## 1. Executive Summary
The **Automation Engine** is the central deterministic workflow orchestrator of WillShop OS. It processes operational events across Sales, Stock, Delivery, Finance, and BI, evaluating rules against pure condition trees, enforcing 3-tier risk permissions, managing approvals, and executing actions with strict idempotency and auditability.

---

## 2. Pipeline Overview
`EVENT -> TRIGGER -> CONTEXT -> CONDITIONS -> DECISION -> PERMISSION -> ACTION -> VERIFICATION -> RESULT -> NOTIFICATION -> AUDIT -> LEARNING`

- **EVENT**: Received via `SystemEvent` bus.
- **TRIGGER**: Matches rule config (e.g. `eventType: 'stock.low'`).
- **CONTEXT**: Scoped payload with tenant isolation (`organizationId`).
- **CONDITIONS**: Evaluated deterministically via `ConditionEvaluator` (No `eval`).
- **DECISION & PERMISSION**: Evaluated via `PermissionEvaluator`:
  - 🟢 **GREEN**: Low risk -> Auto-execute.
  - 🟡 **YELLOW**: Medium risk -> Route to `ApprovalCenterService` (`PENDING_APPROVAL`).
  - 🔴 **RED**: High risk -> Requires explicit confirmation.
- **ACTION**: Executed via provider-agnostic `ActionExecutorService`.
- **IDEMPOTENCY**: Keyed by `automation_id + event_id + action_id`.
- **AUDIT & LOGS**: History logged in `automation_executions` and `approval_requests`.

---

## 3. Initial Reference Automations
1. **Stock Low** -> Manager notification
2. **Stock Out** -> Urgent critical alert
3. **Delivery Failed** -> Follow-up task creation
4. **Delivery Delivered** -> Internal completion notification
5. **Payment Received** -> Cash receipt notification
6. **Goal At Risk** -> CEO alert
7. **BI Anomaly Detected** -> Critical system alert
8. **Large Expense Requested** -> Approval request (> 100,000 XOF)

---

## 4. Emergency Kill Switch
The `KillSwitchService` enforces immediate priority stopping:
- **Global**: Halts all automation processing for an organization.
- **Category**: Pauses specific categories (e.g., `FINANCE`, `DELIVERY`, `STOCK`).
- **Automation ID**: Pauses a single specified rule.

---

## 5. Security & RLS
All database tables (`automation_rules`, `automation_executions`, `approval_requests`, `kill_switches`) enforce multi-tenant isolation via PostgreSQL Row Level Security (RLS) policies checking `is_org_member(organization_id)`.
