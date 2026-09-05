# WillShop OS — Golden Path End-to-End Test Specification

This document specifies the **"Scenario A — WhatsApp to Cash" Golden Path**, validating the end-to-end integration across all 13 modules of WillShop OS.

## 1. Golden Path Flow & Verification Assertions

```
 1. Customer inbound WhatsApp message
 2. Customer identified/created in CRM
 3. Conversation initialized & sales agent assigns product
 4. Order created with line items
 5. Inventory stock reserved in product_stock
 6. Order confirmed by customer
 7. Logistics delivery task created & driver assigned
 8. Delivery completed successfully by driver
 9. Customer payment received & verified
10. Finance ledger transaction recorded (Double-entry)
11. Marketing attribution linked (Spend vs Revenue)
12. Contribution Profit & COGS calculated
13. BI Engine metrics & daily aggregations refreshed
14. System domain event emitted (ORDER_COMPLETED)
15. Automation Engine evaluates rules (e.g. stock replenishment check)
16. CEO AI analyzes order result & updates context memory
17. Strategy Goal KPI value updated automatically
18. CEO Cockpit reflects updated revenue, profit, cash, and health metrics
```

## 2. Invariant Rules Verified

- **Zero Financial Discrepancy**: Payment total = Order total = Financial Ledger transaction total.
- **Zero Inventory Drift**: Reserved stock quantity matches physical stock deduction precisely.
- **Single Source of Truth Preservation**: BI metrics and CEO AI summaries match SSOT database tables identically.
- **Strict Correlation**: Single `correlation_id` traces the entire lifecycle from WhatsApp message to Strategy KPI update.
