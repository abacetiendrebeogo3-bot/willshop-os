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

const client = new Client({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

client.connect().then(async () => {
  console.log('Setting storage policies for product-images...');

  const storagePoliciesSql = `
    -- Enable RLS on storage.objects if not enabled
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Public read policy for product-images bucket
    DO $$ BEGIN
      CREATE POLICY "Public read for product-images" ON storage.objects
        FOR SELECT USING (bucket_id = 'product-images');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Upload policy for product-images bucket
    DO $$ BEGIN
      CREATE POLICY "Authenticated upload for product-images" ON storage.objects
        FOR INSERT WITH CHECK (
          bucket_id = 'product-images' AND auth.role() = 'authenticated'
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Delete policy for product-images bucket
    DO $$ BEGIN
      CREATE POLICY "Authenticated delete for product-images" ON storage.objects
        FOR DELETE USING (
          bucket_id = 'product-images' AND auth.role() = 'authenticated'
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    -- Update policy for product-images bucket
    DO $$ BEGIN
      CREATE POLICY "Authenticated update for product-images" ON storage.objects
        FOR UPDATE USING (
          bucket_id = 'product-images' AND auth.role() = 'authenticated'
        );
    EXCEPTION WHEN duplicate_object THEN null; END $$;
  `;

  await client.query(storagePoliciesSql);
  console.log('✅ Storage policies applied successfully!');

  await client.end();
  process.exit(0);
}).catch(err => {
  console.error('❌ Error setting storage policies:', err.message);
  process.exit(1);
});
