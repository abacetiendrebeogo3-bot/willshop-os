/**
 * WILLShop OS — Delivery State Machine Domain Service
 * Pure Domain Layer — ZERO external dependencies.
 */

import { DeliveryStatus } from '../entities/DataCoreEntities';
import { ValidationError } from '../errors/AppErrors';

export const ALLOWED_DELIVERY_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  PENDING: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['PICKED_UP', 'IN_TRANSIT', 'FAILED', 'RESCHEDULED', 'CANCELLED'],
  PICKED_UP: ['IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED'],
  IN_TRANSIT: ['DELIVERED', 'FAILED', 'RETURNED'],
  DELIVERED: ['CLOSED', 'RETURNED'],
  CLOSED: [],
  FAILED: ['RESCHEDULED', 'RETURNED'],
  RESCHEDULED: ['ASSIGNED', 'CANCELLED'],
  RETURNED: [],
  CANCELLED: [],
};

export class DeliveryStateMachine {
  static canTransition(currentStatus: DeliveryStatus, targetStatus: DeliveryStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = ALLOWED_DELIVERY_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  static validateTransition(currentStatus: DeliveryStatus, targetStatus: DeliveryStatus): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new ValidationError(
        `Invalid delivery status transition from '${currentStatus}' to '${targetStatus}'.`
      );
    }
  }
}
