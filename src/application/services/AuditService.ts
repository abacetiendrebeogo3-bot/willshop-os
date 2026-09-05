/**
 * WILLShop OS — Central Audit Service
 * Application Layer.
 * Single unified audit system for the entire application.
 */

import { IAuditRepository } from '../../domain/interfaces/IRepositories';
import { AuditLog } from '../../domain/entities/AuditLog';

export interface CreateAuditLogDTO {
  organizationId: string;
  actorId?: string | null;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  beforeState?: Record<string, unknown> | null;
  afterState?: Record<string, unknown> | null;
  reason?: string | null;
  correlationId?: string | null;
  aiAgent?: string | null;
  aiAction?: string | null;
}

export class AuditService {
  constructor(private readonly auditRepo: IAuditRepository) {}

  async log(dto: CreateAuditLogDTO): Promise<AuditLog> {
    return this.auditRepo.log({
      ...dto,
      actorId: dto.actorId ?? null,
      targetId: dto.targetId ?? null,
      beforeState: dto.beforeState ?? null,
      afterState: dto.afterState ?? null,
      reason: dto.reason ?? null,
      correlationId: dto.correlationId ?? null,
      aiAgent: dto.aiAgent ?? null,
      aiAction: dto.aiAction ?? null,
    });
  }

  async getLogs(orgId: string, limit = 50): Promise<AuditLog[]> {
    return this.auditRepo.getLogsByOrg(orgId, limit);
  }
}
