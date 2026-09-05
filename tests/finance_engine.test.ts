/**
 * WILLShop OS — BUILD 06 Finance Engine Test Suite
 * Validates corporate finance ledger, account balances, expenses, transfers,
 * owner draw/contribution separation, reconciliation, and tenant isolation.
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  CreateFinancialAccountService,
  CreateExpenseService,
  TransferFundsService,
  OwnerDrawService,
  OwnerContributionService,
  ReconciliationService,
  FinancialObligationService,
  FinanceSummaryService,
} from '../src/application/services/FinanceApplicationServices';

import { InMemoryFinanceRepository } from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';
import { AuditService } from '../src/application/services/AuditService';
import { InMemoryAuditRepository, InMemoryEventRepository, InMemoryIdempotencyRepository } from '../src/infrastructure/repositories/InMemoryRepositories';
import { IdempotencyService } from '../src/application/services/IdempotencyService';
import { setMockContext } from '../src/application/services/OrganizationContextService';

describe('Build 06 — Finance Engine Automated Test Suite', () => {
  const orgAId = 'org-willshop-001';
  const orgBId = 'org-competitor-002';
  const userId = 'user-ceo-wilty';

  let financeRepo: InMemoryFinanceRepository;
  let auditService: AuditService;
  let eventRepo: InMemoryEventRepository;
  let idempotencyService: IdempotencyService;

  let createAccountService: CreateFinancialAccountService;
  let createExpenseService: CreateExpenseService;
  let transferFundsService: TransferFundsService;
  let ownerDrawService: OwnerDrawService;
  let ownerContributionService: OwnerContributionService;
  let reconciliationService: ReconciliationService;
  let obligationService: FinancialObligationService;
  let summaryService: FinanceSummaryService;

  beforeEach(() => {
    setMockContext({
      userId,
      organizationId: orgAId,
      role: 'OWNER',
    });

    financeRepo = new InMemoryFinanceRepository();
    auditService = new AuditService(new InMemoryAuditRepository());
    eventRepo = new InMemoryEventRepository();
    idempotencyService = new IdempotencyService(new InMemoryIdempotencyRepository());

    createAccountService = new CreateFinancialAccountService(financeRepo, auditService, eventRepo, idempotencyService);
    createExpenseService = new CreateExpenseService(financeRepo, auditService, eventRepo, idempotencyService);
    transferFundsService = new TransferFundsService(financeRepo, auditService, eventRepo, idempotencyService);
    ownerDrawService = new OwnerDrawService(financeRepo, auditService, eventRepo, idempotencyService);
    ownerContributionService = new OwnerContributionService(financeRepo, auditService, eventRepo, idempotencyService);
    reconciliationService = new ReconciliationService(financeRepo, auditService, eventRepo, idempotencyService);
    obligationService = new FinancialObligationService(financeRepo, auditService);
    summaryService = new FinanceSummaryService(financeRepo);
  });

  test('Financial Accounts: Should create accounts and maintain accurate current balances', async () => {
    const cashAcc = await createAccountService.execute('Caisse Principale', 'CASH_REGISTER', 200000);
    const omAcc = await createAccountService.execute('Orange Money Pro', 'MOBILE_MONEY', 500000);

    assert.ok(cashAcc.id);
    assert.strictEqual(cashAcc.currentBalance, 200000);
    assert.strictEqual(omAcc.currentBalance, 500000);

    const list = await financeRepo.listAccountsByOrg(orgAId);
    assert.strictEqual(list.length, 2);
  });

  test('Expenses & Ledger: Should record expense and debit account balance', async () => {
    const account = await createAccountService.execute('Caisse WillShop', 'CASH_REGISTER', 100000);

    const expense = await createExpenseService.execute(
      account.id,
      'MARKETING_ADS',
      30000,
      'Campagne Facebook Ads septembre',
      'https://storage.supabase.co/receipts/rec-001.pdf',
      undefined,
      'idem-exp-001'
    );

    assert.strictEqual(expense.amount, 30000);
    assert.strictEqual(expense.direction, 'OUTFLOW');
    assert.strictEqual(expense.category, 'MARKETING_ADS');

    const updatedAccount = await financeRepo.getAccount(account.id, orgAId);
    assert.strictEqual((updatedAccount as any).currentBalance, 70000);
  });

  test('Business vs Personal: OWNER_DRAW and OWNER_CONTRIBUTION should be separate from OpEx and Revenue', async () => {
    const bankAcc = await createAccountService.execute('Coris Bank Pro', 'BANK_ACCOUNT', 1000000);

    // Owner Draw (Wilty takes money for personal use)
    const draw = await ownerDrawService.execute(bankAcc.id, 150000, 'Retrait personnel Wilty');
    assert.strictEqual(draw.category, 'OWNER_DRAW');
    assert.strictEqual(draw.direction, 'OUTFLOW');

    let accState = await financeRepo.getAccount(bankAcc.id, orgAId);
    assert.strictEqual((accState as any).currentBalance, 850000);

    // Owner Contribution (Wilty injects personal capital)
    const contrib = await ownerContributionService.execute(bankAcc.id, 300000, 'Apport en capital Wilty');
    assert.strictEqual(contrib.category, 'OWNER_CONTRIBUTION');
    assert.strictEqual(contrib.direction, 'INFLOW');

    accState = await financeRepo.getAccount(bankAcc.id, orgAId);
    assert.strictEqual((accState as any).currentBalance, 1150000);

    // Verify metrics distinction
    const summary = await summaryService.getSummary();
    assert.strictEqual(summary.ownerDraws, 150000);
    assert.strictEqual(summary.ownerContributions, 300000);
    assert.strictEqual(summary.revenue, 0); // Capital injection is NOT sales revenue
    assert.strictEqual(summary.operatingExpenses, 0); // Owner draw is NOT OpEx
  });

  test('Transfers: Fund transfer between accounts must be atomic and update both balances', async () => {
    const omAcc = await createAccountService.execute('Orange Money', 'MOBILE_MONEY', 500000);
    const bankAcc = await createAccountService.execute('Banque Pro', 'BANK_ACCOUNT', 100000);

    const result = await transferFundsService.execute(
      omAcc.id,
      bankAcc.id,
      100000,
      'Transfert de securite vers banque',
      'idem-trf-001'
    );

    assert.ok(result.sourceTransaction.transferId);
    assert.strictEqual(result.sourceTransaction.transferId, result.destinationTransaction.transferId);

    const updatedOm = await financeRepo.getAccount(omAcc.id, orgAId);
    const updatedBank = await financeRepo.getAccount(bankAcc.id, orgAId);

    assert.strictEqual((updatedOm as any).currentBalance, 400000);
    assert.strictEqual((updatedBank as any).currentBalance, 200000);
  });

  test('Reconciliation: Detect discrepancy and apply controlled adjustment with justification', async () => {
    const cashAcc = await createAccountService.execute('Caisse Physique', 'CASH_REGISTER', 150000);

    // Actual physical count is 145,000 (missing 5,000)
    const recon = await reconciliationService.execute(
      cashAcc.id,
      145000,
      'Ecart de caisse - billet de 5000 abime refuse',
      'idem-recon-001'
    );

    assert.strictEqual(recon.systemBalance, 150000);
    assert.strictEqual(recon.actualBalance, 145000);
    assert.strictEqual(recon.difference, -5000);
    assert.ok(recon.adjustmentTransaction);

    const updated = await financeRepo.getAccount(cashAcc.id, orgAId);
    assert.strictEqual((updated as any).currentBalance, 145000);
  });

  test('Financial Obligations: Should track supplier debts and customer receivables', async () => {
    const debt = await obligationService.create(
      'DEBT',
      'SUPPLIER',
      'Fournisseur Textile Ouaga',
      450000,
      new Date('2026-10-01'),
      'Achat 100 T-shirts'
    );

    assert.ok(debt.id);
    assert.strictEqual(debt.type, 'DEBT');
    assert.strictEqual(debt.remainingAmount, 450000);

    const summary = await summaryService.getSummary();
    assert.strictEqual(summary.totalDebts, 450000);
  });

  test('Tenant Isolation: User from Org B cannot access Org A accounts or transactions', async () => {
    const accA = await createAccountService.execute('Compte Org A', 'CASH_REGISTER', 100000);

    setMockContext({
      userId: 'user-b',
      organizationId: orgBId,
      role: 'OWNER',
    });

    const accFromOrgB = await financeRepo.getAccount(accA.id, orgBId);
    assert.strictEqual(accFromOrgB, null);

    const listOrgB = await financeRepo.listAccountsByOrg(orgBId);
    assert.strictEqual(listOrgB.length, 0);
  });
});
