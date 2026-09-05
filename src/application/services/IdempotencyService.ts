/**
 * WILLShop OS — System Event Dispatcher & Idempotency Services
 * Application Layer.
 */

import { IEventRepository, IIdempotencyRepository } from '../../domain/interfaces/IRepositories';
import { SystemEvent, IdempotencyRecord } from '../../domain/entities/SystemEvent';
import { IdempotencyMismatchError } from '../../domain/errors/AppErrors';

export interface DispatchEventDTO {
  organizationId: string;
  eventType: string;
  payload: Record<string, unknown>;
  actorId?: string | null;
  correlationId?: string | null;
}

export class EventDispatcherService {
  constructor(private readonly eventRepo: IEventRepository) {}

  async dispatch(dto: DispatchEventDTO): Promise<SystemEvent> {
    return this.eventRepo.recordEvent({
      organizationId: dto.organizationId,
      eventType: dto.eventType,
      payload: dto.payload,
      actorId: dto.actorId ?? null,
      correlationId: dto.correlationId ?? null,
    });
  }
}

export class IdempotencyService {
  constructor(private readonly idempotencyRepo: IIdempotencyRepository) {}

  /**
   * Processes request with idempotency protection.
   * - Same key + same request payload: returns original result payload.
   * - Same key + different request payload: throws IDEMPOTENCY_KEY_REUSE_MISMATCH.
   */
  async execute<T extends Record<string, unknown>>(
    key: string,
    orgId: string,
    requestPayload: Record<string, unknown>,
    operation: () => Promise<T>
  ): Promise<{ data: T; isCachedResponse: boolean }> {
    const requestHash = JSON.stringify(requestPayload);
    const existing = await this.idempotencyRepo.findKey(key, orgId);

    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new IdempotencyMismatchError(
          `Idempotency key '${key}' was previously used with a different request payload.`
        );
      }
      if (existing.responsePayload) {
        return { data: existing.responsePayload as T, isCachedResponse: true };
      }
    } else {
      await this.idempotencyRepo.createKey(key, orgId, requestHash);
    }

    const result = await operation();
    await this.idempotencyRepo.completeKey(key, orgId, result);

    return { data: result, isCachedResponse: false };
  }

  async check<T>(key: string, orgId: string, requestPayload: Record<string, unknown>): Promise<T | null> {
    const requestHash = JSON.stringify(requestPayload);
    const existing = await this.idempotencyRepo.findKey(key, orgId);
    if (existing) {
      if (existing.requestHash !== requestHash) {
        throw new IdempotencyMismatchError(
          `Idempotency key '${key}' was previously used with a different request payload.`
        );
      }
      if (existing.responsePayload) {
        return existing.responsePayload as T;
      }
    }
    await this.idempotencyRepo.createKey(key, orgId, requestHash);
    return null;
  }

  async save<T>(key: string, orgId: string, requestPayload: Record<string, unknown>, responsePayload: T): Promise<void> {
    await this.idempotencyRepo.completeKey(key, orgId, responsePayload as Record<string, unknown>);
  }
}
