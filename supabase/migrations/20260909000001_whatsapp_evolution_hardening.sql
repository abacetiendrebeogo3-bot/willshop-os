-- ============================================================================
-- WILLShop OS — BUILD 15 HARDENING: WHATSAPP, EVOLUTION, IDEMPOTENCY & MODES
-- Migration: 20260909000001_whatsapp_evolution_hardening.sql
-- Description: Conversation mode enum, uniqueness constraints for external IDs and provider identity
-- ============================================================================

-- 1. Conversation Mode Enum (AI_ACTIVE, HUMAN_ACTIVE, ESCALATED, PAUSED)
DO $$ BEGIN
    CREATE TYPE conversation_mode_enum AS ENUM ('AI_ACTIVE', 'HUMAN_ACTIVE', 'ESCALATED', 'PAUSED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Add conversation_mode to conversations table
ALTER TABLE public.conversations 
ADD COLUMN IF NOT EXISTS conversation_mode conversation_mode_enum NOT NULL DEFAULT 'AI_ACTIVE';

-- 3. Add provider_identity to whatsapp_numbers for multi-tenant identity mapping
ALTER TABLE public.whatsapp_numbers
ADD COLUMN IF NOT EXISTS provider_identity VARCHAR(255) NULL;

-- Unique constraint ensuring provider + provider_phone_number_id is globally unique across orgs
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_numbers_provider_identity 
ON public.whatsapp_numbers(provider, provider_phone_number_id);

-- 4. Idempotency constraint on messages: unique external_message_id per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_messages_unique_external_id 
ON public.messages(organization_id, external_message_id) 
WHERE external_message_id IS NOT NULL;

-- 5. Index for quick lookup of conversation mode & assigned user
CREATE INDEX IF NOT EXISTS idx_conversations_org_mode 
ON public.conversations(organization_id, conversation_mode);
