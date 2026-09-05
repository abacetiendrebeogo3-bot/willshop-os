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

const dbPassword = process.env.SUPABASE_DB_PASSWORD || '';
const ref = 'stbzctncpvgqdpybcrmg';

const pgClient = new Client({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

async function fixStorageRls() {
  await pgClient.connect();

  console.log('--- STORAGE POLICIES CURRENTLY ON OBJECTS ---');
  const pRes = await pgClient.query(`
    SELECT policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  `);
  console.log('Storage Policies:', pRes.rows);

  console.log('\n--- STORAGE BUCKETS ---');
  const bRes = await pgClient.query(`SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets`);
  console.log('Buckets:', bRes.rows);

  // Check if we can grant or create policy using postgres user
  try {
    const policySql = `
      DO $$ BEGIN
        CREATE POLICY "product_images_select" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "product_images_insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-images');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "product_images_update" ON storage.objects FOR UPDATE USING (bucket_id = 'product-images');
      EXCEPTION WHEN duplicate_object THEN null; END $$;

      DO $$ BEGIN
        CREATE POLICY "product_images_delete" ON storage.objects FOR DELETE USING (bucket_id = 'product-images');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `;
    await pgClient.query(policySql);
    console.log('✅ Storage policies created on storage.objects successfully!');
  } catch (err: any) {
    console.error('❌ Policy creation error:', err.message);
  }

  await pgClient.end();
  process.exit(0);
}

fixStorageRls();
