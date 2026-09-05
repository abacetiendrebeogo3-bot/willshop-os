import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  for (const line of envConfig.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const adminSupabase = createClient(supabaseUrl, serviceKey);

async function testStorageBucket() {
  console.log('--- TESTING STORAGE BUCKET CONFIGURATION ---');

  // 1. Update bucket to public: true
  const { data: bData, error: bErr } = await adminSupabase.storage.updateBucket('product-images', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
  });

  if (bErr) {
    console.error('Update bucket error:', bErr.message);
  } else {
    console.log('✅ Bucket product-images updated to public: true');
  }

  // 2. Test upload using service role client
  const dummyBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  const testPath = `test_org/test_prod/dummy_${Date.now()}.png`;

  const { data: upData, error: upErr } = await adminSupabase.storage
    .from('product-images')
    .upload(testPath, dummyBuffer, { contentType: 'image/png', upsert: true });

  if (upErr) {
    console.error('❌ Service role upload error:', upErr.message);
  } else {
    console.log('✅ Service role upload SUCCESS! Path:', upData.path);
    const { data: urlData } = adminSupabase.storage.from('product-images').getPublicUrl(testPath);
    console.log('✅ Public URL generated:', urlData.publicUrl);
    
    // Clean test object
    await adminSupabase.storage.from('product-images').remove([testPath]);
  }

  process.exit(0);
}

testStorageBucket();
