-- ============================================================================
-- WILLShop OS — SEED INITIAL ORGANIZATION
-- Migration: 20260905000001_seed_willshop.sql
-- Description: Seeds the initial WillShop organization
-- ============================================================================

INSERT INTO public.organizations (id, name, slug, country, currency, timezone, settings)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid,
    'WillShop',
    'willshop',
    'Burkina Faso',
    'XOF',
    'Africa/Ouagadougou',
    '{"theme": "dark", "features": {"ai_gateway": true, "audit_trail": true}}'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    country = EXCLUDED.country,
    currency = EXCLUDED.currency,
    timezone = EXCLUDED.timezone,
    updated_at = NOW();
