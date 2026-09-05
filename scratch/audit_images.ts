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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditStorageAndTables() {
  console.log('--- AUDITING PRODUCT IMAGES & STORAGE ---');
  
  // 1. Check products table schema/columns
  const { data: productSample, error: pErr } = await supabase.from('products').select('*').limit(1);
  if (pErr) console.error('Error fetching products:', pErr);
  else console.log('Products columns:', productSample && productSample.length > 0 ? Object.keys(productSample[0]) : 'No rows found');

  // 2. Check if product_images table exists
  const { data: imgSample, error: imgErr } = await supabase.from('product_images').select('*').limit(1);
  if (imgErr) {
    console.log('product_images table query error/status:', imgErr.message, imgErr.code);
  } else {
    console.log('product_images table EXISTS! Columns:', imgSample && imgSample.length > 0 ? Object.keys(imgSample[0]) : 'Table exists but empty');
  }

  // 3. Check Supabase Storage buckets
  const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
  if (bErr) console.error('Error listing buckets:', bErr);
  else console.log('Available Storage Buckets:', buckets.map(b => ({ id: b.id, name: b.name, public: b.public })));

  process.exit(0);
}

auditStorageAndTables();
