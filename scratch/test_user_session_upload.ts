import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';

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

const dbPassword = process.env.SUPABASE_DB_PASSWORD || '';
const ref = 'stbzctncpvgqdpybcrmg';

const pgClient = new Client({
  host: `db.${ref}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: dbPassword,
  ssl: { rejectUnauthorized: false }
});

async function inspectUsersAndTables() {
  await pgClient.connect();

  console.log('--- 1. AUTH USERS ---');
  const uRes = await pgClient.query(`SELECT id, email, created_at FROM auth.users LIMIT 10`);
  console.log('Users:', uRes.rows);

  console.log('\n--- 2. USER ORGANIZATION ROLES ---');
  const rRes = await pgClient.query(`SELECT user_id, organization_id, role FROM public.user_organization_roles LIMIT 10`);
  console.log('Roles:', rRes.rows);

  console.log('\n--- 3. PRODUCTS TABLE SCHEMA & FKs ---');
  const pRes = await pgClient.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'products'
  `);
  console.log('Products columns:', pRes.rows);

  console.log('\n--- 4. PRODUCT_STOCK TABLE SCHEMA ---');
  const psRes = await pgClient.query(`
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'product_stock'
  `);
  console.log('Product_stock columns:', psRes.rows);

  await pgClient.end();
  process.exit(0);
}

inspectUsersAndTables();
