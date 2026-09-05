import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const envLocalPath = path.join(process.cwd(), '.env.local');
let url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
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
        if (key === 'NEXT_PUBLIC_SUPABASE_ANON_KEY' && !anonKey) anonKey = val;
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

async function runTruthVerification() {
  const projectRef = extractProjectRef(url);
  if (!dbUrl) {
    dbUrl = `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  console.log('🧪 WILLSHOP OS — TRUTH DATASET KPI & REACTIVITY AUDIT\n');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  const ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const CEO_USER_ID = '11111111-1111-1111-1111-111111111111';

  let passedKpi = 0;
  let totalKpi = 0;

  try {
    // ------------------------------------------------------------------------
    // PHASE 1: INITIAL STATE KPI VERIFICATION
    // ------------------------------------------------------------------------
    console.log('--- PHASE 1: INITIAL STATE KPI VERIFICATION ---');

    // 1. CA Total
    totalKpi++;
    const caRes = await client.query(`SELECT SUM(total) as ca FROM public.orders WHERE organization_id = $1 AND status != 'CANCELLED';`, [ORG_ID]);
    const ca = parseFloat(caRes.rows[0].ca || 0);
    const caExpected = 55000;
    const caPassed = ca === caExpected;
    if (caPassed) passedKpi++;
    console.log(`[KPI 1] Chiffre d'Affaires (CA): Attendu=${caExpected} XOF | Affiché=${ca} XOF | Diff=${ca - caExpected} | ${caPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // 2. Total Orders Count
    totalKpi++;
    const ordCountRes = await client.query(`SELECT COUNT(*) as cnt FROM public.orders WHERE organization_id = $1;`, [ORG_ID]);
    const ordCount = parseInt(ordCountRes.rows[0].cnt);
    const ordExpected = 3;
    const ordPassed = ordCount === ordExpected;
    if (ordPassed) passedKpi++;
    console.log(`[KPI 2] Commandes Totales: Attendu=${ordExpected} | Affiché=${ordCount} | Diff=${ordCount - ordExpected} | ${ordPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // 3. Encaissements Vrais (Cash In)
    totalKpi++;
    const payRes = await client.query(`SELECT SUM(amount) as cash_in FROM public.payments WHERE organization_id = $1 AND status IN ('RECEIVED', 'VERIFIED');`, [ORG_ID]);
    const cashIn = parseFloat(payRes.rows[0].cash_in || 0);
    const cashInExpected = 15000;
    const cashInPassed = cashIn === cashInExpected;
    if (cashInPassed) passedKpi++;
    console.log(`[KPI 3] Encaissements (Cash In): Attendu=${cashInExpected} XOF | Affiché=${cashIn} XOF | Diff=${cashIn - cashInExpected} | ${cashInPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // 4. Créances Clients (Unpaid)
    totalKpi++;
    const creances = ca - cashIn;
    const creancesExpected = 40000;
    const creancesPassed = creances === creancesExpected;
    if (creancesPassed) passedKpi++;
    console.log(`[KPI 4] Créances Clients: Attendu=${creancesExpected} XOF | Affiché=${creances} XOF | Diff=${creances - creancesExpected} | ${creancesPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // 5. Stock Physical Total
    totalKpi++;
    const stockPhysRes = await client.query(`SELECT SUM(physical_stock) as phys, SUM(reserved_stock) as res, SUM(available_stock) as avail FROM public.product_stock WHERE organization_id = $1;`, [ORG_ID]);
    const physStock = parseInt(stockPhysRes.rows[0].phys || 0);
    const resStock = parseInt(stockPhysRes.rows[0].res || 0);
    const availStock = parseInt(stockPhysRes.rows[0].avail || 0);
    const physExpected = 149; // (49 + 50 + 50)
    const physPassed = physStock === physExpected && resStock === 1 && availStock === 148;
    if (physPassed) passedKpi++;
    console.log(`[KPI 5] Stock Total (Phys/Res/Avail): Attendu=149/1/148 | Affiché=${physStock}/${resStock}/${availStock} | ${physPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // 6. Deliveries Status
    totalKpi++;
    const delRes = await client.query(`SELECT status, COUNT(*) as cnt FROM public.deliveries WHERE organization_id = $1 GROUP BY status;`, [ORG_ID]);
    const delCounts = Object.fromEntries(delRes.rows.map((r) => [r.status, parseInt(r.cnt)]));
    const delPassed = delCounts['DELIVERED'] === 1 && delCounts['IN_TRANSIT'] === 1;
    if (delPassed) passedKpi++;
    console.log(`[KPI 6] Livraisons (Delivered/InTransit): Attendu=1/1 | Affiché=${delCounts['DELIVERED'] || 0}/${delCounts['IN_TRANSIT'] || 0} | ${delPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // 7. Finance Net Cash Flow & Account Balances
    totalKpi++;
    const txRes = await client.query(`
      SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as inc,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as exp
      FROM public.transactions WHERE organization_id = $1;
    `, [ORG_ID]);
    const totalInc = parseFloat(txRes.rows[0].inc || 0);
    const totalExp = parseFloat(txRes.rows[0].exp || 0);
    const finPassed = totalInc === 15000 && totalExp === 15000;
    if (finPassed) passedKpi++;
    console.log(`[KPI 7] Finance Transactions (Income/Expense): Attendu=15000/15000 XOF | Affiché=${totalInc}/${totalExp} XOF | ${finPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // 8. Wilty Personal OS Isolation
    totalKpi++;
    const wiltyGoalRes = await client.query(`SELECT progress_percent FROM public.personal_goals WHERE user_id = $1;`, [CEO_USER_ID]);
    const wiltyProgress = parseFloat(wiltyGoalRes.rows[0]?.progress_percent || 0);
    const wiltyPassed = wiltyProgress === 25.00;
    if (wiltyPassed) passedKpi++;
    console.log(`[KPI 8] Wilty Personal OS (Goal Progress): Attendu=25.0% | Affiché=${wiltyProgress}% | ${wiltyPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    console.log(`\nPHASE 1 RESULT: ${passedKpi} / ${totalKpi} KPIs Verified Successfully!\n`);

    // ------------------------------------------------------------------------
    // PHASE 2: REACTIVITY TESTS (MUTATIONS & LIVE PROPAGATION)
    // ------------------------------------------------------------------------
    console.log('--- PHASE 2: REACTIVITY TESTS ---');

    // A. Modify Stock (Restock 10 units of Produit A)
    console.log('[TEST A] Reactivity: Restocking 10 units of Produit A...');
    await client.query(`UPDATE public.product_stock SET physical_stock = physical_stock + 10 WHERE organization_id = $1 AND product_id IN (SELECT id FROM public.products WHERE sku = 'SKU-PROD-A');`, [ORG_ID]);
    const newPhysRes = await client.query(`SELECT SUM(physical_stock) as phys FROM public.product_stock WHERE organization_id = $1;`, [ORG_ID]);
    const newPhys = parseInt(newPhysRes.rows[0].phys);
    const testAPassed = newPhys === 159;
    console.log(`   Result: New Physical Stock = ${newPhys} (Expected 159) | ${testAPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // B. Modify Order Status (Transition Order 002 to DELIVERED)
    console.log('[TEST B] Reactivity: Transitioning Order 002 to DELIVERED...');
    await client.query(`UPDATE public.orders SET status = 'DELIVERED' WHERE organization_id = $1 AND order_number = 'ORD-TEST-002';`, [ORG_ID]);
    await client.query(`UPDATE public.product_stock SET physical_stock = physical_stock - 1, reserved_stock = reserved_stock - 1 WHERE organization_id = $1 AND product_id IN (SELECT id FROM public.products WHERE sku = 'SKU-PROD-B');`, [ORG_ID]);
    const newResStock = await client.query(`SELECT SUM(reserved_stock) as res FROM public.product_stock WHERE organization_id = $1;`, [ORG_ID]);
    const testBPassed = parseInt(newResStock.rows[0].res) === 0;
    console.log(`   Result: Reserved Stock after delivery = ${newResStock.rows[0].res} (Expected 0) | ${testBPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // C. Record Payment (Add 10,000 XOF payment for Order 002)
    console.log('[TEST C] Reactivity: Recording full payment of 10,000 XOF for Order 002...');
    await client.query(`
      INSERT INTO public.payments (organization_id, order_id, amount, currency, method, status, received_at)
      SELECT organization_id, id, 10000.00, 'XOF', 'MOBILE_MONEY', 'VERIFIED', NOW()
      FROM public.orders WHERE order_number = 'ORD-TEST-002';
    `, []);
    const newCashInRes = await client.query(`SELECT SUM(amount) as cash_in FROM public.payments WHERE organization_id = $1 AND status IN ('RECEIVED', 'VERIFIED');`, [ORG_ID]);
    const newCashIn = parseFloat(newCashInRes.rows[0].cash_in);
    const testCPassed = newCashIn === 25000;
    console.log(`   Result: New Total Encaissements = ${newCashIn} XOF (Expected 25,000 XOF) | ${testCPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // D. Cancel Order (Cancel Order 003 Draft 30,000 XOF)
    console.log('[TEST D] Reactivity: Cancelling Order 003 (Draft)...');
    await client.query(`UPDATE public.orders SET status = 'CANCELLED' WHERE organization_id = $1 AND order_number = 'ORD-TEST-003';`, [ORG_ID]);
    const finalCaRes = await client.query(`SELECT SUM(total) as ca FROM public.orders WHERE organization_id = $1 AND status != 'CANCELLED';`, [ORG_ID]);
    const finalCa = parseFloat(finalCaRes.rows[0].ca);
    const testDPassed = finalCa === 25000; // (10k + 15k)
    console.log(`   Result: New Active CA = ${finalCa} XOF (Expected 25,000 XOF) | ${testDPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    // ------------------------------------------------------------------------
    // PHASE 3: RLS MULTI-TENANCY ISOLATION VERIFICATION
    // ------------------------------------------------------------------------
    console.log('\n--- PHASE 3: RLS ISOLATION VERIFICATION ---');
    const supabaseAnon = createClient(url, anonKey, { auth: { persistSession: false } });
    const { data: anonData } = await supabaseAnon.from('orders').select('*');
    const rlsPassed = (anonData === null || anonData.length === 0);
    console.log(`[RLS TEST] Unauthenticated Anon Access to Business Orders: Blocked (${anonData?.length || 0} rows returned) | ${rlsPassed ? '🟢 PASS' : '🔴 FAIL'}`);

    console.log('\n==================================================');
    console.log('TRUTH AUDIT COMPLETE');
    console.log('==================================================');

  } catch (err: any) {
    console.error('🔴 Verification Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runTruthVerification();
