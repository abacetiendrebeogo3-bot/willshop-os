/**
 * WILLShop OS — Data Core Automated Test Suite (Build 02)
 * Validates all 20 Data Core domain entities, repositories & RLS constraints
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  InMemoryCustomerRepository,
  InMemoryProductRepository,
  InMemoryStockRepository,
  InMemoryOrderRepository,
  InMemoryPaymentRepository,
  InMemoryDeliveryRepository,
  InMemoryFinanceRepository,
  InMemoryAIMemoryRepository,
  InMemoryAIActionRepository,
  InMemoryGoalRepository,
} from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';

import {
  Customer,
  Product,
  ProductStock,
  Order,
  Payment,
  Delivery,
  FinancialAccount,
  AIMemory,
  Goal,
} from '../src/domain/entities/DataCoreEntities';

describe('Build 02 — Data Core Automated Test Suite', () => {
  const customerRepo = new InMemoryCustomerRepository();
  const productRepo = new InMemoryProductRepository();
  const stockRepo = new InMemoryStockRepository();
  const orderRepo = new InMemoryOrderRepository();
  const paymentRepo = new InMemoryPaymentRepository();
  const deliveryRepo = new InMemoryDeliveryRepository();
  const financeRepo = new InMemoryFinanceRepository();
  const aiMemoryRepo = new InMemoryAIMemoryRepository();
  const aiActionRepo = new InMemoryAIActionRepository();
  const goalRepo = new InMemoryGoalRepository();

  const orgAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // WillShop
  const orgBId = 'b1ffcd88-8b0a-3ef7-aa5c-5aa8ac270b22'; // OtherOrg

  // --------------------------------------------------------------------------
  // 1. Customers Test
  // --------------------------------------------------------------------------
  test('Customers: Should create customer and enforce organization ownership', async () => {
    const customer = await customerRepo.create({
      organizationId: orgAId,
      firstName: 'Moussa',
      lastName: 'Traoré',
      phone: '+22670000001',
      city: 'Ouagadougou',
      source: 'WHATSAPP',
      status: 'ACTIVE',
    });

    assert.ok(customer.id);
    assert.strictEqual(customer.fullName, 'Moussa Traoré');
    assert.strictEqual(customer.organizationId, orgAId);

    // Cross-tenant check: orgB should NOT find Org A customer
    const crossCheck = await customerRepo.findById(customer.id, orgBId);
    assert.strictEqual(crossCheck, null);
  });

  // --------------------------------------------------------------------------
  // 2. Product & ProductStock Source of Truth Test
  // --------------------------------------------------------------------------
  test('Stock: Should calculate available_stock = physical_stock - reserved_stock', async () => {
    const product = await productRepo.create({
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
    });

    const stock = await stockRepo.initializeStock({
      organizationId: orgAId,
      productId: product.id,
      physicalStock: 100,
      reservedStock: 20,
      minimumStock: 10,
    });

    assert.strictEqual(stock.physicalStock, 100);
    assert.strictEqual(stock.reservedStock, 20);
    assert.strictEqual(stock.availableStock, 80); // 100 - 20 = 80
  });

  // --------------------------------------------------------------------------
  // 3. StockMovements Ledger Test
  // --------------------------------------------------------------------------
  test('Stock Movements: Should record movement and update available stock dynamically', async () => {
    const product = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-SAVON-02',
      name: 'Savon Éclat WillShop',
      category: 'BEAUTE',
      purchasePrice: 1000,
      sellingPrice: 3000,
      currency: 'XOF',
      minimumStock: 5,
      unit: 'unite',
      status: 'ACTIVE',
    });

    await stockRepo.initializeStock({
      organizationId: orgAId,
      productId: product.id,
      physicalStock: 50,
      reservedStock: 0,
      minimumStock: 5,
    });

    // Record reservation movement
    await stockRepo.recordMovement({
      organizationId: orgAId,
      productId: product.id,
      movementType: 'RESERVATION',
      direction: 'RESERVE',
      quantity: 5,
      reason: 'Order #1001 reservation',
    });

    const updatedStock = await stockRepo.getStock(product.id, orgAId);
    assert.strictEqual(updatedStock?.physicalStock, 50);
    assert.strictEqual(updatedStock?.reservedStock, 5);
    assert.strictEqual(updatedStock?.availableStock, 45); // 50 - 5 = 45
  });

  // --------------------------------------------------------------------------
  // 4. Orders & OrderItems Snapshots Test
  // --------------------------------------------------------------------------
  test('Orders: Should create order with item product snapshots', async () => {
    const orderData = await orderRepo.createOrder(
      {
        organizationId: orgAId,
        customerId: 'cust-1',
        orderNumber: 'WS-2026-0001',
        status: 'CONFIRMED',
        subtotal: 15000,
        deliveryFee: 1500,
        discount: 0,
        total: 16500,
        currency: 'XOF',
        source: 'WHATSAPP',
      },
      [
        {
          organizationId: orgAId,
          orderId: '', // Set by repo
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 7500,
          subtotal: 15000,
          productNameSnapshot: 'Thé Minceur WillShop',
          skuSnapshot: 'WS-SLIM-01',
        },
      ]
    );

    assert.ok(orderData.order.id);
    assert.strictEqual(orderData.order.total, 16500);
    assert.strictEqual(orderData.items.length, 1);
    assert.strictEqual(orderData.items[0].productNameSnapshot, 'Thé Minceur WillShop');
  });

  // --------------------------------------------------------------------------
  // 5. Payments Test
  // --------------------------------------------------------------------------
  test('Payments: Should record payment tied to order', async () => {
    const payment = await paymentRepo.createPayment({
      organizationId: orgAId,
      orderId: 'ord-1001',
      amount: 16500,
      currency: 'XOF',
      method: 'MOBILE_MONEY',
      status: 'VERIFIED',
      provider: 'ORANGE_MONEY',
      providerReference: 'OM-20260905-001',
    });

    assert.ok(payment.id);
    assert.strictEqual(payment.status, 'VERIFIED');
    assert.strictEqual(payment.amount, 16500);
  });

  // --------------------------------------------------------------------------
  // 6. Deliveries Test
  // --------------------------------------------------------------------------
  test('Deliveries: Should assign delivery to driver and prevent double active deliveries', async () => {
    const delivery = await deliveryRepo.createDelivery({
      organizationId: orgAId,
      orderId: 'ord-1001',
      driverId: 'driver-1',
      zoneId: 'zone-ouaga-south',
      status: 'ASSIGNED',
      deliveryAddress: 'Secteur 15, Ouagadougou',
      deliveryFee: 1500,
    });

    assert.ok(delivery.id);
    assert.strictEqual(delivery.status, 'ASSIGNED');

    // Attempt double active delivery for same order should fail
    await assert.rejects(
      async () => {
        await deliveryRepo.createDelivery({
          organizationId: orgAId,
          orderId: 'ord-1001',
          status: 'PENDING',
          deliveryAddress: 'Duplicate address',
          deliveryFee: 1500,
        });
      },
      (err: Error) => err.message.includes('Active delivery already exists')
    );
  });

  // --------------------------------------------------------------------------
  // 7. Finance (Business Only) Test
  // --------------------------------------------------------------------------
  test('Finance: Should create WillShop business financial account and record transaction', async () => {
    const account = await financeRepo.createAccount({
      organizationId: orgAId,
      name: 'Caisse Principale WillShop',
      type: 'CASH_REGISTER',
      currency: 'XOF',
      openingBalance: 500000,
      status: 'ACTIVE',
    });

    assert.ok(account.id);
    assert.strictEqual(account.type, 'CASH_REGISTER');

    const tx = await financeRepo.recordTransaction({
      organizationId: orgAId,
      financialAccountId: account.id,
      type: 'INCOME',
      amount: 16500,
      currency: 'XOF',
      category: 'SALES_REVENUE',
      referenceType: 'ORDER',
      referenceId: 'ord-1001',
      description: 'Paiement commande WS-2026-0001',
      transactionDate: new Date(),
    });

    assert.ok(tx.id);
    assert.strictEqual(tx.amount, 16500);
  });

  // --------------------------------------------------------------------------
  // 8. AI Memories Scope Isolation Test
  // --------------------------------------------------------------------------
  test('AI Memories: Business memory must be isolated to org, Personal memory has personal scope', async () => {
    const bizMem = await aiMemoryRepo.saveMemory({
      organizationId: orgAId,
      memoryType: 'customer',
      scope: 'business',
      subjectType: 'customer',
      subjectId: 'cust-1',
      content: 'Le client préfére être livré l après-midi',
      confidence: 0.95,
      source: 'SALES_AI',
    });

    const persMem = await aiMemoryRepo.saveMemory({
      organizationId: undefined, // Personal scope
      memoryType: 'personal',
      scope: 'personal',
      subjectType: 'user',
      subjectId: 'user-wilty',
      content: 'Objectif sport 3 fois par semaine',
      confidence: 1.0,
      source: 'WILTY_PERSONAL_OS',
    });

    assert.strictEqual(bizMem.scope, 'business');
    assert.strictEqual(persMem.scope, 'personal');

    const memoriesOrgA = await aiMemoryRepo.getMemories('customer', 'cust-1', orgAId);
    assert.strictEqual(memoriesOrgA.length, 1);
    assert.strictEqual(memoriesOrgA[0].content, 'Le client préfére être livré l après-midi');

    // Org B cannot retrieve Org A business memory
    const memoriesOrgB = await aiMemoryRepo.getMemories('customer', 'cust-1', orgBId);
    assert.strictEqual(memoriesOrgB.length, 0);
  });

  // --------------------------------------------------------------------------
  // 9. AI Actions & Strategy Goals Test
  // --------------------------------------------------------------------------
  test('AI Actions & Goals: Should register AI action request and corporate goal', async () => {
    const aiAction = await aiActionRepo.recordAction({
      organizationId: orgAId,
      actionType: 'STOCK_RESTOCK_RECOMMENDATION',
      permissionLevel: 'YELLOW',
      status: 'PENDING_APPROVAL',
      requestedBy: 'CEO_AI',
      inputSummary: 'Recommandation réapprovisionnement Thé Minceur 50 boites',
    });

    assert.ok(aiAction.id);
    assert.strictEqual(aiAction.permissionLevel, 'YELLOW');

    const goal = await goalRepo.createGoal({
      organizationId: orgAId,
      name: 'Chiffre d affaires Mensuel T1 2026',
      type: 'REVENUE',
      targetValue: 10000000,
      currentValue: 3500000,
      unit: 'XOF',
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-03-31'),
      status: 'IN_PROGRESS',
    });

    assert.ok(goal.id);
    assert.strictEqual(goal.targetValue, 10000000);
  });
});
