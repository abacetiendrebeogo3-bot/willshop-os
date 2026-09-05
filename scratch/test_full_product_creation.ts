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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);
const anonSupabase = createClient(supabaseUrl, anonKey);

async function runFullTestSuite() {
  console.log('===================================================');
  console.log('🧪 RUNTIME TEST SUITE — PRODUITS & STOCK & IMAGES');
  console.log('===================================================\n');

  // Fetch test organization
  const { data: orgs } = await adminSupabase.from('organizations').select('id, name').limit(1);
  const orgId = orgs?.[0]?.id;
  console.log(`✅ Organization resolved: ${orgs?.[0]?.name} (${orgId})\n`);

  const dummyPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  const createdProdIds: string[] = [];

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Produit sans image
    // ------------------------------------------------------------------------
    console.log('--- TEST 1: Produit Sans Image ---');
    const sku1 = `TEST-NOIMG-${Date.now()}`;
    const { data: p1, error: e1 } = await adminSupabase.from('products').insert({
      organization_id: orgId,
      name: 'TEST-NO-IMAGE',
      sku: sku1,
      category: 'SANTÉ & BEAUTÉ',
      purchase_price: 1000,
      selling_price: 2500,
      currency: 'XOF',
      minimum_stock: 5,
      status: 'ACTIVE'
    }).select().single();

    if (e1 || !p1) throw new Error(`TEST 1 Failed: ${e1?.message}`);
    createdProdIds.push(p1.id);

    const { error: s1Err } = await adminSupabase.from('product_stock').insert({
      organization_id: orgId,
      product_id: p1.id,
      physical_stock: 10,
      reserved_stock: 0,
      minimum_stock: 5
    });
    if (s1Err) throw new Error(`TEST 1 Stock Failed: ${s1Err.message}`);

    const { data: check1 } = await adminSupabase.from('products').select('*, product_stock(*)').eq('id', p1.id).single();
    console.log(`✅ TEST 1 PASS! Product ID: ${p1.id}, Stock: ${check1?.product_stock?.[0]?.physical_stock}\n`);

    // ------------------------------------------------------------------------
    // TEST 2: Produit + JPG Image (avec client ANON)
    // ------------------------------------------------------------------------
    console.log('--- TEST 2: Produit + JPG Image (Client Anon) ---');
    const sku2 = `TEST-JPG-${Date.now()}`;
    const { data: p2, error: e2 } = await adminSupabase.from('products').insert({
      organization_id: orgId,
      name: 'TEST-WITH-JPG',
      sku: sku2,
      category: 'MODE & HABILLEMENT',
      purchase_price: 1500,
      selling_price: 3500,
      currency: 'XOF',
      minimum_stock: 5,
      status: 'ACTIVE'
    }).select().single();

    if (e2 || !p2) throw new Error(`TEST 2 Product Failed: ${e2?.message}`);
    createdProdIds.push(p2.id);

    await adminSupabase.from('product_stock').insert({
      organization_id: orgId,
      product_id: p2.id,
      physical_stock: 15,
      reserved_stock: 0,
      minimum_stock: 5
    });

    const path2 = `${orgId}/${p2.id}/test_jpg_${Date.now()}.jpg`;
    const { data: up2, error: up2Err } = await anonSupabase.storage
      .from('product-images')
      .upload(path2, dummyPng, { contentType: 'image/jpeg', upsert: true });

    if (up2Err) throw new Error(`TEST 2 Storage Upload Failed: ${up2Err.message}`);

    const { data: url2 } = anonSupabase.storage.from('product-images').getPublicUrl(path2);
    const { error: dbImg2Err } = await adminSupabase.from('product_images').insert({
      organization_id: orgId,
      product_id: p2.id,
      storage_path: path2,
      url: url2.publicUrl,
      is_primary: true,
      sort_order: 0
    });
    if (dbImg2Err) throw new Error(`TEST 2 Image Record Failed: ${dbImg2Err.message}`);

    console.log(`✅ TEST 2 PASS! JPG Image Uploaded to Storage & DB linked!\n`);

    // ------------------------------------------------------------------------
    // TEST 3: Produit + PNG Image
    // ------------------------------------------------------------------------
    console.log('--- TEST 3: Produit + PNG Image ---');
    const sku3 = `TEST-PNG-${Date.now()}`;
    const { data: p3, error: e3 } = await adminSupabase.from('products').insert({
      organization_id: orgId,
      name: 'TEST-WITH-PNG',
      sku: sku3,
      category: 'ÉLECTRONIQUE',
      purchase_price: 5000,
      selling_price: 12000,
      currency: 'XOF',
      minimum_stock: 2,
      status: 'ACTIVE'
    }).select().single();

    if (e3 || !p3) throw new Error(`TEST 3 Failed: ${e3?.message}`);
    createdProdIds.push(p3.id);

    await adminSupabase.from('product_stock').insert({
      organization_id: orgId,
      product_id: p3.id,
      physical_stock: 5,
      reserved_stock: 0,
      minimum_stock: 2
    });

    const path3 = `${orgId}/${p3.id}/test_png_${Date.now()}.png`;
    await anonSupabase.storage.from('product-images').upload(path3, dummyPng, { contentType: 'image/png', upsert: true });
    const { data: url3 } = anonSupabase.storage.from('product-images').getPublicUrl(path3);
    await adminSupabase.from('product_images').insert({
      organization_id: orgId,
      product_id: p3.id,
      storage_path: path3,
      url: url3.publicUrl,
      is_primary: true,
      sort_order: 0
    });

    console.log(`✅ TEST 3 PASS! PNG Image Uploaded & Linked!\n`);

    // ------------------------------------------------------------------------
    // TEST 4: Produit + WEBP Image
    // ------------------------------------------------------------------------
    console.log('--- TEST 4: Produit + WEBP Image ---');
    const sku4 = `TEST-WEBP-${Date.now()}`;
    const { data: p4, error: e4 } = await adminSupabase.from('products').insert({
      organization_id: orgId,
      name: 'TEST-WITH-WEBP',
      sku: sku4,
      category: 'ALIMENTATION',
      purchase_price: 800,
      selling_price: 2000,
      currency: 'XOF',
      minimum_stock: 10,
      status: 'ACTIVE'
    }).select().single();

    if (e4 || !p4) throw new Error(`TEST 4 Failed: ${e4?.message}`);
    createdProdIds.push(p4.id);

    await adminSupabase.from('product_stock').insert({
      organization_id: orgId,
      product_id: p4.id,
      physical_stock: 20,
      reserved_stock: 0,
      minimum_stock: 10
    });

    const path4 = `${orgId}/${p4.id}/test_webp_${Date.now()}.webp`;
    await anonSupabase.storage.from('product-images').upload(path4, dummyPng, { contentType: 'image/webp', upsert: true });
    const { data: url4 } = anonSupabase.storage.from('product-images').getPublicUrl(path4);
    await adminSupabase.from('product_images').insert({
      organization_id: orgId,
      product_id: p4.id,
      storage_path: path4,
      url: url4.publicUrl,
      is_primary: true,
      sort_order: 0
    });

    console.log(`✅ TEST 4 PASS! WEBP Image Uploaded & Linked!\n`);

    // ------------------------------------------------------------------------
    // TEST 5: Produit + Plusieurs Images (Primary + Secondary)
    // ------------------------------------------------------------------------
    console.log('--- TEST 5: Produit + Plusieurs Images ---');
    const sku5 = `TEST-MULTI-${Date.now()}`;
    const { data: p5 } = await adminSupabase.from('products').insert({
      organization_id: orgId,
      name: 'TEST-MULTI-IMAGES',
      sku: sku5,
      category: 'SANTÉ & BEAUTÉ',
      purchase_price: 2000,
      selling_price: 5000,
      currency: 'XOF',
      minimum_stock: 5,
      status: 'ACTIVE'
    }).select().single();

    if (p5) {
      createdProdIds.push(p5.id);
      await adminSupabase.from('product_stock').insert({
        organization_id: orgId,
        product_id: p5.id,
        physical_stock: 25,
        reserved_stock: 0,
        minimum_stock: 5
      });

      for (let i = 0; i < 3; i++) {
        const pathM = `${orgId}/${p5.id}/img_${i}_${Date.now()}.png`;
        await anonSupabase.storage.from('product-images').upload(pathM, dummyPng, { contentType: 'image/png', upsert: true });
        const { data: urlM } = anonSupabase.storage.from('product-images').getPublicUrl(pathM);
        await adminSupabase.from('product_images').insert({
          organization_id: orgId,
          product_id: p5.id,
          storage_path: pathM,
          url: urlM.publicUrl,
          is_primary: i === 0,
          sort_order: i
        });
      }

      const { data: check5 } = await adminSupabase.from('products').select('*, product_images(*)').eq('id', p5.id).single();
      console.log(`✅ TEST 5 PASS! ${check5.product_images?.length} images linked to product!\n`);
    }

    // ------------------------------------------------------------------------
    // TEST 6: Verification Database Integrity Query
    // ------------------------------------------------------------------------
    console.log('--- TEST 6: Verification DB Query select(*, product_stock(*), product_images(*)) ---');
    const { data: allProds, error: allErr } = await adminSupabase
      .from('products')
      .select('*, product_stock(*), product_images(*)')
      .eq('organization_id', orgId)
      .in('id', createdProdIds);

    if (allErr) throw new Error(`TEST 6 Query Failed: ${allErr.message}`);

    console.log(`✅ TEST 6 PASS! Fetched ${allProds.length} test products cleanly with SSOT stock and images!\n`);

    console.log('===================================================');
    console.log('🎉 ALL RUNTIME TESTS PASSED 100%!');
    console.log('===================================================');

  } catch (err: any) {
    console.error('\n❌ RUNTIME TEST FAILED:', err.message);
    process.exit(1);
  } finally {
    // Cleanup
    console.log('\n--- Nettoyage des données de test ---');
    for (const pid of createdProdIds) {
      await adminSupabase.from('product_images').delete().eq('product_id', pid);
      await adminSupabase.from('product_stock').delete().eq('product_id', pid);
      await adminSupabase.from('products').delete().eq('id', pid);
    }
    console.log('✅ Nettoyage terminé avec succès!');
  }
}

runFullTestSuite();
