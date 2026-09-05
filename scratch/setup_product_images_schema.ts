import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase service role key or URL');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testBucketAndTableSetup() {
  console.log('--- TESTING BUCKET & TABLE SETUP ---');

  // 1. Create storage bucket 'product-images'
  const { data: bucket, error: bucketErr } = await supabase.storage.createBucket('product-images', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  if (bucketErr) {
    console.log('Bucket creation result/error:', bucketErr.message);
  } else {
    console.log('Bucket product-images CREATED successfully:', bucket);
  }

  // 2. Check buckets again
  const { data: buckets } = await supabase.storage.listBuckets();
  console.log('Current buckets:', buckets?.map(b => b.name));

  // 3. Test if SQL execution RPC exists or how migrations are applied
  // Let's test calling pgmeta or rpc
  const sql = `
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
  `;

  // Try raw RPC or query if available, or check if postgres extension / function exists
  const { data: rpcRes, error: rpcErr } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (rpcErr) {
    console.log('exec_sql rpc error:', rpcErr.message);
  } else {
    console.log('Table product_images created via exec_sql!');
  }

  process.exit(0);
}

testBucketAndTableSetup();
