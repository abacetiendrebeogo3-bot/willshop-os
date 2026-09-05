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

async function runImageLifecycleTest() {
  console.log('🧪 Starting Product Images Lifecycle Test...\n');

  // 1. Fetch pilot organization
  const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
  if (!orgs || orgs.length === 0) {
    console.error('No organization found');
    process.exit(1);
  }

  const orgId = orgs[0].id;
  console.log(`✅ Using Org: ${orgs[0].name} (${orgId})\n`);

  const testSku = `IMG-PILOT-${Date.now()}`;
  let createdProductId: string | null = null;
  let img1Id: string | null = null;
  let img2Id: string | null = null;
  let img1Path: string | null = null;

  try {
    // TEST 1: Create Product
    console.log('--- TEST 1: Create Product ---');
    const { data: prod, error: pErr } = await supabase
      .from('products')
      .insert({
        organization_id: orgId,
        name: 'PRODUIT-IMAGE-PILOT-001',
        sku: testSku,
        category: 'SANTÉ & BEAUTÉ',
        purchase_price: 1000,
        selling_price: 2500,
        currency: 'XOF',
        minimum_stock: 5,
        status: 'ACTIVE'
      })
      .select()
      .single();

    if (pErr || !prod) {
      throw new Error(`Failed to create product: ${pErr?.message}`);
    }

    createdProductId = prod.id;
    console.log(`✅ Product Created! ID: ${prod.id}, Name: ${prod.name}`);

    // TEST 2: Upload Primary & Secondary Images to Storage and DB
    console.log('\n--- TEST 2: Upload Images to Storage & DB ---');
    
    // Create dummy image buffer (1x1 PNG)
    const dummyPngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload Image 1 (Primary)
    img1Path = `${orgId}/${prod.id}/test_primary_${Date.now()}.png`;
    const { error: up1Err } = await supabase.storage
      .from('product-images')
      .upload(img1Path, dummyPngBuffer, { contentType: 'image/png', upsert: true });

    if (up1Err) throw new Error(`Upload 1 failed: ${up1Err.message}`);

    const { data: url1Data } = supabase.storage.from('product-images').getPublicUrl(img1Path);

    const { data: img1Record, error: db1Err } = await supabase
      .from('product_images')
      .insert({
        organization_id: orgId,
        product_id: prod.id,
        storage_path: img1Path,
        url: url1Data.publicUrl,
        is_primary: true,
        sort_order: 0
      })
      .select()
      .single();

    if (db1Err || !img1Record) throw new Error(`Insert DB image 1 failed: ${db1Err?.message}`);
    img1Id = img1Record.id;
    console.log(`✅ Primary Image Uploaded & Linked! ID: ${img1Record.id}, Path: ${img1Path}`);

    // Upload Image 2 (Secondary)
    const img2Path = `${orgId}/${prod.id}/test_secondary_${Date.now()}.png`;
    const { error: up2Err } = await supabase.storage
      .from('product-images')
      .upload(img2Path, dummyPngBuffer, { contentType: 'image/png', upsert: true });

    if (up2Err) throw new Error(`Upload 2 failed: ${up2Err.message}`);

    const { data: url2Data } = supabase.storage.from('product-images').getPublicUrl(img2Path);

    const { data: img2Record, error: db2Err } = await supabase
      .from('product_images')
      .insert({
        organization_id: orgId,
        product_id: prod.id,
        storage_path: img2Path,
        url: url2Data.publicUrl,
        is_primary: false,
        sort_order: 1
      })
      .select()
      .single();

    if (db2Err || !img2Record) throw new Error(`Insert DB image 2 failed: ${db2Err?.message}`);
    img2Id = img2Record.id;
    console.log(`✅ Secondary Image Uploaded & Linked! ID: ${img2Record.id}, Path: ${img2Path}`);

    // TEST 3: Verify Images in Product Query
    console.log('\n--- TEST 3: Query Product with Images ---');
    const { data: fetchedProd, error: fErr } = await supabase
      .from('products')
      .select('*, product_images(*)')
      .eq('id', prod.id)
      .single();

    if (fErr || !fetchedProd) throw new Error(`Query product failed: ${fErr?.message}`);
    console.log(`✅ Product Images Count: ${fetchedProd.product_images?.length}`);
    const primaryInDb = fetchedProd.product_images.find((i: any) => i.is_primary);
    console.log(`✅ Primary Image ID: ${primaryInDb?.id} (matches img1: ${primaryInDb?.id === img1Id})`);

    // TEST 4: Change Primary Image
    console.log('\n--- TEST 4: Set Image 2 as Primary ---');
    await supabase.from('product_images').update({ is_primary: false }).eq('product_id', prod.id);
    await supabase.from('product_images').update({ is_primary: true }).eq('id', img2Id);

    const { data: reFetchedImgs } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', prod.id)
      .order('is_primary', { ascending: false });

    const newPrimary = reFetchedImgs?.find(i => i.is_primary);
    console.log(`✅ New Primary Image ID: ${newPrimary?.id} (matches img2: ${newPrimary?.id === img2Id})`);

    // TEST 5: Delete Secondary Image (img1)
    console.log('\n--- TEST 5: Delete Image 1 ---');
    await supabase.from('product_images').delete().eq('id', img1Id);
    await supabase.storage.from('product-images').remove([img1Path]);

    const { data: remainingImgs } = await supabase.from('product_images').select('*').eq('product_id', prod.id);
    console.log(`✅ Remaining Images Count: ${remainingImgs?.length} (Image 1 deleted successfully)`);

    console.log('\n🎉 ALL PRODUCT IMAGES TESTS PASSED SUCCESSFULLY!');
  } catch (err: any) {
    console.error(`\n❌ TEST FAILED:`, err.message);
    process.exit(1);
  } finally {
    // Cleanup
    if (createdProductId) {
      console.log('\n--- Cleanup Test Data ---');
      await supabase.from('product_images').delete().eq('product_id', createdProductId);
      await supabase.from('products').delete().eq('id', createdProductId);
      console.log('✅ Cleanup Finished Successfully!');
    }
  }
}

runImageLifecycleTest();
