# WillShop OS — Single Source of Truth Audit

This document defines the authoritative Single Source of Truth (SSOT) for all critical data domains in WillShop OS, detailing read/write boundaries, projections, snapshots, and caching rules.

## 1. Single Source of Truth Registry

| Data Domain | Single Source of Truth Table | Read Pattern / Access Service | Allowed Projections & Caches | Prohibited Actions |
| :--- | :--- | :--- | :--- | :--- |
| **Inventory Stock** | `product_stock` | `OrderStockApplicationService` | BI aggregates, Stock alert caches | Direct stock mutation by BI or Delivery |
| **Orders** | `orders` | `OrderStockApplicationService` | Sales CRM projections, Delivery orders | Order status changes without stock/finance events |
| **Payments** | `payments` | `FinanceApplicationServices` | Order payment status, Finance ledger link | Modifying payment records outside Finance service |
| **Business Finance** | `financial_accounts`, `transactions` | `FinanceApplicationServices` | BI Financial dashboards, CEO Cockpit Cash KPI | Direct ledger updates bypassing double-entry checks |
| **Marketing Spend** | `marketing_spends` | `MarketingApplicationServices` | BI CAC & ROI projections, CEO AI Marketing reports | Inventing spend figures or changing historical attribution |
| **Delivery Logistics**| `deliveries` | `DeliveryApplicationServices` | Order fulfillment badges, Driver task queues | Delivery status changes without carrier event |
| **Customer Data** | `customers` | `SalesAgentService` | WhatsApp contact cards, CRM lead records | Duplicating customer profiles across tenants |
| **BI Metrics & KPIs** | Source queries over SSOT tables | `AnalyticsApplicationServices` | Calculated daily snapshots in BI cache | Serving as primary source for operational state |
| **Strategic Goals** | `strategy_goals`, `strategy_objectives` | `StrategyApplicationServices` | CEO Cockpit Goal Widgets, Team initiative links | Manual goal override without linked KPI evidence |
| **Team Tasks** | `team_tasks` | `TeamApplicationServices` | Strategy initiative progress bars, CEO AI daily task list | Task mutation without actor authorization |
| **Personal Wealth** | `personal_assets`, `personal_liabilities` | `PersonalApplicationServices` | Wilty Personal Net Worth widget | Reading or injecting into Business Finance |

## 2. Invariant Rules for Data Consistency

1. **No Operational Mutation by Analytics**: BI projections, dashboards, and CEO AI read SSOT tables directly or via services, but MUST NEVER write to SSOT operational state.
2. **Double-Entry Financial Auditing**: Every transaction in `transactions` must balance across `financial_accounts`. `payments` status transitions trigger corresponding ledger movements.
3. **Inventory Reservation Standard**: Stock reservations decrease available `product_stock.quantity_available` immediately upon order confirmation. Order cancellations restore reserved quantities idempotently.
4. **Attribution Integrity**: Revenue and CAC calculations in Marketing must derive strictly from `orders` and `marketing_spends` with matching `campaign_id` or `attribution_source`.
