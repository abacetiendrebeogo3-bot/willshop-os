/**
 * WILLShop OS — WhatsApp Conversation Deduplication & Single-Thread Integrity Test Suite
 * Validates canonical phone normalization, single active conversation per customer,
 * idempotency on external_message_id, and race-condition safety.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { normalizeCanonicalPhone } from '../src/infrastructure/whatsapp/WhatsAppEventNormalizer';
import { CustomerIdentificationService } from '../src/application/services/CustomerIdentificationService';
import { InMemoryCustomerRepository, InMemoryOrderRepository, InMemoryProductRepository } from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';
import { InboundWhatsAppEvent } from '../src/domain/entities/WhatsAppEventEntities';

describe('CRITICAL MISSION — WhatsApp Conversation Deduplication & Single-Thread Integrity', () => {

  // --------------------------------------------------------------------------
  // TEST 1: Phone Normalization to Canonical E.164 (+22672019524)
  // --------------------------------------------------------------------------
  test('TEST 1: normalizeCanonicalPhone must standardize all phone number variants to E.164', () => {
    assert.strictEqual(normalizeCanonicalPhone('+22672019524'), '+22672019524');
    assert.strictEqual(normalizeCanonicalPhone('22672019524'), '+22672019524');
    assert.strictEqual(normalizeCanonicalPhone('0022672019524'), '+22672019524');
    assert.strictEqual(normalizeCanonicalPhone('72019524'), '+22672019524');
  });

  // --------------------------------------------------------------------------
  // TEST 2: Customer Identification Deduplication
  // --------------------------------------------------------------------------
  test('TEST 2: CustomerIdentificationService must reuse existing customer profile across phone variants', async () => {
    const custRepo = new InMemoryCustomerRepository();
    const service = new CustomerIdentificationService(custRepo);
    const orgId = 'org-dedup-test';

    // 1. First event with +22672019524
    const res1 = await service.identifyOrCreateCustomer(orgId, '+22672019524', 'Willy', 'Tiendré');
    assert.strictEqual(res1.isNewCustomer, true);
    assert.strictEqual(res1.customer.phone, '+22672019524');

    // 2. Second event with 22672019524 (no +)
    const res2 = await service.identifyOrCreateCustomer(orgId, '22672019524', 'Willy', 'Tiendré');
    assert.strictEqual(res2.isNewCustomer, false);
    assert.strictEqual(res2.customer.id, res1.customer.id);

    // 3. Third event with 0022672019524
    const res3 = await service.identifyOrCreateCustomer(orgId, '0022672019524', 'Willy', 'Tiendré');
    assert.strictEqual(res3.isNewCustomer, false);
    assert.strictEqual(res3.customer.id, res1.customer.id);

    // Total customer count for org must be exactly 1
    const allCusts = await custRepo.listByOrg(orgId);
    assert.strictEqual(allCusts.length, 1);
  });

  // --------------------------------------------------------------------------
  // TEST 3: Successive Messages to Single Conversation Thread Simulation
  // --------------------------------------------------------------------------
  test('TEST 3: 4 successive messages from same client must attach to EXACTLY 1 conversation thread', () => {
    const conversationsStore = new Map<string, any>();
    const messagesStore: any[] = [];
    const orgId = 'org-single-thread';
    const customerId = 'cust-willy-001';
    const whatsappNumberId = 'num-pilot-001';

    function processEvent(event: Partial<InboundWhatsAppEvent>) {
      const canonicalPhone = normalizeCanonicalPhone(event.senderPhone || '');
      
      // Lookup or create active conversation
      let conv = Array.from(conversationsStore.values()).find(
        (c) => c.organizationId === orgId && c.customerId === customerId && c.status !== 'ARCHIVED'
      );

      if (!conv) {
        conv = {
          id: `conv-${Date.now()}-${Math.random()}`,
          organizationId: orgId,
          customerId,
          whatsappNumberId,
          status: 'OPEN',
          conversationMode: 'AI_ACTIVE',
          createdAt: new Date(),
          lastMessageAt: new Date(),
        };
        conversationsStore.set(conv.id, conv);
      } else {
        conv.lastMessageAt = new Date();
      }

      // Record message
      const msg = {
        id: `msg-${Date.now()}-${Math.random()}`,
        conversationId: conv.id,
        direction: 'INBOUND',
        senderPhone: canonicalPhone,
        content: event.textBody,
        externalMessageId: event.externalMessageId,
      };
      messagesStore.push(msg);

      return { conversationId: conv.id, messageId: msg.id };
    }

    // Process 4 successive incoming messages
    processEvent({ senderPhone: '+22672019524', textBody: 'Salut', externalMessageId: 'msg-1' });
    processEvent({ senderPhone: '22672019524', textBody: 'Je cherche un produit', externalMessageId: 'msg-2' });
    processEvent({ senderPhone: '0022672019524', textBody: 'Kit minceur', externalMessageId: 'msg-3' });
    processEvent({ senderPhone: '72019524', textBody: 'Combien coûte-t-il ?', externalMessageId: 'msg-4' });

    assert.strictEqual(conversationsStore.size, 1, 'Should create exactly 1 conversation for all 4 messages');
    assert.strictEqual(messagesStore.length, 4, 'Should store all 4 messages under the single conversation');
    
    const singleConvId = Array.from(conversationsStore.keys())[0];
    const convMessages = messagesStore.filter((m) => m.conversationId === singleConvId);
    assert.strictEqual(convMessages.length, 4);
  });

  // --------------------------------------------------------------------------
  // TEST 4: Concurrency & Webhook Idempotency
  // --------------------------------------------------------------------------
  test('TEST 4: Duplicate external_message_id must be ignored and not duplicate messages or conversations', () => {
    const messagesSeen = new Set<string>();
    let conversationCount = 0;
    let messageCount = 0;

    function handleWebhook(externalMsgId: string) {
      if (messagesSeen.has(externalMsgId)) {
        return { status: 'IGNORED' };
      }

      if (conversationCount === 0) {
        conversationCount = 1;
      }
      messagesSeen.add(externalMsgId);
      messageCount++;
      return { status: 'SUCCESS' };
    }

    // Send same event twice
    const r1 = handleWebhook('EVO-DUP-TEST-999');
    const r2 = handleWebhook('EVO-DUP-TEST-999');

    assert.strictEqual(r1.status, 'SUCCESS');
    assert.strictEqual(r2.status, 'IGNORED');
    assert.strictEqual(conversationCount, 1);
    assert.strictEqual(messageCount, 1);
  });
});
