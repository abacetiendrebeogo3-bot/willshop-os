-- ============================================================================
-- WILLShop OS — BUILD 05 DELIVERY ENGINE MIGRATION
-- Migration: 20260905000005_delivery_engine.sql
-- Description: Enhanced Delivery schema, snapshots, proof of delivery & atomic RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ADD ENHANCED COLUMNS TO DELIVERIES TABLE
-- ----------------------------------------------------------------------------

ALTER TABLE public.deliveries 
    ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS in_transit_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS rescheduled_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ NULL,
    ADD COLUMN IF NOT EXISTS failure_reason VARCHAR(100) NULL,
    ADD COLUMN IF NOT EXISTS failure_note TEXT NULL,
    ADD COLUMN IF NOT EXISTS reschedule_reason TEXT NULL,
    ADD COLUMN IF NOT EXISTS customer_address_snapshot TEXT NULL,
    ADD COLUMN IF NOT EXISTS customer_phone_snapshot VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS customer_name_snapshot VARCHAR(255) NULL,
    ADD COLUMN IF NOT EXISTS order_total_snapshot NUMERIC(15, 2) NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS delivery_fee_snapshot NUMERIC(15, 2) NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS proof_of_delivery JSONB NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS notes TEXT NULL,
    ADD COLUMN IF NOT EXISTS updated_by UUID NULL;

