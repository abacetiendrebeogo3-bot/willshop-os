import fs from 'fs';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

// Parse .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
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
        if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !anonKey) anonKey = val;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceKey) serviceKey = val;
      }
    }
  });
}

test('WillShop OS — Supabase DEV Project Connectivity Test', async (t) => {
  await t.test('1. Environment Variables Validation', () => {
    assert.ok(url && url.startsWith('http'), 'NEXT_PUBLIC_SUPABASE_URL should be set in .env.local');
    assert.ok(anonKey && anonKey.length > 20, 'NEXT_PUBLIC_SUPABASE_ANON_KEY should be set in .env.local');
    assert.ok(serviceKey && serviceKey.length > 20, 'SUPABASE_SERVICE_ROLE_KEY should be set in .env.local');
  });

  await t.test('2. Live Network Ping to Supabase DEV Project', async () => {
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase.from('organizations').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('  [Supabase Response]', error.code, error.message);
      // Code 42P01 or relation does not exist means connection succeeded, database is fresh!
      const isFreshDatabase = error.code === '42P01' || error.message.includes('does not exist');
      assert.ok(isFreshDatabase, `Unexpected Supabase connection error: ${error.message}`);
    } else {
      console.log('  [Supabase Response] Table organizations exists and responds cleanly.');
    }
  });
});
