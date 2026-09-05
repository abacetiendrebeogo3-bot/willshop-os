/**
 * WILLShop OS — Automation Engine Domain Entities
 * Pure Domain Layer.
 */

import { PermissionLevel } from './DataCoreEntities';

export type TriggerType = 'EVENT' | 'SCHEDULE' | 'CONDITION' | 'MANUAL' | 'WEBHOOK';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'greater_or_equal'
  | 'less_than'
  | 'less_or_equal'
  | 'contains'
  | 'not_contains'
  | 'in'
  | 'not_in'
  | 'exists'
  | 'not_exists';

export interface ConditionNode {
  field?: string;
  operator?: ConditionOperator;
  value?: unknown;
  logicalOperator?: 'AND' | 'OR';
  not?: boolean;
  children?: ConditionNode[];
}

export type ActionType =
  | 'NOTIFICATION'
  | 'WHATSAPP'
  | 'TASK'
  | 'ALERT'
  | 'ASSIGN'
  | 'TAG'
  | 'UPDATE'
  | 'CREATE'
  | 'WEBHOOK';

export type AutomationCategory = 'SALES' | 'STOCK' | 'DELIVERY' | 'FINANCE' | 'MARKETING' | 'SYSTEM' | 'BI';

export interface AutomationActionDef {
  id: string;
  type: ActionType;
  targetService?: string;
  payloadTemplate: Record<string, unknown>;
  permissionLevel: PermissionLevel;
  fallbackActionId?: string | null;
}

export interface RetryPolicy {
  maxAttempts: number;
  initialDelayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

export interface AutomationRule {
  id: string;
  organizationId: string;
  name: string;
  description?: string | null;
  category: AutomationCategory;
  enabled: boolean;
  triggerType: TriggerType;
  triggerConfig: Record<string, unknown>; // e.g. { eventType: 'stock.low' } or { cron: '0 8 * * *' }
  conditions: ConditionNode;
  actions: AutomationActionDef[];
  permissionLevel: PermissionLevel;
  schedule?: string | null;
  delaySeconds?: number;
  retryPolicy?: RetryPolicy;
  fallbackAction?: AutomationActionDef | null;
  stopConditions?: ConditionNode | null;
  cooldownSeconds?: number;
  lastRunAt?: Date | null;
  maxExecutions?: number | null;
  executionCount: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type ExecutionStatus = 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'STOPPED' | 'WAITING_APPROVAL';

export interface AutomationExecution {
  id: string;
  automationId: string;
  organizationId: string;
  eventId?: string | null;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date | null;
  attempt: number;
  maxAttempts: number;
  resultPayload?: Record<string, unknown> | null;
  error?: string | null;
  correlationId?: string | null;
  idempotencyKey: string;
  createdAt: Date;
}

export type ApprovalStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED'
  | 'CANCELLED';

export interface ApprovalRequest {
  id: string;
  automationId: string;
  executionId?: string | null;
  organizationId: string;
  actionType: ActionType;
  permissionLevel: PermissionLevel;
  payload: Record<string, unknown>;
  reason: string;
  evidence: Record<string, unknown>;
  risk: string;
  status: ApprovalStatus;
  expiresAt: Date;
  requestedBy: string;
  approvedBy?: string | null;
  approvedAt?: Date | null;
  rejectedBy?: string | null;
  rejectedAt?: Date | null;
  executedAt?: Date | null;
  executionResult?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface KillSwitchConfig {
  id: string;
  organizationId: string;
  globalStopped: boolean;
  stoppedCategories: AutomationCategory[];
  stoppedAutomationIds: string[];
  updatedBy?: string | null;
  updatedAt: Date;
}
