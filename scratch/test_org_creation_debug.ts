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

console.log('URL:', url ? 'PRESENT' : 'MISSING');
console.log('Service Key:', serviceKey ? 'PRESENT' : 'MISSING');

const supabaseAdmin = createClient(url, serviceKey, {
  auth: { persistSession: false },
});

async function runTest() {
  console.log('\n--- 1. Testing user fetch ---');
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 5 });
  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }
  console.log('Found users:', usersData.users.length);
  if (usersData.users.length === 0) {
    console.error('No users found in database');
    return;
  }

  const testUser = usersData.users[0];
  console.log('Test User ID:', testUser.id, 'Email:', testUser.email);

  console.log('\n--- 2. Testing Insert into organizations ---');
  const testSlug = `test-org-${Date.now()}`;
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: 'Test Org Diagnostic',
      slug: testSlug,
      country: 'Burkina Faso',
      currency: 'XOF',
      timezone: 'Africa/Ouagadougou',
      settings: {
        sector: 'COMMERCE',
        city: 'Ouagadougou',
        company_phone: '+22670000000',
        onboarding_step: 'WHATSAPP',
        onboarding_completed: false,
      },
      created_by: testUser.id,
    })
    .select('*')
    .single();

  if (orgError) {
    console.error('❌ Insert organizations Error:', JSON.stringify(orgError, null, 2));
    return;
  }
  console.log('✅ Insert organizations Success! Org ID:', org.id);

  console.log('\n--- 3. Testing Insert into user_organization_roles ---');
  const { data: role, error: roleError } = await supabaseAdmin
    .from('user_organization_roles')
    .insert({
      organization_id: org.id,
      user_id: testUser.id,
      role: 'OWNER',
      permissions: ['*'],
      created_by: testUser.id,
    })
    .select('*')
    .single();

  if (roleError) {
    console.error('❌ Insert user_organization_roles Error:', JSON.stringify(roleError, null, 2));
  } else {
    console.log('✅ Insert user_organization_roles Success! Role ID:', role.id);
  }

  console.log('\n--- 4. Testing Insert into financial_accounts ---');
  const { data: fin, error: finError } = await supabaseAdmin
    .from('financial_accounts')
    .insert({
      organization_id: org.id,
      name: 'Caisse Principale',
      type: 'CASH_REGISTER',
      opening_balance: 0,
      current_balance: 0,
      currency: 'XOF',
      status: 'ACTIVE',
    })
    .select('*')
    .single();

  if (finError) {
    console.error('❌ Insert financial_accounts Error:', JSON.stringify(finError, null, 2));
  } else {
    console.log('✅ Insert financial_accounts Success! Account ID:', fin.id);
  }

  console.log('\n--- Cleanup test org ---');
  await supabaseAdmin.from('financial_accounts').delete().eq('organization_id', org.id);
  await supabaseAdmin.from('user_organization_roles').delete().eq('organization_id', org.id);
  await supabaseAdmin.from('organizations').delete().eq('id', org.id);
  console.log('Cleanup completed!');
}

runTest().catch(console.error);
