/**
 * WILLShop OS — Core Domain Repository Interfaces
 * Pure Domain Layer.
 */

import { Organization } from '../entities/Organization';
import { AuditLog } from '../entities/AuditLog';
import { SystemEvent } from '../entities/SystemEvent';
import { IdempotencyRecord } from '../entities/SystemEvent';
import { UserRole } from '../types/rbac';

export interface UserOrgRoleContext {
  userId: string;
  organizationId: string;
  role: UserRole;
  permissions: string[];
}

export interface IOrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  getUserRoles(userId: string): Promise<UserOrgRoleContext[]>;
}

export interface IAuditRepository {
  log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog>;
  getLogsByOrg(orgId: string, limit?: number): Promise<AuditLog[]>;
}

export interface IEventRepository {
  recordEvent(event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>): Promise<SystemEvent>;
}

export interface IIdempotencyRepository {
  findKey(key: string, orgId: string): Promise<IdempotencyRecord | null>;
  createKey(key: string, orgId: string, requestHash: string): Promise<IdempotencyRecord>;
  completeKey(key: string, orgId: string, responsePayload: Record<string, unknown>): Promise<void>;
}
