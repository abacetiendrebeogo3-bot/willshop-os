import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

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

const dbPassword = process.env.SUPABASE_DB_PASSWORD;
const ref = 'stbzctncpvgqdpybcrmg';

console.log('Connecting with host db.' + ref + '.supabase.co ...');

const client = new Client({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  console.log('✅ Connected to Supabase Postgres!');
  
  const createTableSql = `
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

  await client.query(createTableSql);
  console.log('✅ Table product_images created and RLS policies applied!');

  // Check structure
  const res = await client.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'product_images'`);
  console.log('Columns in product_images:', res.rows);

  await client.end();
  process.exit(0);
}).catch(err => {
  console.error('❌ Connection error:', err.message);
  process.exit(1);
});
