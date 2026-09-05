/**
 * WILLShop OS — SystemEvent & Idempotency Domain Entities
 * Pure Domain Layer.
 */

export type EventStatus = 'PENDING' | 'PROCESSED' | 'FAILED';

export interface SystemEvent {
  id: string;
  organizationId: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorId?: string | null;
  correlationId?: string | null;
  status: EventStatus;
  createdAt: Date;
}

export type IdempotencyStatus = 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface IdempotencyRecord {
  key: string;
  organizationId: string;
  requestHash: string;
  responsePayload?: Record<string, unknown> | null;
  status: IdempotencyStatus;
  createdAt: Date;
  expiresAt: Date;
}
