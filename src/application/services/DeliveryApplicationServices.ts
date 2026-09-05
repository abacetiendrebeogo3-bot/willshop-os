/**
 * WILLShop OS — Delivery Engine Application Services
 * Application Layer.
 * Orchestrates driver assignment, proof of delivery, status state transitions & communication with Orders Engine.
 */

import {
  IDeliveryRepository,
  IOrderRepository,
  ICustomerRepository,
} from '../../domain/interfaces/IDataCoreRepositories';
import { IAuditRepository, IEventRepository, IIdempotencyRepository } from '../../domain/interfaces/IRepositories';

import { Delivery, DeliveryStatus } from '../../domain/entities/DataCoreEntities';
import { DeliveryStateMachine } from '../../domain/services/DeliveryStateMachine';
import { ValidationError, NotFoundError } from '../../domain/errors/AppErrors';
import { MarkOutForDeliveryService, ReturnOrderService } from './OrderStockApplicationServices';

export interface ProofOfDeliveryInput {
  photoUrl?: string;
  signatureUrl?: string;
  otpCode?: string;
  recipientName: string;
  notes?: string;
}

export class ProofOfDeliveryService {
  validateProof(proof: ProofOfDeliveryInput): void {
    if (!proof.recipientName || proof.recipientName.trim().length === 0) {
      throw new ValidationError('Recipient name is required for proof of delivery');
    }
  }
}

export interface AssignDeliveryInput {
  deliveryId: string;
  organizationId: string;
  driverId: string;
  idempotencyKey?: string;
}

export class DeliveryAssignmentService {
  constructor(
    private readonly deliveryRepo: IDeliveryRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository,
    private readonly idempotencyRepo: IIdempotencyRepository
  ) {}

  async assign(input: AssignDeliveryInput, actorId?: string): Promise<Delivery> {
    if (input.idempotencyKey) {
      const existingKey = await this.idempotencyRepo.findKey(input.idempotencyKey, input.organizationId);
      if (existingKey && existingKey.responsePayload) {
        const cachedId = existingKey.responsePayload.deliveryId as string;
        const cached = await this.deliveryRepo.listByOrg(input.organizationId);
        const match = cached.find((d) => d.id === cachedId);
        if (match) return match;
      } else if (!existingKey) {
        await this.idempotencyRepo.createKey(input.idempotencyKey, input.organizationId, input.deliveryId);
      }
    }

    const delivery = await this.deliveryRepo.findByOrderId(input.deliveryId, input.organizationId);
    const targetDelivery = delivery || (await this.deliveryRepo.listByOrg(input.organizationId)).find((d) => d.id === input.deliveryId);

    if (!targetDelivery) {
      throw new NotFoundError(`Delivery ${input.deliveryId} not found`);
    }

    DeliveryStateMachine.validateTransition(targetDelivery.status, 'ASSIGNED');

    targetDelivery.driverId = input.driverId;
    targetDelivery.status = 'ASSIGNED';
    targetDelivery.assignedAt = new Date();
    targetDelivery.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: input.organizationId,
      actorId,
      action: 'delivery.assign',
      targetEntity: 'deliveries',
      targetId: targetDelivery.id,
      afterState: { driverId: input.driverId, status: 'ASSIGNED' },
    });

    await this.eventRepo.recordEvent({
      organizationId: input.organizationId,
      eventType: 'delivery.assigned',
      payload: { deliveryId: targetDelivery.id, driverId: input.driverId, orderId: targetDelivery.orderId },
      actorId,
    });

    if (input.idempotencyKey) {
      await this.idempotencyRepo.completeKey(input.idempotencyKey, input.organizationId, { deliveryId: targetDelivery.id, status: 'ASSIGNED' });
    }

    return targetDelivery;
  }
}

export class CompleteDeliveryService {
  private readonly proofService = new ProofOfDeliveryService();

  constructor(
    private readonly deliveryRepo: IDeliveryRepository,
    private readonly markOutService: MarkOutForDeliveryService,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  async execute(
    deliveryId: string,
    orgId: string,
    proof: ProofOfDeliveryInput,
    actorId?: string
  ): Promise<Delivery> {
    this.proofService.validateProof(proof);

    const deliveries = await this.deliveryRepo.listByOrg(orgId);
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) throw new NotFoundError(`Delivery ${deliveryId} not found`);

    DeliveryStateMachine.validateTransition(delivery.status, 'DELIVERED');

    // Notify Orders engine to atomically deduct physical stock (READY -> OUT_FOR_DELIVERY)
    try {
      await this.markOutService.execute(delivery.orderId, orgId, actorId);
    } catch {
      // Order may already be in OUT_FOR_DELIVERY status
    }

    delivery.status = 'DELIVERED';
    delivery.deliveredAt = new Date();
    delivery.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: orgId,
      actorId,
      action: 'delivery.deliver',
      targetEntity: 'deliveries',
      targetId: deliveryId,
      afterState: { proof, recipientName: proof.recipientName },
    });

    await this.eventRepo.recordEvent({
      organizationId: orgId,
      eventType: 'delivery.delivered',
      payload: { deliveryId, orderId: delivery.orderId, recipientName: proof.recipientName },
      actorId,
    });

    return delivery;
  }
}

export class FailDeliveryService {
  constructor(
    private readonly deliveryRepo: IDeliveryRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  async execute(
    deliveryId: string,
    orgId: string,
    reason: string,
    note?: string,
    actorId?: string
  ): Promise<Delivery> {
    if (!reason || reason.trim().length === 0) {
      throw new ValidationError('Failure reason is required');
    }

    const deliveries = await this.deliveryRepo.listByOrg(orgId);
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) throw new NotFoundError(`Delivery ${deliveryId} not found`);

    DeliveryStateMachine.validateTransition(delivery.status, 'FAILED');

    delivery.status = 'FAILED';
    delivery.failedAt = new Date();
    delivery.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: orgId,
      actorId,
      action: 'delivery.fail',
      targetEntity: 'deliveries',
      targetId: deliveryId,
      reason,
    });

    await this.eventRepo.recordEvent({
      organizationId: orgId,
      eventType: 'delivery.failed',
      payload: { deliveryId, reason, note },
      actorId,
    });

    return delivery;
  }
}

export class RescheduleDeliveryService {
  constructor(
    private readonly deliveryRepo: IDeliveryRepository,
    private readonly auditRepo: IAuditRepository,
    private readonly eventRepo: IEventRepository
  ) {}

  async execute(
    deliveryId: string,
    orgId: string,
    newScheduledDate: Date,
    reason = 'Rescheduled by customer',
    actorId?: string
  ): Promise<Delivery> {
    const deliveries = await this.deliveryRepo.listByOrg(orgId);
    const delivery = deliveries.find((d) => d.id === deliveryId);
    if (!delivery) throw new NotFoundError(`Delivery ${deliveryId} not found`);

    DeliveryStateMachine.validateTransition(delivery.status, 'RESCHEDULED');

    delivery.status = 'RESCHEDULED';
    delivery.updatedAt = new Date();

    await this.auditRepo.log({
      organizationId: orgId,
      actorId,
      action: 'delivery.reschedule',
      targetEntity: 'deliveries',
      targetId: deliveryId,
      reason,
    });

    await this.eventRepo.recordEvent({
      organizationId: orgId,
      eventType: 'delivery.rescheduled',
      payload: { deliveryId, newScheduledDate, reason },
      actorId,
    });

    return delivery;
  }
}
