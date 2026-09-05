-- ============================================================================
-- WILLSHOP OS — MIGRATION 20260905000008: AUTOMATION ENGINE & APPROVAL CENTER
-- ============================================================================

-- 1. AUTOMATION RULES TABLE
CREATE TABLE IF NOT EXISTS public.automation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'SYSTEM',
    enabled BOOLEAN NOT NULL DEFAULT true,
    trigger_type VARCHAR(50) NOT NULL, -- 'EVENT', 'SCHEDULE', 'CONDITION', 'MANUAL', 'WEBHOOK'
    trigger_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
    actions JSONB NOT NULL DEFAULT '[]'::jsonb,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'GREEN', -- 'GREEN', 'YELLOW', 'RED'
    schedule VARCHAR(100),
    delay_seconds INTEGER DEFAULT 0,
    retry_policy JSONB DEFAULT '{"maxAttempts": 3, "initialDelayMs": 1000, "backoffFactor": 2, "maxDelayMs": 10000}'::jsonb,
    fallback_action JSONB,
    stop_conditions JSONB,
    cooldown_seconds INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,
    max_executions INTEGER,
    execution_count INTEGER NOT NULL DEFAULT 0,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. AUTOMATION EXECUTIONS TABLE
CREATE TABLE IF NOT EXISTS public.automation_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_id UUID,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'EXECUTING', 'COMPLETED', 'FAILED', 'STOPPED', 'WAITING_APPROVAL'
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    attempt INTEGER NOT NULL DEFAULT 1,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    result_payload JSONB DEFAULT '{}'::jsonb,
    error TEXT,
    correlation_id VARCHAR(255),
    idempotency_key VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_automation_exec_idempotency UNIQUE (organization_id, idempotency_key)
);

-- 3. APPROVAL REQUESTS TABLE (APPROVAL CENTER)
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    automation_id UUID NOT NULL REFERENCES public.automation_rules(id) ON DELETE CASCADE,
    execution_id UUID REFERENCES public.automation_executions(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL,
    permission_level VARCHAR(20) NOT NULL DEFAULT 'YELLOW',
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    reason TEXT NOT NULL,
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    risk VARCHAR(50) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_APPROVAL', -- 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'EXPIRED', 'EXECUTING', 'EXECUTED', 'FAILED', 'CANCELLED'
    expires_at TIMESTAMPTZ NOT NULL,
    requested_by VARCHAR(255) NOT NULL DEFAULT 'AUTOMATION_ENGINE',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMPTZ,
    executed_at TIMESTAMPTZ,
    execution_result JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. KILL SWITCHES TABLE
CREATE TABLE IF NOT EXISTS public.kill_switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
    global_stopped BOOLEAN NOT NULL DEFAULT false,
    stopped_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    stopped_automation_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_automation_rules_org_enabled ON public.automation_rules (organization_id, enabled);
CREATE INDEX IF NOT EXISTS idx_automation_rules_trigger_type ON public.automation_rules (organization_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_automation_exec_org_started ON public.automation_executions (organization_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_org_status ON public.approval_requests (organization_id, status);

-- 6. RPC TO INCREMENT EXECUTION COUNT
CREATE OR REPLACE FUNCTION public.increment_automation_execution_count(p_id UUID, p_org_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_org_member(p_org_id) THEN
        RAISE EXCEPTION 'Access Denied: User not a member of org %', p_org_id;
    END IF;

    UPDATE public.automation_rules
    SET execution_count = execution_count + 1,
        last_run_at = NOW(),
        updated_at = NOW()
    WHERE id = p_id AND organization_id = p_org_id;
END;
$$;

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kill_switches ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES FOR TENANT ISOLATION
CREATE POLICY rls_automation_rules_select ON public.automation_rules
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY rls_automation_rules_all ON public.automation_rules
    FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY rls_automation_executions_select ON public.automation_executions
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY rls_automation_executions_all ON public.automation_executions
    FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY rls_approval_requests_select ON public.approval_requests
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY rls_approval_requests_all ON public.approval_requests
    FOR ALL USING (public.is_org_member(organization_id));

CREATE POLICY rls_kill_switches_select ON public.kill_switches
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY rls_kill_switches_all ON public.kill_switches
    FOR ALL USING (public.is_org_member(organization_id));
