# ADR-006: Delivery Engine Ownership & Order Integration Architecture

## Status
Accepted

## Context
WILLShop OS requires a complete Delivery Engine for managing delivery zones, driver assignments, proof of delivery, status tracking, failures, rescheduling, and returns.

## Decision Standards
1. **Module Ownership Boundaries**:
   - Delivery Engine maintains its own state (`deliveries` table and state machine: `PENDING` -> `ASSIGNED` -> `PICKED_UP` -> `IN_TRANSIT` -> `DELIVERED` -> `CLOSED`).
   - Orders Engine remains the SOLE owner of order statuses (`DRAFT`, `CONFIRMED`, `PREPARING`, `READY`, `OUT_FOR_DELIVERY`, `DELIVERED`, `COMPLETED`).
2. **Order & Stock Non-Bypass**:
   - Delivery Engine MUST NOT write directly to `product_stock` or `stock_movements`.
   - On delivery completion (`DELIVERED`), Delivery Engine invokes `MarkOutForDeliveryService` in the Orders module.
   - On delivery return (`RETURNED`), Delivery Engine passes return context (`items_intact: true/false`) to `ReturnOrderService` in the Orders module.
3. **Fee Snapshots**:
   - Delivery fee is snapshotted at creation (`delivery_fee_snapshot`) to prevent historical data mutation if delivery zone fees change later.
4. **Proof of Delivery Storage**:
   - Photos, signatures, recipient names, OTP codes, and notes are stored as structured JSON metadata in `proof_of_delivery`. Media binary files are uploaded to Supabase Storage; raw base64 is NEVER stored in PostgreSQL.
5. **Multi-Tenant RLS & Security**:
   - RLS policies use `public.is_org_member(organization_id)`. SECURITY DEFINER RPCs strictly enforce `SET search_path = public, pg_temp` and `auth.uid()`.
