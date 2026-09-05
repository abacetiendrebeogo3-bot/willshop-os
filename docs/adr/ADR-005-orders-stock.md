# ADR-005: Orders Transaction Engine & Stock Concurrency Architecture

## Status
Accepted

## Context
WILLShop OS requires an atomic, concurrency-safe, deadlock-mitigated order and stock reservation engine with zero overselling guarantees.

## Decision Standards
1. **Atomic PostgreSQL Transactions**:
   - Operations like `confirm_order`, `cancel_order`, `mark_out_for_delivery`, `return_order`, and `stock_adjustment` execute as atomic `SECURITY DEFINER` functions in PostgreSQL.
2. **Deadlock Mitigation**:
   - Lock acquisition on product stock records (`SELECT FOR UPDATE`) always sorts items deterministically by `product_id ASC`.
3. **Zero Overselling & Full Rollback**:
   - Stock availability check (`physical_stock - reserved_stock >= quantity`) is evaluated for all order items before reserving stock.
   - If any item has insufficient stock, the entire transaction throws `INSUFFICIENT_STOCK` and rolls back completely (0 stock reserved, 0 stock movements created).
4. **Order State Machine**:
   - Transitions strictly follow: `DRAFT` -> `CONFIRMED` -> `PREPARING` -> `READY` -> `OUT_FOR_DELIVERY` -> `DELIVERED` -> `COMPLETED`.
   - Branches: `CANCELLED`, `FAILED`, `RETURNED`, `RESCHEDULED`. Illegal jumps throw `ValidationError`.
5. **Server-Calculated Pricing & Product Snapshots**:
   - Prices, subtotals, delivery fees, discounts, and totals are computed on the server side.
   - `order_items` stores historical snapshots (`product_name_snapshot`, `sku_snapshot`, `unit_price`) to prevent historical data mutation if catalog prices change later.
