/**
 * WILLShop OS — Supabase Automation Repositories
 * PostgreSQL implementation wrapping Supabase database queries.
 */

import { SupabaseClient } from '@supabase/supabase-js';
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

export class SupabaseAutomationRuleRepository implements IAutomationRuleRepository {
  constructor(private client: SupabaseClient) {}

  async create(ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>): Promise<AutomationRule> {
    const { data, error } = await this.client
      .from('automation_rules')
      .insert({
        organization_id: ruleData.organizationId,
        name: ruleData.name,
        description: ruleData.description,
        category: ruleData.category,
        enabled: ruleData.enabled,
        trigger_type: ruleData.triggerType,
        trigger_config: ruleData.triggerConfig,
        conditions: ruleData.conditions,
        actions: ruleData.actions,
        permission_level: ruleData.permissionLevel,
        schedule: ruleData.schedule,
        delay_seconds: ruleData.delaySeconds,
        retry_policy: ruleData.retryPolicy,
        fallback_action: ruleData.fallbackAction,
        stop_conditions: ruleData.stopConditions,
        cooldown_seconds: ruleData.cooldownSeconds,
        max_executions: ruleData.maxExecutions,
        created_by: ruleData.createdBy,
        updated_by: ruleData.updatedBy,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseAutomationRuleRepository.create error: ${error.message}`);
    return this.mapRule(data);
  }

  async findById(id: string, orgId: string): Promise<AutomationRule | null> {
    const { data, error } = await this.client
      .from('automation_rules')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapRule(data);
  }

  async listByOrg(orgId: string, enabledOnly?: boolean): Promise<AutomationRule[]> {
    let query = this.client.from('automation_rules').select('*').eq('organization_id', orgId);
    if (enabledOnly) {
      query = query.eq('enabled', true);
    }
    const { data, error } = await query;
    if (error) throw new Error(`SupabaseAutomationRuleRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapRule);
  }

  async update(id: string, orgId: string, updates: Partial<AutomationRule>): Promise<AutomationRule> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.enabled !== undefined) patch.enabled = updates.enabled;
    if (updates.conditions !== undefined) patch.conditions = updates.conditions;
    if (updates.actions !== undefined) patch.actions = updates.actions;
    if (updates.permissionLevel !== undefined) patch.permission_level = updates.permissionLevel;
    if (updates.schedule !== undefined) patch.schedule = updates.schedule;
    if (updates.cooldownSeconds !== undefined) patch.cooldown_seconds = updates.cooldownSeconds;

    const { data, error } = await this.client
      .from('automation_rules')
      .update(patch)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`SupabaseAutomationRuleRepository.update error: ${error.message}`);
    return this.mapRule(data);
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.client.from('automation_rules').delete().eq('id', id).eq('organization_id', orgId);
    if (error) throw new Error(`SupabaseAutomationRuleRepository.delete error: ${error.message}`);
  }

  async incrementExecutionCount(id: string, orgId: string): Promise<void> {
    await this.client.rpc('increment_automation_execution_count', { p_id: id, p_org_id: orgId });
  }

  private mapRule(row: any): AutomationRule {
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      description: row.description,
      category: row.category,
      enabled: row.enabled,
      triggerType: row.trigger_type,
      triggerConfig: row.trigger_config || {},
      conditions: row.conditions || {},
      actions: row.actions || [],
      permissionLevel: row.permission_level,
      schedule: row.schedule,
      delaySeconds: row.delay_seconds,
      retryPolicy: row.retry_policy,
      fallbackAction: row.fallback_action,
      stopConditions: row.stop_conditions,
      cooldownSeconds: row.cooldown_seconds,
      lastRunAt: row.last_run_at ? new Date(row.last_run_at) : null,
      maxExecutions: row.max_executions,
      executionCount: row.execution_count || 0,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export class SupabaseAutomationExecutionRepository implements IAutomationExecutionRepository {
  constructor(private client: SupabaseClient) {}

  async create(execution: Omit<AutomationExecution, 'id' | 'createdAt'>): Promise<AutomationExecution> {
    const { data, error } = await this.client
      .from('automation_executions')
      .insert({
        automation_id: execution.automationId,
        organization_id: execution.organizationId,
        event_id: execution.eventId,
        status: execution.status,
        started_at: execution.startedAt.toISOString(),
        completed_at: execution.completedAt ? execution.completedAt.toISOString() : null,
        attempt: execution.attempt,
        max_attempts: execution.maxAttempts,
        result_payload: execution.resultPayload,
        error: execution.error,
        correlation_id: execution.correlationId,
        idempotency_key: execution.idempotencyKey,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseAutomationExecutionRepository.create error: ${error.message}`);
    return this.mapExecution(data);
  }

  async findById(id: string, orgId: string): Promise<AutomationExecution | null> {
    const { data, error } = await this.client
      .from('automation_executions')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapExecution(data);
  }

  async findIdempotentExecution(idempotencyKey: string, orgId: string): Promise<AutomationExecution | null> {
    const { data, error } = await this.client
      .from('automation_executions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('idempotency_key', idempotencyKey)
      .maybeSingle();

    if (error || !data) return null;
    return this.mapExecution(data);
  }

  async listByOrg(orgId: string, limit = 50): Promise<AutomationExecution[]> {
    const { data, error } = await this.client
      .from('automation_executions')
      .select('*')
      .eq('organization_id', orgId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`SupabaseAutomationExecutionRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapExecution);
  }

  async update(id: string, orgId: string, updates: Partial<AutomationExecution>): Promise<AutomationExecution> {
    const patch: Record<string, unknown> = {};
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.completedAt !== undefined) {
      patch.completed_at = updates.completedAt ? updates.completedAt.toISOString() : null;
    }
    if (updates.resultPayload !== undefined) patch.result_payload = updates.resultPayload;
    if (updates.error !== undefined) patch.error = updates.error;

    const { data, error } = await this.client
      .from('automation_executions')
      .update(patch)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`SupabaseAutomationExecutionRepository.update error: ${error.message}`);
    return this.mapExecution(data);
  }

  private mapExecution(row: any): AutomationExecution {
    return {
      id: row.id,
      automationId: row.automation_id,
      organizationId: row.organization_id,
      eventId: row.event_id,
      status: row.status,
      startedAt: new Date(row.started_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      attempt: row.attempt,
      maxAttempts: row.max_attempts,
      resultPayload: row.result_payload,
      error: row.error,
      correlationId: row.correlation_id,
      idempotencyKey: row.idempotency_key,
      createdAt: new Date(row.created_at),
    };
  }
}

export class SupabaseApprovalCenterRepository implements IApprovalCenterRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: Omit<ApprovalRequest, 'id' | 'createdAt' | 'status'>): Promise<ApprovalRequest> {
    const { data: row, error } = await this.client
      .from('approval_requests')
      .insert({
        automation_id: data.automationId,
        execution_id: data.executionId,
        organization_id: data.organizationId,
        action_type: data.actionType,
        permission_level: data.permissionLevel,
        payload: data.payload,
        reason: data.reason,
        evidence: data.evidence,
        risk: data.risk,
        status: 'PENDING_APPROVAL',
        expires_at: data.expiresAt.toISOString(),
        requested_by: data.requestedBy,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseApprovalCenterRepository.create error: ${error.message}`);
    return this.mapRequest(row);
  }

  async findById(id: string, orgId: string): Promise<ApprovalRequest | null> {
    const { data, error } = await this.client
      .from('approval_requests')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapRequest(data);
  }

  async listByOrg(orgId: string, status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    let query = this.client.from('approval_requests').select('*').eq('organization_id', orgId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;

    if (error) throw new Error(`SupabaseApprovalCenterRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapRequest);
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
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status };
    if (status === 'APPROVED') {
      patch.approved_by = userId;
      patch.approved_at = now;
    }
    if (status === 'REJECTED') {
      patch.rejected_by = userId;
      patch.rejected_at = now;
    }
    if (status === 'EXECUTED') {
      patch.executed_at = now;
      patch.execution_result = resultPayload;
    }

