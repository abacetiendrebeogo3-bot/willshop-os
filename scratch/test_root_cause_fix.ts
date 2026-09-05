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

async function fixStoragePoliciesAndTest() {
  console.log('--- 🛠️ FIXING STORAGE POLICIES & TESTING PRODUCT FLOW ---');

  await pgClient.connect();

  // 1. Create or update storage.objects RLS policies for bucket product-images
  console.log('\n--- 1. APPLYING STORAGE RLS POLICIES FOR product-images BUCKET ---');
  const storageFixSql = `
    -- Enable RLS on storage.objects if not enabled
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    -- Drop conflicting policies on storage.objects for product-images if any
    DROP POLICY IF EXISTS "Public read for product-images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow insert for product-images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow select for product-images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow update for product-images" ON storage.objects;
    DROP POLICY IF EXISTS "Allow delete for product-images" ON storage.objects;

    -- Create public SELECT policy for product-images
    CREATE POLICY "Allow select for product-images" ON storage.objects
      FOR SELECT USING (bucket_id = 'product-images');

    -- Create INSERT policy for product-images
    CREATE POLICY "Allow insert for product-images" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'product-images');

    -- Create UPDATE policy for product-images
    CREATE POLICY "Allow update for product-images" ON storage.objects
      FOR UPDATE USING (bucket_id = 'product-images');

    -- Create DELETE policy for product-images
    CREATE POLICY "Allow delete for product-images" ON storage.objects
      FOR DELETE USING (bucket_id = 'product-images');
  `;

  await pgClient.query(storageFixSql);
  console.log('✅ Storage RLS policies for product-images applied successfully!');

  // 2. Fetch test organization
  const { data: orgs } = await createClient(supabaseUrl, serviceKey).from('organizations').select('id, name').limit(1);
  const orgId = orgs?.[0]?.id;
  console.log(`✅ Using Organization: ${orgs?.[0]?.name} (${orgId})`);

  const supabaseAnon = createClient(supabaseUrl, anonKey);
  const supabaseAdmin = createClient(supabaseUrl, serviceKey);

  // 3. TEST A: Create Product Without Image
  console.log('\n--- TEST A: Create Product Without Image ---');
  const skuA = `TEST-NO-IMG-${Date.now()}`;
  const { data: prodA, error: errA } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: orgId,
      name: 'TEST-NO-IMAGE',
      sku: skuA,
      category: 'SANTÉ & BEAUTÉ',
      purchase_price: 1000,
      selling_price: 2500,
      currency: 'XOF',
      minimum_stock: 5,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (errA || !prodA) {
    console.error('❌ TEST A FAILED: Product creation failed:', errA?.message);
  } else {
    console.log(`✅ TEST A Product Created! ID: ${prodA.id}`);

    // Insert stock in product_stock (SINGULAR)
    const { error: stockErrA } = await supabaseAdmin
      .from('product_stock')
      .insert({
        organization_id: orgId,
        product_id: prodA.id,
        physical_stock: 10,
        reserved_stock: 0,
        minimum_stock: 5
      });

    if (stockErrA) {
      console.error('❌ TEST A FAILED: Stock insertion failed in product_stock:', stockErrA.message);
    } else {
      console.log('✅ TEST A Stock Initialized in product_stock (SINGULAR)!');
    }

    // Verify query select("*, product_stock(*), product_images(*)")
    const { data: queryA, error: qErrA } = await supabaseAdmin
      .from('products')
      .select('*, product_stock(*), product_images(*)')
      .eq('id', prodA.id)
      .single();

    if (qErrA) console.error('❌ TEST A Query failed:', qErrA.message);
    else console.log('✅ TEST A Query product_stock & product_images SUCCESS! Physical Stock:', queryA.product_stock?.[0]?.physical_stock);
  }

  // 4. TEST B: Create Product With Image (JPG, PNG, WEBP)
  console.log('\n--- TEST B: Create Product With Image ---');
  const skuB = `TEST-WITH-IMG-${Date.now()}`;
  const { data: prodB, error: errB } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: orgId,
      name: 'TEST-WITH-IMAGE',
      sku: skuB,
      category: 'SANTÉ & BEAUTÉ',
      purchase_price: 1000,
      selling_price: 2500,
      currency: 'XOF',
      minimum_stock: 5,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (errB || !prodB) {
    console.error('❌ TEST B FAILED: Product creation failed:', errB?.message);
  } else {
    console.log(`✅ TEST B Product Created! ID: ${prodB.id}`);

    // Insert stock in product_stock
    await supabaseAdmin.from('product_stock').insert({
      organization_id: orgId,
      product_id: prodB.id,
      physical_stock: 10,
      reserved_stock: 0,
      minimum_stock: 5
    });

    // Upload Image using anon client
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );
    const storagePath = `${orgId}/${prodB.id}/test_image_${Date.now()}.png`;

    const { data: upResB, error: upErrB } = await supabaseAnon.storage
      .from('product-images')
      .upload(storagePath, dummyPngBuffer, { contentType: 'image/png', upsert: true });

    if (upErrB) {
      console.error('❌ TEST B FAILED: Storage upload failed:', upErrB.message);
    } else {
      console.log(`✅ TEST B Image Uploaded to Storage! Path: ${upResB.path}`);

      const { data: urlData } = supabaseAnon.storage.from('product-images').getPublicUrl(storagePath);

      // Insert record in product_images
      const { data: imgRecordB, error: dbImgErrB } = await supabaseAdmin
        .from('product_images')
        .insert({
          organization_id: orgId,
          product_id: prodB.id,
          storage_path: storagePath,
          url: urlData.publicUrl,
          is_primary: true,
          sort_order: 0
        })
        .select()
        .single();

      if (dbImgErrB) {
        console.error('❌ TEST B FAILED: product_images record creation failed:', dbImgErrB.message);
      } else {
        console.log(`✅ TEST B product_images record created! ID: ${imgRecordB.id}`);
      }
    }

    // Verify query select("*, product_stock(*), product_images(*)")
    const { data: queryB, error: qErrB } = await supabaseAdmin
      .from('products')
      .select('*, product_stock(*), product_images(*)')
      .eq('id', prodB.id)
      .single();

    if (qErrB) {
      console.error('❌ TEST B Query failed:', qErrB.message);
    } else {
      console.log('✅ TEST B Full Query SUCCESS!');
      console.log(`   - Product: ${queryB.name}`);
      console.log(`   - Stock: ${queryB.product_stock?.[0]?.physical_stock}`);
      console.log(`   - Images Count: ${queryB.product_images?.length}`);
      console.log(`   - Primary Image URL: ${queryB.product_images?.[0]?.url}`);
    }
  }

  // Cleanup Test Data
  console.log('\n--- Cleanup Test Data ---');
  if (prodA?.id) {
    await supabaseAdmin.from('product_stock').delete().eq('product_id', prodA.id);
    await supabaseAdmin.from('products').delete().eq('id', prodA.id);
  }
  if (prodB?.id) {
    await supabaseAdmin.from('product_images').delete().eq('product_id', prodB.id);
    await supabaseAdmin.from('product_stock').delete().eq('product_id', prodB.id);
    await supabaseAdmin.from('products').delete().eq('id', prodB.id);
  }
  console.log('✅ Cleanup Finished Successfully!');

  await pgClient.end();
  process.exit(0);
}

fixStoragePoliciesAndTest();
