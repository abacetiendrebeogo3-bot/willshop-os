/**
 * WILLShop OS — Automation Engine Application Services
 * Orchestrates event handling, deterministic condition evaluation, 3-tier risk permissions,
 * Approval Center routing, action execution, idempotency, and kill switches.
 * Application Layer.
 */

import { SystemEvent } from '../../domain/entities/SystemEvent';
import {
  AutomationRule,
  AutomationExecution,
  ApprovalRequest,
  ApprovalStatus,
  AutomationCategory,
  ActionType,
} from '../../domain/entities/AutomationEntities';
import { PermissionLevel } from '../../domain/entities/DataCoreEntities';
import {
  IAutomationRuleRepository,
  IAutomationExecutionRepository,
  IApprovalCenterRepository,
  IKillSwitchRepository,
} from '../../domain/interfaces/IAutomationRepositories';
import { ConditionEvaluator } from '../../domain/services/ConditionEvaluator';
import { PermissionEvaluator } from '../../domain/services/PermissionEvaluator';
import { KillSwitchService } from '../../domain/services/KillSwitchService';

export interface ActionExecutorDependencies {
  sendWhatsAppMessage?: (orgId: string, phone: string, text: string) => Promise<{ success: boolean; messageId?: string }>;
  createTask?: (orgId: string, title: string, description?: string) => Promise<{ id: string }>;
  createAlert?: (orgId: string, title: string, severity: string) => Promise<{ id: string }>;
  recordEvent?: (event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>) => Promise<SystemEvent>;
}

export class ActionExecutorService {
  constructor(private deps: ActionExecutorDependencies) {}

  public async executeAction(
    actionType: ActionType,
    orgId: string,
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; result?: Record<string, unknown>; error?: string }> {
    try {
      switch (actionType) {
        case 'NOTIFICATION':
        case 'ALERT': {
          const title = (payload.title as string) || (payload.message as string) || 'Notification Automation';
          const severity = (payload.severity as string) || 'INFO';
          if (this.deps.createAlert) {
            const res = await this.deps.createAlert(orgId, title, severity);
            return { success: true, result: { alertId: res.id, title } };
          }
          if (this.deps.recordEvent) {
            await this.deps.recordEvent({
              organizationId: orgId,
              eventType: 'system.notification.created',
              payload: { title, severity, payload },
            });
          }
          return { success: true, result: { title, status: 'RECORDED' } };
        }

        case 'WHATSAPP': {
          const phone = payload.phone as string;
          const message = payload.message as string;
          if (!phone || !message) {
            return { success: false, error: 'Phone and message are required for WHATSAPP action' };
          }
          if (this.deps.sendWhatsAppMessage) {
            const res = await this.deps.sendWhatsAppMessage(orgId, phone, message);
            return { success: res.success, result: { messageId: res.messageId } };
          }
          return { success: true, result: { status: 'SIMULATED_WHATSAPP_SENT', phone, message } };
        }

        case 'TASK': {
          const title = (payload.title as string) || 'Tâche d\'automatisation';
          const description = payload.description as string;
          if (this.deps.createTask) {
            const res = await this.deps.createTask(orgId, title, description);
            return { success: true, result: { taskId: res.id, title } };
          }
          return { success: true, result: { title, status: 'TASK_CREATED' } };
        }

        case 'TAG': {
          const tag = payload.tag as string;
          const entityId = payload.entityId as string;
          return { success: true, result: { status: 'TAG_ADDED', tag, entityId } };
        }

        case 'ASSIGN':
        case 'UPDATE':
        case 'CREATE': {
          return { success: true, result: { status: 'ACTION_EXECUTED', payload } };
        }

        default:
          return { success: true, result: { status: 'NOOP_ACTION', payload } };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Action execution error' };
    }
  }
}

export class ApprovalCenterService {
  constructor(
    private approvalRepo: IApprovalCenterRepository,
    private actionExecutor: ActionExecutorService
  ) {}

