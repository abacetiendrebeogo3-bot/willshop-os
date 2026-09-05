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

async function main() {
  const projectRef = extractProjectRef(url);
  console.log('Project Ref:', projectRef);
  console.log('DB Password Present:', Boolean(dbPassword));
  console.log('DB URL Present:', Boolean(dbUrl));
}

main();