-- ----------------------------------------------------------------------------
-- 2. RPC: ASSIGN DELIVERY (ATOMIC LOCKING)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.assign_delivery(
    p_delivery_id UUID,
    p_organization_id UUID,
    p_driver_id UUID,
    p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_delivery record;
    v_driver record;
    v_result JSONB;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    -- Verify driver belongs to organization
    SELECT * INTO v_driver FROM public.drivers 
    WHERE id = p_driver_id AND organization_id = p_organization_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Driver % not found', p_driver_id;
    END IF;

    -- Lock delivery record
    SELECT * INTO v_delivery FROM public.deliveries 
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Delivery % not found', p_delivery_id;
    END IF;

    IF v_delivery.status NOT IN ('PENDING', 'RESCHEDULED') THEN
        IF v_delivery.status = 'ASSIGNED' AND v_delivery.driver_id = p_driver_id THEN
            RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'ASSIGNED', 'alreadyAssigned', true);
        END IF;
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot assign delivery in status %', v_delivery.status;
    END IF;

    UPDATE public.deliveries
    SET driver_id = p_driver_id,
        status = 'ASSIGNED',
        assigned_at = NOW(),
        updated_at = NOW(),
        updated_by = v_actor_id
    WHERE id = p_delivery_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id, after_state)
    VALUES (p_organization_id, v_actor_id, 'delivery.assign', 'deliveries', p_delivery_id::text, jsonb_build_object('driverId', p_driver_id, 'status', 'ASSIGNED'));

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'delivery.assigned', jsonb_build_object('deliveryId', p_delivery_id, 'driverId', p_driver_id, 'orderId', v_delivery.order_id), v_actor_id);

    v_result := jsonb_build_object('deliveryId', p_delivery_id, 'driverId', p_driver_id, 'status', 'ASSIGNED', 'success', true);
    RETURN v_result;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC: PICKUP DELIVERY
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.pickup_delivery(
    p_delivery_id UUID,
    p_organization_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_delivery record;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    SELECT * INTO v_delivery FROM public.deliveries 
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Delivery % not found', p_delivery_id;
    END IF;

    IF v_delivery.status <> 'ASSIGNED' THEN
        IF v_delivery.status = 'PICKED_UP' THEN
            RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'PICKED_UP', 'alreadyPickedUp', true);
        END IF;
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot pickup delivery in status %', v_delivery.status;
    END IF;

    UPDATE public.deliveries
    SET status = 'PICKED_UP',
        picked_up_at = NOW(),
        updated_at = NOW(),
        updated_by = v_actor_id
    WHERE id = p_delivery_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id)
    VALUES (p_organization_id, v_actor_id, 'delivery.pickup', 'deliveries', p_delivery_id::text);

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'delivery.picked_up', jsonb_build_object('deliveryId', p_delivery_id), v_actor_id);

    RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'PICKED_UP', 'success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC: START IN_TRANSIT DELIVERY
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.start_transit_delivery(
    p_delivery_id UUID,
    p_organization_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_delivery record;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    SELECT * INTO v_delivery FROM public.deliveries 
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Delivery % not found', p_delivery_id;
    END IF;

    IF v_delivery.status NOT IN ('PICKED_UP', 'ASSIGNED') THEN
        IF v_delivery.status = 'IN_TRANSIT' THEN
            RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'IN_TRANSIT', 'alreadyInTransit', true);
        END IF;
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot start transit for delivery in status %', v_delivery.status;
    END IF;

    UPDATE public.deliveries
    SET status = 'IN_TRANSIT',
        in_transit_at = NOW(),
        updated_at = NOW(),
        updated_by = v_actor_id
    WHERE id = p_delivery_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id)
    VALUES (p_organization_id, v_actor_id, 'delivery.start_transit', 'deliveries', p_delivery_id::text);

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'delivery.in_transit', jsonb_build_object('deliveryId', p_delivery_id), v_actor_id);

    RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'IN_TRANSIT', 'success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPC: COMPLETE DELIVERY (DELIVERED WITH PROOF)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.deliver_delivery(
    p_delivery_id UUID,
    p_organization_id UUID,
    p_proof_json JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_delivery record;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    SELECT * INTO v_delivery FROM public.deliveries 
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Delivery % not found', p_delivery_id;
    END IF;

    IF v_delivery.status NOT IN ('IN_TRANSIT', 'PICKED_UP') THEN
        IF v_delivery.status = 'DELIVERED' THEN
            RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'DELIVERED', 'alreadyDelivered', true);
        END IF;
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot complete delivery in status %', v_delivery.status;
    END IF;

    UPDATE public.deliveries
    SET status = 'DELIVERED',
        delivered_at = NOW(),
        proof_of_delivery = p_proof_json,
        updated_at = NOW(),
        updated_by = v_actor_id
    WHERE id = p_delivery_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id, after_state)
    VALUES (p_organization_id, v_actor_id, 'delivery.deliver', 'deliveries', p_delivery_id::text, jsonb_build_object('proof', p_proof_json));

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'delivery.delivered', jsonb_build_object('deliveryId', p_delivery_id, 'orderId', v_delivery.order_id), v_actor_id);

    RETURN jsonb_build_object('deliveryId', p_delivery_id, 'orderId', v_delivery.order_id, 'status', 'DELIVERED', 'success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. RPC: FAIL DELIVERY
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fail_delivery(
    p_delivery_id UUID,
    p_organization_id UUID,
    p_failure_reason VARCHAR(100),
    p_failure_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_delivery record;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    SELECT * INTO v_delivery FROM public.deliveries 
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Delivery % not found', p_delivery_id;
    END IF;

    IF v_delivery.status IN ('DELIVERED', 'CLOSED', 'CANCELLED') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot fail delivery in status %', v_delivery.status;
    END IF;

    UPDATE public.deliveries
    SET status = 'FAILED',
        failed_at = NOW(),
        failure_reason = p_failure_reason,
        failure_note = p_failure_note,
        updated_at = NOW(),
        updated_by = v_actor_id
    WHERE id = p_delivery_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id, reason)
    VALUES (p_organization_id, v_actor_id, 'delivery.fail', 'deliveries', p_delivery_id::text, p_failure_reason);

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'delivery.failed', jsonb_build_object('deliveryId', p_delivery_id, 'reason', p_failure_reason), v_actor_id);

    RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'FAILED', 'reason', p_failure_reason, 'success', true);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. RPC: RESCHEDULE DELIVERY
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.reschedule_delivery(
    p_delivery_id UUID,
    p_organization_id UUID,
    p_scheduled_at TIMESTAMPTZ,
    p_reason TEXT DEFAULT 'Rescheduled by customer or driver'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_delivery record;
BEGIN
    v_actor_id := auth.uid();

    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'FORBIDDEN: User not authorized in organization %', p_organization_id;
    END IF;

    SELECT * INTO v_delivery FROM public.deliveries 
    WHERE id = p_delivery_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'NOT_FOUND: Delivery % not found', p_delivery_id;
    END IF;

    IF v_delivery.status NOT IN ('FAILED', 'PENDING', 'ASSIGNED') THEN
        RAISE EXCEPTION 'INVALID_TRANSITION: Cannot reschedule delivery in status %', v_delivery.status;
    END IF;

    UPDATE public.deliveries
    SET status = 'RESCHEDULED',
        scheduled_at = p_scheduled_at,
        rescheduled_at = NOW(),
        reschedule_reason = p_reason,
        updated_at = NOW(),
        updated_by = v_actor_id
    WHERE id = p_delivery_id AND organization_id = p_organization_id;

    INSERT INTO public.audit_log (organization_id, actor_id, action, target_entity, target_id, reason)
    VALUES (p_organization_id, v_actor_id, 'delivery.reschedule', 'deliveries', p_delivery_id::text, p_reason);

    INSERT INTO public.events (organization_id, event_type, payload, actor_id)
    VALUES (p_organization_id, 'delivery.rescheduled', jsonb_build_object('deliveryId', p_delivery_id, 'scheduledAt', p_scheduled_at), v_actor_id);

    RETURN jsonb_build_object('deliveryId', p_delivery_id, 'status', 'RESCHEDULED', 'scheduledAt', p_scheduled_at, 'success', true);
END;
$$;
