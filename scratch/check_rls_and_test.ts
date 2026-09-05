import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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

async function runDiagnostic() {
  console.log('--- 🔍 DIAGNOSTIC RUNTIME DÉTAILLÉ ---');

  await pgClient.connect();

  // 1. Inspect RLS Policies on products, product_stocks, product_images, and storage.objects
  console.log('\n--- 1. POLITIQUES RLS EXISTANTES ---');
  const rlsRes = await pgClient.query(`
    SELECT tablename, policyname, roles, cmd, qual, with_check 
    FROM pg_policies 
    WHERE schemaname IN ('public', 'storage') 
      AND tablename IN ('products', 'product_stocks', 'product_images', 'objects')
    ORDER BY tablename, cmd;
  `);
  
  rlsRes.rows.forEach(row => {
    console.log(`[${row.tablename}] Policy: "${row.policyname}" (${row.cmd}) -> check: ${row.with_check || row.qual}`);
  });

  // 2. Fetch a real test user from user_organization_roles
  const userRes = await pgClient.query(`
    SELECT uor.user_id, uor.organization_id, u.email
    FROM public.user_organization_roles uor
    JOIN auth.users u ON u.id = uor.user_id
    WHERE uor.deleted_at IS NULL
    LIMIT 1;
  `);

  if (userRes.rows.length === 0) {
    console.error('No user found in user_organization_roles');
    process.exit(1);
  }

  const testUser = userRes.rows[0];
  console.log(`\n✅ Utilisateur de test trouvé: ${testUser.email} (User ID: ${testUser.user_id}, Org ID: ${testUser.organization_id})`);

  // 3. Test insertion with Service Role vs Anon Role (with auth context simulation)
  console.log('\n--- 2. TEST INSERTION SANS IMAGE (SERVICE ROLE) ---');
  const adminSupabase = createClient(supabaseUrl, serviceKey);
  const testSku1 = `TEST-NO-IMG-${Date.now()}`;

  const { data: p1, error: e1 } = await adminSupabase
    .from('products')
    .insert({
      organization_id: testUser.organization_id,
      name: 'TEST-NO-IMAGE',
      sku: testSku1,
      category: 'SANTÉ & BEAUTÉ',
      purchase_price: 1000,
      selling_price: 2500,
      currency: 'XOF',
      minimum_stock: 5,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (e1) {
    console.error('❌ ECHEC Insertion Produit Sans Image (Service Role):', e1.message);
  } else {
    console.log('✅ PASS Insertion Produit Sans Image (Service Role)! ID:', p1.id);
    
    // Insert stock
    const { error: s1Err } = await adminSupabase
      .from('product_stocks')
      .insert({
        organization_id: testUser.organization_id,
        product_id: p1.id,
        physical_stock: 10,
        reserved_stock: 0,
        minimum_stock: 5
      });
    if (s1Err) console.error('❌ ECHEC Insertion Stock (Service Role):', s1Err.message);
    else console.log('✅ PASS Insertion Stock (Service Role)!');
  }

  // 4. Test Image Upload with Anon Key + Storage bucket policies
  console.log('\n--- 3. TEST SUPABASE STORAGE UPLOAD (ANON KEY) ---');
  const anonSupabase = createClient(supabaseUrl, anonKey);
  
  const dummyBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  const storagePath = `${testUser.organization_id}/${p1?.id || 'test'}/test_${Date.now()}.png`;

  const { data: upRes, error: upErr } = await anonSupabase.storage
    .from('product-images')
    .upload(storagePath, dummyBuffer, { contentType: 'image/png', upsert: true });

  if (upErr) {
    console.error('❌ ECHEC Upload Storage (Anon Key):', upErr.message, upErr);
  } else {
    console.log('✅ PASS Upload Storage (Anon Key)! Path:', upRes.path);
  }

  // Clean test product 1
  if (p1?.id) {
    await adminSupabase.from('product_stocks').delete().eq('product_id', p1.id);
    await adminSupabase.from('products').delete().eq('id', p1.id);
  }

  await pgClient.end();
  process.exit(0);
}

runDiagnostic();
