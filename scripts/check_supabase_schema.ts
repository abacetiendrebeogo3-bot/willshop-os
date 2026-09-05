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

async function inspectSchema() {
  console.log('🔍 Inspecting Supabase DEV Database Schema...\n');

  const targetTables = [
    'organizations',
    'user_organization_roles',
    'audit_log',
    'events',
    'notifications',
    'idempotency_keys',
    'customers',
    'products',
    'product_stocks',
    'stock_movements',
    'orders',
    'order_items',
    'payments',
    'deliveries',
    'delivery_routes',
    'proof_of_deliveries',
    'financial_accounts',
    'transactions',
    'financial_obligations',
    'daily_sales_summaries',
    'executive_insights',
    'anomaly_logs',
    'automation_rules',
    'automation_executions',
    'approval_queue',
    'ceo_ai_decisions',
    'ceo_ai_memory',
    'marketing_campaigns',
    'marketing_creatives',
    'employees',
    'employee_tasks',
    'strategic_goals',
    'strategic_initiatives',
    'personal_goals',
    'personal_tasks',
    'personal_habits',
    'personal_financial_accounts',
  ];

  const existingTables: string[] = [];
  const missingTables: string[] = [];

  for (const tableName of targetTables) {
    const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
    if (!error) {
      existingTables.push(tableName);
    } else {
      missingTables.push(tableName);
    }
  }

  console.log(`✅ Existing Tables Count: ${existingTables.length} / ${targetTables.length}`);
  if (existingTables.length > 0) {
    console.log('   Tables:', existingTables.join(', '));
  }
  if (missingTables.length > 0) {
    console.log(`\n⚠️ Missing Tables Count: ${missingTables.length}`);
    console.log('   Missing:', missingTables.join(', '));
  }
}

inspectSchema();
