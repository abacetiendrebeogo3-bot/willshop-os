-- ============================================================================
-- WILLSHOP OS — MIGRATION 20260905000009: CEO AI ENGINE & USAGE LOGS
-- ============================================================================

-- 1. AI USAGE LOGS TABLE
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    provider VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    estimated_cost NUMERIC(15, 6) NOT NULL DEFAULT 0.0,
    latency_ms INTEGER NOT NULL DEFAULT 0,
    operation VARCHAR(100) NOT NULL,
    correlation_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AI RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    problem TEXT NOT NULL,
    observation TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    recommendation TEXT NOT NULL,
    potential_benefit TEXT NOT NULL,
    risk TEXT NOT NULL,
    confidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    urgency VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    proposed_action JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'PROPOSED', -- 'PROPOSED', 'ACCEPTED', 'REJECTED', 'EXECUTED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. AI DECISIONS TABLE
CREATE TABLE IF NOT EXISTS public.ai_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    decision_title VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    expected_outcome TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'SUPERSEEDED', 'ARCHIVED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_org_created ON public.ai_usage_logs (organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_org_status ON public.ai_recommendations (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_org_status ON public.ai_decisions (organization_id, status);

-- 5. RPC TO CALCULATE TOTAL AI COST
CREATE OR REPLACE FUNCTION public.get_ai_total_cost_by_org(p_org_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total NUMERIC;
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Access Denied: User not a member of org %', p_org_id;
    END IF;

    SELECT COALESCE(SUM(estimated_cost), 0.0)
    INTO v_total
    FROM public.ai_usage_logs
    WHERE organization_id = p_org_id;

    RETURN v_total;
END;
$$;

-- 6. ENABLE RLS
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_decisions ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES
CREATE POLICY rls_ai_usage_logs_select ON public.ai_usage_logs
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY rls_ai_usage_logs_all ON public.ai_usage_logs
    FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY rls_ai_recommendations_select ON public.ai_recommendations
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY rls_ai_recommendations_all ON public.ai_recommendations
    FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY rls_ai_decisions_select ON public.ai_decisions
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY rls_ai_decisions_all ON public.ai_decisions
    FOR ALL USING (public.is_org_member(organization_id));
