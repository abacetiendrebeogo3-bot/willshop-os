/**
 * WILLShop OS — Automation Engine Repository Interfaces
 * Pure Domain Layer.
 */

import {
  AutomationRule,
  AutomationExecution,
  ApprovalRequest,
  ApprovalStatus,
  KillSwitchConfig,
} from '../entities/AutomationEntities';

export interface IAutomationRuleRepository {
  create(rule: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Promise<AutomationRule>;
  findById(id: string, orgId: string): Promise<AutomationRule | null>;
  listByOrg(orgId: string, enabledOnly?: boolean): Promise<AutomationRule[]>;
  update(id: string, orgId: string, updates: Partial<AutomationRule>): Promise<AutomationRule>;
  delete(id: string, orgId: string): Promise<void>;
  incrementExecutionCount(id: string, orgId: string): Promise<void>;
}

export interface IAutomationExecutionRepository {
  create(execution: Omit<AutomationExecution, 'id' | 'createdAt'>): Promise<AutomationExecution>;
  findById(id: string, orgId: string): Promise<AutomationExecution | null>;
  findIdempotentExecution(idempotencyKey: string, orgId: string): Promise<AutomationExecution | null>;
  listByOrg(orgId: string, limit?: number): Promise<AutomationExecution[]>;
  update(id: string, orgId: string, updates: Partial<AutomationExecution>): Promise<AutomationExecution>;
}

export interface IApprovalCenterRepository {
  create(request: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): Promise<ApprovalRequest>;
  findById(id: string, orgId: string): Promise<ApprovalRequest | null>;
  listByOrg(orgId: string, status?: ApprovalStatus): Promise<ApprovalRequest[]>;
  findPendingByOrg(orgId: string): Promise<ApprovalRequest[]>;
  updateStatus(
    id: string,
    orgId: string,
    status: ApprovalStatus,
    userId?: string,
    resultPayload?: Record<string, unknown>
  ): Promise<ApprovalRequest>;
}

export interface IKillSwitchRepository {
  getConfigByOrg(orgId: string): Promise<KillSwitchConfig | null>;
  updateConfig(orgId: string, updates: Partial<KillSwitchConfig>, updatedBy?: string): Promise<KillSwitchConfig>;
}
