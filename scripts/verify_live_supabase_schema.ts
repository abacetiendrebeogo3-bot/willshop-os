import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const envLocalPath = path.join(process.cwd(), '.env.local');
let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let dbPassword = process.env.SUPABASE_DB_PASSWORD || '';
let dbUrl = process.env.DATABASE_URL || '';

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
        if (key === 'SUPABASE_DB_PASSWORD' && !dbPassword) dbPassword = val;
        if (key === 'DATABASE_URL' && !dbUrl) dbUrl = val;
      }
    }
  });
}

function extractProjectRef(supabaseUrl: string): string {
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.hostname.split('.')[0];
  } catch {
    return '';
  }
}

async function auditSchema() {
  const projectRef = extractProjectRef(url);
  if (!dbUrl) {
    dbUrl = `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    console.log('🚀 WILLSHOP OS — SUPABASE DEV LIVE CATALOG AUDIT\n');

    // 1. Tables
    const tablesRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
    `);
    const tables = tablesRes.rows.map((r) => r.table_name).sort();

    // 2. Functions / RPC
    const functionsRes = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';
    `);
    const functions = functionsRes.rows.map((r) => r.routine_name).sort();

    // 3. Triggers
    const triggersRes = await client.query(`
      SELECT trigger_name, event_object_table 
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public';
    `);
    const triggers = triggersRes.rows;

    // 4. RLS Policies
    const policiesRes = await client.query(`
      SELECT policyname, tablename 
      FROM pg_policies 
      WHERE schemaname = 'public';
    `);
    const policies = policiesRes.rows;

    // 5. Indexes
    const indexesRes = await client.query(`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE schemaname = 'public';
    `);
    const indexes = indexesRes.rows;

    // 6. Foreign Keys
    const fkRes = await client.query(`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_type = 'FOREIGN KEY' AND table_schema = 'public';
    `);
    const foreignKeys = fkRes.rows;

    // 7. Check Seed Data (Root Org)
    const seedRes = await client.query(`
      SELECT id, name, slug, country, currency 
      FROM public.organizations 
      WHERE slug = 'willshop';
    `);
    const seedOrg = seedRes.rows[0];

    console.log(`🟢 Tables (Public Schema): ${tables.length}`);
    console.log(`   List: ${tables.join(', ')}\n`);

    console.log(`🟢 Functions / RPC: ${functions.length}`);
    console.log(`   List: ${functions.join(', ')}\n`);

    console.log(`🟢 Triggers: ${triggers.length}`);
    console.log(`🟢 RLS Policies: ${policies.length}`);
    console.log(`🟢 Indexes: ${indexes.length}`);
    console.log(`🟢 Foreign Keys: ${foreignKeys.length}\n`);

    if (seedOrg) {
      console.log(`🟢 Seed Organization: "${seedOrg.name}" (${seedOrg.slug}) | ID: ${seedOrg.id}`);
    } else {
      console.error('🔴 Seed Organization Missing!');
    }

  } catch (err: any) {
    console.error('🔴 Catalog Audit Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

auditSchema();
