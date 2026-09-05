/**
 * WILLShop OS — AuditLog Entity
 * Pure Domain Layer — Central Audit Log representation.
 */

export interface AuditLog {
  id: string;
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
  createdAt: Date;
}
