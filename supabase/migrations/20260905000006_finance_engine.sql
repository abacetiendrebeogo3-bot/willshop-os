-- ============================================================================
-- WILLShop OS — BUILD 06 FINANCE ENGINE MIGRATION
-- Migration: 20260905000006_finance_engine.sql
-- Description: Financial Ledger, Multi-Account Management, Expenses, Transfers, 
--              Owner Draw / Contribution separation, Obligations, and RPCs
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ENUM & CHECK CONSTRAINTS ENHANCEMENTS
-- ----------------------------------------------------------------------------

-- Add current_balance and description to financial_accounts if missing
ALTER TABLE public.financial_accounts 
ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS description TEXT NULL;

-- Update existing financial_accounts current_balance to opening_balance if 0
UPDATE public.financial_accounts 
SET current_balance = opening_balance 
WHERE current_balance = 0.00 AND opening_balance > 0.00;

-- Add direction, status, transfer_id, receipt_url, metadata to transactions
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS direction VARCHAR(20) NOT NULL DEFAULT 'INFLOW',
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'POSTED',
ADD COLUMN IF NOT EXISTS transfer_id UUID NULL,
ADD COLUMN IF NOT EXISTS receipt_url TEXT NULL,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS metadata JSONB NULL DEFAULT '{}'::jsonb;

-- Check constraint on direction
DO $$ BEGIN
    ALTER TABLE public.transactions ADD CONSTRAINT check_tx_direction CHECK (direction IN ('INFLOW', 'OUTFLOW'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Check constraint on status
DO $$ BEGIN
    ALTER TABLE public.transactions ADD CONSTRAINT check_tx_status CHECK (status IN ('PENDING', 'POSTED', 'VOIDED'));
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ----------------------------------------------------------------------------
-- 2. FINANCIAL OBLIGATIONS TABLE (Debts & Receivables)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.financial_obligations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('DEBT', 'RECEIVABLE')),
    party_type VARCHAR(50) NOT NULL DEFAULT 'OTHER' CHECK (party_type IN ('SUPPLIER', 'CUSTOMER', 'EMPLOYEE', 'OTHER')),
    party_id UUID NULL,
    party_name VARCHAR(255) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (paid_amount >= 0),
    remaining_amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00 CHECK (remaining_amount >= 0),
    due_date TIMESTAMPTZ NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'CANCELLED')),
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.financial_obligations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "financial_obligations_org_policy" ON public.financial_obligations;
CREATE POLICY "financial_obligations_org_policy" ON public.financial_obligations
    FOR ALL
    USING (public.is_org_member(organization_id))
    WITH CHECK (public.is_org_member(organization_id));

