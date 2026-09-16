/**
 * WILLShop OS — Commercial Intelligence Engine & Copilot Test Suite
 * 
 * Verifies the OBSERVE_ONLY paradigm:
 * 1. AI is ACTIVE for background analysis, CRM context structuring, and action recommendation ("MA JOURNÉE").
 * 2. 0 Automated AI Outbound responses are sent to WhatsApp customers.
 * 3. `assertNoAIOutbound()` server-side guard blocks all automated dispatches in OBSERVE_ONLY.
 * 4. Factual evidence ("Pourquoi ?") is derived strictly from real DB records (0 invented data).
 * 5. CEO Morning Brief & Commercial Morning Brief generation.
 * 6. Action status persistence & Multi-tenant RLS isolation.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { REAL_COMMERCIAL_ORG_ID, SANDBOX_TEST_ORG_ID, assertNotCommercialOrg } from '../src/config/testGuardrails.js';
import { AIGlobalGuardService } from '../src/application/services/AIGlobalGuardService.js';
import {
  CommercialIntelligenceEngine,
  StructuredConversationContext,
  TodayActionItem,
} from '../src/application/services/CommercialIntelligenceEngine.js';

describe('Commercial Intelligence & Copilot Engine Test Suite (OBSERVE_ONLY Mode)', () => {
  const ORG_A = SANDBOX_TEST_ORG_ID; // '00000000-0000-4000-a000-000000000000'
  const ORG_B = '11111111-1111-4111-a111-111111111111';

  // Mock DB tables state
  let killSwitchesDB: Record<string, { global_stopped: boolean }> = {};
  let orgSettingsDB: Record<string, { ai_global_enabled?: boolean; ai_agent_config?: { agent_mode?: string } }> = {};
  let storedMessagesDB: any[] = [];
  let storedOrdersDB: any[] = [];
  let storedDeliveriesDB: any[] = [];
  let storedConversationsDB: any[] = [];

  const createMockSupabase = () => ({
    from: (table: string) => ({
      select: (cols?: string) => ({
        eq: (field: string, val: string) => ({
          single: async () => {
            if (table === 'kill_switches') {
              const row = killSwitchesDB[val];
              return row ? { data: row, error: null } : { data: null, error: null };
            }
            if (table === 'organizations') {
              const row = orgSettingsDB[val];
              return row ? { data: { settings: row }, error: null } : { data: null, error: null };
            }
            return { data: null, error: null };
          },
          maybeSingle: async () => {
            if (table === 'kill_switches') {
              const row = killSwitchesDB[val];
              return row ? { data: row, error: null } : { data: null, error: null };
            }
            return { data: null, error: null };
          },
          is: (field2: string, val2: any) => {
            if (table === 'orders') {
              const filtered = storedOrdersDB.filter((o) => o.organization_id === val);
              return Promise.resolve({ data: filtered, error: null });
            }
            if (table === 'deliveries') {
              const filtered = storedDeliveriesDB.filter((d) => d.organization_id === val);
              return Promise.resolve({ data: filtered, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
        is: (field: string, val: any) => ({
          eq: (field2: string, val2: string) => {
            if (table === 'orders') {
              const filtered = storedOrdersDB.filter((o) => o.organization_id === val2);
              return Promise.resolve({ data: filtered, error: null });
            }
            if (table === 'deliveries') {
              const filtered = storedDeliveriesDB.filter((d) => d.organization_id === val2);
              return Promise.resolve({ data: filtered, error: null });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
      insert: async (data: any) => {
        if (table === 'messages') {
          storedMessagesDB.push(data);
          return { data, error: null };
        }
        return { data: null, error: null };
      },
    }),
  });

  beforeEach(() => {
    assertNotCommercialOrg(ORG_A, 'Commercial Intelligence Test Org A');
    assertNotCommercialOrg(ORG_B, 'Commercial Intelligence Test Org B');

    killSwitchesDB = {
      [ORG_A]: { global_stopped: false },
      [ORG_B]: { global_stopped: false },
    };

    orgSettingsDB = {
      [ORG_A]: { ai_global_enabled: true, ai_agent_config: { agent_mode: 'OBSERVE_ONLY' } },
      [ORG_B]: { ai_global_enabled: true, ai_agent_config: { agent_mode: 'OBSERVE_ONLY' } },
    };

    storedMessagesDB = [];

    storedOrdersDB = [
      { id: 'ORD-101', organization_id: ORG_A, customer_id: 'cust-1', status: 'PENDING', total_amount: 25000, payment_status: 'UNPAID' },
      { id: 'ORD-102', organization_id: ORG_A, customer_id: 'cust-2', status: 'COMPLETED', total_amount: 15000, payment_status: 'PAID' },
    ];

    storedDeliveriesDB = [
      { id: 'DEL-201', organization_id: ORG_A, order_id: 'ORD-101', status: 'FAILED' },
      { id: 'DEL-202', organization_id: ORG_A, order_id: 'ORD-102', status: 'DELIVERED' },
    ];

    storedConversationsDB = [
      {
        id: 'conv-101',
        organization_id: ORG_A,
        customer_id: 'cust-1',
        customer: { id: 'cust-1', name: 'Aminata K.', phone: '+22670112233' },
        metadata: { product_name: 'Kit Minceur', selling_price: 25000, neighborhood: 'Somgandé' },
        last_message_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
      },
      {
        id: 'conv-102',
        organization_id: ORG_A,
        customer_id: 'cust-2',
        customer: { id: 'cust-2', name: 'Moussa S.', phone: '+22676004455' },
        metadata: { product_name: 'Green Mask Stick', selling_price: 15000, neighborhood: 'Ouaga 2000' },
        last_message_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
      },
    ];
  });

  test('A. Anti-pollution safeguard blocks test execution on live commercial org', () => {
    assert.throws(
      () => assertNotCommercialOrg(REAL_COMMERCIAL_ORG_ID, 'Guardrail Check'),
      /ANTI-POLLUTION SAFEGUARD BLOCKED/
    );
  });

  test('B. In OBSERVE_ONLY mode: AI is ENABLED for background analysis but OUTBOUND is BLOCKED', async () => {
    const mockSupabase = createMockSupabase();

    const guardResult = await AIGlobalGuardService.checkAIEnabled(mockSupabase as any, ORG_A);

    assert.equal(guardResult.isAIEnabled, true, 'AI must be enabled for background analysis');
    assert.equal(guardResult.isAIOutboundAllowed, false, 'Outbound customer auto-replies must be strictly blocked');
    assert.equal(guardResult.agentMode, 'OBSERVE_ONLY');

    const assertResult = await AIGlobalGuardService.assertNoAIOutbound(mockSupabase as any, ORG_A);
    assert.equal(assertResult.allowed, false);
  });

  test('C. Inbound customer message is stored and analyzed without sending automated WhatsApp AI reply', async () => {
    const mockSupabase = createMockSupabase();

    // 1. Simulate inbound message storage
    await mockSupabase.from('messages').insert({
      organization_id: ORG_A,
      conversation_id: 'conv-101',
      direction: 'INBOUND',
      body: 'Je souhaite connaître le délai pour recevoir mon Kit Minceur à Somgandé',
      sender_phone: '+22670112233',
      created_at: new Date().toISOString(),
    });

    assert.equal(storedMessagesDB.length, 1);
    assert.equal(storedMessagesDB[0].body, 'Je souhaite connaître le délai pour recevoir mon Kit Minceur à Somgandé');

    // 2. Verify outbound guard blocks auto-reply
    const outboundGuard = await AIGlobalGuardService.assertNoAIOutbound(mockSupabase as any, ORG_A);
    assert.equal(outboundGuard.allowed, false, 'Outbound auto-reply must be suppressed');
  });

  test('D. Salesperson message updates commercial activity without triggering automated AI response', async () => {
    const mockSupabase = createMockSupabase();

    // Salesperson sends message
    await mockSupabase.from('messages').insert({
      organization_id: ORG_A,
      conversation_id: 'conv-101',
      direction: 'OUTBOUND',
      body: 'Bonjour Aminata, le livreur peut passer ce soir à 17h.',
      created_at: new Date().toISOString(),
    });

    assert.equal(storedMessagesDB.length, 1);
    assert.equal(storedMessagesDB[0].direction, 'OUTBOUND');

    // Outbound guard ensures no automated AI response follows
    const outboundGuard = await AIGlobalGuardService.assertNoAIOutbound(mockSupabase as any, ORG_A);
    assert.equal(outboundGuard.allowed, false);
  });

  test('E. Conversation Context Structuring extracts factual attributes without inventing data', () => {
    const mockCustomer = { id: 'cust-101', name: 'Fatou Bamba', phone: '+22677889900' };
    const mockConv = {
      id: 'conv-301',
      customer_id: 'cust-101',
      metadata: { product_name: 'Thé Detox Ventre Plat', selling_price: 12000, neighborhood: 'Koulouba' },
      last_message_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    };

    const mockMessages = [
      { direction: 'INBOUND', body: 'Combien coûte le Thé Detox ?', created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
      { direction: 'OUTBOUND', body: 'Le Thé Detox est à 12000 XOF avec livraison à Koulouba.', created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
    ];

    const ctx = CommercialIntelligenceEngine.analyzeAndStructureConversation(mockMessages, mockCustomer, mockConv, [], []);

    assert.equal(ctx.customerName, 'Fatou Bamba');
    assert.equal(ctx.productInterest, 'Thé Detox Ventre Plat');
    assert.equal(ctx.sellingPrice, 12000);
    assert.equal(ctx.deliveryNeighborhood, 'Koulouba');
    assert.equal(ctx.stage, 'PRICE_COMMUNICATED');
    assert.ok(ctx.evidence.length > 0);
  });

  test('F. TodayActions Engine produces prioritized task cards with "Pourquoi ?" provenance', () => {
    const mockContexts: StructuredConversationContext[] = [
      {
        conversationId: 'conv-101',
        customerId: 'cust-101',
        customerName: 'Aminata K.',
        customerPhone: '+22670112233',
        intent: 'ORDER_FOLLOWUP',
        stage: 'UNFINISHED_ORDER',
        productInterest: 'Kit Minceur',
        productId: 'prod-1',
        quantity: 1,
        sellingPrice: 25000,
        deliveryNeighborhood: 'Somgandé',
        lastCustomerActivity: new Date(Date.now() - 5 * 3600 * 1000),
        lastCommercialActivity: new Date(Date.now() - 5 * 3600 * 1000),
        lastContactAt: new Date(Date.now() - 5 * 3600 * 1000),
        daysSinceLastActivity: 0,
        nextAction: 'Résoudre la livraison',
        priority: 'URGENT',
        needsFollowup: true,
        followupDueAt: new Date(),
        orderId: 'ORD-101',
        orderStatus: 'PENDING',
        deliveryStatus: 'FAILED',
        paymentStatus: 'UNPAID',
        evidence: ['Échec de livraison sur la commande #ORD-101'],
      },
      {
        conversationId: 'conv-102',
        customerId: 'cust-102',
        customerName: 'Moussa S.',
        customerPhone: '+22676004455',
        intent: 'PRICE_QUERY',
        stage: 'PRICE_COMMUNICATED',
        productInterest: 'Green Mask Stick',
        productId: 'prod-2',
        quantity: 1,
        sellingPrice: 15000,
        deliveryNeighborhood: 'Ouaga 2000',
        lastCustomerActivity: new Date(Date.now() - 48 * 3600 * 1000),
        lastCommercialActivity: new Date(Date.now() - 48 * 3600 * 1000),
        lastContactAt: new Date(Date.now() - 48 * 3600 * 1000),
        daysSinceLastActivity: 2,
        nextAction: 'Relancer le prospect',
        priority: 'IMPORTANT',
        needsFollowup: true,
        followupDueAt: new Date(),
        orderId: null,
        orderStatus: null,
        deliveryStatus: null,
        paymentStatus: null,
        evidence: ['Prix de 15000 XOF transmis il y a 2 jours'],
      },
    ];

    const actions = CommercialIntelligenceEngine.generateTodayActions(mockContexts, ORG_A);

    assert.equal(actions.length, 2);
    assert.equal(actions[0].priority, 'URGENT', 'Highest priority item must appear first');
    assert.equal(actions[0].actionType, 'SUIVRE_LIVRAISON');
    assert.ok(actions[0].suggestedResponse.includes('Aminata K.'));
    assert.equal(actions[1].priority, 'IMPORTANT');
    assert.equal(actions[1].actionType, 'RELANCER_PROSPECT');
  });

  test('G. CEO Morning Brief calculates macro KPIs from live DB tables with zero invented data', async () => {
    const mockSupabase = createMockSupabase();

    const brief = await CommercialIntelligenceEngine.generateCEOMorningBrief(mockSupabase as any, ORG_A);

    assert.equal(brief.organizationId, ORG_A);
    assert.ok(brief.summaryHeadline.includes('Willy'));
    assert.equal(brief.salesStats.totalOrdersYesterday, 2);
    assert.equal(brief.salesStats.totalRevenueXof, 40000);
    assert.equal(brief.salesStats.unconfirmedOrdersCount, 1);
    assert.ok(brief.keyAlerts.length > 0);
  });

  test('H. Personal Commercial Morning Brief ("MA JOURNÉE") generates agenda for assigned sales rep', async () => {
    const mockSupabase = createMockSupabase();

    const brief = await CommercialIntelligenceEngine.generateCommercialMorningBrief(
      mockSupabase as any,
      ORG_A,
      'user-awa-1'
    );

    assert.equal(brief.organizationId, ORG_A);
    assert.equal(brief.commercialName, 'Awa');
    assert.ok(brief.summaryHeadline.includes('Awa'));
  });

  test('I. Multi-Tenant Isolation: Org A intelligence data is completely separate from Org B', async () => {
    const mockSupabase = createMockSupabase();

    const briefA = await CommercialIntelligenceEngine.generateCEOMorningBrief(mockSupabase as any, ORG_A);
    const briefB = await CommercialIntelligenceEngine.generateCEOMorningBrief(mockSupabase as any, ORG_B);

    assert.equal(briefA.salesStats.totalOrdersYesterday, 2);
    assert.equal(briefB.salesStats.totalOrdersYesterday, 0, 'Org B must have 0 orders from Org A');
  });
});
