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

async function verifyBusinessTruth() {
  const projectRef = extractProjectRef(url);
  if (!dbUrl) {
    dbUrl = `postgres://postgres:${encodeURIComponent(dbPassword)}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  console.log('🧪 WILLSHOP OS — STRICT BUSINESS TRUTH AUDIT\n');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  const client = await pool.connect();
  const ORG_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  try {
    // 1. Trésorerie
    const accRes = await client.query(`SELECT SUM(opening_balance) as base FROM public.financial_accounts WHERE organization_id = $1;`, [ORG_ID]);
    const txRes = await client.query(`
      SELECT 
        SUM(CASE WHEN type = 'INCOME' THEN amount ELSE 0 END) as inc,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as exp
      FROM public.transactions WHERE organization_id = $1;
    `, [ORG_ID]);
    const treasuryCash = (parseFloat(accRes.rows[0].base || 0) + parseFloat(txRes.rows[0].inc || 0) - parseFloat(txRes.rows[0].exp || 0));

    // 2. CA Aujourd'hui (revenueToday)
    const caTodayRes = await client.query(`
      SELECT SUM(total) as ca_today, COUNT(*) as cnt_today 
      FROM public.orders 
      WHERE organization_id = $1 
        AND status NOT IN ('CANCELLED', 'FAILED', 'RETURNED')
        AND created_at >= CURRENT_DATE;
    `, [ORG_ID]);
    const revenueToday = parseFloat(caTodayRes.rows[0].ca_today || 0);
    const ordersTodayCount = parseInt(caTodayRes.rows[0].cnt_today || 0);

    // 3. CA 7 Jours (revenue7Days)
    const ca7dRes = await client.query(`
      SELECT SUM(total) as ca_7d, COUNT(*) as cnt_7d 
      FROM public.orders 
      WHERE organization_id = $1 
        AND status NOT IN ('CANCELLED', 'FAILED', 'RETURNED')
        AND created_at >= (NOW() - INTERVAL '7 days');
    `, [ORG_ID]);
    const revenue7Days = parseFloat(ca7dRes.rows[0].ca_7d || 0);
    const orders7DaysCount = parseInt(ca7dRes.rows[0].cnt_7d || 0);

    // 4. Marge Brute 7 Jours (COGS 7D)
    const cogs7dRes = await client.query(`
      SELECT SUM(oi.quantity * p.purchase_price) as cogs_7d
      FROM public.order_items oi
      JOIN public.orders o ON o.id = oi.order_id
      JOIN public.products p ON p.id = oi.product_id
      WHERE o.organization_id = $1
        AND o.status NOT IN ('CANCELLED', 'FAILED', 'RETURNED')
        AND o.created_at >= (NOW() - INTERVAL '7 days');
    `, [ORG_ID]);
    const cogs7Days = parseFloat(cogs7dRes.rows[0].cogs_7d || 0);
    const grossProfit7Days = revenue7Days - cogs7Days;
    const grossMarginPercent = revenue7Days > 0 ? Math.round((grossProfit7Days / revenue7Days) * 1000) / 10 : 0;

    // 5. Créances Clients Per Order
    const recRes = await client.query(`
      SELECT o.id, o.total,
             COALESCE(SUM(p.amount) FILTER (WHERE p.status IN ('RECEIVED', 'VERIFIED')), 0) as paid
      FROM public.orders o
      LEFT JOIN public.payments p ON p.order_id = o.id
      WHERE o.organization_id = $1
        AND o.status NOT IN ('CANCELLED', 'FAILED')
      GROUP BY o.id, o.total;
    `, [ORG_ID]);
    const customerReceivablesTotal = recRes.rows.reduce((sum, r) => sum + Math.max(0, parseFloat(r.total) - parseFloat(r.paid)), 0);

    // 6. Stock Critique & Ruptures (Available Stock = Physical - Reserved)
    const stockRes = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE (physical_stock - reserved_stock) <= minimum_stock AND (physical_stock - reserved_stock) > 0) as low_stock,
        COUNT(*) FILTER (WHERE (physical_stock - reserved_stock) <= 0) as out_of_stock
      FROM public.product_stock
      WHERE organization_id = $1;
    `, [ORG_ID]);
    const lowStockProductsCount = parseInt(stockRes.rows[0].low_stock || 0);
    const outOfStockProductsCount = parseInt(stockRes.rows[0].out_of_stock || 0);

    // 7. Livraisons Breakdown & Success Rate
    const delRes = await client.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'DELIVERED') as delivered,
        COUNT(*) FILTER (WHERE status IN ('ASSIGNED', 'PICKED_UP', 'IN_TRANSIT')) as in_transit,
        COUNT(*) FILTER (WHERE status IN ('FAILED', 'RESCHEDULED', 'RETURNED')) as failed
      FROM public.deliveries
      WHERE organization_id = $1;
    `, [ORG_ID]);
    const delTotal = parseInt(delRes.rows[0].total || 0);
    const delDelivered = parseInt(delRes.rows[0].delivered || 0);
    const delInTransit = parseInt(delRes.rows[0].in_transit || 0);
    const delFailed = parseInt(delRes.rows[0].failed || 0);
    const deliverySuccessRate = delTotal > 0 ? Math.round((delDelivered / delTotal) * 100) : 0;

    console.log('--- 12 BUSINESS METRICS SQL MATRIX ---');
    console.log(`1. Trésorerie Cash: ${treasuryCash} XOF`);
    console.log(`2. CA Aujourd'hui: ${revenueToday} XOF (${ordersTodayCount} commandes)`);
    console.log(`3. CA 7 Jours: ${revenue7Days} XOF (${orders7DaysCount} commandes)`);
    console.log(`4. Marge Brute 7D: ${grossProfit7Days} XOF (COGS: ${cogs7Days} XOF)`);
    console.log(`5. Marge Brute %: ${grossMarginPercent}%`);
    console.log(`6. Commandes Aujourd'hui: ${ordersTodayCount}`);
    console.log(`7. Commandes En Attente: ${orders7DaysCount - delDelivered}`);
    console.log(`8. Créances Clients: ${customerReceivablesTotal} XOF`);
    console.log(`9. Stock Critique: ${lowStockProductsCount} produits`);
    console.log(`10. Ruptures de Stock: ${outOfStockProductsCount} produits`);
    console.log(`11. Livraisons (Total/Delivered/Transit/Failed): ${delTotal}/${delDelivered}/${delInTransit}/${delFailed}`);
    console.log(`12. Taux Réussite Livraisons: ${deliverySuccessRate}%`);

  } catch (err: any) {
    console.error('🔴 Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

verifyBusinessTruth();
