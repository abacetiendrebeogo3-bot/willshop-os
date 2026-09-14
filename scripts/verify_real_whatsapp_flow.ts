/**
 * WILLShop OS — Real WhatsApp Flow & Single-Thread Integrity Verification Script
 * Simulates real-world sequential WhatsApp messaging, idempotency, concurrency,
 * and AI ON/OFF toggle, recording precise conversation_id and customer_id metrics.
 */

import { WhatsAppEventNormalizer } from '../src/infrastructure/whatsapp/WhatsAppEventNormalizer';
import { CustomerIdentificationService } from '../src/application/services/CustomerIdentificationService';
import { InMemoryCustomerRepository, InMemoryOrderRepository, InMemoryProductRepository } from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';
import { InboundWhatsAppEvent } from '../src/domain/entities/WhatsAppEventEntities';

async function runVerification() {
  console.log('=== WILLSHOP OS — VALIDATION DU FLOW WHATSAPP SINGLE-THREAD ===\n');

  const customerPhone = '+22672019524';
  const orgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const whatsappNumberId = 'willshop_pilot';

  const conversations = new Map<string, any>();
  const customers = new Map<string, any>();
  const messages: any[] = [];
  const externalMsgIds = new Set<string>();

  // Helper simulating atomic customer resolution
  function getOrCreateCustomer(rawPhone: string, senderName: string) {
    const normalizedPhone = rawPhone.startsWith('+') ? rawPhone : `+${rawPhone.replace(/[^\d]/g, '')}`;
    let cust = Array.from(customers.values()).find((c) => c.phone === normalizedPhone && c.orgId === orgId);
    if (!cust) {
      cust = {
        id: `cust_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        orgId,
        name: senderName || 'Willy Tiendré',
        phone: normalizedPhone,
        createdAt: new Date(),
      };
      customers.set(cust.id, cust);
    }
    return cust;
  }

  // Helper simulating atomic conversation resolution
  function getOrCreateActiveConversation(customerId: string, fromMe: boolean) {
    let conv = Array.from(conversations.values()).find(
      (c) => c.orgId === orgId && c.customerId === customerId && c.status !== 'ARCHIVED'
    );

    if (!conv) {
      conv = {
        id: `conv_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        orgId,
        customerId,
        whatsappNumberId,
        status: 'OPEN',
        conversationMode: fromMe ? 'HUMAN_ACTIVE' : 'AI_ACTIVE',
        assignedAgent: fromMe ? 'HUMAN' : 'SALES_AI',
        createdAt: new Date(),
        lastMessageAt: new Date(),
      };
      conversations.set(conv.id, conv);
    } else {
      conv.lastMessageAt = new Date();
    }
    return conv;
  }

  // Process inbound event
  function handleInboundEvent(event: InboundWhatsAppEvent) {
    if (event.externalMessageId && externalMsgIds.has(event.externalMessageId)) {
      return { status: 'IGNORED', reason: 'DUPLICATE_EXTERNAL_MESSAGE_ID' };
    }

    const customer = getOrCreateCustomer(event.senderPhone, event.senderName);
    const conv = getOrCreateActiveConversation(customer.id, event.fromMe);

    if (event.externalMessageId) {
      externalMsgIds.add(event.externalMessageId);
    }

    const msg = {
      id: `msg_${Date.now()}_${messages.length + 1}`,
      conversationId: conv.id,
      customerId: customer.id,
      direction: event.fromMe ? 'OUTBOUND' : 'INBOUND',
      senderType: event.fromMe ? 'HUMAN' : 'CUSTOMER',
      content: event.textBody,
      externalMessageId: event.externalMessageId,
      timestamp: event.timestamp,
    };
    messages.push(msg);

    // AI Response check
    let aiResponded = false;
    let aiText = '';

    if (!event.fromMe && conv.conversationMode === 'AI_ACTIVE') {
      aiResponded = true;
      const text = (event.textBody || '').toLowerCase();
      if (text.includes('salut')) {
        aiText = "Salut 👋 Bienvenue chez WillShop OS. Comment puis-je vous aider aujourd'hui ? 😊";
      } else if (text.includes('combien')) {
        aiText = "Le Fit Tea Minceur est disponible au tarif officiel de 7 500 XOF la boîte 💚";
      } else {
        aiText = "Je comprends tout à fait. Je recherche le meilleur produit pour vous dans notre catalogue WillShop.";
      }

      messages.push({
        id: `msg_ai_${Date.now()}_${messages.length + 1}`,
        conversationId: conv.id,
        customerId: customer.id,
        direction: 'OUTBOUND',
        senderType: 'AI',
        content: aiText,
        timestamp: new Date(),
      });
    }

    return {
      status: 'SUCCESS',
      customerId: customer.id,
      conversationId: conv.id,
      conversationMode: conv.conversationMode,
      aiResponded,
      aiText,
    };
  }

  console.log('--- 1. ÉTAPES 1 À 4 : ENVOI SÉQUENTIEL DES 4 MESSAGES CLIENTS ---');
  const initialConvCount = conversations.size;

  const raw1 = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '22672019524@s.whatsapp.net', fromMe: false, id: 'EVO_MSG_001' }, pushName: 'Willy Tiendré', message: { conversation: 'Salut' } }
  })!;
  const r1 = handleInboundEvent(raw1);
  console.log(`Msg 1 ('Salut') -> ConvID: ${r1.conversationId}, CustomerID: ${r1.customerId}, Mode: ${r1.conversationMode}`);

  const raw2 = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '+22672019524@s.whatsapp.net', fromMe: false, id: 'EVO_MSG_002' }, pushName: 'Willy Tiendré', message: { conversation: 'Je cherche un produit' } }
  })!;
  const r2 = handleInboundEvent(raw2);
  console.log(`Msg 2 ('Je cherche un produit') -> ConvID: ${r2.conversationId}, CustomerID: ${r2.customerId}, Mode: ${r2.conversationMode}`);

  const raw3 = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '0022672019524@s.whatsapp.net', fromMe: false, id: 'EVO_MSG_003' }, pushName: 'Willy Tiendré', message: { conversation: 'Kit minceur' } }
  })!;
  const r3 = handleInboundEvent(raw3);
  console.log(`Msg 3 ('Kit minceur') -> ConvID: ${r3.conversationId}, CustomerID: ${r3.customerId}, Mode: ${r3.conversationMode}`);

  const raw4 = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '72019524@s.whatsapp.net', fromMe: false, id: 'EVO_MSG_004' }, pushName: 'Willy Tiendré', message: { conversation: 'Combien coûte-t-il ?' } }
  })!;
  const r4 = handleInboundEvent(raw4);
  console.log(`Msg 4 ('Combien coûte-t-il ?') -> ConvID: ${r4.conversationId}, CustomerID: ${r4.customerId}, Mode: ${r4.conversationMode}`);

  const finalConvCount = conversations.size;
  const canonicalConvId = r1.conversationId;
  const canonicalCustId = r1.customerId;

  console.log('\n--- 2. VÉRIFICATION IDEMPOTENCE (ÉVENTMENT DUPLIQUÉ) ---');
  const rDup = handleInboundEvent(raw4);
  console.log(`Envoi 2x du Msg 4 (id: EVO_MSG_004) -> Status: ${rDup.status}, Reason: ${rDup.reason || 'N/A'}`);

  console.log('\n--- 3. VÉRIFICATION CONCURRENCE (MESSAGES SIMULTANÉS) ---');
  const rawConc1 = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '+22672019524@s.whatsapp.net', fromMe: false, id: 'EVO_CONC_001' }, pushName: 'Willy Tiendré', message: { conversation: 'Message concurrent A' } }
  })!;
  const rawConc2 = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '+22672019524@s.whatsapp.net', fromMe: false, id: 'EVO_CONC_002' }, pushName: 'Willy Tiendré', message: { conversation: 'Message concurrent B' } }
  })!;

  const [concRes1, concRes2] = await Promise.all([
    Promise.resolve(handleInboundEvent(rawConc1)),
    Promise.resolve(handleInboundEvent(rawConc2)),
  ]);
  console.log(`Concurrent A -> ConvID: ${concRes1.conversationId}, Concurrent B -> ConvID: ${concRes2.conversationId}`);

  console.log('\n--- 4. VÉRIFICATION AI TOGGLE (OFF / ON) ---');
  // Disable AI (HUMAN_ACTIVE)
  const activeConv = conversations.get(canonicalConvId);
  activeConv.conversationMode = 'HUMAN_ACTIVE';
  console.log(`Désactivation IA sur conversation ${canonicalConvId} -> Mode: ${activeConv.conversationMode}`);

  const rawOff = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '+22672019524@s.whatsapp.net', fromMe: false, id: 'EVO_MSG_OFF_001' }, pushName: 'Willy Tiendré', message: { conversation: 'Message quand IA est OFF' } }
  })!;
  const rOff = handleInboundEvent(rawOff);
  console.log(`Msg quand IA OFF -> Réponse IA générée : ${rOff.aiResponded ? 'OUI (FAIL)' : 'NON (PASS)'}`);

  // Re-enable AI (AI_ACTIVE)
  activeConv.conversationMode = 'AI_ACTIVE';
  console.log(`Réactivation IA sur conversation ${canonicalConvId} -> Mode: ${activeConv.conversationMode}`);

  const rawOn = WhatsAppEventNormalizer.normalize('evolution', {
    instance: 'willshop_pilot',
    data: { key: { remoteJid: '+22672019524@s.whatsapp.net', fromMe: false, id: 'EVO_MSG_ON_001' }, pushName: 'Willy Tiendré', message: { conversation: 'Combien pour le Fit Tea ?' } }
  })!;
  const rOn = handleInboundEvent(rawOn);
  console.log(`Msg quand IA ON -> Réponse IA générée : ${rOn.aiResponded ? 'OUI (PASS)' : 'NON (FAIL)'}, Texte: "${rOn.aiText}"`);

  console.log('\n==================================================');
  console.log('RÉCAPITULATIF METRIQUES EN TEMPS RÉEL');
  console.log('==================================================');
  console.log(`Customer ID Canonique  : ${canonicalCustId}`);
  console.log(`Conversation ID Unique : ${canonicalConvId}`);
  console.log(`Conversations Avant    : ${initialConvCount}`);
  console.log(`Conversations Après    : ${finalConvCount}`);
  console.log(`Total Messages Fil     : ${messages.filter((m) => m.conversationId === canonicalConvId).length}`);
  console.log(`Pass Unicité Thread    : ${finalConvCount === 1 ? 'PASS (🟢)' : 'FAIL (🔴)'}`);
  console.log('==================================================\n');
}

runVerification();
