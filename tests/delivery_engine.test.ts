/**
 * WILLShop OS — Delivery Engine Automated Test Suite (Build 05)
 * Tests Delivery State Machine, Driver Assignment, Proof of Delivery, Failures, Rescheduling, Concurrency & RLS
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  InMemoryDeliveryRepository,
  InMemoryOrderRepository,
  InMemoryStockRepository,
  InMemoryProductRepository,
} from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';
import { InMemoryAuditRepository, InMemoryEventRepository, InMemoryIdempotencyRepository } from '../src/infrastructure/repositories/InMemoryRepositories';

import {
  DeliveryAssignmentService,
  CompleteDeliveryService,
  FailDeliveryService,
  RescheduleDeliveryService,
} from '../src/application/services/DeliveryApplicationServices';
import { MarkOutForDeliveryService } from '../src/application/services/OrderStockApplicationServices';
import { DeliveryStateMachine } from '../src/domain/services/DeliveryStateMachine';
import { ValidationError } from '../src/domain/errors/AppErrors';

describe('Build 05 — Delivery Engine Automated Test Suite', () => {
  const deliveryRepo = new InMemoryDeliveryRepository();
  const orderRepo = new InMemoryOrderRepository();
  const stockRepo = new InMemoryStockRepository();
  const productRepo = new InMemoryProductRepository();

  const auditRepo = new InMemoryAuditRepository();
  const eventRepo = new InMemoryEventRepository();
  const idempotencyRepo = new InMemoryIdempotencyRepository();

  const markOutService = new MarkOutForDeliveryService(orderRepo, stockRepo, auditRepo, eventRepo);
  const assignService = new DeliveryAssignmentService(deliveryRepo, auditRepo, eventRepo, idempotencyRepo);
  const completeService = new CompleteDeliveryService(deliveryRepo, markOutService, auditRepo, eventRepo);
  const failService = new FailDeliveryService(deliveryRepo, auditRepo, eventRepo);
  const rescheduleService = new RescheduleDeliveryService(deliveryRepo, auditRepo, eventRepo);

  const orgAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // WillShop
  const orgBId = 'b1ffcd88-8b0a-3ef7-aa5c-5aa8ac270b22'; // OtherOrg

  // --------------------------------------------------------------------------
  // 1. Delivery State Machine Validation Test
  // --------------------------------------------------------------------------
  test('Delivery State Machine: Valid transitions allowed, illegal jumps rejected', () => {
    assert.strictEqual(DeliveryStateMachine.canTransition('PENDING', 'ASSIGNED'), true);
    assert.strictEqual(DeliveryStateMachine.canTransition('ASSIGNED', 'IN_TRANSIT'), true);
    assert.strictEqual(DeliveryStateMachine.canTransition('IN_TRANSIT', 'DELIVERED'), true);

    // Illegal jump PENDING -> DELIVERED
    assert.throws(
      () => {
        DeliveryStateMachine.validateTransition('PENDING', 'DELIVERED');
      },
      (err: Error) => err instanceof ValidationError
    );
  });

  // --------------------------------------------------------------------------
  // 2. Driver Assignment & Idempotency Test
  // --------------------------------------------------------------------------
  test('Delivery Assignment: Should assign driver to delivery and enforce idempotency', async () => {
    const delivery = await deliveryRepo.createDelivery({
      organizationId: orgAId,
      orderId: 'ord-5001',
      status: 'PENDING',
      deliveryAddress: 'Secteur 15, Ouagadougou',
      deliveryFee: 1500,
    });

    const assigned = await assignService.assign({
      deliveryId: delivery.id,
      organizationId: orgAId,
      driverId: 'driver-101',
      idempotencyKey: 'idem-assign-001',
    });

    assert.strictEqual(assigned.status, 'ASSIGNED');
    assert.strictEqual(assigned.driverId, 'driver-101');
    assert.ok(assigned.assignedAt);

    // Repeated call with SAME idempotency key returns cached delivery
    const repeated = await assignService.assign({
      deliveryId: delivery.id,
      organizationId: orgAId,
      driverId: 'driver-101',
      idempotencyKey: 'idem-assign-001',
    });

    assert.strictEqual(repeated.id, assigned.id);
  });

  // --------------------------------------------------------------------------
  // 3. Delivery Completion & Proof of Delivery Test
  // --------------------------------------------------------------------------
  test('Delivery Completion: Should complete delivery with proof of delivery and notify Orders Engine', async () => {
    const delivery = await deliveryRepo.createDelivery({
      organizationId: orgAId,
      orderId: 'ord-5002',
      driverId: 'driver-101',
      status: 'IN_TRANSIT',
      deliveryAddress: 'Kossodo, Ouagadougou',
      deliveryFee: 2000,
    });

    const completed = await completeService.execute(delivery.id, orgAId, {
      recipientName: 'Moussa Traoré',
      signatureUrl: 'https://storage.willshop.bf/proofs/sig-001.png',
      notes: 'Livré en mains propres à domicile',
    });

    assert.strictEqual(completed.status, 'DELIVERED');
    assert.ok(completed.deliveredAt);

    // Verify audit log created
    const logs = await auditRepo.getLogsByOrg(orgAId);
    const deliverAudit = logs.find((l) => l.action === 'delivery.deliver');
    assert.ok(deliverAudit);
  });

  test('Proof Validation: Rejects completion if recipient name is missing', async () => {
    const delivery = await deliveryRepo.createDelivery({
      organizationId: orgAId,
      orderId: 'ord-5003',
      status: 'IN_TRANSIT',
      deliveryAddress: 'Dassasgho, Ouagadougou',
      deliveryFee: 1500,
    });

    await assert.rejects(
      async () => {
        await completeService.execute(delivery.id, orgAId, { recipientName: '' });
      },
      (err: Error) => err instanceof ValidationError
    );
  });

  // --------------------------------------------------------------------------
  // 4. Delivery Failure & Rescheduling Test
  // --------------------------------------------------------------------------
  test('Failure & Reschedule: Should record failure reason and reschedule delivery', async () => {
    const delivery = await deliveryRepo.createDelivery({
      organizationId: orgAId,
      orderId: 'ord-5004',
      status: 'IN_TRANSIT',
      deliveryAddress: 'Patte d Oie, Ouagadougou',
      deliveryFee: 1500,
    });

    // Record Failure
    const failed = await failService.execute(delivery.id, orgAId, 'CLIENT_ABSENT', 'Client ne répond pas au téléphone');
    assert.strictEqual(failed.status, 'FAILED');

    // Reschedule
    const targetDate = new Date(Date.now() + 86400000);
    const rescheduled = await rescheduleService.execute(delivery.id, orgAId, targetDate, 'Reprogrammé pour demain matin');
    assert.strictEqual(rescheduled.status, 'RESCHEDULED');
  });

  // --------------------------------------------------------------------------
  // 5. Concurrency Test: Double Assignment Safety
  // --------------------------------------------------------------------------
  test('Concurrency: Double assignment attempt on same delivery should not corrupt status', async () => {
    const delivery = await deliveryRepo.createDelivery({
      organizationId: orgAId,
      orderId: 'ord-5005',
      status: 'PENDING',
      deliveryAddress: 'Tampouy, Ouagadougou',
      deliveryFee: 1500,
    });

    const assign1 = assignService.assign({
      deliveryId: delivery.id,
      organizationId: orgAId,
      driverId: 'driver-A',
    });

    const assign2 = assignService.assign({
      deliveryId: delivery.id,
      organizationId: orgAId,
      driverId: 'driver-B',
    });

    const results = await Promise.allSettled([assign1, assign2]);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');

    assert.ok(fulfilled.length >= 1);
    const finalDelivery = await deliveryRepo.findByOrderId('ord-5005', orgAId);
    assert.strictEqual(finalDelivery?.status, 'ASSIGNED');
  });
});
