-- ============================================================================
-- WILLSHOP OS — MIGRATION 20260914000002: AD MARKETING ATTRIBUTION & LIFECYCLE
-- ============================================================================

-- 1. CUSTOMER ATTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.customer_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN', -- 'FACEBOOK_ADS', 'INSTAGRAM_ADS', 'WHATSAPP_DIRECT', 'REFERRAL', 'ORGANIC', 'OTHER', 'UNKNOWN'
    source_type VARCHAR(50) NOT NULL DEFAULT 'unknown', -- 'ad', 'post', 'tracking_link', 'qr', 'unknown'
    platform VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN', -- 'META_ADS', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'UNKNOWN'
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    campaign_name VARCHAR(255),
    ad_set_id UUID REFERENCES public.ad_sets(id) ON DELETE SET NULL,
    ad_set_name VARCHAR(255),
    ad_id VARCHAR(255),
    ad_name VARCHAR(255),
    creative_id UUID REFERENCES public.marketing_creatives(id) ON DELETE SET NULL,
    creative_name VARCHAR(255),
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    product_name VARCHAR(255),
    source_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    confidence VARCHAR(20) NOT NULL DEFAULT 'UNKNOWN', -- 'HIGH', 'MEDIUM', 'LOW', 'UNKNOWN'
    attribution_method VARCHAR(50) NOT NULL DEFAULT 'UNKNOWN', -- 'META_REFERRAL_DIRECT', 'TRACKING_LINK_ID', 'EXPLICIT_SOURCE_LINK', 'PRODUCT_MATCH', 'ORGANIC_DIRECT', 'UNKNOWN'
    touch_type VARCHAR(20) NOT NULL DEFAULT 'last_touch', -- 'first_touch', 'last_touch'
    attributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONVERSION LIFECYCLE EVENTS TABLE
CREATE TABLE IF NOT EXISTS public.attribution_lifecycle_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
    attribution_id UUID REFERENCES public.customer_attributions(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- 'ATTRIBUTED', 'LEAD', 'QUALIFIED', 'PRODUCT_INTEREST', 'DELIVERY_CHECKED', 'ORDER_STARTED', 'ORDER_CREATED', 'ORDER_CONFIRMED', 'DELIVERED', 'PAID'
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) DEFAULT 0.00,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES FOR MULTI-TENANT QUERY EFFICIENCY
CREATE INDEX IF NOT EXISTS idx_cust_attr_org_cust ON public.customer_attributions (organization_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_cust_attr_org_touch ON public.customer_attributions (organization_id, customer_id, touch_type);
CREATE INDEX IF NOT EXISTS idx_attr_events_org_type ON public.attribution_lifecycle_events (organization_id, event_type);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES FOR TENANT ISOLATION
ALTER TABLE public.customer_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribution_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY rls_customer_attributions_all ON public.customer_attributions 
    FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY rls_attribution_lifecycle_events_all ON public.attribution_lifecycle_events 
    FOR ALL USING (public.is_org_member(organization_id));
