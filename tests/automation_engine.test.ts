/**
 * WILLShop OS — Build 08 Automation Engine Test Suite
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { SystemEvent } from '../src/domain/entities/SystemEvent';
import { ConditionNode } from '../src/domain/entities/AutomationEntities';
import { ConditionEvaluator } from '../src/domain/services/ConditionEvaluator';
import { PermissionEvaluator } from '../src/domain/services/PermissionEvaluator';
import { KillSwitchService } from '../src/domain/services/KillSwitchService';
import {
  InMemoryAutomationRuleRepository,
  InMemoryAutomationExecutionRepository,
  InMemoryApprovalCenterRepository,
  InMemoryKillSwitchRepository,
} from '../src/infrastructure/repositories/InMemoryAutomationRepositories';
import {
  ActionExecutorService,
  ApprovalCenterService,
  KillSwitchApplicationService,
  AutomationEngineService,
} from '../src/application/services/AutomationApplicationServices';

describe('Build 08 — Automation Engine Automated Test Suite', () => {
  const orgId = 'org_automation_test_001';

  test('Condition Evaluator: Should evaluate comparison operators and logical tree deterministically', () => {
    const context = {
      order: { totalAmount: 150000, status: 'CONFIRMED' },
      stock: { available: 2 },
      customer: { vip: true, country: 'BF' },
    };

    // Test 1: Leaf condition
    const leafNode: ConditionNode = { field: 'order.totalAmount', operator: 'greater_than', value: 100000 };
    assert.strictEqual(ConditionEvaluator.evaluate(leafNode, context), true);

    // Test 2: AND condition
    const andNode: ConditionNode = {
      logicalOperator: 'AND',
      children: [
        { field: 'stock.available', operator: 'less_than', value: 5 },
        { field: 'customer.country', operator: 'equals', value: 'BF' },
      ],
    };
    assert.strictEqual(ConditionEvaluator.evaluate(andNode, context), true);

    // Test 3: OR condition
    const orNode: ConditionNode = {
      logicalOperator: 'OR',
      children: [
        { field: 'order.status', operator: 'equals', value: 'CANCELLED' },
        { field: 'customer.vip', operator: 'equals', value: true },
      ],
    };
    assert.strictEqual(ConditionEvaluator.evaluate(orNode, context), true);

    // Test 4: NOT condition
    const notNode: ConditionNode = {
      not: true,
      field: 'stock.available',
      operator: 'greater_than',
      value: 10,
    };
    assert.strictEqual(ConditionEvaluator.evaluate(notNode, context), true);
  });

  test('Permission Evaluator: GREEN auto-executes, YELLOW/RED routes to approval', () => {
    assert.strictEqual(PermissionEvaluator.canAutoExecute('GREEN'), true);
    assert.strictEqual(PermissionEvaluator.canAutoExecute('YELLOW'), false);

    assert.strictEqual(PermissionEvaluator.requiresApproval('YELLOW'), true);
    assert.strictEqual(PermissionEvaluator.requiresApproval('RED'), true);

    assert.strictEqual(PermissionEvaluator.inferPermission('NOTIFICATION'), 'GREEN');
    assert.strictEqual(PermissionEvaluator.inferPermission('WHATSAPP'), 'YELLOW');
  });

  test('Approval Center: Should request approval, approve, and execute action', async () => {
    const approvalRepo = new InMemoryApprovalCenterRepository();
    let actionExecuted = false;

    const actionExecutor = new ActionExecutorService({
      createAlert: async () => {
        actionExecuted = true;
        return { id: 'alert_123' };
      },
    });

    const approvalService = new ApprovalCenterService(approvalRepo, actionExecutor);

    // 1. Request Approval
    const req = await approvalService.requestApproval(
      'rule_100',
      'exec_100',
      orgId,
      'ALERT',
      'YELLOW',
      { title: 'Validation requise' },
      'Dépense importante',
      { amount: 200000 },
      'MEDIUM'
    );

    assert.strictEqual(req.status, 'PENDING_APPROVAL');

    // 2. Pending list check
    const pending = await approvalService.getPendingRequests(orgId);
    assert.strictEqual(pending.length, 1);

    // 3. Approve Request
    const approved = await approvalService.approveRequest(req.id, orgId, 'user_manager_1');
    assert.strictEqual(approved.status, 'EXECUTED');
    assert.strictEqual(approved.approvedBy, 'user_manager_1');
    assert.strictEqual(actionExecuted, true);
  });

  test('Approval Center: Expired request transitions to EXPIRED without auto-execution', async () => {
    const approvalRepo = new InMemoryApprovalCenterRepository();
    const actionExecutor = new ActionExecutorService({});
    const approvalService = new ApprovalCenterService(approvalRepo, actionExecutor);

    // Create request expired 1 hour ago
    const req = await approvalRepo.create({
      automationId: 'rule_exp',
      organizationId: orgId,
      actionType: 'WHATSAPP',
      permissionLevel: 'YELLOW',
      payload: { message: 'Expired' },
      reason: 'Expired test',
      evidence: {},
      risk: 'MEDIUM',
      expiresAt: new Date(Date.now() - 3600 * 1000), // Expired
      requestedBy: 'AUTOMATION_ENGINE',
    });

    // Check expirations
    const expiredCount = await approvalService.checkExpirations(orgId);
    assert.strictEqual(expiredCount, 1);

    const updated = await approvalRepo.findById(req.id, orgId);
    assert.strictEqual(updated?.status, 'EXPIRED');

    // Attempt to approve expired request should fail
    await assert.rejects(async () => {
      await approvalService.approveRequest(req.id, orgId, 'user_manager_1');
    }, /has expired/);
  });

  test('Kill Switch: Global and Category emergency stops block executions', async () => {
    const ksRepo = new InMemoryKillSwitchRepository();
    const ksService = new KillSwitchApplicationService(ksRepo);

    // 1. Initially active
    let config = await ksRepo.getConfigByOrg(orgId);
    let status = KillSwitchService.isExecutionBlocked(config, 'rule_1', 'STOCK');
    assert.strictEqual(status.blocked, false);

    // 2. Toggle Category Stop
    await ksService.toggleCategory(orgId, 'STOCK', true, 'admin');
    config = await ksRepo.getConfigByOrg(orgId);
    status = KillSwitchService.isExecutionBlocked(config, 'rule_1', 'STOCK');
    assert.strictEqual(status.blocked, true);

    // 3. Toggle Global Stop
    await ksService.toggleGlobal(orgId, true, 'admin');
    config = await ksRepo.getConfigByOrg(orgId);
    status = KillSwitchService.isExecutionBlocked(config, 'rule_2', 'DELIVERY');
    assert.strictEqual(status.blocked, true);
  });

  test('Automation Engine: Event trigger evaluates rules and executes GREEN actions', async () => {
    const ruleRepo = new InMemoryAutomationRuleRepository();
    const execRepo = new InMemoryAutomationExecutionRepository();
    const approvalRepo = new InMemoryApprovalCenterRepository();
    const ksRepo = new InMemoryKillSwitchRepository();

    let alertCreated = false;
    const actionExecutor = new ActionExecutorService({
      createAlert: async () => {
        alertCreated = true;
        return { id: 'alert_low_stock' };
      },
    });

    const approvalService = new ApprovalCenterService(approvalRepo, actionExecutor);
    const engine = new AutomationEngineService(ruleRepo, execRepo, ksRepo, approvalService, actionExecutor);

    // Seed rules
    await engine.seedInitialAutomations(orgId);

    // Trigger stock.low event
    const stockLowEvent: SystemEvent = {
      id: 'evt_stock_low_001',
      organizationId: orgId,
      eventType: 'stock.low',
      payload: { productId: 'prod_99', availableStock: 2 },
      status: 'PROCESSED',
      createdAt: new Date(),
    };

    const executions = await engine.handleEvent(stockLowEvent);
    assert.strictEqual(executions.length, 1);
    assert.strictEqual(executions[0].status, 'COMPLETED');
    assert.strictEqual(alertCreated, true);
  });

  test('Automation Engine: Idempotency deduplicates repeated identical event triggers', async () => {
    const ruleRepo = new InMemoryAutomationRuleRepository();
    const execRepo = new InMemoryAutomationExecutionRepository();
    const approvalRepo = new InMemoryApprovalCenterRepository();
    const ksRepo = new InMemoryKillSwitchRepository();

    let alertCount = 0;
    const actionExecutor = new ActionExecutorService({
      createAlert: async () => {
        alertCount++;
        return { id: 'alert_dedup' };
      },
    });

    const approvalService = new ApprovalCenterService(approvalRepo, actionExecutor);
    const engine = new AutomationEngineService(ruleRepo, execRepo, ksRepo, approvalService, actionExecutor);

    await engine.seedInitialAutomations(orgId);

    const stockOutEvent: SystemEvent = {
      id: 'evt_stock_out_001',
      organizationId: orgId,
      eventType: 'stock.out',
      payload: { productId: 'prod_100', availableStock: 0 },
      status: 'PROCESSED',
      createdAt: new Date(),
    };

    // First trigger
    await engine.handleEvent(stockOutEvent);
    assert.strictEqual(alertCount, 1);

    // Duplicate trigger
    await engine.handleEvent(stockOutEvent);
    assert.strictEqual(alertCount, 1); // Deduplicated by idempotency key
  });
});
