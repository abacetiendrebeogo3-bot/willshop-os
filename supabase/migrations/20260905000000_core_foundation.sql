-- ============================================================================
-- WILLShop OS — BUILD 01 CORE FOUNDATION MIGRATION
-- Migration: 20260905000000_core_foundation.sql
-- Description: Core tables, RLS policies, RBAC, Audit, Events, Notifications & Idempotency
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ----------------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('OWNER', 'MANAGER', 'COMMERCIAL', 'LIVREUR', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status AS ENUM ('PENDING', 'PROCESSED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL DEFAULT 'Burkina Faso',
    currency VARCHAR(10) NOT NULL DEFAULT 'XOF',
    timezone VARCHAR(100) NOT NULL DEFAULT 'Africa/Ouagadougou',
    settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL
);

-- User Organization Roles Table (RBAC Matrix)
CREATE TABLE IF NOT EXISTS public.user_organization_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    role user_role NOT NULL DEFAULT 'VIEWER',
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NULL,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT unique_user_org UNIQUE (organization_id, user_id)
);

-- Audit Log Table (Central Audit System)
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_id UUID NULL,
    action VARCHAR(255) NOT NULL,
    target_entity VARCHAR(255) NOT NULL,
    target_id VARCHAR(255) NULL,
    before_state JSONB NULL,
    after_state JSONB NULL,
    reason TEXT NULL,
    correlation_id VARCHAR(255) NULL,
    ai_agent VARCHAR(100) NULL,
    ai_action VARCHAR(255) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Events Engine Table
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    event_type VARCHAR(255) NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    actor_id UUID NULL,
    correlation_id VARCHAR(255) NULL,
    status event_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications Base Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Idempotency Keys Infrastructure Table
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    request_hash VARCHAR(255) NOT NULL,
    response_payload JSONB NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PROCESSING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ----------------------------------------------------------------------------
-- 3. INDEXES
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_user ON public.user_organization_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_org_roles_org ON public.user_organization_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_created ON public.audit_log(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_org_status ON public.events(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_idempotency_expires ON public.idempotency_keys(expires_at);

-- ----------------------------------------------------------------------------
-- 4. RLS HELPER SECURITY DEFINER FUNCTIONS
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_org_member(p_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_organization_roles
        WHERE organization_id = p_org_id
          AND user_id = auth.uid()
          AND deleted_at IS NULL
    );
$$;

CREATE OR REPLACE FUNCTION public.get_user_org_role(p_org_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role
    FROM public.user_organization_roles
    WHERE organization_id = p_org_id
      AND user_id = auth.uid()
      AND deleted_at IS NULL
    LIMIT 1;
$$;

-- ----------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_organization_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;

-- Organizations Policies
CREATE POLICY org_select_policy ON public.organizations
    FOR SELECT USING (public.is_org_member(id));

CREATE POLICY org_update_policy ON public.organizations
    FOR UPDATE USING (public.is_org_member(id) AND public.get_user_org_role(id) = 'OWNER');

-- User Organization Roles Policies
CREATE POLICY user_roles_select_policy ON public.user_organization_roles
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY user_roles_insert_policy ON public.user_organization_roles
    FOR INSERT WITH CHECK (
        public.is_org_member(organization_id) AND 
        public.get_user_org_role(organization_id) IN ('OWNER', 'MANAGER')
    );

CREATE POLICY user_roles_update_policy ON public.user_organization_roles
    FOR UPDATE USING (
        public.is_org_member(organization_id) AND 
        public.get_user_org_role(organization_id) = 'OWNER'
    );

-- Audit Log Policies
CREATE POLICY audit_select_policy ON public.audit_log
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY audit_insert_policy ON public.audit_log
    FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- Events Policies
CREATE POLICY events_select_policy ON public.events
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY events_insert_policy ON public.events
    FOR INSERT WITH CHECK (public.is_org_member(organization_id));

-- Notifications Policies
CREATE POLICY notifications_select_policy ON public.notifications
    FOR SELECT USING (user_id = auth.uid() AND public.is_org_member(organization_id));

CREATE POLICY notifications_update_policy ON public.notifications
    FOR UPDATE USING (user_id = auth.uid() AND public.is_org_member(organization_id));

-- Idempotency Keys Policies
CREATE POLICY idempotency_select_policy ON public.idempotency_keys
    FOR SELECT USING (public.is_org_member(organization_id));

CREATE POLICY idempotency_insert_policy ON public.idempotency_keys
    FOR INSERT WITH CHECK (public.is_org_member(organization_id));

CREATE POLICY idempotency_update_policy ON public.idempotency_keys
    FOR UPDATE USING (public.is_org_member(organization_id));
