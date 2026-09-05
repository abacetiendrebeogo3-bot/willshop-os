import fs from 'fs';
import path from 'path';

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

async function diagnose() {
  console.log('===============================================================');
  console.log('🔍 SUPABASE AUTH DIAGNOSTIC TOOL');
  console.log('===============================================================');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('1. ENVIRONMENT VARIABLES AUDIT:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL:', url ? url : '🔴 MISSING');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY:', anonKey ? `${anonKey.substring(0, 20)}...` : '🔴 MISSING');

  if (!url || !anonKey || url.includes('placeholder')) {
    console.error('🔴 CRITICAL: Environment variables are missing or set to placeholder!');
    process.exit(1);
  }

  console.log('\n2. DIRECT NETWORK & HEALTH CHECK (fetch):');
  try {
    const healthUrl = `${url}/auth/v1/health`;
    console.log(`   Calling GET ${healthUrl}...`);
    const res = await fetch(healthUrl, {
      headers: { apikey: anonKey }
    });
    console.log(`   HTTP Status: ${res.status} ${res.statusText}`);
    const body = await res.json();
    console.log('   Health response:', JSON.stringify(body));
    if (res.ok) {
      console.log('   🟢 Supabase Auth service is UP and reachable!');
    } else {
      console.log('   🟡 Supabase Auth returned non-200 status');
    }
  } catch (err: any) {
    console.error('   🔴 FETCH FAILED:', err.message);
  }

  console.log('\n3. DIRECT SIGNUP API TEST:');
  const testEmail = `test_diag_${Date.now()}@gmail.com`;
  const testPass = 'TestPass123!#';
  try {
    const signupUrl = `${url}/auth/v1/signup`;
    console.log(`   Calling POST ${signupUrl} for ${testEmail}...`);
    const res = await fetch(signupUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': anonKey
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPass,
        data: { first_name: 'Diag', last_name: 'Test' }
      })
    });
    console.log(`   HTTP Status: ${res.status} ${res.statusText}`);
    const body = await res.json();
    console.log('   Signup response:', JSON.stringify(body));

    if (res.ok && (body.id || body.user?.id || body.access_token)) {
      console.log('   🟢 SIGNUP DIRECT API SUCCEEDED!');
    } else {
      console.log('   🔴 SIGNUP DIRECT API REJECTED:', body);
    }
  } catch (err: any) {
    console.error('   🔴 SIGNUP FETCH FAILED:', err.message);
  }
}

diagnose();
