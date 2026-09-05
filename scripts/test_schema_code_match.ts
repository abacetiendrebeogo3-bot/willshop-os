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

async function runSchemaTest() {
  console.log('🧪 RUNNING CODE VS SUPABASE DEV SCHEMA MATCH TEST...\n');

  const entitiesToTest = [
    { name: 'Organizations', table: 'organizations', select: 'id, name, slug, country, currency, timezone, settings' },
    { name: 'Customers', table: 'customers', select: 'id, organization_id, first_name, last_name, full_name, phone, whatsapp_phone, city, source, status' },
    { name: 'Products', table: 'products', select: 'id, organization_id, sku, name, description, category, purchase_price, selling_price, currency, status' },
    { name: 'Orders', table: 'orders', select: 'id, organization_id, customer_id, order_number, status, subtotal, delivery_fee, discount, total, currency, source' },
    { name: 'Payments', table: 'payments', select: 'id, organization_id, order_id, amount, currency, method, status' },
    { name: 'Deliveries', table: 'deliveries', select: 'id, organization_id, order_id, driver_id, status, delivery_address, delivery_fee' },
    { name: 'Financial Accounts', table: 'financial_accounts', select: 'id, organization_id, name, type, currency, opening_balance, status' },
    { name: 'Conversations', table: 'conversations', select: 'id, organization_id, customer_id, unread_count' },
    { name: 'Personal Goals (Wilty)', table: 'personal_goals', select: 'id, user_id, scope, category, title, priority, status, baseline_value, target_value, current_value, progress_percent' },
  ];

  let passedCount = 0;
  for (const entity of entitiesToTest) {
    const { data, error } = await supabase.from(entity.table).select(entity.select).limit(1);
    if (error) {
      console.error(`❌ Entity ${entity.name} (${entity.table}) SCHEMA MATCH FAILED:`, error.message);
    } else {
      passedCount++;
      console.log(`✅ Entity ${entity.name} (${entity.table}) Schema Match OK!`);
    }
  }

  console.log(`\n🎯 Code vs Supabase DEV Schema Test Result: ${passedCount} / ${entitiesToTest.length} Passed.`);
  if (passedCount === entitiesToTest.length) {
    console.log('\n🟢 SCHEMA SUPABASE DEV OPÉRATIONNEL');
  } else {
    console.error('\n🔴 NO-GO: Schema Mismatch Detected!');
    process.exit(1);
  }
}

runSchemaTest();