    const { data, error } = await this.client
      .from('approval_requests')
      .update(patch)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`SupabaseApprovalCenterRepository.updateStatus error: ${error.message}`);
    return this.mapRequest(data);
  }

  private mapRequest(row: any): ApprovalRequest {
    return {
      id: row.id,
      automationId: row.automation_id,
      executionId: row.execution_id,
      organizationId: row.organization_id,
      actionType: row.action_type,
      permissionLevel: row.permission_level,
      payload: row.payload || {},
      reason: row.reason,
      evidence: row.evidence || {},
      risk: row.risk,
      status: row.status,
      expiresAt: new Date(row.expires_at),
      requestedBy: row.requested_by,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      rejectedBy: row.rejected_by,
      rejectedAt: row.rejected_at ? new Date(row.rejected_at) : null,
      executedAt: row.executed_at ? new Date(row.executed_at) : null,
      executionResult: row.execution_result,
      createdAt: new Date(row.created_at),
    };
  }
}

export class SupabaseKillSwitchRepository implements IKillSwitchRepository {
  constructor(private client: SupabaseClient) {}

  async getConfigByOrg(orgId: string): Promise<KillSwitchConfig | null> {
    const { data, error } = await this.client
      .from('kill_switches')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (error || !data) {
      return {
        id: `ks_${orgId}`,
        organizationId: orgId,
        globalStopped: false,
        stoppedCategories: [],
        stoppedAutomationIds: [],
        updatedAt: new Date(),
      };
    }
    return {
      id: data.id,
      organizationId: data.organization_id,
      globalStopped: data.global_stopped,
      stoppedCategories: data.stopped_categories || [],
      stoppedAutomationIds: data.stopped_automation_ids || [],
      updatedBy: data.updated_by,
      updatedAt: new Date(data.updated_at),
    };
  }

  async updateConfig(orgId: string, updates: Partial<KillSwitchConfig>, updatedBy?: string): Promise<KillSwitchConfig> {
    const { data, error } = await this.client
      .from('kill_switches')
      .upsert({
        organization_id: orgId,
        global_stopped: updates.globalStopped,
        stopped_categories: updates.stoppedCategories,
        stopped_automation_ids: updates.stoppedAutomationIds,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseKillSwitchRepository.updateConfig error: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      globalStopped: data.global_stopped,
      stoppedCategories: data.stopped_categories || [],
      stoppedAutomationIds: data.stopped_automation_ids || [],
      updatedBy: data.updated_by,
      updatedAt: new Date(data.updated_at),
    };
  }
}
