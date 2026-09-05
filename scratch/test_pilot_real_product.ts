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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, serviceKey);

async function testRealPilotProductAndOrder() {
  console.log('===================================================');
  console.log('🛍️ CREATION & VERIFICATION PRODUIT REEL EN BASE');
  console.log('===================================================\n');

  // 1. Get organization
  const { data: orgs } = await supabase.from('organizations').select('id, name').limit(1);
  const orgId = orgs?.[0]?.id;
  console.log(`✅ Organization: ${orgs?.[0]?.name} (${orgId})`);

  // 2. Create Real Product
  const sku = `PILOT-IMG-${Date.now()}`;
  const { data: prod, error: pErr } = await supabase.from('products').insert({
    organization_id: orgId,
    name: 'PRODUIT-PILOT-IMAGE-001',
    sku: sku,
    category: 'SANTÉ & BEAUTÉ',
    purchase_price: 1000,
    selling_price: 2500,
    currency: 'XOF',
    minimum_stock: 5,
    status: 'ACTIVE'
  }).select().single();

  if (pErr || !prod) {
    console.error('❌ Failed to create product:', pErr?.message);
    process.exit(1);
  }
  console.log(`✅ 1. Product Record Created! ID: ${prod.id}`);

  // 3. Create Product Stock
  const { data: st, error: stErr } = await supabase.from('product_stock').insert({
    organization_id: orgId,
    product_id: prod.id,
    physical_stock: 10,
    reserved_stock: 0,
    minimum_stock: 5
  }).select().single();

  if (stErr) {
    console.error('❌ Failed to create stock:', stErr.message);
    process.exit(1);
  }
  console.log(`✅ 2. Product Stock Initialized! Physical: 10, Reserved: 0, Available: 10`);

  // 4. Upload Image to Storage & insert DB record
  const dummyBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );
  const storagePath = `${orgId}/${prod.id}/pilot_image_${Date.now()}.png`;

  const { data: upData, error: upErr } = await supabase.storage
    .from('product-images')
    .upload(storagePath, dummyBuffer, { contentType: 'image/png', upsert: true });

  if (upErr) {
    console.error('❌ Storage upload failed:', upErr.message);
    process.exit(1);
  }

  const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(storagePath);

  const { data: imgRec, error: imgErr } = await supabase.from('product_images').insert({
    organization_id: orgId,
    product_id: prod.id,
    storage_path: storagePath,
    url: urlData.publicUrl,
    is_primary: true,
    sort_order: 0
  }).select().single();

  if (imgErr) {
    console.error('❌ Image record failed:', imgErr.message);
    process.exit(1);
  }
  console.log(`✅ 3. Product Image Uploaded & Linked! ID: ${imgRec.id}`);
  console.log(`   - Storage Path: ${storagePath}`);
  console.log(`   - Public URL: ${urlData.publicUrl}`);

  // 5. Test Order Creation with 1 Unit
  console.log('\n--- 4. TEST CREATION COMMANDE CLIENT AVEC CE PRODUIT ---');
  const { data: custs } = await supabase.from('customers').select('id').eq('organization_id', orgId).limit(1);
  let customerId = custs?.[0]?.id;

  if (!customerId) {
    const { data: newCust } = await supabase.from('customers').insert({
      organization_id: orgId,
      first_name: 'Client Pilot',
      last_name: 'Test',
      phone: '+22670000000'
    }).select().single();
    customerId = newCust?.id;
  }

  const orderNumber = `ORD-PILOT-${Date.now()}`;
  const { data: order, error: oErr } = await supabase.from('orders').insert({
    organization_id: orgId,
    customer_id: customerId,
    order_number: orderNumber,
    status: 'CONFIRMED',
    total: 2500,
    currency: 'XOF'
  }).select().single();

  if (oErr || !order) {
    console.error('❌ Order creation failed:', oErr?.message);
    process.exit(1);
  }

  await supabase.from('order_items').insert({
    order_id: order.id,
    product_id: prod.id,
    quantity: 1,
    unit_price: 2500,
    total_price: 2500
  });

  // Reserve 1 stock
  await supabase.from('product_stock').update({
    reserved_stock: 1
  }).eq('product_id', prod.id);

  // 6. Verify Full Database Query
  const { data: verifyProd } = await supabase
    .from('products')
    .select('*, product_stock(*), product_images(*)')
    .eq('id', prod.id)
    .single();

  console.log(`✅ 5. Real Product Database State Verified:`);
  console.log(`   - Product Name: ${verifyProd.name}`);
  console.log(`   - SKU: ${verifyProd.sku}`);
  console.log(`   - Physical Stock: ${verifyProd.product_stock?.[0]?.physical_stock}`);
  console.log(`   - Reserved Stock: ${verifyProd.product_stock?.[0]?.reserved_stock}`);
  console.log(`   - Available Stock: ${verifyProd.product_stock[0].physical_stock - verifyProd.product_stock[0].reserved_stock}`);
  console.log(`   - Primary Image URL: ${verifyProd.product_images?.[0]?.url}`);

  // Cleanup order & product test
  await supabase.from('order_items').delete().eq('order_id', order.id);
  await supabase.from('orders').delete().eq('id', order.id);
  await supabase.from('product_images').delete().eq('product_id', prod.id);
  await supabase.from('product_stock').delete().eq('product_id', prod.id);
  await supabase.from('products').delete().eq('id', prod.id);

  console.log('\n✅ Cleaned up pilot test records!');
  process.exit(0);
}

testRealPilotProductAndOrder();
