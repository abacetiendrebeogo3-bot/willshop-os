-- ============================================================================
-- WILLShop OS — BUILD 04 ORDERS + STOCK ENGINE RPC MIGRATION
-- Migration: 20260905000004_orders_stock.sql
-- Description: Atomic PostgreSQL transaction functions for orders & stock
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RPC: CONFIRM ORDER (ATOMIC TRANSACTION WITH DEADLOCK MITIGATION)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.confirm_order(
    p_order_id UUID,
    p_organization_id UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_order record;
    v_item record;
    v_stock record;
    v_idempotency record;
    v_hash TEXT;
    v_result JSONB;
BEGIN
    v_actor_id := auth.uid();

    -- 1. Security Check
    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    -- 2. Idempotency Check
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        v_hash := md5(p_order_id::text || ':' || p_organization_id::text);
        SELECT * INTO v_idempotency 
        FROM public.idempotency_keys 
        WHERE key = p_idempotency_key AND organization_id = p_organization_id;

        IF FOUND THEN
            IF v_idempotency.request_hash <> v_hash THEN
                RAISE EXCEPTION 'IDEMPOTENCY_KEY_REUSE_MISMATCH: Key % reused with different payload', p_idempotency_key;
            END IF;
            IF v_idempotency.response_payload IS NOT NULL THEN
                RETURN v_idempotency.response_payload;
            END IF;
        ELSE
            INSERT INTO public.idempotency_keys (key, organization_id, request_hash, status)
            VALUES (p_idempotency_key, p_organization_id, v_hash, 'PROCESSING');
        END IF;
    END IF;

    -- 3. Lock and Verify Order
    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id AND organization_id = p_organization_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Order % not found', p_order_id;
    END IF;

    IF v_order.status <> 'DRAFT' THEN
        IF v_order.status = 'CONFIRMED' THEN
            v_result := jsonb_build_object('orderId', p_order_id, 'status', 'CONFIRMED', 'alreadyConfirmed', true);
            RETURN v_result;
        END IF;
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot confirm order in status %', v_order.status;
    END IF;

    -- 4. Lock Product Stocks in Deterministic Order (product_id ASC) to prevent Deadlocks
    FOR v_item IN 
        SELECT * FROM public.order_items 
        WHERE order_id = p_order_id AND organization_id = p_organization_id 
        ORDER BY product_id ASC
    LOOP
        SELECT * INTO v_stock 
        FROM public.product_stock 
        WHERE product_id = v_item.product_id AND organization_id = p_organization_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Stock record not found for product %', v_item.product_id;
        END IF;

        -- Verify Stock Availability
        IF (v_stock.physical_stock - v_stock.reserved_stock) < v_item.quantity THEN
            RAISE EXCEPTION 'INSUFFICIENT_STOCK: Product % has available stock % but requested %', 
                v_item.product_id, (v_stock.physical_stock - v_stock.reserved_stock), v_item.quantity;
        END IF;
    END LOOP;

    -- 5. Reserve Stock & Record Stock Movements
    FOR v_item IN 
        SELECT * FROM public.order_items 
        WHERE order_id = p_order_id AND organization_id = p_organization_id 
        ORDER BY product_id ASC
    LOOP
        UPDATE public.product_stock
        SET reserved_stock = reserved_stock + v_item.quantity,
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND organization_id = p_organization_id;

        INSERT INTO public.stock_movements (
            organization_id, product_id, movement_type, direction, quantity, reference_type, reference_id, reason, created_by
        ) VALUES (
            p_organization_id, v_item.product_id, 'RESERVATION', 'RESERVE', v_item.quantity, 'ORDER', p_order_id::text, 'Order Confirmation Reservation', v_actor_id
        );
    END LOOP;

    -- 6. Update Order Status
    UPDATE public.orders
    SET status = 'CONFIRMED',
        updated_at = NOW()
    WHERE id = p_order_id AND organization_id = p_organization_id;

    -- 7. Record Audit & Event
    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id, after_state)
    VALUES (p_organization_id, v_actor_id, 'order.confirm', 'orders', p_order_id::text, jsonb_build_object('status', 'CONFIRMED'));

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'order.confirmed', jsonb_build_object('orderId', p_order_id, 'orderNumber', v_order.order_number), v_actor_id);

    v_result := jsonb_build_object('orderId', p_order_id, 'status', 'CONFIRMED', 'success', true);

    -- 8. Complete Idempotency Result
    IF p_idempotency_key IS NOT NULL AND p_idempotency_key <> '' THEN
        UPDATE public.idempotency_keys
        SET status = 'COMPLETED', response_payload = v_result
        WHERE key = p_idempotency_key AND organization_id = p_organization_id;
    END IF;

    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. RPC: CANCEL ORDER
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.cancel_order(
    p_order_id UUID,
    p_organization_id UUID,
    p_idempotency_key TEXT DEFAULT NULL,
    p_reason TEXT DEFAULT 'Cancelled by user'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_order record;
    v_item record;
    v_result JSONB;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id AND organization_id = p_organization_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Order % not found', p_order_id;
    END IF;

    IF v_order.status = 'CANCELLED' THEN
        RETURN jsonb_build_object('orderId', p_order_id, 'status', 'CANCELLED', 'alreadyCancelled', true);
    END IF;

    -- If order was CONFIRMED or PREPARING/READY, release reserved stock
    IF v_order.status IN ('CONFIRMED', 'PREPARING', 'READY') THEN
        FOR v_item IN 
            SELECT * FROM public.order_items 
            WHERE order_id = p_order_id AND organization_id = p_organization_id 
            ORDER BY product_id ASC
        LOOP
            UPDATE public.product_stock
            SET reserved_stock = GREATEST(0, reserved_stock - v_item.quantity),
                updated_at = NOW()
            WHERE product_id = v_item.product_id AND organization_id = p_organization_id;

            INSERT INTO public.stock_movements (
                organization_id, product_id, movement_type, direction, quantity, reference_type, reference_id, reason, created_by
            ) VALUES (
                p_organization_id, v_item.product_id, 'RELEASE', 'RELEASE', v_item.quantity, 'ORDER', p_order_id::text, p_reason, v_actor_id
            );
        END LOOP;
    END IF;

    UPDATE public.orders
    SET status = 'CANCELLED',
        notes = COALESCE(notes || ' | ', '') || 'Cancelled: ' || p_reason,
        updated_at = NOW()
    WHERE id = p_order_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id, reason)
    VALUES (p_organization_id, v_actor_id, 'order.cancel', 'orders', p_order_id::text, p_reason);

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'order.cancelled', jsonb_build_object('orderId', p_order_id, 'reason', p_reason), v_actor_id);

    v_result := jsonb_build_object('orderId', p_order_id, 'status', 'CANCELLED', 'success', true);
    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC: MARK OUT FOR DELIVERY (ATOMIC STOCK SALE DEDUCTION)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.mark_out_for_delivery(
    p_order_id UUID,
    p_organization_id UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_order record;
    v_item record;
    v_result JSONB;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    SELECT * INTO v_order 
    FROM public.orders 
    WHERE id = p_order_id AND organization_id = p_organization_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Order % not found', p_order_id;
    END IF;

    IF v_order.status = 'OUT_FOR_DELIVERY' THEN
        RETURN jsonb_build_object('orderId', p_order_id, 'status', 'OUT_FOR_DELIVERY', 'alreadyOutForDelivery', true);
    END IF;

    -- Atomically convert reserved stock to physical sale deduction
    FOR v_item IN 
        SELECT * FROM public.order_items 
        WHERE order_id = p_order_id AND organization_id = p_organization_id 
        ORDER BY product_id ASC
    LOOP
        UPDATE public.product_stock
        SET physical_stock = GREATEST(0, physical_stock - v_item.quantity),
            reserved_stock = GREATEST(0, reserved_stock - v_item.quantity),
            updated_at = NOW()
        WHERE product_id = v_item.product_id AND organization_id = p_organization_id;

        INSERT INTO public.stock_movements (
            organization_id, product_id, movement_type, direction, quantity, reference_type, reference_id, reason, created_by
        ) VALUES (
            p_organization_id, v_item.product_id, 'SALE', 'OUT', v_item.quantity, 'ORDER', p_order_id::text, 'Out for Delivery Sale Deduction', v_actor_id
        );
    END LOOP;

    UPDATE public.orders
    SET status = 'OUT_FOR_DELIVERY',
        updated_at = NOW()
    WHERE id = p_order_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id)
    VALUES (p_organization_id, v_actor_id, 'order.out_for_delivery', 'orders', p_order_id::text);

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'order.out_for_delivery', jsonb_build_object('orderId', p_order_id), v_actor_id);

    v_result := jsonb_build_object('orderId', p_order_id, 'status', 'OUT_FOR_DELIVERY', 'success', true);
    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC: STOCK ADJUSTMENT (CONTROLLED AUDITED INVENTORY ADJUSTMENT)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.stock_adjustment(
    p_product_id UUID,
    p_organization_id UUID,
    p_new_physical_stock INT,
    p_reason TEXT DEFAULT 'Physical Inventory Adjustment'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_stock record;
    v_delta INT;
    v_dir VARCHAR(10);
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    IF p_new_physical_stock < 0 THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Physical stock cannot be negative';
    END IF;

    SELECT * INTO v_stock 
    FROM public.product_stock 
    WHERE product_id = p_product_id AND organization_id = p_organization_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Product stock not found for product %', p_product_id;
    END IF;

    IF p_new_physical_stock < v_stock.reserved_stock THEN
        RAISE EXCEPTION 'VALIDATION_ERROR: Physical stock % cannot be set below reserved stock %', 
            p_new_physical_stock, v_stock.reserved_stock;
    END IF;

    v_delta := p_new_physical_stock - v_stock.physical_stock;

    IF v_delta = 0 THEN
        RETURN jsonb_build_object('productId', p_product_id, 'physicalStock', p_new_physical_stock, 'adjusted', false);
    END IF;

    IF v_delta > 0 THEN
        v_dir := 'IN';
    ELSE
        v_dir := 'OUT';
    END IF;

    UPDATE public.product_stock
    SET physical_stock = p_new_physical_stock,
        updated_at = NOW()
    WHERE product_id = p_product_id AND organization_id = p_organization_id;

    INSERT INTO public.stock_movements (
        organization_id, product_id, movement_type, direction, quantity, reference_type, reference_id, reason, created_by
    ) VALUES (
        p_organization_id, p_product_id, 'ADJUSTMENT', v_dir, ABS(v_delta), 'INVENTORY', p_product_id::text, p_reason, v_actor_id
    );

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id, before_state, after_state, reason)
    VALUES (
        p_organization_id, v_actor_id, 'stock.adjustment', 'product_stock', p_product_id::text,
        jsonb_build_object('physicalStock', v_stock.physical_stock),
        jsonb_build_object('physicalStock', p_new_physical_stock),
        p_reason
    );

    RETURN jsonb_build_object('productId', p_product_id, 'physicalStock', p_new_physical_stock, 'adjusted', true);
END;
$$;
