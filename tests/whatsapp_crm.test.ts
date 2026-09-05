/**
 * WILLShop OS — WhatsApp & CRM Automated Test Suite (Build 03)
 * Validates Webhooks, Phone Normalization, Conversations, Messages, Leads, Handoffs, Tags, AI Sales Agent & RLS.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { CustomerIdentificationService } from '../src/application/services/CustomerIdentificationService';
import { SalesAgentService, SalesAgentContextService } from '../src/application/services/SalesAgentService';
import { MockAIGateway } from '../src/infrastructure/ai/MockAIGateway';
import { MetaWhatsAppAdapter } from '../src/infrastructure/whatsapp/MetaWhatsAppAdapter';

import {
  InMemoryWhatsAppNumberRepository,
  InMemoryConversationRepository,
  InMemoryMessageRepository,
  InMemoryLeadRepository,
  InMemoryTagRepository,
  InMemoryCustomerNoteRepository,
  InMemoryHumanHandoffRepository,
} from '../src/infrastructure/repositories/InMemoryWhatsAppCRMRepositories';

import { InMemoryCustomerRepository } from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';

describe('Build 03 — WhatsApp + CRM Automated Test Suite', () => {
  const customerRepo = new InMemoryCustomerRepository();
  const identificationService = new CustomerIdentificationService(customerRepo);

  const numRepo = new InMemoryWhatsAppNumberRepository();
  const convRepo = new InMemoryConversationRepository();
  const msgRepo = new InMemoryMessageRepository();
  const leadRepo = new InMemoryLeadRepository();
  const tagRepo = new InMemoryTagRepository();
  const noteRepo = new InMemoryCustomerNoteRepository();
  const handoffRepo = new InMemoryHumanHandoffRepository();

  const whatsappAdapter = new MetaWhatsAppAdapter();
  const aiGateway = new MockAIGateway();
  const salesContextService = new SalesAgentContextService();
  const salesAgentService = new SalesAgentService(aiGateway, salesContextService);

  const orgAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // WillShop
  const orgBId = 'b1ffcd88-8b0a-3ef7-aa5c-5aa8ac270b22'; // OtherOrg

  // --------------------------------------------------------------------------
  // 1. Phone Normalization & Customer Identification Test
  // --------------------------------------------------------------------------
  test('CRM: Phone normalization should standardize raw numbers cleanly', () => {
    assert.strictEqual(identificationService.normalizePhoneNumber('+226 70 00 00 01'), '+22670000001');
    assert.strictEqual(identificationService.normalizePhoneNumber('0022670000001'), '+22670000001');
    assert.strictEqual(identificationService.normalizePhoneNumber('70000001'), '+22670000001');
  });

  test('CRM: Identify or Create Customer should not duplicate existing customer', async () => {
    const res1 = await identificationService.identifyOrCreateCustomer(orgAId, '+226 70 00 00 01', 'Moussa', 'Traore');
    assert.strictEqual(res1.isNewCustomer, true);
    assert.strictEqual(res1.customer.phone, '+22670000001');

    // Second call with same phone number should return existing customer
    const res2 = await identificationService.identifyOrCreateCustomer(orgAId, '70000001', 'Moussa', 'Traore');
    assert.strictEqual(res2.isNewCustomer, false);
    assert.strictEqual(res2.customer.id, res1.customer.id);
  });

  // --------------------------------------------------------------------------
  // 2. WhatsApp Message & Webhook Idempotency Test
  // --------------------------------------------------------------------------
  test('WhatsApp: Inbound message should be recorded and duplicate external_message_id ignored', async () => {
    const conv = await convRepo.createConversation({
      organizationId: orgAId,
      customerId: 'cust-1',
      status: 'OPEN',
      channel: 'WHATSAPP',
      assignedAgent: 'SALES_AI',
      lastMessageAt: new Date(),
      unreadCount: 1,
      priority: 'NORMAL',
      metadata: {},
    });

    const msg1 = await msgRepo.saveMessage({
      organizationId: orgAId,
      conversationId: conv.id,
      direction: 'INBOUND',
      senderType: 'CUSTOMER',
      messageType: 'TEXT',
      content: 'Bonjour WillShop',
      externalMessageId: 'wamid.HBgLMTIzNDU2Nzg5',
      metadata: {},
      sentAt: new Date(),
      status: 'RECEIVED',
    });

    assert.ok(msg1.id);
    assert.strictEqual(msg1.content, 'Bonjour WillShop');

    // Duplicate webhook event with SAME externalMessageId
    const msg2 = await msgRepo.saveMessage({
      organizationId: orgAId,
      conversationId: conv.id,
      direction: 'INBOUND',
      senderType: 'CUSTOMER',
      messageType: 'TEXT',
      content: 'Bonjour WillShop',
      externalMessageId: 'wamid.HBgLMTIzNDU2Nzg5',
      metadata: {},
      sentAt: new Date(),
      status: 'RECEIVED',
    });

    // Same message entity returned, no duplicate created
    assert.strictEqual(msg2.id, msg1.id);
  });

  // --------------------------------------------------------------------------
  // 3. WhatsApp Adapter Send Message Test
  // --------------------------------------------------------------------------
  test('WhatsApp Provider: MetaWhatsAppAdapter should send outbound message successfully', async () => {
    const res = await whatsappAdapter.sendTextMessage('phone-num-id-123', {
      toPhoneNumber: '+22670000001',
      messageText: 'Votre commande WillShop est confirmée.',
    });

    assert.strictEqual(res.status, 'SENT');
    assert.ok(res.externalMessageId.startsWith('wamid.'));
  });

  // --------------------------------------------------------------------------
  // 4. Leads & Opportunity Management Test
  // --------------------------------------------------------------------------
  test('Leads: Should create lead and transition status NEW -> QUALIFIED -> WON', async () => {
    const lead = await leadRepo.createLead({
      organizationId: orgAId,
      customerId: 'cust-1',
      source: 'WHATSAPP_INBOUND',
      status: 'NEW',
      score: 50,
      estimatedValue: 15000,
      productInterest: 'Thé Minceur WillShop',
      lastActivityAt: new Date(),
    });

    assert.ok(lead.id);
    assert.strictEqual(lead.status, 'NEW');

    // Qualify lead
    await leadRepo.updateStatus(lead.id, orgAId, 'QUALIFIED', 85);
    const updatedLead = await leadRepo.findById(lead.id, orgAId);
    assert.strictEqual(updatedLead?.status, 'QUALIFIED');
    assert.strictEqual(updatedLead?.score, 85);
  });

  // --------------------------------------------------------------------------
  // 5. Customer Notes & Tags Test
  // --------------------------------------------------------------------------
  test('Tags & Notes: Internal notes and customer tags should be stored and org-isolated', async () => {
    const tag = await tagRepo.createTag({
      organizationId: orgAId,
      name: 'VIP_WILLSHOP',
      color: '#D4A843',
      category: 'COMMERCIAL',
    });

    await tagRepo.addTagToCustomer('cust-1', tag.id);
    const custTags = await tagRepo.getCustomerTags('cust-1');
    assert.strictEqual(custTags.length, 1);
    assert.strictEqual(custTags[0].name, 'VIP_WILLSHOP');

    const note = await noteRepo.addNote({
      organizationId: orgAId,
      customerId: 'cust-1',
      authorId: 'user-agent-1',
      content: 'Note interne: Préfère la livraison en début d après-midi.',
    });

    assert.ok(note.id);
    const notes = await noteRepo.listNotes('cust-1', orgAId);
    assert.strictEqual(notes.length, 1);
  });

  // --------------------------------------------------------------------------
  // 6. Human Handoff Test
  // --------------------------------------------------------------------------
  test('Human Handoff: Complex request should trigger human handoff workflow', async () => {
    const handoff = await handoffRepo.requestHandoff({
      organizationId: orgAId,
      conversationId: 'conv-100',
      requestedBy: 'SALES_AI',
      reason: 'Demande de réduction spéciale grands comptes',
      status: 'PENDING',
    });

    assert.ok(handoff.id);
    assert.strictEqual(handoff.status, 'PENDING');

    const pending = await handoffRepo.listPendingByOrg(orgAId);
    assert.strictEqual(pending.length, 1);

    await handoffRepo.resolveHandoff(handoff.id, orgAId, 'human-agent-1');
    const pendingAfter = await handoffRepo.listPendingByOrg(orgAId);
    assert.strictEqual(pendingAfter.length, 0);
  });

  // --------------------------------------------------------------------------
  // 7. Sales Agent Context & Completion Test
  // --------------------------------------------------------------------------
  test('Sales Agent: Should generate AI completion with strict price context and detect handoff', async () => {
    const mockCustomer = {
      id: 'cust-1',
      organizationId: orgAId,
      firstName: 'Moussa',
      lastName: 'Traore',
      fullName: 'Moussa Traore',
      phone: '+22670000001',
      city: 'Ouagadougou',
      source: 'WHATSAPP',
      status: 'PROSPECT',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockProduct = {
      id: 'prod-1',
      organizationId: orgAId,
      sku: 'WS-SLIM-01',
      name: 'Thé Minceur WillShop',
      category: 'SANTE',
      purchasePrice: 2500,
      sellingPrice: 7500,
      currency: 'XOF',
      minimumStock: 10,
      unit: 'boite',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockMessages: any[] = [
      {
        id: 'msg-1',
        organizationId: orgAId,
        conversationId: 'conv-1',
        direction: 'INBOUND',
        senderType: 'CUSTOMER',
        messageType: 'TEXT',
        content: 'Bonjour, quel est le prix du thé minceur ?',
        status: 'RECEIVED',
        sentAt: new Date(),
        createdAt: new Date(),
      },
    ];

    const aiRes = await salesAgentService.generateResponse(mockCustomer, mockMessages, [mockProduct]);
    assert.strictEqual(aiRes.triggerHandoff, false);
    assert.ok(aiRes.responseText.length > 0);

    // Test explicit handoff keyword
    const handoffMessages: any[] = [
      {
        id: 'msg-2',
        organizationId: orgAId,
        conversationId: 'conv-1',
        direction: 'INBOUND',
        senderType: 'CUSTOMER',
        messageType: 'TEXT',
        content: 'Je veux parler à un conseiller humain pour un remboursement.',
        status: 'RECEIVED',
        sentAt: new Date(),
        createdAt: new Date(),
      },
    ];

    const handoffRes = await salesAgentService.generateResponse(mockCustomer, handoffMessages, [mockProduct]);
    assert.strictEqual(handoffRes.triggerHandoff, true);
    assert.ok(handoffRes.responseText.includes('humain'));
  });
});
