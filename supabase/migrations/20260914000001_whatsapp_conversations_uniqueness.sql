-- ============================================================================
-- WILLShop OS — WHATSAPP CONVERSATIONS UNIQUENESS & INTEGRITY MIGRATION
-- Migration: 20260914000001_whatsapp_conversations_uniqueness.sql
-- Description: Adds uniqueness constraints and partial indexes for active conversations per customer/org/number
-- ============================================================================

-- 1. Partial Unique Index ensuring exactly 1 active conversation per (organization_id, customer_id, whatsapp_number_id)
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_conversations_active_unique_cust
  ON public.conversations (organization_id, customer_id, whatsapp_number_id)
  WHERE status NOT IN ('ARCHIVED', 'CLOSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Partial Unique Index ensuring 1 customer per phone number per organization
DO $$ BEGIN
  CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_org_phone_unique
  ON public.customers (organization_id, phone);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Function to deduplicate/merge active conversations for the same customer into a canonical conversation
CREATE OR REPLACE FUNCTION public.merge_duplicate_conversations(p_org_id UUID, p_phone TEXT)
RETURNS UUID AS $$
DECLARE
  v_canonical_customer_id UUID;
  v_canonical_conv_id UUID;
  v_dup_conv RECORD;
BEGIN
  -- 1. Find canonical customer ID
  SELECT id INTO v_canonical_customer_id
  FROM public.customers
  WHERE organization_id = p_org_id AND (phone = p_phone OR phone = REPLACE(p_phone, '+', ''))
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_canonical_customer_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 2. Find canonical conversation ID (earliest active conversation)
  SELECT id INTO v_canonical_conv_id
  FROM public.conversations
  WHERE organization_id = p_org_id AND customer_id = v_canonical_customer_id
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_canonical_conv_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- 3. Re-assign messages from duplicate conversations into canonical conversation
  FOR v_dup_conv IN
    SELECT id FROM public.conversations
    WHERE organization_id = p_org_id
      AND customer_id = v_canonical_customer_id
      AND id <> v_canonical_conv_id
  LOOP
    UPDATE public.messages
    SET conversation_id = v_canonical_conv_id
    WHERE conversation_id = v_dup_conv.id;

    UPDATE public.conversations
    SET status = 'ARCHIVED',
        metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{merged_into}', to_jsonb(v_canonical_conv_id::text))
    WHERE id = v_dup_conv.id;
  END LOOP;

  RETURN v_canonical_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
