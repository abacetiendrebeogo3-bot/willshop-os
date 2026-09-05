# WILLSHOP OS — OPERATIONAL INCIDENT RUNBOOK

This runbook specifies the triage, diagnostic, and resolution steps for operational incidents during the WillShop OS Real-World Pilot.

---

## 🔍 DIAGNOSTIC TRACING FLOW

Every operational request, event, and background action generates a `correlation_id`.

```
Client WhatsApp / Web Action
  ↓ (attaches header x-correlation-id: corr_abc123)
API Route / Webhook Receiver
  ↓ (propagates correlation_id)
System Event / Audit Log
  ↓ (stored in audit_logs with correlationId = corr_abc123)
Automation / AI Execution
```

To trace any issue end-to-end:
```bash
# Search logs by correlation ID across all services
grep "corr_abc123" logs/production.log
```

---

## ⚡ INCIDENT RESPONSE MATRIX

### INC-01: Unexpected Webhook Failure / Missing WhatsApp Messages
- **Symptom:** WhatsApp inbound messages not appearing in CRM Inbox.
- **Diagnostic Steps:**
  1. Inspect `/api/webhooks/whatsapp/meta` HTTP status in Vercel logs.
  2. Verify Meta Webhook signature validation (`x-hub-signature-256`).
  3. Check Meta App Access Token validity.
- **Resolution:**
  - If token expired, refresh Meta Graph API permanent access token in Vercel environment variables.
  - If signature invalid, verify `META_APP_SECRET`.

### INC-02: Concurrent Stock Overselling Attempt
- **Symptom:** Two orders submitted simultaneously for remaining physical unit.
- **Diagnostic Steps:**
  1. Inspect `stock_movements` log for `productId`.
  2. Verify `OrderStockApplicationServices` atomic transaction locks.
- **Expected Resolution:**
  - System automatically rejects second order with `ValidationError("Stock insuffisant pour réserver le produit")`. First order reserves stock cleanly.

### INC-03: AI Sales Agent Misbehavior / Hallucination Attempt
- **Symptom:** AI Sales Agent attempts to offer unauthorized discounts or unlisted products.
- **Diagnostic Steps:**
  1. Inspect `ai_usage_logs` for prompt injection signatures.
  2. Check `SafetyGuardrails.verifyPriceQuote(quotedPrice, catalogPrice)`.
- **Immediate Resolution:**
  1. Activate Kill Switch: Navigate to `/automation` -> **Kill Switch** -> **Stop AI Sales Agent**.
  2. Switch conversation to manual commercial agent takeover.

---

## 🎛️ EMERGENCY KILL SWITCH CHEAT SHEET

| Desired Action | Procedure | Recovery Step |
| :--- | :--- | :--- |
| **Stop All AI Sales Responses** | Call `KillSwitchApplicationService.toggleCategory(orgId, 'SALES', true)` | Call `toggleCategory(..., false)` |
| **Stop Outbound Messages** | Call `KillSwitchApplicationService.toggleCategory(orgId, 'NOTIFICATIONS', true)` | Call `toggleCategory(..., false)` |
| **Stop All Automations** | Call `KillSwitchApplicationService.toggleGlobal(orgId, true)` | Call `toggleGlobal(..., false)` |

---

## 📞 INCIDENT ESCALATION CONTACTS

- **Lead Architect & CEO:** Willy Tiendré
- **Systems Engineering:** WillShop Lead Engineer
- **Meta Developer Support:** [Meta Developer Help Center](https://developers.facebook.com/)
