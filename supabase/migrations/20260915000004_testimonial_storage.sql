-- ============================================================================
-- WILLShop OS — TESTIMONIAL IMAGES STORAGE MIGRATION
-- Migration: 20260915000004_testimonial_storage.sql
-- Description: Creates testimonial-images bucket and RLS policies for storage
-- ============================================================================

-- 1. Create storage bucket if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'testimonial-images',
  'testimonial-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Objects RLS Policies
-- Note: Policies enforce tenant isolation using the path format: {organization_id}/{testimonial_id}/{filename}

DO $$ BEGIN
  CREATE POLICY "Public Read Testimonial Images" ON storage.objects
    FOR SELECT USING (bucket_id = 'testimonial-images');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can upload testimonial images to their org path" ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'testimonial-images' AND
      (storage.foldername(name))[1]::uuid IN (
        SELECT organization_id FROM public.user_organization_roles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can update testimonial images of their org path" ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'testimonial-images' AND
      (storage.foldername(name))[1]::uuid IN (
        SELECT organization_id FROM public.user_organization_roles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can delete testimonial images of their org path" ON storage.objects
    FOR DELETE USING (
      bucket_id = 'testimonial-images' AND
      (storage.foldername(name))[1]::uuid IN (
        SELECT organization_id FROM public.user_organization_roles WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;