  public async requestApproval(
    automationId: string,
    executionId: string | null,
    orgId: string,
    actionType: ActionType,
    permissionLevel: PermissionLevel,
    payload: Record<string, unknown>,
    reason: string,
    evidence: Record<string, unknown>,
    risk: string,
    requestedBy = 'AUTOMATION_ENGINE',
    expiresHours = 48
  ): Promise<ApprovalRequest> {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresHours);

    return this.approvalRepo.create({
      automationId,
      executionId,
      organizationId: orgId,
      actionType,
      permissionLevel,
      payload,
      reason,
      evidence,
      risk,
      expiresAt,
      requestedBy,
    });
  }

  public async approveRequest(requestId: string, orgId: string, userId: string): Promise<ApprovalRequest> {
    const request = await this.approvalRepo.findById(requestId, orgId);
    if (!request) throw new Error(`Approval request ${requestId} not found`);
    if (request.status !== 'PENDING_APPROVAL') {
      throw new Error(`Cannot approve request ${requestId}: request status is ${request.status} (has expired or was already processed)`);
    }

    if (new Date() > request.expiresAt) {
      await this.approvalRepo.updateStatus(requestId, orgId, 'EXPIRED');
      throw new Error(`Cannot approve request ${requestId}: request has expired`);
    }

    // Mark APPROVED
    await this.approvalRepo.updateStatus(requestId, orgId, 'APPROVED', userId);

    // Execute Action
    const execRes = await this.actionExecutor.executeAction(request.actionType, orgId, request.payload);

    if (execRes.success) {
      return this.approvalRepo.updateStatus(requestId, orgId, 'EXECUTED', userId, execRes.result);
    } else {
      return this.approvalRepo.updateStatus(requestId, orgId, 'FAILED', userId, { error: execRes.error });
    }
  }

  public async rejectRequest(requestId: string, orgId: string, userId: string, reason?: string): Promise<ApprovalRequest> {
    const request = await this.approvalRepo.findById(requestId, orgId);
    if (!request) throw new Error(`Approval request ${requestId} not found`);

    return this.approvalRepo.updateStatus(requestId, orgId, 'REJECTED', userId, { rejectionReason: reason });
  }

  public async checkExpirations(orgId: string): Promise<number> {
    const pending = await this.approvalRepo.findPendingByOrg(orgId);
    let expiredCount = 0;
    const now = new Date();

    for (const req of pending) {
      if (now > req.expiresAt) {
        await this.approvalRepo.updateStatus(req.id, orgId, 'EXPIRED');
        expiredCount++;
      }
    }

    return expiredCount;
  }

  public async getPendingRequests(orgId: string): Promise<ApprovalRequest[]> {
    return this.approvalRepo.findPendingByOrg(orgId);
  }

  public async listRequests(orgId: string, status?: ApprovalStatus): Promise<ApprovalRequest[]> {
    return this.approvalRepo.listByOrg(orgId, status);
  }
}

export class KillSwitchApplicationService {
  constructor(private killSwitchRepo: IKillSwitchRepository) {}

  public async toggleGlobal(orgId: string, stopped: boolean, userId?: string) {
    return this.killSwitchRepo.updateConfig(orgId, { globalStopped: stopped }, userId);
  }

  public async toggleCategory(orgId: string, category: AutomationCategory, stopped: boolean, userId?: string) {
    const current = await this.killSwitchRepo.getConfigByOrg(orgId);
    let categories = [...(current?.stoppedCategories || [])];
    if (stopped) {
      if (!categories.includes(category)) categories.push(category);
    } else {
      categories = categories.filter((c) => c !== category);
    }
    return this.killSwitchRepo.updateConfig(orgId, { stoppedCategories: categories }, userId);
  }

  public async toggleAutomation(orgId: string, automationId: string, stopped: boolean, userId?: string) {
    const current = await this.killSwitchRepo.getConfigByOrg(orgId);
    let ids = [...(current?.stoppedAutomationIds || [])];
    if (stopped) {
      if (!ids.includes(automationId)) ids.push(automationId);
    } else {
      ids = ids.filter((id) => id !== automationId);
    }
    return this.killSwitchRepo.updateConfig(orgId, { stoppedAutomationIds: ids }, userId);
  }

