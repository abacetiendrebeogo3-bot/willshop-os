/**
 * WILLShop OS — BUILD 14 System Integration & Consolidation Test Suite
 * Validates Cross-Domain Security Isolation, Data Consistency Engine,
 * System Health Service, and Idempotency/Concurrency invariants.
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import { DataConsistencyEngine } from '../src/application/services/DataConsistencyEngine';
import { SystemHealthService } from '../src/application/services/SystemHealthService';
import { PersonalApplicationService } from '../src/application/services/PersonalApplicationServices';
import { CreateFinancialAccountService } from '../src/application/services/FinanceApplicationServices';
import { IdempotencyService } from '../src/application/services/IdempotencyService';

import { InMemoryPersonalRepositories } from '../src/infrastructure/repositories/InMemoryPersonalRepositories';
import { InMemoryFinanceRepository } from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';

import { AuditService } from '../src/application/services/AuditService';
import { InMemoryAuditRepository, InMemoryEventRepository, InMemoryIdempotencyRepository } from '../src/infrastructure/repositories/InMemoryRepositories';
import { setMockContext } from '../src/application/services/OrganizationContextService';

describe('Build 14 — System Integration & Consolidation Test Suite', () => {
  const orgId = 'org-willshop-sys-int';
  const userId = 'user-ceo-wilty';

  let personalRepo: InMemoryPersonalRepositories;
  let financeRepo: InMemoryFinanceRepository;
  let auditService: AuditService;
  let eventRepo: InMemoryEventRepository;
  let idempRepo: InMemoryIdempotencyRepository;
  let idempotencyService: IdempotencyService;

  beforeEach(() => {
    setMockContext({
      userId,
      organizationId: orgId,
      role: 'OWNER',
    });

    const auditRepo = new InMemoryAuditRepository();
    idempRepo = new InMemoryIdempotencyRepository();
    eventRepo = new InMemoryEventRepository();
    auditService = new AuditService(auditRepo);
    idempotencyService = new IdempotencyService(idempRepo);

    personalRepo = new InMemoryPersonalRepositories();
    financeRepo = new InMemoryFinanceRepository();
  });

  test('1. Cross-Domain Isolation: Personal Finance and Business Finance remain strictly separated', async () => {
    const createAccountService = new CreateFinancialAccountService(financeRepo, auditService, eventRepo, idempotencyService);
    const bizAccount = await createAccountService.execute(
      'Business Coris Bank',
      'BANK_ACCOUNT',
      5000000
    );
    assert.strictEqual(bizAccount.organizationId, orgId);

    const personalService = new PersonalApplicationService({
      profileRepo: personalRepo,
      goalRepo: personalRepo,
      projectRepo: personalRepo,
      taskRepo: personalRepo,
      habitRepo: personalRepo,
      learningRepo: personalRepo,
      accountRepo: personalRepo,
      transactionRepo: personalRepo,
      budgetRepo: personalRepo,
      netWorthRepo: personalRepo,
      investmentRepo: personalRepo,
      decisionRepo: personalRepo,
      bridgeRepo: personalRepo,
    });

    const personalAccount = await personalService.createPersonalAccount(
      userId,
      'Wilty Personal Cash',
      'BANK',
      'XOF',
      500000
    );
    assert.strictEqual(personalAccount.userId, userId);

    // Verify personal accounts are NOT listed in Business accounts
    const bizAccounts = await financeRepo.listAccountsByOrg(orgId);
    const bizAccountIds = bizAccounts.map((a) => a.id);
    assert.strictEqual(bizAccountIds.includes(personalAccount.id), false);
  });

  test('2. Data Consistency Engine: Detects Order vs Payment total discrepancy', () => {
    const engine = new DataConsistencyEngine();
    const report = engine.auditSystemData(orgId, {
      orders: [{ id: 'ord-101', totalAmount: 50000, status: 'DELIVERED' }],
      payments: [{ id: 'pay-201', orderId: 'ord-101', amount: 30000, status: 'VERIFIED' }],
      stockItems: [{ id: 'stk-1', name: 'Item', quantityAvailable: 10, reservedQuantity: 0 }],
      financialTransactions: [{ id: 'tx-1', paymentId: 'pay-201', amount: 30000, type: 'INCOME' }],
      marketingSpends: [],
      financialMarketingExpenses: 0,
      biRevenueTotal: 50000,
      sourceOrdersRevenueTotal: 50000,
      goals: [],
    });

    assert.strictEqual(report.isConsistent, false);
    assert.strictEqual(report.criticalCount, 1);
    assert.strictEqual(report.inconsistencies[0].category, 'ORDER_PAYMENT');
    assert.strictEqual(report.inconsistencies[0].expectedValue, 50000);
    assert.strictEqual(report.inconsistencies[0].actualValue, 30000);
  });

  test('3. Data Consistency Engine: Detects Negative Stock Balances', () => {
    const engine = new DataConsistencyEngine();
    const report = engine.auditSystemData(orgId, {
      orders: [],
      payments: [],
      stockItems: [{ id: 'stk-2', name: 'Negative Stock', quantityAvailable: -5, reservedQuantity: 0 }],
      financialTransactions: [],
      marketingSpends: [],
      financialMarketingExpenses: 0,
      biRevenueTotal: 0,
      sourceOrdersRevenueTotal: 0,
      goals: [],
    });

    assert.strictEqual(report.isConsistent, false);
    assert.strictEqual(report.criticalCount, 1);
    assert.strictEqual(report.inconsistencies[0].category, 'STOCK_BALANCE');
  });

  test('4. Data Consistency Engine: Detects BI Revenue vs SSOT Orders Discrepancy', () => {
    const engine = new DataConsistencyEngine();
    const report = engine.auditSystemData(orgId, {
      orders: [{ id: 'ord-1', totalAmount: 100000, status: 'DELIVERED' }],
      payments: [{ id: 'pay-1', orderId: 'ord-1', amount: 100000, status: 'VERIFIED' }],
      stockItems: [],
      financialTransactions: [{ id: 'tx-1', paymentId: 'pay-1', amount: 100000, type: 'INCOME' }],
      marketingSpends: [],
      financialMarketingExpenses: 0,
      biRevenueTotal: 150000, // BI reporting wrong total
      sourceOrdersRevenueTotal: 100000,
      goals: [],
    });

    assert.strictEqual(report.isConsistent, false);
    assert.strictEqual(report.criticalCount, 1);
    assert.strictEqual(report.inconsistencies[0].category, 'BI_SOURCE');
  });

  test('5. System Health Service: Returns HEALTHY when clean, CRITICAL when DB or inconsistencies fail', () => {
    const healthService = new SystemHealthService();

    // Clean check
    const healthyReport = healthService.diagnose(orgId, { dbConnected: true }, {
      orders: [],
      payments: [],
      stockItems: [],
      financialTransactions: [],
      marketingSpends: [],
      financialMarketingExpenses: 0,
      biRevenueTotal: 0,
      sourceOrdersRevenueTotal: 0,
      goals: [],
    });
    assert.strictEqual(healthyReport.globalStatus, 'HEALTHY');

    // DB Down check
    const dbDownReport = healthService.diagnose(orgId, { dbConnected: false });
    assert.strictEqual(dbDownReport.globalStatus, 'CRITICAL');
    assert.strictEqual(dbDownReport.pillars['DATABASE'].status, 'CRITICAL');
  });

  test('6. Idempotency Service: Re-executing identical key returns cached response without duplicate execution', async () => {
    let executionCounter = 0;

    const op = async () => {
      executionCounter++;
      return { result: 'ORDER_PROCESSED_SUCCESSFULLY' };
    };

    const call1 = await idempotencyService.execute('idemp-key-99', orgId, { orderId: 'ord-888' }, op);
    assert.strictEqual(call1.isCachedResponse, false);
    assert.strictEqual(executionCounter, 1);

    const call2 = await idempotencyService.execute('idemp-key-99', orgId, { orderId: 'ord-888' }, op);
    assert.strictEqual(call2.isCachedResponse, true);
    assert.strictEqual(executionCounter, 1); // Counter did NOT increment
    assert.deepStrictEqual(call1.data, call2.data);
  });
});
