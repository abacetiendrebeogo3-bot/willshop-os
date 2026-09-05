# WILLShop OS — Database Architecture & Schema Specification

## 1. Database Engine
- PostgreSQL hosted on Supabase.
- Versioned SQL migrations stored in `supabase/migrations/`.

## 2. Core Tables (Build 01)
- `organizations`: Tenant records (Default: WillShop, Burkina Faso, XOF).
- `user_organization_roles`: User role assignments & permissions.
- `audit_log`: Unified audit trail.
- `events`: System event engine table.
- `notifications`: Notifications repository.
- `idempotency_keys`: Idempotency keys infrastructure table.

## 3. Financial & Operational Standards
- Financial Ledger: Append-only ledger with compensatory transactions.
- Stock Source of Truth: `product_stock` (physical_stock, reserved_stock, minimum_stock) with `available_stock = physical_stock - reserved_stock`.
- Atomic RPCs: PostgreSQL functions execute all critical operations (`confirm_order`, `cancel_order`, etc.).
