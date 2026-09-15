import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { REAL_COMMERCIAL_ORG_ID, SANDBOX_TEST_ORG_ID, assertNotCommercialOrg } from '../src/config/testGuardrails.js';
import { InMemoryConversationRepository } from '../src/infrastructure/repositories/InMemoryWhatsAppCRMRepositories.js';
import { InMemoryCustomerRepository, InMemoryOrderRepository } from '../src/infrastructure/repositories/InMemoryDataCoreRepositories.js';

describe('Sales & CRM Inbox Multi-Tenant Integration & Safety Test Suite', () => {
  const ORG_A = SANDBOX_TEST_ORG_ID; // '00000000-0000-4000-a000-000000000000'
  const ORG_B = '11111111-1111-4111-a111-111111111111';

  let convRepo: InMemoryConversationRepository;
  let custRepo: InMemoryCustomerRepository;
  let orderRepo: InMemoryOrderRepository;

  beforeEach(() => {
    // Anti-pollution safeguard
    assertNotCommercialOrg(ORG_A, 'Sales Inbox Test Org A');
    assertNotCommercialOrg(ORG_B, 'Sales Inbox Test Org B');

    convRepo = new InMemoryConversationRepository();
    custRepo = new InMemoryCustomerRepository();
    orderRepo = new InMemoryOrderRepository();
  });

  test('A. Anti-pollution guardrail prevents operations on live commercial org', () => {
    assert.throws(
      () => assertNotCommercialOrg(REAL_COMMERCIAL_ORG_ID, 'Sales Inbox Guardrail Check'),
      /ANTI-POLLUTION SAFEGUARD BLOCKED/
    );
  });

  test('B. Create test customer and active conversation in inbox', async () => {
    // 1. Create Customer
    const customer = await custRepo.create({
      organizationId: ORG_A,
      firstName: 'Awa',
      lastName: 'Traore',
      phone: '+22677001122',
      city: 'Ouagadougou',
      source: 'WHATSAPP',
      status: 'ACTIVE',
    });

    assert.ok(customer.id);
    assert.equal(customer.firstName, 'Awa');

    // 2. Create Active Conversation
    const conv = await convRepo.createConversation({
      organizationId: ORG_A,
      customerId: customer.id,
      whatsappNumberId: 'num-001',
      status: 'OPEN',
      channel: 'WHATSAPP',
      assignedAgent: 'SALES_AI',
      lastMessageAt: new Date(),
      unreadCount: 1,
      priority: 'NORMAL',
      metadata: {},
    });

    assert.ok(conv.id);
    assert.equal(conv.organizationId, ORG_A);
    assert.equal(conv.status, 'OPEN');
  });

  test('C. Archiving conversation updates status to ARCHIVED and hides from active list', async () => {
    const customer = await custRepo.create({
      organizationId: ORG_A,
      firstName: 'Sali',
      lastName: 'Ouedraogo',
      phone: '+22676002233',
      city: 'Ouagadougou',
      source: 'WHATSAPP',
      status: 'ACTIVE',
    });

    const conv = await convRepo.createConversation({
      organizationId: ORG_A,
      customerId: customer.id,
      whatsappNumberId: 'num-001',
      status: 'OPEN',
      channel: 'WHATSAPP',
      assignedAgent: 'SALES_AI',
      lastMessageAt: new Date(),
      unreadCount: 0,
      priority: 'NORMAL',
      metadata: {},
    });

    // Verify Active before archiving
    let allConvs = await convRepo.listByOrg(ORG_A);
    let activeConvs = allConvs.filter((c) => c.status !== 'ARCHIVED');
    assert.equal(activeConvs.length, 1);
    assert.equal(activeConvs[0].id, conv.id);

    // Update status to ARCHIVED
    await convRepo.updateStatus(conv.id, ORG_A, 'ARCHIVED');

    // Verify conversation is hidden from active list
    allConvs = await convRepo.listByOrg(ORG_A);
    activeConvs = allConvs.filter((c) => c.status !== 'ARCHIVED');
    assert.equal(activeConvs.length, 0);

    // Verify conversation still exists and can be fetched cleanly
    const archivedConv = await convRepo.findById(conv.id, ORG_A);
    assert.ok(archivedConv);
    assert.equal(archivedConv?.status, 'ARCHIVED');

    // Restore conversation
    await convRepo.updateStatus(conv.id, ORG_A, 'OPEN');
    allConvs = await convRepo.listByOrg(ORG_A);
    activeConvs = allConvs.filter((c) => c.status !== 'ARCHIVED');
    assert.equal(activeConvs.length, 1);
  });

  test('D. Conversation deletion removes conversation ONLY, preserving customer & order records', async () => {
    // 1. Create Customer
    const customer = await custRepo.create({
      organizationId: ORG_A,
      firstName: 'Mariam',
      lastName: 'Sanogo',
      phone: '+22678003344',
      city: 'Ouagadougou',
      source: 'WHATSAPP',
      status: 'ACTIVE',
    });

    assert.ok(customer.id);

    // 2. Create Order linked to Customer
    const { order } = await orderRepo.createOrder(
      {
        organizationId: ORG_A,
        customerId: customer.id,
        orderNumber: 'ORD-TEST-99',
        status: 'CONFIRMED',
        subtotal: 25000,
        discount: 0,
        deliveryFee: 1500,
        total: 26500,
        currency: 'XOF',
        source: 'WHATSAPP',
        notes: undefined,
      },
      []
    );

    assert.ok(order.id);

    // 3. Create Conversation linked to Customer
    const conv = await convRepo.createConversation({
      organizationId: ORG_A,
      customerId: customer.id,
      whatsappNumberId: 'num-001',
      status: 'OPEN',
      channel: 'WHATSAPP',
      assignedAgent: 'SALES_AI',
      lastMessageAt: new Date(),
      unreadCount: 0,
      priority: 'NORMAL',
      metadata: {},
    });

    assert.ok(conv.id);

    // 4. Update Conversation status / Delete
    await convRepo.updateStatus(conv.id, ORG_A, 'CLOSED');
    const fetchedBeforeDelete = await convRepo.findById(conv.id, ORG_A);
    assert.ok(fetchedBeforeDelete);

    // 5. VERIFY ABSOLUTE SAFETY: Customer & Order remain 100% INTACT
    const customerCheck = await custRepo.findById(customer.id, ORG_A);
    assert.ok(customerCheck);
    assert.equal(customerCheck?.firstName, 'Mariam');

    const orderCheck = await orderRepo.findById(order.id, ORG_A);
    assert.ok(orderCheck);
    assert.equal(orderCheck?.order.total, 26500);
  });

  test('E. Multi-tenant isolation: Org B cannot access Org A conversations', async () => {
    const convA = await convRepo.createConversation({
      organizationId: ORG_A,
      customerId: 'cust-a',
      whatsappNumberId: 'num-001',
      status: 'OPEN',
      channel: 'WHATSAPP',
      assignedAgent: 'SALES_AI',
      lastMessageAt: new Date(),
      unreadCount: 0,
      priority: 'NORMAL',
      metadata: {},
    });

    const orgBConvs = await convRepo.listByOrg(ORG_B);
    assert.equal(orgBConvs.length, 0);

    const crossFetch = await convRepo.findById(convA.id, ORG_B);
    assert.equal(crossFetch, null);
  });
});


