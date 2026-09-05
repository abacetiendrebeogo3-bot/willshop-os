/**
 * WILLShop OS — In-Memory Automation Engine Repositories
 * High-fidelity in-memory implementation for unit testing and local development.
 */

import {
  AutomationRule,
  AutomationExecution,
  ApprovalRequest,
  ApprovalStatus,
  KillSwitchConfig,
} from '../../domain/entities/AutomationEntities';
import {
  IAutomationRuleRepository,
  IAutomationExecutionRepository,
  IApprovalCenterRepository,
  IKillSwitchRepository,
} from '../../domain/interfaces/IAutomationRepositories';

export class InMemoryAutomationRuleRepository implements IAutomationRuleRepository {
  private rules: Map<string, AutomationRule> = new Map();

  async create(ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Promise<AutomationRule> {
    const id = `rule_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();
    const rule: AutomationRule = {
      ...ruleData,
      id,
      executionCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.rules.set(id, rule);
    return rule;
  }

  async findById(id: string, orgId: string): Promise<AutomationRule | null> {
    const rule = this.rules.get(id);
    if (!rule || rule.organizationId !== orgId) return null;
    return rule;
  }

  async listByOrg(orgId: string, enabledOnly?: boolean): Promise<AutomationRule[]> {
    return Array.from(this.rules.values()).filter((r) => {
      if (r.organizationId !== orgId) return false;
      if (enabledOnly && !r.enabled) return false;
      return true;
    });
  }

  async update(id: string, orgId: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const rule = await this.findById(id, orgId);
    if (!rule) throw new Error(`Automation rule ${id} not found in org ${orgId}`);

    const updated: AutomationRule = {
      ...rule,
      ...updates,
      updatedAt: new Date(),
    };
    this.rules.set(id, updated);
    return updated;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const rule = await this.findById(id, orgId);
    if (rule) {
      this.rules.delete(id);
    }
  }

  async incrementExecutionCount(id: string, orgId: string): Promise<void> {
    const rule = await this.findById(id, orgId);
    if (rule) {
      rule.executionCount += 1;
      rule.lastRunAt = new Date();
      rule.updatedAt = new Date();
      this.rules.set(id, rule);
    }
  }
}

export class InMemoryAutomationExecutionRepository implements IAutomationExecutionRepository {
  private executions: Map<string, AutomationExecution> = new Map();

  async create(data: Omit<AutomationExecution, 'id' | 'createdAt'>): Promise<AutomationExecution> {
    const id = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const execution: AutomationExecution = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.executions.set(id, execution);
    return execution;
  }

  async findById(id: string, orgId: string): Promise<AutomationExecution | null> {
    const exec = this.executions.get(id);
    if (!exec || exec.organizationId !== orgId) return null;
    return exec;
  }

  async findIdempotentExecution(idempotencyKey: string, orgId: string): Promise<AutomationExecution | null> {
    for (const exec of this.executions.values()) {
      if (exec.organizationId === orgId && exec.idempotencyKey === idempotencyKey) {
        return exec;
      }
    }
    return null;
  }

  async listByOrg(orgId: string, limit = 50): Promise<AutomationExecution[]> {
    return Array.from(this.executions.values())
      .filter((e) => e.organizationId === orgId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())
      .slice(0, limit);
  }

  async update(id: string, orgId: string, updates: Partial<AutomationExecution>): Promise<AutomationExecution> {
    const exec = await this.findById(id, orgId);
    if (!exec) throw new Error(`Execution ${id} not found in org ${orgId}`);

    const updated: AutomationExecution = {
      ...exec,
      ...updates,
    };
    this.executions.set(id, updated);
    return updated;
  }
}

export class InMemoryApprovalCenterRepository implements IApprovalCenterRepository {
  private requests: Map<string, ApprovalRequest> = new Map();

  async create(data: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): Promise<ApprovalRequest> {
    const id = `appr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const request: ApprovalRequest = {
      ...data,
      id,
      status: 'PENDING_APPROVAL',
      createdAt: new Date(),
    };
    this.requests.set(id, request);
    return request;
  }

  async findById(id: string, orgId: string): Promise<ApprovalRequest | null> {
    const req = this.requests.get(id);
    if (!req || req.organizationId !== orgId) return null;
    return req;
  }

  async listByOrg(orgId: string, status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    return Array.from(this.requests.values()).filter((r) => {
      if (r.organizationId !== orgId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  async findPendingByOrg(orgId: string): Promise<ApprovalRequest[]> {
    return this.listByOrg(orgId, 'PENDING_APPROVAL');
  }

  async updateStatus(
    id: string,
    orgId: string,
    status: ApprovalStatus,
    userId?: string,
    resultPayload?: Record<string, unknown>
  ): Promise<ApprovalRequest> {
    const req = await this.findById(id, orgId);
    if (!req) throw new Error(`Approval request ${id} not found in org ${orgId}`);

    const now = new Date();
    const updated: ApprovalRequest = {
      ...req,
      status,
      ...(status === 'APPROVED' && { approvedBy: userId, approvedAt: now }),
      ...(status === 'REJECTED' && { rejectedBy: userId, rejectedAt: now }),
      ...(status === 'EXECUTED' && { executedAt: now, executionResult: resultPayload }),
    };

    this.requests.set(id, updated);
    return updated;
  }
}

export class InMemoryKillSwitchRepository implements IKillSwitchRepository {
  private configs: Map<string, KillSwitchConfig> = new Map();

  async getConfigByOrg(orgId: string): Promise<KillSwitchConfig | null> {
    return this.configs.get(orgId) || {
      id: `ks_${orgId}`,
      organizationId: orgId,
      globalStopped: false,
      stoppedCategories: [],
      stoppedAutomationIds: [],
      updatedAt: new Date(),
    };
  }

  async updateConfig(orgId: string, updates: Partial<KillSwitchConfig>, updatedBy?: string): Promise<KillSwitchConfig> {
    const current = await this.getConfigByOrg(orgId);
    const updated: KillSwitchConfig = {
      ...current!,
      ...updates,
      updatedBy,
      updatedAt: new Date(),
    };
    this.configs.set(orgId, updated);
    return updated;
  }
}
