# ADR 007 — Finance Engine Ownership & Multi-Account Ledger

## Status
Accepted

## Context
WillShop OS requires an absolute, unshakeable source of financial truth for the e-commerce business. The CEO needs to know at any moment:
- How much money WillShop owns across all accounts (Cash, Orange Money, Moov Money, Bank Accounts).
- The exact origin and destination of every FCFA entering or leaving the business.
- True operating profitability vs cash flow position.
- Strict separation between WillShop corporate finances and Wilty's personal finances.

## Decision
1. **Append-Only Financial Ledger**: Posted transactions are immutable. Physical deletion or direct in-place mutation of a `POSTED` transaction is forbidden. Adjustments must be performed via counter-entries or auditable reconciliation adjustments.
2. **Business vs Personal Isolation**: All tables and services operate strictly under `organization_id = WillShop`. Owner withdrawals are categorized as `OWNER_DRAW` (equity outflow) and owner capital injections as `OWNER_CONTRIBUTION` (equity inflow). `OWNER_DRAW` is strictly excluded from Operating Expenses (OpEx).
3. **Atomic Account Transfers**: Transfers between two accounts within the same organization generate two linked transaction entries (`OUTFLOW` from source, `INFLOW` to destination) sharing a single `transfer_id`, executed atomically via PostgreSQL RPC (`transfer_funds`) with deterministic `FOR UPDATE` locking.
4. **Orders & Delivery Integration Contracts**:
   - Order payments verified trigger `INFLOW` transactions under `PRODUCT_SALE`.
   - Delivery revenue (`DELIVERY_FEE_COLLECTED`) and driver cost (`DELIVERY_COST`) are tracked separately to calculate true delivery margin.
   - Cost of Goods Sold (COGS) is determined from product historical snapshot costs (`unit_cost_snapshot`).

## Consequences
- Guarantees financial integrity and auditability.
- Prevents accidental distortion of profit metrics by owner personal withdrawals.
- Prepares WillShop OS for future double-entry general ledger accounting (V2) without breaking backward compatibility.