  public async getConfig(orgId: string) {
    return this.killSwitchRepo.getConfigByOrg(orgId);
  }
}

export class AutomationEngineService {
  constructor(
    private ruleRepo: IAutomationRuleRepository,
    private executionRepo: IAutomationExecutionRepository,
    private killSwitchRepo: IKillSwitchRepository,
    private approvalCenter: ApprovalCenterService,
    private actionExecutor: ActionExecutorService
  ) {}

  /**
   * Main entry point for system events: evaluates matching automation rules.
   */
  public async handleEvent(event: SystemEvent): Promise<AutomationExecution[]> {
    const orgId = event.organizationId;
    const rules = await this.ruleRepo.listByOrg(orgId, true);
    const matchingRules = rules.filter(
      (r) => r.triggerType === 'EVENT' && r.triggerConfig?.eventType === event.eventType
    );

    const executions: AutomationExecution[] = [];

    for (const rule of matchingRules) {
      const exec = await this.evaluateAndExecuteRule(rule, event);
      if (exec) executions.push(exec);
    }

    return executions;
  }

  /**
   * Manual or scheduled trigger handler for a single automation rule.
   */
  public async executeRule(
    automationId: string,
    orgId: string,
    contextOverride?: Record<string, unknown>
  ): Promise<AutomationExecution | null> {
    const rule = await this.ruleRepo.findById(automationId, orgId);
    if (!rule || !rule.enabled) return null;

    const mockEvent: SystemEvent = {
      id: `manual_evt_${Date.now()}`,
      organizationId: orgId,
      eventType: 'manual.trigger',
      payload: contextOverride || {},
      status: 'PROCESSED',
      createdAt: new Date(),
    };

    return this.evaluateAndExecuteRule(rule, mockEvent);
  }

