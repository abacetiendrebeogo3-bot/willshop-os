# WILLShop OS — Finance Invariants & Rules

## Core Financial Invariants

1. **Transaction Immutability**:
   - A `POSTED` transaction can never have its `amount`, `category`, or `financial_account_id` mutated.
   - Corrections require explicit void entries or auditable reconciliation adjustments.

2. **Business vs Personal Separation**:
   - `OWNER_DRAW` represents equity withdrawals by Wilty. It is recorded as an equity outflow and strictly **EXCLUDED** from Operating Expenses (OpEx) so it never artificially reduces operating margins.
   - `OWNER_CONTRIBUTION` represents capital injections into WillShop. It is recorded as an equity inflow and strictly **EXCLUDED** from Product Sales Revenue.

3. **Cash Flow vs Profit Distinction**:
   - `Net Cash Flow` = Total Inflows - Total Outflows.
   - `Gross Profit` = Product Revenue - Cost of Goods Sold (COGS).
   - `Operating Profit` = Gross Profit - Operating Expenses (OpEx).
   - Cash position and profitability are tracked separately to avoid cash crunch surprises.

4. **Fund Transfer Invariant**:
   - A transfer between Account A and Account B debits Account A (`OUTFLOW`) and credits Account B (`INFLOW`) by the exact same amount.
   - Both entries share a single `transfer_id`.

5. **Multi-Tenant RLS Isolation**:
   - All financial accounts, transactions, and obligations are isolated by `organization_id` at the database level.
   - No user can access or mutate financial data outside their authorized organization.
