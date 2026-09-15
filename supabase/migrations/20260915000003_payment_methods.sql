-- ============================================================================
-- WILLSHOP OS — PAYMENT METHODS MULTI-TENANT SCHEMA & RLS
-- Migration: 20260915000003_payment_methods.sql
-- Description: Creates the payment_methods table with organization_id RLS policy
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL DEFAULT 'MOBILE_MONEY',
    identifier VARCHAR(255) NOT NULL,
    instructions TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_methods_org_id ON public.payment_methods(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_methods_active ON public.payment_methods(organization_id, is_active) WHERE deleted_at IS NULL;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read own organization payment methods" ON public.payment_methods;
CREATE POLICY "Users can read own organization payment methods"
    ON public.payment_methods FOR SELECT
    USING (
        organization_id IN (
            SELECT uor.organization_id 
            FROM public.user_organization_roles uor 
            WHERE uor.user_id = auth.uid() AND uor.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "Users can insert own organization payment methods" ON public.payment_methods;
CREATE POLICY "Users can insert own organization payment methods"
    ON public.payment_methods FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT uor.organization_id 
            FROM public.user_organization_roles uor 
            WHERE uor.user_id = auth.uid() AND uor.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "Users can update own organization payment methods" ON public.payment_methods;
CREATE POLICY "Users can update own organization payment methods"
    ON public.payment_methods FOR UPDATE
    USING (
        organization_id IN (
            SELECT uor.organization_id 
            FROM public.user_organization_roles uor 
            WHERE uor.user_id = auth.uid() AND uor.deleted_at IS NULL
        )
    );

DROP POLICY IF EXISTS "Users can delete own organization payment methods" ON public.payment_methods;
CREATE POLICY "Users can delete own organization payment methods"
    ON public.payment_methods FOR DELETE
    USING (
        organization_id IN (
            SELECT uor.organization_id 
            FROM public.user_organization_roles uor 
            WHERE uor.user_id = auth.uid() AND uor.deleted_at IS NULL
        )
    );
