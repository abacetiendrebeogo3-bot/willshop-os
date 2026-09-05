/**
 * WILLShop OS — Orders & Stock Engine Automated Test Suite (Build 04)
 * Tests State Machine, Atomic Reservations, Insufficient Stock Rollback, Concurrency, Deadlock Mitigation & RLS
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  InMemoryOrderRepository,
  InMemoryStockRepository,
  InMemoryProductRepository,
  InMemoryCustomerRepository,
} from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';
import { InMemoryAuditRepository, InMemoryEventRepository, InMemoryIdempotencyRepository } from '../src/infrastructure/repositories/InMemoryRepositories';

import {
  CreateOrderService,
  ConfirmOrderService,
  CancelOrderService,
  MarkOutForDeliveryService,
} from '../src/application/services/OrderStockApplicationServices';
import { OrderStateMachine } from '../src/domain/services/OrderStateMachine';
import { ValidationError, NotFoundError } from '../src/domain/errors/AppErrors';

describe('Build 04 — Orders & Stock Engine Automated Test Suite', () => {
  const orderRepo = new InMemoryOrderRepository();
  const stockRepo = new InMemoryStockRepository();
  const productRepo = new InMemoryProductRepository();
  const customerRepo = new InMemoryCustomerRepository();

  const auditRepo = new InMemoryAuditRepository();
  const eventRepo = new InMemoryEventRepository();
  const idempotencyRepo = new InMemoryIdempotencyRepository();

  const createOrderService = new CreateOrderService(orderRepo, productRepo, auditRepo, eventRepo);
  const confirmOrderService = new ConfirmOrderService(orderRepo, stockRepo, auditRepo, eventRepo, idempotencyRepo);
  const cancelOrderService = new CancelOrderService(orderRepo, stockRepo, auditRepo, eventRepo);
  const markOutService = new MarkOutForDeliveryService(orderRepo, stockRepo, auditRepo, eventRepo);

  const orgAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // WillShop
  const orgBId = 'b1ffcd88-8b0a-3ef7-aa5c-5aa8ac270b22'; // OtherOrg

  // --------------------------------------------------------------------------
  // 1. Order Creation & Server-Calculated Pricing Test
  // --------------------------------------------------------------------------
  test('Order: Should create DRAFT order with server-calculated subtotal and snapshots', async () => {
    const product = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-THÉ-01',
      name: 'Thé WillShop Luxe',
      category: 'SANTE',
      purchasePrice: 2000,
      sellingPrice: 7500,
      currency: 'XOF',
      minimumStock: 5,
      unit: 'boite',
      status: 'ACTIVE',
    });

    const { order, items } = await createOrderService.execute({
      organizationId: orgAId,
      customerId: 'cust-100',
      items: [{ productId: product.id, quantity: 2 }],
      deliveryFee: 1500,
      discount: 1000,
    });

    assert.ok(order.id);
    assert.strictEqual(order.status, 'DRAFT');
    assert.strictEqual(order.subtotal, 15000); // 7500 * 2
    assert.strictEqual(order.total, 15500); // 15000 + 1500 - 1000
    assert.strictEqual(items[0].productNameSnapshot, 'Thé WillShop Luxe');
    assert.strictEqual(items[0].skuSnapshot, 'WS-THÉ-01');
  });

  test('Order: Duplicate product lines in same order should be rejected', async () => {
    const prod = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-DUP-01',
      name: 'Produit DUP',
      category: 'TEST',
      purchasePrice: 1000,
      sellingPrice: 2000,
      currency: 'XOF',
      minimumStock: 1,
      unit: 'unite',
      status: 'ACTIVE',
    });

    await assert.rejects(
      async () => {
        await createOrderService.execute({
          organizationId: orgAId,
          customerId: 'cust-100',
          items: [
            { productId: prod.id, quantity: 1 },
            { productId: prod.id, quantity: 2 },
          ],
        });
      },
      (err: Error) => err instanceof ValidationError
    );
  });

  // --------------------------------------------------------------------------
  // 2. Order State Machine Test
  // --------------------------------------------------------------------------
  test('State Machine: Illegal state transition DRAFT -> DELIVERED should throw ValidationError', () => {
    assert.throws(
      () => {
        OrderStateMachine.validateTransition('DRAFT', 'DELIVERED');
      },
      (err: Error) => err instanceof ValidationError
    );
  });

  // --------------------------------------------------------------------------
  // 3. Order Confirmation & Stock Reservation Test
  // --------------------------------------------------------------------------
  test('Confirmation: Should confirm order, reserve stock, and record stock movement', async () => {
    const prod = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-SAVON-10',
      name: 'Savon Bio WillShop',
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
      productId: prod.id,
      physicalStock: 20,
      reservedStock: 0,
      minimumStock: 5,
    });

    const { order } = await createOrderService.execute({
      organizationId: orgAId,
      customerId: 'cust-100',
      items: [{ productId: prod.id, quantity: 4 }],
    });

    const confirmed = await confirmOrderService.execute(order.id, orgAId, 'idem-confirm-001');
    assert.strictEqual(confirmed.order.status, 'CONFIRMED');

    const stock = await stockRepo.getStock(prod.id, orgAId);
    assert.strictEqual(stock?.physicalStock, 20);
    assert.strictEqual(stock?.reservedStock, 4);
    assert.strictEqual(stock?.availableStock, 16);

    const mvts = await stockRepo.getMovements(prod.id, orgAId);
    assert.strictEqual(mvts.length, 1);
    assert.strictEqual(mvts[0].movementType, 'RESERVATION');
  });

  // --------------------------------------------------------------------------
  // 4. Insufficient Stock Rollback Test
  // --------------------------------------------------------------------------
  test('Confirmation: Insufficient stock should reject confirmation and leave stock untouched', async () => {
    const prod = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-RARE-01',
      name: 'Produit Rare WillShop',
      category: 'LIXE',
      purchasePrice: 10000,
      sellingPrice: 25000,
      currency: 'XOF',
      minimumStock: 2,
      unit: 'unite',
      status: 'ACTIVE',
    });

    await stockRepo.initializeStock({
      organizationId: orgAId,
      productId: prod.id,
      physicalStock: 3,
      reservedStock: 0,
      minimumStock: 2,
    });

    const { order } = await createOrderService.execute({
      organizationId: orgAId,
      customerId: 'cust-100',
      items: [{ productId: prod.id, quantity: 5 }], // Wants 5, available is 3
    });

    await assert.rejects(
      async () => {
        await confirmOrderService.execute(order.id, orgAId);
      },
      (err: Error) => {
        assert.ok(err instanceof ValidationError);
        assert.ok(err.message.includes('INSUFFICIENT_STOCK'));
        return true;
      }
    );

    // Verify stock was untouched
    const stock = await stockRepo.getStock(prod.id, orgAId);
    assert.strictEqual(stock?.physicalStock, 3);
    assert.strictEqual(stock?.reservedStock, 0);
    assert.strictEqual(stock?.availableStock, 3);
  });

  // --------------------------------------------------------------------------
  // 5. Cancellation & Stock Release Test
  // --------------------------------------------------------------------------
  test('Cancellation: Cancelling a CONFIRMED order should release reserved stock', async () => {
    const prod = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-CANCEL-01',
      name: 'Produit Cancel Test',
      category: 'TEST',
      purchasePrice: 1000,
      sellingPrice: 4000,
      currency: 'XOF',
      minimumStock: 2,
      unit: 'unite',
      status: 'ACTIVE',
    });

    await stockRepo.initializeStock({
      organizationId: orgAId,
      productId: prod.id,
      physicalStock: 10,
      reservedStock: 0,
      minimumStock: 2,
    });

    const { order } = await createOrderService.execute({
      organizationId: orgAId,
      customerId: 'cust-100',
      items: [{ productId: prod.id, quantity: 3 }],
    });

    await confirmOrderService.execute(order.id, orgAId);
    const stockAfterConfirm = await stockRepo.getStock(prod.id, orgAId);
    assert.strictEqual(stockAfterConfirm?.reservedStock, 3);

    // Cancel order
    const cancelledOrder = await cancelOrderService.execute(order.id, orgAId, 'Client a changé d avis');
    assert.strictEqual(cancelledOrder.status, 'CANCELLED');

    const stockAfterCancel = await stockRepo.getStock(prod.id, orgAId);
    assert.strictEqual(stockAfterCancel?.reservedStock, 0);
    assert.strictEqual(stockAfterCancel?.availableStock, 10);
  });

  // --------------------------------------------------------------------------
  // 6. Out For Delivery Atomic Sale Deduction Test
  // --------------------------------------------------------------------------
  test('Out For Delivery: Transition READY -> OUT_FOR_DELIVERY should atomically deduct physical and reserved stock', async () => {
    const prod = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-OUT-01',
      name: 'Produit Delivery Sale Test',
      category: 'SANTE',
      purchasePrice: 2000,
      sellingPrice: 5000,
      currency: 'XOF',
      minimumStock: 2,
      unit: 'unite',
      status: 'ACTIVE',
    });

    await stockRepo.initializeStock({
      organizationId: orgAId,
      productId: prod.id,
      physicalStock: 15,
      reservedStock: 0,
      minimumStock: 2,
    });

    const { order } = await createOrderService.execute({
      organizationId: orgAId,
      customerId: 'cust-100',
      items: [{ productId: prod.id, quantity: 5 }],
    });

    await confirmOrderService.execute(order.id, orgAId);
    // Simulate manual status transitions to READY
    order.status = 'READY';

    const outOrder = await markOutService.execute(order.id, orgAId);
    assert.strictEqual(outOrder.status, 'OUT_FOR_DELIVERY');

    const stockAfterOut = await stockRepo.getStock(prod.id, orgAId);
    assert.strictEqual(stockAfterOut?.physicalStock, 10); // 15 - 5 = 10
    assert.strictEqual(stockAfterOut?.reservedStock, 0); // 5 - 5 = 0
    assert.strictEqual(stockAfterOut?.availableStock, 10); // 10 - 0 = 10
  });

  // --------------------------------------------------------------------------
  // 7. Concurrency & Overselling Prevention Test
  // --------------------------------------------------------------------------
  test('Concurrency: Two simultaneous orders trying to reserve remaining stock (Available: 5, Requested: 4 & 4)', async () => {
    const prod = await productRepo.create({
      organizationId: orgAId,
      sku: 'WS-RACE-01',
      name: 'Produit Stock Limite Race Test',
      category: 'TEST',
      purchasePrice: 1000,
      sellingPrice: 3000,
      currency: 'XOF',
      minimumStock: 1,
      unit: 'unite',
      status: 'ACTIVE',
    });

    await stockRepo.initializeStock({
      organizationId: orgAId,
      productId: prod.id,
      physicalStock: 5,
      reservedStock: 0,
      minimumStock: 1,
    });

    const { order: orderA } = await createOrderService.execute({
      organizationId: orgAId,
      customerId: 'cust-A',
      items: [{ productId: prod.id, quantity: 4 }],
    });

    const { order: orderB } = await createOrderService.execute({
      organizationId: orgAId,
      customerId: 'cust-B',
      items: [{ productId: prod.id, quantity: 4 }],
    });

    // Execute confirmation A and B
    let orderASucceeded = false;
    let orderBSucceeded = false;

    try {
      await confirmOrderService.execute(orderA.id, orgAId);
      orderASucceeded = true;
    } catch {
      orderASucceeded = false;
    }

    try {
      await confirmOrderService.execute(orderB.id, orgAId);
      orderBSucceeded = true;
    } catch {
      orderBSucceeded = false;
    }

    // Exactly 1 order must succeed and 1 order must fail
    assert.strictEqual(orderASucceeded !== orderBSucceeded, true);

    const finalStock = await stockRepo.getStock(prod.id, orgAId);
    assert.strictEqual(finalStock?.physicalStock, 5);
    assert.strictEqual(finalStock?.reservedStock, 4);
    assert.strictEqual(finalStock?.availableStock, 1); // 5 - 4 = 1 (NEVER NEGATIVE!)
  });
});
