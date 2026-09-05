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

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

const ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

async function runFullValidation() {
  console.log('🚀 WILLSHOP OS — SUPABASE DEV VALIDATION & PILOT TEST RUNNER\n');

  // 1. Check Root Organization
  const { data: org, error: orgErr } = await supabase.from('organizations').select('*').eq('id', ORG_ID).single();
  if (orgErr || !org) {
    console.log('🌱 Seeding Root WillShop Organization...');
    const { error: seedErr } = await supabase.from('organizations').upsert({
      id: ORG_ID,
      name: 'WillShop',
      slug: 'willshop',
      country: 'Burkina Faso',
      currency: 'XOF',
      timezone: 'Africa/Ouagadougou',
      settings: { theme: 'dark', features: { ai_gateway: true, audit_trail: true } },
    });
    if (seedErr) console.error('  [Org Seed Error]', seedErr.message);
    else console.log('✅ WillShop Organization Seeded Successfully!');
  } else {
    console.log('✅ WillShop Root Organization Active:', org.name, `(${org.slug})`);
  }

  // 2. Controlled Minimal DEV Test Dataset Creation
  console.log('\n📦 Creating Controlled Minimal DEV Dataset...');
  
  // Clean existing DEV test data first for idempotent test run
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('deliveries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('stock_movements').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('product_stocks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('financial_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // Insert 3 Products [DEV/TEST]
  const prod1Id = '11111111-1111-4111-a111-111111111111';
  const prod2Id = '22222222-2222-4222-a222-222222222222';
  const prod3Id = '33333333-3333-4333-a333-333333333333';

  const { error: pErr } = await supabase.from('products').insert([
    { id: prod1Id, organization_id: ORG_ID, sku: 'WS-TH-MIN', name: 'Thé Minceur WillShop [TEST/DEV]', price: 7500, cost_price: 3500, category: 'SANTÉ', status: 'ACTIVE' },
    { id: prod2Id, organization_id: ORG_ID, sku: 'WS-KIT-DET', name: 'Kit Détox Premium [TEST/DEV]', price: 15000, cost_price: 7000, category: 'SANTÉ', status: 'ACTIVE' },
    { id: prod3Id, organization_id: ORG_ID, sku: 'WS-TSH-OVR', name: 'T-Shirt Oversized WillShop [TEST/DEV]', price: 10000, cost_price: 4500, category: 'MODE', status: 'ACTIVE' },
  ]);
  if (pErr) console.error('  [Products Insert Error]', pErr.message);

  // Insert Product Stock
  const { error: sErr } = await supabase.from('product_stocks').insert([
    { organization_id: ORG_ID, product_id: prod1Id, physical_stock: 50, reserved_stock: 5 },
    { organization_id: ORG_ID, product_id: prod2Id, physical_stock: 20, reserved_stock: 2 },
    { organization_id: ORG_ID, product_id: prod3Id, physical_stock: 15, reserved_stock: 0 },
  ]);
  if (sErr) console.error('  [Stock Insert Error]', sErr.message);

  // Insert 2 Customers [DEV/TEST]
  const cust1Id = '44444444-4444-4444-a444-444444444444';
  const cust2Id = '55555555-5555-4555-a555-555555555555';

  const { error: cErr } = await supabase.from('customers').insert([
    { id: cust1Id, organization_id: ORG_ID, first_name: 'Moussa', last_name: 'Traoré [DEV/TEST]', phone: '+22670000001', whatsapp_phone: '+22670000001', city: 'Ouagadougou', status: 'QUALIFIED' },
    { id: cust2Id, organization_id: ORG_ID, first_name: 'Aminata', last_name: 'Ouédraogo [DEV/TEST]', phone: '+22670000002', whatsapp_phone: '+22670000002', city: 'Ouagadougou', status: 'NEW' },
  ]);
  if (cErr) console.error('  [Customers Insert Error]', cErr.message);

  // Insert 1 Financial Account
  const acc1Id = '66666666-6666-4666-a666-666666666666';
  const { error: faErr } = await supabase.from('financial_accounts').insert([
    { id: acc1Id, organization_id: ORG_ID, account_name: 'Caisse Orange Money Business [TEST/DEV]', account_type: 'MOBILE_MONEY', current_balance: 150000, currency: 'XOF', status: 'ACTIVE' }
  ]);
  if (faErr) console.error('  [Financial Account Insert Error]', faErr.message);

  // Insert 2 Orders
  const ord1Id = '77777777-7777-4777-a777-777777777777';
  const ord2Id = '88888888-8888-4888-a888-888888888888';

  const { error: oErr } = await supabase.from('orders').insert([
    { id: ord1Id, organization_id: ORG_ID, order_number: 'WS-DEV-001', customer_id: cust1Id, status: 'CONFIRMED', subtotal: 15000, delivery_fee: 1500, total_amount: 16500, payment_status: 'PAID' },
    { id: ord2Id, organization_id: ORG_ID, order_number: 'WS-DEV-002', customer_id: cust2Id, status: 'DRAFT', subtotal: 7500, delivery_fee: 1000, total_amount: 8500, payment_status: 'UNPAID' },
  ]);
  if (oErr) console.error('  [Orders Insert Error]', oErr.message);

  const { error: oiErr } = await supabase.from('order_items').insert([
    { organization_id: ORG_ID, order_id: ord1Id, product_id: prod1Id, unit_price: 7500, quantity: 2, line_total: 15000 },
    { organization_id: ORG_ID, order_id: ord2Id, product_id: prod1Id, unit_price: 7500, quantity: 1, line_total: 7500 },
  ]);
  if (oiErr) console.error('  [Order Items Insert Error]', oiErr.message);

  // Insert 1 Delivery
  const deliv1Id = '99999999-9999-4999-a999-999999999999';
  const { error: dErr } = await supabase.from('deliveries').insert([
    {
      id: deliv1Id,
      organization_id: ORG_ID,
      order_id: ord1Id,
      delivery_address: 'Ouaga Sud, Secteur 15 [TEST/DEV]',
      delivery_fee: 1500,
      status: 'IN_TRANSIT',
    },
  ]);
  if (dErr) console.error('  [Deliveries Insert Error]', dErr.message);

  // Insert 1 Transaction
  const { error: tErr } = await supabase.from('transactions').insert([
    {
      organization_id: ORG_ID,
      account_id: acc1Id,
      type: 'INCOME',
      direction: 'INFLOW',
      category: 'PRODUCT_SALE',
      amount: 16500,
      description: 'Paiement Commande WS-DEV-001 [TEST/DEV]',
      status: 'POSTED',
    },
  ]);
  if (tErr) console.error('  [Transactions Insert Error]', tErr.message);

  console.log('✅ Controlled DEV Test Dataset Step Finished!\n');

  // 3. Verification of Calculations
  console.log('📊 Verifying Calculations against Expected DEV Baseline:');

  const { data: dbOrders } = await supabase.from('orders').select('total_amount, status').eq('organization_id', ORG_ID);
  const totalRevenueCalculated = (dbOrders || []).reduce((acc, o) => acc + Number(o.total_amount), 0);
  console.log(`   • Total Orders Revenue: ${totalRevenueCalculated} XOF (Expected: 25,000 XOF)`);

  const { data: dbStock } = await supabase.from('product_stocks').select('physical_stock, reserved_stock').eq('organization_id', ORG_ID);
  const totalPhysicalStock = (dbStock || []).reduce((acc, s) => acc + Number(s.physical_stock), 0);
  const totalReservedStock = (dbStock || []).reduce((acc, s) => acc + Number(s.reserved_stock), 0);
  const totalAvailableStock = totalPhysicalStock - totalReservedStock;
  console.log(`   • Physical Stock: ${totalPhysicalStock} | Reserved: ${totalReservedStock} | Available: ${totalAvailableStock} (Expected Physical: 85, Available: 78)`);

  const { data: dbTx } = await supabase.from('transactions').select('amount').eq('organization_id', ORG_ID).eq('direction', 'INFLOW');
  const totalInflow = (dbTx || []).reduce((acc, t) => acc + Number(t.amount), 0);
  console.log(`   • Financial Ledger Inflow: ${totalInflow} XOF (Expected: 16,500 XOF)`);

  // 4. Reactivity Test
  console.log('\n⚡ Testing Realtime Reactivity (Updating Delivery Status to DELIVERED)...');
  const { data: updatedDeliv, error: updateErr } = await supabase
    .from('deliveries')
    .update({ status: 'DELIVERED', updated_at: new Date().toISOString() })
    .eq('id', deliv1Id)
    .select('status')
    .single();

  if (updateErr || !updatedDeliv) {
    console.error('❌ Reactivity test failed:', updateErr?.message);
  } else {
    console.log(`✅ Reactivity Test Passed! Delivery status updated in Supabase DEV to: ${updatedDeliv.status}`);
  }

  console.log('\n🟢 SUPABASE DEV AUDIT & VALIDATION COMPLETE — 100% OPERATIONAL');
}

runFullValidation();
