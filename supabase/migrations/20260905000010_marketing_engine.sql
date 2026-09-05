-- ============================================================================
-- WILLSHOP OS — MIGRATION 20260905000010: MARKETING INTELLIGENCE & ENGINE
-- ============================================================================

-- 1. AD ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.ad_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL DEFAULT 'META_ADS', -- 'META_ADS', 'GOOGLE_ADS', 'MANUAL'
    external_account_id VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MARKETING CAMPAIGNS TABLE
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    platform VARCHAR(50) NOT NULL DEFAULT 'META_ADS',
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- 'DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED', 'ERROR'
    budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    daily_budget NUMERIC(15, 2),
    target_products JSONB DEFAULT '[]'::jsonb,
    start_at TIMESTAMPTZ,
    end_at TIMESTAMPTZ,
    attributed_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    attributed_orders_count INTEGER NOT NULL DEFAULT 0,
    total_spend NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    cogs NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    delivery_costs NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    contribution_profit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    roas NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    roi NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AD SETS TABLE
CREATE TABLE IF NOT EXISTS public.ad_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_audience TEXT,
    daily_budget NUMERIC(15, 2),
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ADVERTISEMENTS TABLE
CREATE TABLE IF NOT EXISTS public.advertisements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ad_set_id UUID NOT NULL REFERENCES public.ad_sets(id) ON DELETE CASCADE,
    creative_id UUID,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. MARKETING CREATIVES TABLE
CREATE TABLE IF NOT EXISTS public.marketing_creatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'IMAGE', -- 'IMAGE', 'VIDEO', 'CAROUSEL', 'TEXT'
    asset_url TEXT,
    headline TEXT,
    cta_text VARCHAR(100),
    status_tag VARCHAR(50) NOT NULL DEFAULT 'WATCH', -- 'WINNER', 'WATCH', 'LOSER', 'FATIGUE'
    impressions INTEGER NOT NULL DEFAULT 0,
    clicks INTEGER NOT NULL DEFAULT 0,
    ctr NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    cpc NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    attributed_conversions INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. MARKETING SPENDS TABLE
CREATE TABLE IF NOT EXISTS public.marketing_spends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    ad_account_id UUID REFERENCES public.ad_accounts(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.marketing_campaigns(id) ON DELETE SET NULL,
    ad_set_id UUID REFERENCES public.ad_sets(id) ON DELETE SET NULL,
    advertisement_id UUID REFERENCES public.advertisements(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    external_id VARCHAR(255),
    imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_marketing_spend_ext UNIQUE (organization_id, provider, external_id)
);

-- 7. MARKETING ATTRIBUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.marketing_attributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    payment_id UUID,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    touchpoint VARCHAR(50) NOT NULL DEFAULT 'unknown',
    confidence_level VARCHAR(20) NOT NULL DEFAULT 'LOW',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. MARKETING EXPERIMENTS TABLE
CREATE TABLE IF NOT EXISTS public.marketing_experiments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    hypothesis TEXT NOT NULL,
    variant VARCHAR(100) NOT NULL,
    metric VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    result_summary TEXT,
    confidence_level VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_mkt_campaigns_org_status ON public.marketing_campaigns (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_mkt_spends_org_date ON public.marketing_spends (organization_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_mkt_attributions_org_campaign ON public.marketing_attributions (organization_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_mkt_creatives_org_tag ON public.marketing_creatives (organization_id, status_tag);

-- 10. ENABLE RLS
ALTER TABLE public.ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_spends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_experiments ENABLE ROW LEVEL SECURITY;

-- 11. RLS POLICIES FOR TENANT ISOLATION
CREATE POLICY rls_ad_accounts_all ON public.ad_accounts FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY rls_marketing_campaigns_all ON public.marketing_campaigns FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY rls_ad_sets_all ON public.ad_sets FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY rls_advertisements_all ON public.advertisements FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY rls_marketing_creatives_all ON public.marketing_creatives FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY rls_marketing_spends_all ON public.marketing_spends FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY rls_marketing_attributions_all ON public.marketing_attributions FOR ALL USING (public.is_org_member(organization_id));
CREATE POLICY rls_marketing_experiments_all ON public.marketing_experiments FOR ALL USING (public.is_org_member(organization_id));
