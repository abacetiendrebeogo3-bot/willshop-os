/**
 * WILLShop OS — Order State Machine Domain Service
 * Pure Domain Layer — ZERO external dependencies.
 * Enforces valid state transitions and rejects illegal jumps (e.g. DRAFT -> DELIVERED).
 */

import { OrderStatus } from '../entities/DataCoreEntities';
import { ValidationError } from '../errors/AppErrors';

export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED', 'FAILED'],
  PREPARING: ['READY', 'CANCELLED', 'FAILED'],
  READY: ['OUT_FOR_DELIVERY', 'CANCELLED', 'FAILED'],
  OUT_FOR_DELIVERY: ['DELIVERED', 'FAILED', 'RESCHEDULED', 'RETURNED', 'CANCELLED'],
  DELIVERED: ['COMPLETED', 'RETURNED'],
  COMPLETED: [],
  CANCELLED: [],
  FAILED: ['DRAFT'], // Retry draft
  RETURNED: [],
  RESCHEDULED: ['OUT_FOR_DELIVERY', 'CANCELLED'],
};

export class OrderStateMachine {
  static canTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): boolean {
    if (currentStatus === targetStatus) return true;
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(targetStatus);
  }

  static validateTransition(currentStatus: OrderStatus, targetStatus: OrderStatus): void {
    if (!this.canTransition(currentStatus, targetStatus)) {
      throw new ValidationError(
        `Invalid order status transition from '${currentStatus}' to '${targetStatus}'.`
      );
    }
  }
}
