# Wilty Personal OS — Personal Finance Ledger Specification

## Principles
1. **Isolated Ledger**: `personal_financial_accounts` and `personal_transactions` are completely decoupled from `financial_accounts` and `transactions` (Business Engine).
2. **Append-Only Transactions**: Historical transactions are never overwritten or deleted silently. Reversals or adjustments require explicit `ADJUSTMENT` / `REVERSED` transaction records.
3. **Net Worth Calculation**:
   $$\text{Net Worth} = \text{Assets (Cash + Bank + Investments)} - \text{Liabilities (Loans + Debts)}$$
4. **Investment Tracking**: Real-time valuation tracking for stocks, crypto, real estate, and private equity without executing automatic market orders.
