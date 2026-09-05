# WILLSHOP OS — USER ACCEPTANCE TESTING (UAT) CHECKLIST

This document specifies the real-world validation scenarios for each key operational role during the Build 15 Production Pilot.

---

## 👔 ROLE 1: CHIEF EXECUTIVE OFFICER (WILLY TIENDRÉ)

| Test ID | UAT Scenario | Step-by-Step Procedure | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-CEO-01** | Consult Business Activity | Open `/` (Dashboard) | CEO Cockpit loads in < 2 seconds displaying real-world sales, cash treasury, and margin metrics. | ✅ PASS |
| **UAT-CEO-02** | Review Daily Briefing | Click **Daily Briefing** tab | AI generates structured summary of urgent alerts, low stock, and revenue performance with source evidence. | ✅ PASS |
| **UAT-CEO-03** | Approval Center Workflow | Navigate to `/automation` -> Pending Approvals | Pending high-risk action (e.g. expense > 50,000 XOF) can be approved or rejected with audit record. | ✅ PASS |
| **UAT-CEO-04** | Verify Strategy Goal Link | Navigate to `/strategy` | Live BI KPI link automatically updates goal progress percentage without manual data entry. | ✅ PASS |

---

## 👩‍💼 ROLE 2: COMMERCIAL / SALES AGENT

| Test ID | UAT Scenario | Step-by-Step Procedure | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-SALES-01** | WhatsApp Message Handling | Receive inbound customer query on `/crm` | Customer identified or created instantly; conversation thread updated in real-time. | ✅ PASS |
| **UAT-SALES-02** | Order Creation | Click **Create Order** in conversation window | Select product, quantity, and zone; subtotal and delivery fee calculated server-side. | ✅ PASS |
| **UAT-SALES-03** | Stock Check Safeguard | Attempt order creation for out-of-stock product | System blocks confirmation with clear error message `"Stock insuffisant"`. | ✅ PASS |
| **UAT-SALES-04** | Commercial Handoff | Client asks complex custom question | AI Sales Agent pauses and flags conversation `HUMAN_HANDOFF_REQUIRED`. | ✅ PASS |

---

## 🚚 ROLE 3: DELIVERY DRIVER (RASMANÉ & TEAM)

| Test ID | UAT Scenario | Step-by-Step Procedure | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-DRV-01** | View Assigned Deliveries | Open `/delivery` tab | Display assigned deliveries filtered by driver ID and status `ASSIGNED`. | ✅ PASS |
| **UAT-DRV-02** | Mark In-Transit | Click **Start Delivery** | Delivery status updates to `IN_TRANSIT`; stock deducted from physical inventory. | ✅ PASS |
| **UAT-DRV-03** | Complete Delivery | Click **Confirm Delivery** with proof | Order transitions to `DELIVERED`; customer notification sent automatically. | ✅ PASS |
| **UAT-DRV-04** | Report Delivery Failure | Click **Report Issue** (Client absent) | Delivery status transitions to `FAILED`; task created for customer follow-up. | ✅ PASS |

---

## 💳 ROLE 4: FINANCE & ACCOUNTANT

| Test ID | UAT Scenario | Step-by-Step Procedure | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **UAT-FIN-01** | Record Mobile Money Payment | Open `/finance` -> **Record Payment** | Attach payment to order ID; status transitions `PENDING` -> `VERIFIED`. | ✅ PASS |
| **UAT-FIN-02** | Ledger Entry Verification | Inspect `/finance` transactions | Income transaction posted to `Compte Principal Coris Bank` atomically. | ✅ PASS |
| **UAT-FIN-03** | Bank Reconciliation | Click **Reconcile Account** | Discrepancies flagged; controlled adjustment recorded with mandatory reason string. | ✅ PASS |
| **UAT-FIN-04** | Boundary Isolation Check | Attempt access to Personal OS ledger | Access denied with `ForbiddenError` (Personal data strictly isolated). | ✅ PASS |
