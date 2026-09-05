/**
 * WILLShop OS — In-Memory Repositories for Unit Testing & Testing Suite
 * Infrastructure Layer.
 */

import {
  IOrganizationRepository,
  IAuditRepository,
  IEventRepository,
  IIdempotencyRepository,
  UserOrgRoleContext,
} from '../../domain/interfaces/IRepositories';
import { Organization } from '../../domain/entities/Organization';
import { AuditLog } from '../../domain/entities/AuditLog';
import { SystemEvent, IdempotencyRecord } from '../../domain/entities/SystemEvent';

export class InMemoryOrganizationRepository implements IOrganizationRepository {
  private orgs: Map<string, Organization> = new Map();
  private userRoles: Map<string, UserOrgRoleContext[]> = new Map();

  constructor() {
    // Seed default WillShop org
    const defaultOrg: Organization = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      name: 'WillShop',
      slug: 'willshop',
      country: 'Burkina Faso',
      currency: 'XOF',
      timezone: 'Africa/Ouagadougou',
      settings: { theme: 'dark' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.orgs.set(defaultOrg.id, defaultOrg);
  }

  async findById(id: string): Promise<Organization | null> {
    return this.orgs.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    for (const org of this.orgs.values()) {
      if (org.slug === slug) return org;
    }
    return null;
  }

  async getUserRoles(userId: string): Promise<UserOrgRoleContext[]> {
    return this.userRoles.get(userId) || [];
  }

  // Testing helpers
  seedOrganization(org: Organization): void {
    this.orgs.set(org.id, org);
  }

  assignUserRole(userId: string, roleCtx: UserOrgRoleContext): void {
    const existing = this.userRoles.get(userId) || [];
    existing.push(roleCtx);
    this.userRoles.set(userId, existing);
  }
}

export class InMemoryAuditRepository implements IAuditRepository {
  private logs: AuditLog[] = [];

  async log(entry: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
    const newLog: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date(),
    };
    this.logs.push(newLog);
    return newLog;
  }

  async getLogsByOrg(orgId: string, limit = 50): Promise<AuditLog[]> {
    return this.logs
      .filter((l) => l.organizationId === orgId)
      .slice(-limit)
      .reverse();
  }

  getAllLogs(): AuditLog[] {
    return [...this.logs];
  }
}

export class InMemoryEventRepository implements IEventRepository {
  private events: SystemEvent[] = [];

  async recordEvent(entry: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>): Promise<SystemEvent> {
    const newEvent: SystemEvent = {
      ...entry,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      status: 'PENDING',
      createdAt: new Date(),
    };
    this.events.push(newEvent);
    return newEvent;
  }

  getEvents(): SystemEvent[] {
    return [...this.events];
  }
}

export class InMemoryIdempotencyRepository implements IIdempotencyRepository {
  private records: Map<string, IdempotencyRecord> = new Map();

  private makeCompositeKey(key: string, orgId: string): string {
    return `${orgId}:${key}`;
  }

  async findKey(key: string, orgId: string): Promise<IdempotencyRecord | null> {
    return this.records.get(this.makeCompositeKey(key, orgId)) || null;
  }

  async createKey(key: string, orgId: string, requestHash: string): Promise<IdempotencyRecord> {
    const record: IdempotencyRecord = {
      key,
      organizationId: orgId,
      requestHash,
      status: 'PROCESSING',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    };
    this.records.set(this.makeCompositeKey(key, orgId), record);
    return record;
  }

  async completeKey(key: string, orgId: string, responsePayload: Record<string, unknown>): Promise<void> {
    const compositeKey = this.makeCompositeKey(key, orgId);
    const existing = this.records.get(compositeKey);
    if (existing) {
      existing.status = 'COMPLETED';
      existing.responsePayload = responsePayload;
      this.records.set(compositeKey, existing);
    }
  }
}
