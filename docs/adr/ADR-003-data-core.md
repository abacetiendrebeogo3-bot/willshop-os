# ADR-003: Data Core Architecture & Schema Standards

## Status
Accepted

## Context
WILLShop OS requires a central Data Core that serves as the single source of truth for all business engines (CRM, Stock, Orders, Delivery, Finance, Marketing, Team, Strategy, AI).

## Decision Standards
1. **Stock Source of Truth**:
   - Stock is maintained in `product_stock` (`physical_stock`, `reserved_stock`, `minimum_stock`) with `available_stock = physical_stock - reserved_stock`.
   - Every physical stock change or reservation writes an append-only entry in `stock_movements`.
2. **Financial Ledger & Scope**:
   - `financial_accounts` and `transactions` handle WillShop business finances ONLY.
   - Strict separation between business finance (`scope = business`) and Wilty personal finance (`scope = personal`).
3. **Data Snapshots**:
   - `order_items` stores historical snapshots of `product_name_snapshot` and `sku_snapshot` to prevent historical data mutation if product catalog changes.
4. **AI Memory Scope**:
   - `ai_memories` supports `scope = 'business'` (scoped to `organization_id`) and `scope = 'personal'` (scoped to individual user).
5. **No Destructive CASCADE**:
   - Critical business data (`customers`, `products`, `orders`, `financial_accounts`) uses `ON DELETE RESTRICT` or `ON DELETE SET NULL` to prevent accidental data loss.
