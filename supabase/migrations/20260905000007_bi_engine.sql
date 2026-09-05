-- ============================================================================
-- WILLShop OS — BUILD 07 BI & BUSINESS INTELLIGENCE ENGINE MIGRATION
-- Migration: 20260905000007_bi_engine.sql
-- Description: Analytical Tables, Data Quality, BI Alerts, and Security-hardened Analytical RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. DATA QUALITY ISSUES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.data_quality_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    issue_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    description TEXT NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL
);

ALTER TABLE public.data_quality_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "data_quality_issues_org_policy" ON public.data_quality_issues;
CREATE POLICY "data_quality_issues_org_policy" ON public.data_quality_issues
    FOR ALL
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- 2. BI ALERTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bi_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    alert_type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ NULL,
    resolved_at TIMESTAMPTZ NULL
);

ALTER TABLE public.bi_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "bi_alerts_org_policy" ON public.bi_alerts;
CREATE POLICY "bi_alerts_org_policy" ON public.bi_alerts
    FOR ALL
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- 3. ANALYTICAL RPC: bi_product_performance_summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bi_product_performance_summary(p_org_id UUID)
RETURNS TABLE (
    product_id UUID,
    sku VARCHAR,
    product_name VARCHAR,
    units_sold BIGINT,
    revenue_fcfa NUMERIC,
    cogs_fcfa NUMERIC,
    gross_profit_fcfa NUMERIC,
    gross_margin_percentage NUMERIC,
    available_stock INT,
    performance_tag VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Forbidden: User is not a member of organization %', p_org_id;
    END IF;

    RETURN QUERY
    SELECT 
        p.id AS product_id,
        p.sku,
        p.name AS product_name,
        COALESCE(SUM(oi.quantity), 0)::BIGINT AS units_sold,
        COALESCE(SUM(oi.subtotal), 0.00)::NUMERIC AS revenue_fcfa,
        COALESCE(SUM(oi.quantity * p.purchase_price), 0.00)::NUMERIC AS cogs_fcfa,
        (COALESCE(SUM(oi.subtotal), 0.00) - COALESCE(SUM(oi.quantity * p.purchase_price), 0.00))::NUMERIC AS gross_profit_fcfa,
        CASE 
            WHEN COALESCE(SUM(oi.subtotal), 0) > 0 THEN 
                ROUND(((COALESCE(SUM(oi.subtotal), 0.00) - COALESCE(SUM(oi.quantity * p.purchase_price), 0.00)) / SUM(oi.subtotal)) * 100, 1)
            ELSE 0.0 
        END::NUMERIC AS gross_margin_percentage,
        COALESCE(ps.available_stock, 0)::INT AS available_stock,
        CASE 
            WHEN COALESCE(SUM(oi.quantity), 0) >= 30 THEN 'BEST_SELLER'::VARCHAR
            WHEN COALESCE(ps.available_stock, 0) <= p.minimum_stock THEN 'WATCH'::VARCHAR
            ELSE 'REGULAR'::VARCHAR
        END AS performance_tag
    FROM public.products p
    LEFT JOIN public.product_stock ps ON ps.product_id = p.id AND ps.organization_id = p_org_id
    LEFT JOIN public.order_items oi ON oi.product_id = p.id AND oi.organization_id = p_org_id
    LEFT JOIN public.orders o ON o.id = oi.order_id AND o.status IN ('DELIVERED', 'COMPLETED')
    WHERE p.organization_id = p_org_id AND p.deleted_at IS NULL
    GROUP BY p.id, p.sku, p.name, p.purchase_price, ps.available_stock, p.minimum_stock
    ORDER BY revenue_fcfa DESC;
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. ANALYTICAL RPC: bi_delivery_performance_summary
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bi_delivery_performance_summary(p_org_id UUID)
RETURNS TABLE (
    zone_id UUID,
    zone_name VARCHAR,
    city VARCHAR,
    total_deliveries BIGINT,
    delivered_count BIGINT,
    failed_count BIGINT,
    failure_rate_percentage NUMERIC,
    delivery_fee_collected_fcfa NUMERIC,
    delivery_cost_paid_fcfa NUMERIC,
    delivery_margin_fcfa NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Forbidden: User is not a member of organization %', p_org_id;
    END IF;

    RETURN QUERY
    SELECT
        z.id AS zone_id,
        z.name AS zone_name,
        z.city,
        COUNT(d.id)::BIGINT AS total_deliveries,
        COUNT(CASE WHEN d.status IN ('DELIVERED', 'CLOSED') THEN 1 END)::BIGINT AS delivered_count,
        COUNT(CASE WHEN d.status = 'FAILED' THEN 1 END)::BIGINT AS failed_count,
        CASE 
            WHEN COUNT(d.id) > 0 THEN ROUND((COUNT(CASE WHEN d.status = 'FAILED' THEN 1 END)::NUMERIC / COUNT(d.id)::NUMERIC) * 100, 1)
            ELSE 0.0 
        END::NUMERIC AS failure_rate_percentage,
        COALESCE(SUM(d.delivery_fee), 0.00)::NUMERIC AS delivery_fee_collected_fcfa,
        COALESCE(SUM(d.delivery_fee * 0.7), 0.00)::NUMERIC AS delivery_cost_paid_fcfa,
        COALESCE(SUM(d.delivery_fee * 0.3), 0.00)::NUMERIC AS delivery_margin_fcfa
    FROM public.delivery_zones z
    LEFT JOIN public.deliveries d ON d.zone_id = z.id AND d.organization_id = p_org_id
    WHERE z.organization_id = p_org_id
    GROUP BY z.id, z.name, z.city;
END;
$$;
