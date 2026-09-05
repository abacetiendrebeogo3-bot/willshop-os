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

async function inspectColumns() {
  console.log('--- Inspecting organizations ---');
  const { data: orgs, error: orgErr } = await supabaseAdmin.from('organizations').select('*').limit(1);
  if (orgErr) console.error('orgErr:', orgErr);
  else if (orgs && orgs.length > 0) console.log('organizations columns:', Object.keys(orgs[0]));
  else console.log('organizations table is empty');

  console.log('\n--- Inspecting user_organization_roles ---');
  const { data: roles, error: roleErr } = await supabaseAdmin.from('user_organization_roles').select('*').limit(1);
  if (roleErr) console.error('roleErr:', roleErr);
  else if (roles && roles.length > 0) console.log('user_organization_roles columns:', Object.keys(roles[0]));
  else console.log('user_organization_roles table is empty');

  console.log('\n--- Inspecting financial_accounts ---');
  const { data: fins, error: finErr } = await supabaseAdmin.from('financial_accounts').select('*').limit(1);
  if (finErr) console.error('finErr:', finErr);
  else if (fins && fins.length > 0) console.log('financial_accounts columns:', Object.keys(fins[0]));
  else console.log('financial_accounts table is empty');
}

inspectColumns();
