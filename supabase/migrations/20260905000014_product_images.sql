-- ============================================================================
-- WILLShop OS — PRODUCT IMAGES MIGRATION
-- Migration: 20260905000014_product_images.sql
-- Description: Creates product_images table, indexes, and RLS policies
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_org_id ON public.product_images(organization_id);

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view product images of their organization" ON public.product_images
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM public.user_organization_roles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can insert product images in their organization" ON public.product_images
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM public.user_organization_roles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update product images in their organization" ON public.product_images
    FOR UPDATE USING (
      organization_id IN (
        SELECT organization_id FROM public.user_organization_roles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Users can delete product images of their organization" ON public.product_images
    FOR DELETE USING (
      organization_id IN (
        SELECT organization_id FROM public.user_organization_roles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;
