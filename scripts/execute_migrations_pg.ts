import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

const envLocalPath = path.join(process.cwd(), '.env.local');
let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
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

async function runMigrations() {
  console.log('🚀 WILLSHOP OS — SEQUENTIAL 14 MIGRATIONS RUNNER (POSTGRES ENGINE)\n');

  const projectRef = extractProjectRef(url);
  if (!dbUrl) {
    if (!projectRef || !dbPassword) {
      console.error('❌ Error: Missing SUPABASE_DB_PASSWORD or DATABASE_URL in .env.local');
      console.log('\nVeuillez ajouter votre mot de passe de base de données dans .env.local :');
      console.log('SUPABASE_DB_PASSWORD=votre_mot_de_passe_database\n');
      process.exit(1);
    }
    // Construct Supabase direct connection string
    dbUrl = `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  console.log(`📡 Connecting to Supabase DEV Postgres Engine (Project Ref: ${projectRef})...`);
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

  console.log(`📋 Found ${files.length} SQL Migration files in /supabase/migrations/\n`);

  const client = await pool.connect();
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      console.log(`[${i + 1}/${files.length}] Applying Migration: ${file}...`);
      await client.query('BEGIN;');
      await client.query(sql);
      await client.query('COMMIT;');
      console.log(`   ✅ Migration ${file} applied successfully!\n`);
    }

    console.log('🎉 ALL 14 MIGRATIONS APPLIED SUCCESSFULLY TO SUPABASE DEV POSTGRES!');
  } catch (err: any) {
    await client.query('ROLLBACK;').catch(() => {});
    console.error('❌ Migration Execution Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
