# WillShop OS — Event Architecture Audit & Registry

This document audits the event-driven backbone of WillShop OS, detailing event structure, idempotency guarantees, producers, consumers, and side effects.

## 1. Event Envelope Schema

Every domain event emitted in WillShop OS conforms to the standard event structure:

```json
{
  "event_id": "evt_9a8b7c6d-5e4f-3a2b-1c0d-fe9e8d7c6b5a",
  "event_type": "ORDER_CONFIRMED",
  "aggregate_type": "ORDER",
  "aggregate_id": "ord_10203040",
  "organization_id": "org_willshop_default",
  "actor": "sales_agent_01",
  "source": "SalesApplicationService",
  "timestamp": "2026-09-05T08:50:00Z",
  "payload_version": "1.0",
  "correlation_id": "corr_wh_msg_8839201",
  "idempotency_key": "idemp_order_confirm_ord_10203040",
  "metadata": {
    "channel": "WHATSAPP",
    "customer_id": "cust_554433"
  }
}
```

## 2. Event Registry: Type $\to$ Producer $\to$ Consumers $\to$ Side Effects

| Event Type | Producer | Consumers | Side Effects |
| :--- | :--- | :--- | :--- |
| `CUSTOMER_CREATED` | Sales CRM Service | WhatsApp Service, Analytics | Creates CRM contact card, triggers welcome flow |
| `ORDER_CREATED` | Order & Stock Service | Stock Service, Automation Engine | Reserves product stock, notifies sales agent |
| `ORDER_CONFIRMED` | Order & Stock Service | Logistics, Finance Engine, BI | Dispatches delivery assignment, prepares invoice |
| `DELIVERY_ASSIGNED` | Delivery Service | Driver App, WhatsApp Service | Notifies driver, sends tracking link to customer |
| `DELIVERY_COMPLETED` | Delivery Service | Order Service, Finance Engine, BI | Marks order delivered, prompts payment collection |
| `PAYMENT_RECEIVED` | Finance Engine | Order Service, BI Engine, Marketing | Reconciles payment, updates account ledger, updates CAC/ROI |
| `STOCK_LOW_DETECTED`| Stock Service | Automation Engine, CEO AI | Triggers reorder alert, creates CEO recommendation |
| `GOAL_KPI_UPDATED` | Strategy Service | CEO Cockpit, BI Engine | Re-evaluates strategic target progress |
| `ACTION_RECOMMENDED`| CEO AI Engine | CEO Cockpit, Approval Loop | Queues executive decision item (`GREEN`/`YELLOW`/`RED`) |
| `BRIDGE_TRANSFER_EXEC`| Personal OS Bridge | Business Finance, Personal Finance | Executes dual-entry cross-domain ledger movement |

## 3. Idempotency & Concurrency Audit

1. **Idempotency Key Check**: Handlers verify `IdempotencyService.hasBeenProcessed(idempotency_key)`. If processed, the event is skipped silently without duplicating operations.
2. **Concurrency Locks**: Stock reservations and ledger entries use explicit optimistic/pessimistic lock tokens on `aggregate_id` to prevent overselling or double posting.
3. **Correlation Tracking**: `correlation_id` is propagated through all derivative events across the pipeline (`WhatsApp` $\to$ `Order` $\to$ `Delivery` $\to$ `Payment` $\to$ `Finance` $\to$ `BI` $\to$ `CEO AI`).