-- ----------------------------------------------------------------------------
-- 3. INDEXES FOR PERFORMANCE & AUDIT TRACEABILITY
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_transactions_org_account ON public.transactions (organization_id, financial_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions (organization_id, category);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_id ON public.transactions (transfer_id);
CREATE INDEX IF NOT EXISTS idx_financial_obligations_org ON public.financial_obligations (organization_id, status);

-- ----------------------------------------------------------------------------
-- 4. ATOMIC RPC: post_financial_transaction
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.post_financial_transaction(
    p_organization_id UUID,
    p_financial_account_id UUID,
    p_type VARCHAR(50),
    p_direction VARCHAR(20),
    p_amount NUMERIC(15, 2),
    p_category VARCHAR(100),
    p_reference_type VARCHAR(100) DEFAULT NULL,
    p_reference_id VARCHAR(255) DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_receipt_url TEXT DEFAULT NULL,
    p_actor_id UUID DEFAULT NULL,
    p_idempotency_key VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tx_id UUID;
    v_acc_balance NUMERIC(15, 2);
    v_new_balance NUMERIC(15, 2);
BEGIN
    -- Security context verification
    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'Forbidden: User is not a member of organization %', p_organization_id;
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transaction amount must be strictly greater than 0';
    END IF;

    -- Lock financial account FOR UPDATE
    SELECT current_balance INTO v_acc_balance
    FROM public.financial_accounts
    WHERE id = p_financial_account_id AND organization_id = p_organization_id
    FOR UPDATE;

    IF v_acc_balance IS NULL THEN
        RAISE EXCEPTION 'Financial account % not found for organization %', p_financial_account_id, p_organization_id;
    END IF;

    -- Compute new balance based on direction
    IF p_direction = 'INFLOW' THEN
        v_new_balance := v_acc_balance + p_amount;
    ELSIF p_direction = 'OUTFLOW' THEN
        v_new_balance := v_acc_balance - p_amount;
    ELSE
        RAISE EXCEPTION 'Invalid transaction direction: %', p_direction;
    END IF;

    -- Update account balance
    UPDATE public.financial_accounts
    SET current_balance = v_new_balance,
        updated_at = NOW()
    WHERE id = p_financial_account_id;

    -- Insert append-only transaction
    INSERT INTO public.transactions (
        organization_id,
        financial_account_id,
        type,
        direction,
        amount,
        currency,
        category,
        status,
        reference_type,
        reference_id,
        description,
        receipt_url,
        transaction_date,
        created_by,
        created_at
    ) VALUES (
        p_organization_id,
        p_financial_account_id,
        p_type::transaction_type,
        p_direction,
        p_amount,
        'XOF',
        p_category,
        'POSTED',
        p_reference_type,
        p_reference_id,
        p_description,
        p_receipt_url,
        NOW(),
        p_actor_id,
        NOW()
    ) RETURNING id INTO v_tx_id;

    -- Log Audit
    INSERT INTO public.audit_log (
        organization_id,
        actor_id,
        action,
        target_type,
        target_id,
        details
    ) VALUES (
        p_organization_id,
        p_actor_id,
        'FINANCIAL_TRANSACTION_POSTED',
        'transaction',
        v_tx_id::TEXT,
        jsonb_build_object(
            'account_id', p_financial_account_id,
            'direction', p_direction,
            'amount', p_amount,
            'category', p_category,
            'new_balance', v_new_balance
        )
    );

    RETURN v_tx_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. ATOMIC RPC: transfer_funds
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_funds(
    p_organization_id UUID,
    p_source_account_id UUID,
    p_destination_account_id UUID,
    p_amount NUMERIC(15, 2),
    p_description TEXT DEFAULT 'Inter-account fund transfer',
    p_actor_id UUID DEFAULT NULL,
    p_idempotency_key VARCHAR(255) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_transfer_id UUID := uuid_generate_v4();
    v_source_bal NUMERIC(15, 2);
    v_dest_bal NUMERIC(15, 2);
    v_first_acc UUID;
    v_second_acc UUID;
BEGIN
    IF NOT public.is_org_member(p_organization_id) THEN
        RAISE EXCEPTION 'Forbidden: User is not a member of organization %', p_organization_id;
    END IF;

    IF p_source_account_id = p_destination_account_id THEN
        RAISE EXCEPTION 'Source and destination accounts must be different';
    END IF;

    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Transfer amount must be strictly greater than 0';
    END IF;

    -- Deadlock prevention: Lock accounts in deterministic UUID order
    IF p_source_account_id < p_destination_account_id THEN
        v_first_acc := p_source_account_id;
        v_second_acc := p_destination_account_id;
    ELSE
        v_first_acc := p_destination_account_id;
        v_second_acc := p_source_account_id;
    END IF;

    PERFORM current_balance FROM public.financial_accounts WHERE id = v_first_acc AND organization_id = p_organization_id FOR UPDATE;
    PERFORM current_balance FROM public.financial_accounts WHERE id = v_second_acc AND organization_id = p_organization_id FOR UPDATE;

    -- Fetch current balances
    SELECT current_balance INTO v_source_bal FROM public.financial_accounts WHERE id = p_source_account_id AND organization_id = p_organization_id;
    SELECT current_balance INTO v_dest_bal FROM public.financial_accounts WHERE id = p_destination_account_id AND organization_id = p_organization_id;

    IF v_source_bal IS NULL OR v_dest_bal IS NULL THEN
        RAISE EXCEPTION 'One or both financial accounts do not exist in organization %', p_organization_id;
    END IF;

    -- Debit source account
    UPDATE public.financial_accounts SET current_balance = v_source_bal - p_amount, updated_at = NOW() WHERE id = p_source_account_id;
    INSERT INTO public.transactions (
        organization_id, financial_account_id, type, direction, amount, currency, category, status, reference_type, reference_id, transfer_id, description, created_by
    ) VALUES (
        p_organization_id, p_source_account_id, 'TRANSFER'::transaction_type, 'OUTFLOW', p_amount, 'XOF', 'OTHER', 'POSTED', 'transfer', v_transfer_id::TEXT, v_transfer_id, '[Transfer Out] ' || p_description, p_actor_id
    );

    -- Credit destination account
    UPDATE public.financial_accounts SET current_balance = v_dest_bal + p_amount, updated_at = NOW() WHERE id = p_destination_account_id;
    INSERT INTO public.transactions (
        organization_id, financial_account_id, type, direction, amount, currency, category, status, reference_type, reference_id, transfer_id, description, created_by
    ) VALUES (
        p_organization_id, p_destination_account_id, 'TRANSFER'::transaction_type, 'INFLOW', p_amount, 'XOF', 'OTHER', 'POSTED', 'transfer', v_transfer_id::TEXT, v_transfer_id, '[Transfer In] ' || p_description, p_actor_id
    );

    -- Audit Log
    INSERT INTO public.audit_log (
        organization_id, actor_id, action, target_type, target_id, details
    ) VALUES (
        p_organization_id, p_actor_id, 'FUND_TRANSFER_EXECUTED', 'transfer', v_transfer_id::TEXT,
        jsonb_build_object('source_account_id', p_source_account_id, 'destination_account_id', p_destination_account_id, 'amount', p_amount)
    );

    RETURN v_transfer_id;
END;
$$;