  private async evaluateAndExecuteRule(rule: AutomationRule, event: SystemEvent): Promise<AutomationExecution | null> {
    const orgId = rule.organizationId;

    // 1. Kill Switch Check
    const ksConfig = await this.killSwitchRepo.getConfigByOrg(orgId);
    const ksStatus = KillSwitchService.isExecutionBlocked(ksConfig, rule.id, rule.category);
    if (ksStatus.blocked) {
      const idempotencyKey = `${rule.id}_${event.id}_blocked`;
      return this.executionRepo.create({
        automationId: rule.id,
        organizationId: orgId,
        eventId: event.id,
        status: 'STOPPED',
        startedAt: new Date(),
        completedAt: new Date(),
        attempt: 1,
        maxAttempts: 1,
        error: ksStatus.reason,
        idempotencyKey,
      });
    }

    // 2. Cooldown Check
    if (rule.cooldownSeconds && rule.lastRunAt) {
      const elapsedSeconds = (Date.now() - rule.lastRunAt.getTime()) / 1000;
      if (elapsedSeconds < rule.cooldownSeconds) {
        return null; // Cooldown active, suppress execution
      }
    }

    // 3. Max Executions Check
    if (rule.maxExecutions && rule.executionCount >= rule.maxExecutions) {
      return null;
    }

    // 4. Build Scoped Context
    const context: Record<string, unknown> = {
      event,
      organizationId: orgId,
      payload: event.payload || {},
      ...(event.payload || {}),
    };

    // 5. Evaluate Condition Tree
    const conditionMatched = ConditionEvaluator.evaluate(rule.conditions, context);
    if (!conditionMatched) {
      return null; // Condition not met
    }

    // 6. Check Idempotency Key
    const actionId = rule.actions.length > 0 ? rule.actions[0].id : 'default';
    const idempotencyKey = `${rule.id}_${event.id}_${actionId}`;
    const existingExec = await this.executionRepo.findIdempotentExecution(idempotencyKey, orgId);
    if (existingExec) {
      return existingExec; // Deduplicated
    }

    // 7. Create Pending Execution Record
    const execution = await this.executionRepo.create({
      automationId: rule.id,
      organizationId: orgId,
      eventId: event.id,
      status: 'EXECUTING',
      startedAt: new Date(),
      attempt: 1,
      maxAttempts: rule.retryPolicy?.maxAttempts || 3,
      correlationId: event.correlationId,
      idempotencyKey,
    });

    let hasPendingApproval = false;
    const actionResults: Record<string, unknown>[] = [];

    // 8. Process Actions
    for (const action of rule.actions) {
      const permissionLevel = PermissionEvaluator.inferPermission(action.type, action.permissionLevel);

      if (PermissionEvaluator.canAutoExecute(permissionLevel)) {
        // GREEN: Auto-Execute
        const res = await this.actionExecutor.executeAction(action.type, orgId, {
          ...action.payloadTemplate,
          ...event.payload,
        });

        if (res.success) {
          actionResults.push({ actionId: action.id, status: 'SUCCESS', result: res.result });
        } else {
          // Handle Fallback if provided
          if (rule.fallbackAction) {
            const fallbackRes = await this.actionExecutor.executeAction(
              rule.fallbackAction.type,
              orgId,
              rule.fallbackAction.payloadTemplate
            );
            actionResults.push({ actionId: action.id, status: 'FALLBACK_EXECUTED', fallback: fallbackRes });
          } else {
            actionResults.push({ actionId: action.id, status: 'FAILED', error: res.error });
          }
        }
      } else {
        // YELLOW or RED: Route to Approval Center
        hasPendingApproval = true;
        await this.approvalCenter.requestApproval(
          rule.id,
          execution.id,
          orgId,
          action.type,
          permissionLevel,
          { ...action.payloadTemplate, ...event.payload },
          `Automatisation '${rule.name}': Action ${action.type} nécessite approbation (${permissionLevel})`,
          { eventType: event.eventType, ruleId: rule.id, payload: event.payload },
          permissionLevel === 'RED' ? 'HIGH' : 'MEDIUM',
          'AUTOMATION_ENGINE'
        );
        actionResults.push({ actionId: action.id, status: 'WAITING_APPROVAL', permissionLevel });
      }
    }

    // Update Rule execution count & last run timestamp
    await this.ruleRepo.incrementExecutionCount(rule.id, orgId);

    // Finalize Execution Status
    const finalStatus = hasPendingApproval ? 'WAITING_APPROVAL' : 'COMPLETED';
    return this.executionRepo.update(execution.id, orgId, {
      status: finalStatus,
      completedAt: new Date(),
      resultPayload: { actions: actionResults },
    });
  }

