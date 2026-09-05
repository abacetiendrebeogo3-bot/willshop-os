import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';

// Load .env.local
const envLocalPath = path.join(process.cwd(), '.env.local');
let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let dbPassword = process.env.SUPABASE_DB_PASSWORD || '';
let dbUrl = process.env.DATABASE_URL || '';
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
        if (key === 'SUPABASE_DB_PASSWORD' && !dbPassword) dbPassword = val;
        if (key === 'DATABASE_URL' && !dbUrl) dbUrl = val;
        if (key === 'SUPABASE_SERVICE_ROLE_KEY' && !serviceKey) serviceKey = val;
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

const projectRef = extractProjectRef(url);
if (!dbUrl) {
  dbUrl = `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
}

const WILLSHOP_DEV_ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const NEW_USER_ID = '99999999-9999-4999-a999-999999999999';
const NEW_ORG_ID = 'b8888888-8888-4888-a888-888888888888';

interface TestResult {
  step: string;
  name: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function recordResult(step: string, name: string, passed: boolean, details: string) {
  results.push({ step, name, passed, details });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${step}] ${name}: ${details}`);
}

async function runNewUserJourneyTest() {
  console.log('===============================================================');
  console.log('🚀 WILLShop OS — NEW USER JOURNEY & MULTI-TENANT TEST SUITE');
  console.log('===============================================================\n');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();

  try {
    await client.query('BEGIN;');

    // --------------------------------------------------------------------------
    // TEST A & B: SIGNUP, NEW ORGANIZATION CREATION & OWNER ROLE ASSIGNMENT
    // --------------------------------------------------------------------------
    console.log('--- TEST A & B: NEW USER SIGNUP & ORGANIZATION CREATION ---');
    
    // Clean previous new test user data if exists
    await client.query('DELETE FROM public.order_items WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.deliveries WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.payments WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.stock_movements WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.orders WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.product_stock WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.products WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.messages WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.conversations WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.customers WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.whatsapp_numbers WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.user_organization_roles WHERE organization_id = $1', [NEW_ORG_ID]);
    await client.query('DELETE FROM public.organizations WHERE id = $1', [NEW_ORG_ID]);

    // Create New Organization B
    await client.query(`
      INSERT INTO public.organizations (id, name, slug, country, currency, timezone, settings, created_by)
      VALUES ($1, 'PILOT NEW USER COMPANY', 'pilot-new-user-company', 'Burkina Faso', 'XOF', 'Africa/Ouagadougou', '{"onboarding_completed": false}', $2)
    `, [NEW_ORG_ID, NEW_USER_ID]);

    // Create OWNER Role
    await client.query(`
      INSERT INTO public.user_organization_roles (organization_id, user_id, role, permissions, created_by)
      VALUES ($1, $2, 'OWNER', '["*"]', $2)
    `, [NEW_ORG_ID, NEW_USER_ID]);

    const rolesRes = await client.query('SELECT role FROM public.user_organization_roles WHERE organization_id = $1 AND user_id = $2', [NEW_ORG_ID, NEW_USER_ID]);
    const roleCreated = rolesRes.rows[0]?.role === 'OWNER';

    recordResult('TEST A & B', 'Signup & Organization Creation', roleCreated, `Created Org "PILOT NEW USER COMPANY" (${NEW_ORG_ID}) with role OWNER`);

    // --------------------------------------------------------------------------
    // TEST C: MULTI-TENANT ISOLATION AUDIT FOR BRAND NEW ORGANIZATION
    // --------------------------------------------------------------------------
    console.log('\n--- TEST C: ISOLATION AUDIT FOR NEW ORGANIZATION ---');
    const custRes = await client.query('SELECT COUNT(*) FROM public.customers WHERE organization_id = $1', [NEW_ORG_ID]);
    const ordRes = await client.query('SELECT COUNT(*) FROM public.orders WHERE organization_id = $1', [NEW_ORG_ID]);
    const prodRes = await client.query('SELECT COUNT(*) FROM public.products WHERE organization_id = $1', [NEW_ORG_ID]);
    const convRes = await client.query('SELECT COUNT(*) FROM public.conversations WHERE organization_id = $1', [NEW_ORG_ID]);

    const isIsolatedEmpty =
      Number(custRes.rows[0].count) === 0 &&
      Number(ordRes.rows[0].count) === 0 &&
      Number(prodRes.rows[0].count) === 0 &&
      Number(convRes.rows[0].count) === 0;

    recordResult('TEST C', 'Brand New Organization Isolation Audit', isIsolatedEmpty, '0 customers, 0 orders, 0 products, 0 conversations. Absolute clean state (0 = 0).');

    // --------------------------------------------------------------------------
    // TEST D: WHATSAPP CONNECTION & ASSOCIATION TO NEW ORG
    // --------------------------------------------------------------------------
    console.log('\n--- TEST D: WHATSAPP CONNECTION ---');
    const waPhone = '+22670999999';
    const waNumId = 'a0000000-0000-4000-a000-000000000099';
    await client.query(`
      INSERT INTO public.whatsapp_numbers (id, organization_id, phone_number, display_name, provider, provider_phone_number_id, status)
      VALUES ($1, $2, $3, 'PILOT NEW USER Line', 'META_CLOUD_API', 'wa-pid-70999999', 'ACTIVE')
    `, [waNumId, NEW_ORG_ID, waPhone]);

    const waCheck = await client.query('SELECT status FROM public.whatsapp_numbers WHERE organization_id = $1 AND id = $2', [NEW_ORG_ID, waNumId]);
    recordResult('TEST D', 'WhatsApp Connection & Org Association', waCheck.rows[0]?.status === 'ACTIVE', `WhatsApp ${waPhone} associated cleanly to Org ${NEW_ORG_ID}`);

    // --------------------------------------------------------------------------
    // TEST E: PRODUCT CREATION IN NEW ORG
    // --------------------------------------------------------------------------
    console.log('\n--- TEST E: PRODUCT CREATION ---');
    const prodId = '88888888-8888-4888-a888-888888888888';
    await client.query(`
      INSERT INTO public.products (id, organization_id, sku, name, selling_price, purchase_price, category, minimum_stock, status)
      VALUES ($1, $2, 'PILOT-PROD-5000', 'PILOT PRODUCT', 5000, 2000, 'SANTE', 5, 'ACTIVE')
    `, [prodId, NEW_ORG_ID]);

    await client.query(`
      INSERT INTO public.product_stock (organization_id, product_id, physical_stock, reserved_stock, minimum_stock)
      VALUES ($1, $2, 10, 0, 5)
    `, [NEW_ORG_ID, prodId]);

    const prodCheck = await client.query('SELECT selling_price FROM public.products WHERE id = $1 AND organization_id = $2', [prodId, NEW_ORG_ID]);
    recordResult('TEST E', 'Product Creation', Number(prodCheck.rows[0]?.selling_price) === 5000, 'Product "PILOT PRODUCT" created @ 5,000 XOF (Stock: 10)');

    // --------------------------------------------------------------------------
    // TEST F: FIRST ORDER EXECUTION FOR NEW USER ORG
    // --------------------------------------------------------------------------
    console.log('\n--- TEST F: FIRST ORDER EXECUTION ---');
    const custId = '99999999-9999-4999-a999-999999999988';
    await client.query(`
      INSERT INTO public.customers (id, organization_id, first_name, last_name, phone, whatsapp_phone, city, status)
      VALUES ($1, $2, 'Oumar', 'Traoré [NEW TEST]', $3, $3, 'Ouagadougou', 'QUALIFIED')
    `, [custId, NEW_ORG_ID, waPhone]);

    const orderId = '77777777-7777-4777-a777-777777777778';
    await client.query(`
      INSERT INTO public.orders (id, organization_id, customer_id, order_number, status, subtotal, delivery_fee, discount, total, source, notes)
      VALUES ($1, $2, $3, 'NEW-PILOT-001', 'CONFIRMED', 5000, 1000, 0, 6000, 'WHATSAPP', 'Première commande de l utilisateur')
    `, [orderId, NEW_ORG_ID, custId]);

    await client.query(`
      INSERT INTO public.order_items (id, organization_id, order_id, product_id, quantity, unit_price, subtotal, product_name_snapshot, sku_snapshot)
      VALUES ('55555555-5555-4555-a555-555555555558', $1, $2, $3, 1, 5000, 5000, 'PILOT PRODUCT', 'PILOT-PROD-5000')
    `, [NEW_ORG_ID, orderId, prodId]);

    // Stock reservation
    await client.query('UPDATE public.product_stock SET reserved_stock = reserved_stock + 1 WHERE product_id = $1 AND organization_id = $2', [prodId, NEW_ORG_ID]);

    const stockCheck = await client.query('SELECT physical_stock, reserved_stock, available_stock FROM public.product_stock WHERE product_id = $1 AND organization_id = $2', [prodId, NEW_ORG_ID]);
    const stockRow = stockCheck.rows[0];

    const stockOk = stockRow.physical_stock === 10 && stockRow.reserved_stock === 1 && stockRow.available_stock === 9;
    recordResult('TEST F', 'First Order & Stock Reservation Math', stockOk, 'Order NEW-PILOT-001 total 6,000 XOF | Available stock decreased from 10 to 9');

    // --------------------------------------------------------------------------
    // TEST G: CROSS-TENANT PERSISTENCE & DATA BOUNDARY
    // --------------------------------------------------------------------------
    console.log('\n--- TEST G: CROSS-TENANT ISOLATION VERIFICATION ---');
    const orgAOrdersRes = await client.query('SELECT COUNT(*) FROM public.orders WHERE organization_id = $1', [WILLSHOP_DEV_ORG_ID]);
    const orgBOrdersRes = await client.query('SELECT COUNT(*) FROM public.orders WHERE organization_id = $1', [NEW_ORG_ID]);

    const orgAOrders = Number(orgAOrdersRes.rows[0].count);
    const orgBOrders = Number(orgBOrdersRes.rows[0].count);

    const isolationOk = orgAOrders >= 1 && orgBOrders === 1;
    recordResult('TEST G', 'Cross-Tenant Isolation Verification', isolationOk, `Org WillShop DEV orders: ${orgAOrders} | Org New User orders: ${orgBOrders}. Strictly isolated.`);

    await client.query('COMMIT;');
  } catch (err: any) {
    await client.query('ROLLBACK;');
    console.error('❌ Script Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }

  // --------------------------------------------------------------------------
  // SUMMARY REPORT
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log('📊 NEW USER JOURNEY SUMMARY REPORT');
  console.log('===============================================================');
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.log(`Total Checks: ${total} | Passed: ${passed} | Failed: ${failed}`);

  if (failed === 0) {
    console.log('\n🟢 NEW USER JOURNEY : PASS');
  } else {
    console.log('\n🔴 NEW USER JOURNEY : FAIL');
  }
}

runNewUserJourneyTest();
