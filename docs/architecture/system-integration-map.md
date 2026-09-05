# WillShop OS — System Integration Map

This document provides a technical map of domain dependencies, data flow hierarchy, service responsibilities, and architectural boundaries across all 13 builds of WillShop OS.

## 1. Domain Dependency Hierarchy

```
[ Build 01: Core Foundation & Security (Auth, RBAC, RLS) ]
                         │
                         ▼
[ Build 02: Data Core (Entities, Event Store, Invariants) ]
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
[ Build 03: Sales ] [ Build 04: Stock ] [ Build 05: Delivery ]
 (WhatsApp & CRM)    (Orders & Inventory)   (Logistics & Drivers)
        │                │                │
        └────────────────┼────────────────┘
                         ▼
             [ Build 06: Finance Engine ]
          (Ledger, Payments, COGS, Profit)
                         │
                         ▼
              [ Build 07: BI Engine ]
       (Metrics, Cohorts, Profitability, KPIs)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ Build 08: Automation ]       [ Build 10: Marketing ]
(Rule Evaluation, Events)      (Ad Spend, Attribution)
        │                                 │
        └────────────────┬────────────────┘
                         ▼
             [ Build 09: CEO AI Engine ]
       (Reasoning, Actions, Memory, Approval)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
[ Build 11: Team ]             [ Build 12: Strategy ]
(Tasks, Assignments)          (Objectives, KPIs, Goals)
                                          │
                                          ▼
                         [ Build 13: Wilty Personal OS ]
                         (Strictly Isolated Personal Scope)
```

## 2. Component Data Flow Architecture

### Primary End-to-End Data Pipeline:
`World` $\to$ `Integrations (WhatsApp/Meta/Delivery/Gateways)` $\to$ `Events` $\to$ `Data Core` $\to$ `Business Engines` $\to$ `BI` $\to$ `Automation` $\to$ `AI` $\to$ `Recommendation` $\to$ `Approval` $\to$ `Action` $\to$ `Verification` $\to$ `Learning` $\to$ `Memory`

### Strategic Cascade Pipeline:
`Vision` $\to$ `Strategy` $\to$ `Objectives` $\to$ `Goals` $\to$ `Initiatives` $\to$ `Plans` $\to$ `Tasks` $\to$ `Execution` $\to$ `Results` $\to$ `Learning`

### Personal OS Pipeline:
`Personal Data` $\to$ `Personal Intelligence` $\to$ `Personal Priorities` $\to$ `Personal Actions` $\to$ `Personal Review`
*(Strict boundary separation between Business and Personal scopes)*

## 3. Producer / Consumer Registry

| Domain | Producer Output | Primary Consumers |
| :--- | :--- | :--- |
| **Sales & CRM** | Leads, Customers, Messages, Deals | Orders, CEO AI, BI |
| **Orders & Stock** | Orders, Stock Reservations, Product Stock | Delivery, Finance, BI, CEO AI |
| **Delivery** | Delivery Dispatch, Status, Carrier Costs | Orders, Finance, BI |
| **Finance** | Financial Accounts, Ledger Transactions, Payments, Profitability | BI, Marketing, CEO AI, Strategy |
| **Marketing** | Ad Campaigns, Ad Spends, Channel Attribution | Sales, Finance, BI, CEO AI |
| **BI Engine** | Daily/Monthly Aggregations, Cohorts, Contribution Profit | CEO AI, Automation, Strategy |
| **Automation** | Triggered Workflows, Action Execution Logs | System Health, CEO AI |
| **CEO AI** | Action Recommendations, Executive Briefings | Team, Strategy, Automation |
| **Team** | Tasks, Time Logs, Performance Ratings | Strategy, CEO AI |
| **Strategy** | Strategic Goals, KPI Targets, Initiatives | Team, CEO AI, BI |
| **Personal OS** | Personal Assets, Liabilities, Tasks, Personal Memory | Wilty Personal Cockpit (ONLY) |

## 4. Forbidden Dependencies & Invariants

1. **BI Engine $\to$ Operational Mutators**: BI Engine reads operational data to build aggregates, but NEVER mutates operational stock, order, or financial tables.
2. **Business $\leftrightarrow$ Personal Cross-Pollination**: Business engines NEVER read or write `scope = personal` tables directly. All cross-domain operations MUST pass through `BusinessPersonalBridgeRecord` with explicit audit trails.
3. **CEO AI $\to$ Direct Database Bypasses**: CEO AI cannot execute arbitrary SQL or bypass business engine validators. All actions route through domain application services.
4. **Idempotency Invariant**: Duplicate event receipt (`idempotency_key`) must result in no duplicate database entries or financial transactions.