  /**
   * Seeds initial reference automations if none exist for the organization.
   */
  public async seedInitialAutomations(orgId: string): Promise<AutomationRule[]> {
    const existing = await this.ruleRepo.listByOrg(orgId);
    if (existing.length > 0) return existing;

    const initialRules: Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt' | 'executionCount'>[] = [
      {
        organizationId: orgId,
        name: 'Alerte Stock Bas',
        description: 'Notifier le responsable quand un produit passe sous le seuil critique',
        category: 'STOCK',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'stock.low' },
        conditions: { field: 'payload.availableStock', operator: 'less_than', value: 5 },
        actions: [
          {
            id: 'act_stock_low',
            type: 'ALERT',
            permissionLevel: 'GREEN',
            payloadTemplate: { title: 'Alerte Stock Bas', severity: 'WARNING' },
          },
        ],
        permissionLevel: 'GREEN',
        cooldownSeconds: 300,
      },
      {
        organizationId: orgId,
        name: 'Alerte Rupture de Stock',
        description: 'Alerte urgente en cas de rupture totale de stock',
        category: 'STOCK',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'stock.out' },
        conditions: { field: 'payload.availableStock', operator: 'less_or_equal', value: 0 },
        actions: [
          {
            id: 'act_stock_out',
            type: 'ALERT',
            permissionLevel: 'GREEN',
            payloadTemplate: { title: 'RUPTURE DE STOCK CRITIQUE', severity: 'CRITICAL' },
          },
        ],
        permissionLevel: 'GREEN',
      },
      {
        organizationId: orgId,
        name: 'Suivi Livraison Échouée',
        description: 'Créer une tâche de suivi lorsqu\'une livraison échoue',
        category: 'DELIVERY',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'delivery.failed' },
        conditions: { field: 'payload.status', operator: 'equals', value: 'FAILED' },
        actions: [
          {
            id: 'act_delivery_failed_task',
            type: 'TASK',
            permissionLevel: 'GREEN',
            payloadTemplate: { title: 'Relance client livraison échouée', description: 'Vérifier adresse et reprogrammer' },
          },
        ],
        permissionLevel: 'GREEN',
      },
      {
        organizationId: orgId,
        name: 'Confirmation Livraison Réussie',
        description: 'Journaliser la confirmation de livraison réussie',
        category: 'DELIVERY',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'delivery.delivered' },
        conditions: { field: 'payload.status', operator: 'equals', value: 'DELIVERED' },
        actions: [
          {
            id: 'act_delivery_delivered_notify',
            type: 'NOTIFICATION',
            permissionLevel: 'GREEN',
            payloadTemplate: { title: 'Livraison complétée avec succès' },
          },
        ],
        permissionLevel: 'GREEN',
      },
      {
        organizationId: orgId,
        name: 'Notification Paiement Reçu',
        description: 'Notifier la réception d\'un paiement client',
        category: 'FINANCE',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'payment.received' },
        conditions: { field: 'payload.amount', operator: 'greater_than', value: 0 },
        actions: [
          {
            id: 'act_payment_notify',
            type: 'NOTIFICATION',
            permissionLevel: 'GREEN',
            payloadTemplate: { title: 'Paiement client encaissé' },
          },
        ],
        permissionLevel: 'GREEN',
      },
      {
        organizationId: orgId,
        name: 'Objectif Entreprise à Risque',
        description: 'Alerter le CEO quand un objectif prend du retard',
        category: 'BI',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'goal.at_risk' },
        conditions: {},
        actions: [
          {
            id: 'act_goal_risk_alert',
            type: 'ALERT',
            permissionLevel: 'GREEN',
            payloadTemplate: { title: 'Objectif d\'entreprise en retard', severity: 'WARNING' },
          },
        ],
        permissionLevel: 'GREEN',
      },
      {
        organizationId: orgId,
        name: 'Alerte Anomalie BI',
        description: 'Alerter en cas de détection d\'anomalie par le moteur BI',
        category: 'BI',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'anomaly.detected' },
        conditions: {},
        actions: [
          {
            id: 'act_bi_anomaly_alert',
            type: 'ALERT',
            permissionLevel: 'GREEN',
            payloadTemplate: { title: 'Anomalie métier détectée', severity: 'CRITICAL' },
          },
        ],
        permissionLevel: 'GREEN',
      },
      {
        organizationId: orgId,
        name: 'Approbation Dépense Importante',
        description: 'Demander validation avant d\'enregistrer une dépense > 100 000 XOF',
        category: 'FINANCE',
        enabled: true,
        triggerType: 'EVENT',
        triggerConfig: { eventType: 'finance.expense_created' },
        conditions: { field: 'payload.amount', operator: 'greater_than', value: 100000 },
        actions: [
          {
            id: 'act_large_expense_approval',
            type: 'CREATE',
            permissionLevel: 'YELLOW',
            payloadTemplate: { title: 'Validation dépense importante requise' },
          },
        ],
        permissionLevel: 'YELLOW',
      },
    ];

    const created: AutomationRule[] = [];
    for (const data of initialRules) {
      created.push(await this.ruleRepo.create(data));
    }

    return created;
  }
}
