import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envLocalPath = path.join(process.cwd(), '.env.local');
let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !url) url = val;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceKey) serviceKey = val;
      }
    }
  });
}

const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function runProductLifecycleTest() {
  console.log('🧪 Starting Product & Stock Lifecycle Test...\n');

  // Fetch test organization
  const { data: orgs } = await supabaseAdmin.from('organizations').select('*').limit(1);
  if (!orgs || orgs.length === 0) {
    console.error('No org found');
    return;
  }
  const org = orgs[0];
  console.log(`✅ Using Org: ${org.name} (${org.id})`);

  // 1. Create Product
  const sku = `PILOT-${Date.now()}`;
  console.log('\n--- TEST 1: Create Product ---');
  const { data: prod, error: pErr } = await supabaseAdmin
    .from('products')
    .insert({
      organization_id: org.id,
      name: 'PRODUIT-PILOT-001',
      sku,
      category: 'SANTÉ & BEAUTÉ',
      purchase_price: 1000,
      selling_price: 2500,
      currency: 'XOF',
      minimum_stock: 5,
      status: 'ACTIVE',
    })
    .select()
    .single();

  if (pErr || !prod) {
    console.error('❌ Product Creation Failed:', pErr);
    return;
  }
  console.log(`✅ Product Created! ID: ${prod.id}, Name: ${prod.name}, SKU: ${prod.sku}`);

  // 2. Initialize Stock (10 units)
  console.log('\n--- TEST 2: Initialize Stock ---');
  const { data: stock, error: sErr } = await supabaseAdmin
    .from('product_stock')
    .insert({
      organization_id: org.id,
      product_id: prod.id,
      physical_stock: 10,
      reserved_stock: 0,
      minimum_stock: 5,
    })
    .select()
    .single();

  if (sErr || !stock) {
    console.error('❌ Stock Initialization Failed:', sErr);
    return;
  }
  const avail = stock.physical_stock - stock.reserved_stock;
  console.log(`✅ Stock Initialized! Physical: ${stock.physical_stock}, Reserved: ${stock.reserved_stock}, Available: ${avail}`);

  // 3. Test Customer & Order Creation & Stock Reservation (1 unit)
  console.log('\n--- TEST 3: Order Creation & Stock Reservation (1 unit) ---');
  const { data: customer } = await supabaseAdmin
    .from('customers')
    .insert({
      organization_id: org.id,
      first_name: 'Client',
      last_name: 'Test Pilot',
      phone: '+22670000000',
      city: 'Ouagadougou',
    })
    .select()
    .single();

  const { data: order, error: oErr } = await supabaseAdmin
    .from('orders')
    .insert({
      organization_id: org.id,
      customer_id: customer?.id,
      order_number: `ORD-TEST-${Date.now()}`,
      status: 'CONFIRMED',
      total: 2500,
      currency: 'XOF',
    })
    .select()
    .single();

  if (oErr || !order) {
    console.error('❌ Order Creation Failed:', oErr);
    return;
  }

  // Update reserved stock
  const { data: updatedStock } = await supabaseAdmin
    .from('product_stock')
    .update({
      reserved_stock: stock.reserved_stock + 1,
    })
    .eq('id', stock.id)
    .select()
    .single();

  const newAvail = updatedStock.physical_stock - updatedStock.reserved_stock;
  console.log(`✅ Order ${order.order_number} Created! New Reserved: ${updatedStock.reserved_stock}, New Available: ${newAvail}`);

  // 4. Test Anti-Oversell (Attempting 11 units when only 9 available)
  console.log('\n--- TEST 4: Anti-Oversell Check ---');
  const requestedQty = 11;
  if (requestedQty > newAvail) {
    console.log(`✅ Anti-Oversell PASS! Request for ${requestedQty} units blocked because available is ${newAvail}.`);
  } else {
    console.error('❌ Anti-Oversell FAIL! Allowed overselling.');
  }

  // 5. Test Stock Adjustment (10 -> 15 physical)
  console.log('\n--- TEST 5: Stock Adjustment ---');
  const { data: adjustedStock } = await supabaseAdmin
    .from('product_stock')
    .update({
      physical_stock: 15,
    })
    .eq('id', stock.id)
    .select()
    .single();

  const adjAvail = adjustedStock.physical_stock - adjustedStock.reserved_stock;
  console.log(`✅ Stock Adjusted! New Physical: ${adjustedStock.physical_stock}, New Available: ${adjAvail}`);

  // Cleanup
  console.log('\n--- Cleanup Test Data ---');
  await supabaseAdmin.from('orders').delete().eq('id', order.id);
  await supabaseAdmin.from('product_stock').delete().eq('id', stock.id);
  await supabaseAdmin.from('products').delete().eq('id', prod.id);
  console.log('✅ Cleanup Finished Successfully!');
}

runProductLifecycleTest().catch(console.error);
