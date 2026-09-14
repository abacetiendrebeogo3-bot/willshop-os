/**
 * WILLShop OS — Historical Conversation Deduplication & Active Thread Audit
 * Inspects all conversations for customer +22672019524 and merges historical duplicates cleanly.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Parse .env.local if present
try {
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
        if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
        if (!process.env[key]) process.env[key] = value.trim();
      }
    });
  }
} catch (err) {
  // Ignore
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://stbzctncpvgqdpybcrmg.supabase.co';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('=== AUDIT DES CONVERSATIONS WHATSAPP (+22672019524) ===\n');

  // 1. Fetch all customer rows for +22672019524
  const { data: customers } = await supabase
    .from('customers')
    .select('id, first_name, last_name, phone, created_at')
    .or('phone.eq.+22672019524,phone.eq.22672019524,phone.eq.72019524');

  console.log(`[CUSTOMERS FOUND]: ${customers?.length || 0}`);
  customers?.forEach((c) => console.log(` - Customer ID: ${c.id} | Phone: ${c.phone} | Created: ${c.created_at}`));

  const customerIds = customers?.map((c) => c.id) || [];

  if (customerIds.length === 0) {
    console.log('Aucun client trouvé pour ce numéro.');
    return;
  }

  // 2. Fetch all conversations for these customer IDs
  const { data: conversations } = await supabase
    .from('conversations')
    .select('id, organization_id, customer_id, whatsapp_number_id, status, conversation_mode, created_at, last_message_at')
    .in('customer_id', customerIds)
    .order('created_at', { ascending: true });

  console.log(`\n[TOTAL CONVERSATIONS HISTORIQUES]: ${conversations?.length || 0}`);
  conversations?.forEach((conv, idx) => {
    console.log(` [${idx + 1}] ID: ${conv.id} | Status: ${conv.status} | Mode: ${conv.conversation_mode} | Created: ${conv.created_at}`);
  });

  const activeConvs = conversations?.filter((c) => c.status !== 'ARCHIVED') || [];
  console.log(`\n[CONVERSATIONS ACTIVES]: ${activeConvs.length}`);

  if (activeConvs.length > 1) {
    console.log('\n[FUSION HISTORIQUE]: Plus d\'une conversation active détectée. Exécution de la consolidation...');

    const canonicalConv = activeConvs[0];
    const duplicateConvs = activeConvs.slice(1);

    for (const dup of duplicateConvs) {
      // Reassign all messages from duplicate conversation to canonical conversation
      const { data: movedMsgs } = await supabase
        .from('messages')
        .update({ conversation_id: canonicalConv.id })
        .eq('conversation_id', dup.id)
        .select();

      console.log(` - Reassigned ${movedMsgs?.length || 0} messages from duplicate conversation ${dup.id} -> canonical ${canonicalConv.id}`);

      // Mark duplicate conversation as ARCHIVED
      await supabase
        .from('conversations')
        .update({ status: 'ARCHIVED', metadata: { archived_reason: 'MERGED_HISTORICAL_DUPLICATE', canonical_conversation_id: canonicalConv.id } })
        .eq('id', dup.id);

      console.log(` - Marked duplicate conversation ${dup.id} as ARCHIVED.`);
    }

    console.log('\n[CONSOLIDATION TERMINÉE EN SUCCÈS] 🟢');
  } else {
    console.log('\n[THREAD UNIQUE CONSERVÉ]: 1 seule conversation active présente. Aucune duplication.');
  }

  // 3. Verify final state
  const { data: finalActive } = await supabase
    .from('conversations')
    .select('id, status, created_at')
    .in('customer_id', customerIds)
    .neq('status', 'ARCHIVED');

  console.log(`\n==================================================`);
  console.log(`RÉSULTAT AUDIT FINAL :`);
  console.log(`Conversations actives finales : ${finalActive?.length || 0}`);
  console.log(`Canonical Conversation ID    : ${finalActive?.[0]?.id || 'N/A'}`);
  console.log(`==================================================`);
}

main().catch(console.error);
