# WILLShop OS — Finance Engine Data Model

## Overview
The Finance Engine manages corporate financial accounts, transaction ledgers, account transfers, financial obligations (debts & receivables), and account reconciliations.

## Entities & Tables

### 1. `financial_accounts`
Represents repositories where WillShop corporate money is stored.
- `id` (UUID, Primary Key)
- `organization_id` (UUID, FK -> organizations)
- `name` (VARCHAR, e.g., 'Caisse Principale', 'Orange Money Pro', 'Coris Bank')
- `type` (ENUM: `CASH_REGISTER`, `BANK_ACCOUNT`, `MOBILE_MONEY`, `SAVINGS`, `OTHER_PRO`)
- `currency` (VARCHAR, default 'XOF')
- `opening_balance` (NUMERIC(15,2))
- `current_balance` (NUMERIC(15,2))
- `status` (VARCHAR, default 'ACTIVE')
- `created_at`, `updated_at`

### 2. `transactions`
Append-only ledger recording all corporate cash movements.
- `id` (UUID, Primary Key)
- `organization_id` (UUID, FK -> organizations)
- `financial_account_id` (UUID, FK -> financial_accounts)
- `type` (ENUM: `INCOME`, `EXPENSE`, `TRANSFER`)
- `direction` (VARCHAR: `INFLOW`, `OUTFLOW`)
- `amount` (NUMERIC(15,2), > 0)
- `currency` (VARCHAR, default 'XOF')
- `category` (VARCHAR: `PRODUCT_SALE`, `SUPPLIER_PURCHASE`, `MARKETING_ADS`, `DELIVERY_COST`, `SALARY`, `OWNER_DRAW`, `OWNER_CONTRIBUTION`, etc.)
- `status` (VARCHAR: `PENDING`, `POSTED`, `VOIDED`)
- `reference_type` (VARCHAR: `order`, `payment`, `expense`, `transfer`, `delivery`, `supplier_bill`, `adjustment`)
- `reference_id` (VARCHAR)
- `transfer_id` (UUID, links debit & credit entries)
- `receipt_url` (TEXT, Supabase Storage URL for receipt image/PDF)
- `description` (TEXT)
- `transaction_date` (TIMESTAMPTZ)
- `created_by` (UUID)
- `created_at`, `updated_at`

### 3. `financial_obligations`
Tracks debts owed by WillShop (suppliers, payroll) and receivables owed to WillShop (unpaid customers, partners).
- `id` (UUID, Primary Key)
- `organization_id` (UUID, FK -> organizations)
- `type` (VARCHAR: `DEBT`, `RECEIVABLE`)
- `party_type` (VARCHAR: `SUPPLIER`, `CUSTOMER`, `EMPLOYEE`, `OTHER`)
- `party_id` (UUID, optional)
- `party_name` (VARCHAR)
- `amount` (NUMERIC(15,2))
- `paid_amount` (NUMERIC(15,2))
- `remaining_amount` (NUMERIC(15,2))
- `due_date` (TIMESTAMPTZ)
- `status` (VARCHAR: `PENDING`, `PARTIAL`, `PAID`, `CANCELLED`)
- `description` (TEXT)
- `created_at`, `updated_at`
