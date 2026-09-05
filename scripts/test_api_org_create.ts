import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...vals] = trimmed.split('=');
        process.env[key.trim()] = vals.join('=').trim();
      }
    }
  }
}

loadEnvLocal();

async function testOrgCreate() {
  console.log('Testing org creation logic...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stbzctncpvgqdpybcrmg.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  console.log('URL:', supabaseUrl);
  console.log('Service Role Key present:', serviceKey ? 'YES' : 'NO');

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  const name = "Willshop Test Company " + Date.now();
  const baseSlug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Create dummy auth user first
  const testEmail = `test_org_user_${Date.now()}@gmail.com`;
  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
  });

  if (userError || !userData.user) {
    console.error('Failed to create test user:', userError);
    return;
  }

  const userId = userData.user.id;
  console.log('Created test auth user:', userId);

  // 1. Insert Org
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({
      name: name.trim(),
      slug,
      country: 'Burkina Faso',
      currency: 'XOF',
      timezone: 'Africa/Ouagadougou',
      settings: {
        sector: 'Santé & Beauté',
        city: 'Ouagadougou',
        company_phone: '+22655002796',
        onboarding_step: 'WHATSAPP',
        onboarding_completed: false,
      },
      created_by: userId,
    })
    .select('*')
    .single();

  if (orgError) {
    console.error('Org Insert Error:', orgError);
    return;
  }
  console.log('Org Insert Success:', org.id);

  // 2. Insert Role
  const { error: roleError } = await supabaseAdmin
    .from('user_organization_roles')
    .insert({
      organization_id: org.id,
      user_id: userId,
      role: 'OWNER',
      permissions: ['*'],
      created_by: userId,
    });

  if (roleError) {
    console.error('Role Insert Error:', roleError);
    return;
  }
  console.log('Role Insert Success');

  // 3. Insert Financial Account
  const { error: finError } = await supabaseAdmin.from('financial_accounts').insert({
    organization_id: org.id,
    name: 'Caisse Principale',
    type: 'CASH_REGISTER',
    opening_balance: 0,
    current_balance: 0,
    currency: 'XOF',
    status: 'ACTIVE',
  });

  if (finError) {
    console.error('Fin Account Insert Error:', finError);
    return;
  }
  console.log('Fin Account Insert Success');

  console.log('🟢 ALL ORG CREATION STEPS SUCCEEDED!');
}

testOrgCreate();
