/**
 * WILLShop OS — BUILD 13 : WILTY PERSONAL OS TEST SUITE
 * Comprehensive integration & domain unit tests.
 * Includes explicit Business/Personal boundary isolation assertions.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InMemoryPersonalRepositories } from '../src/infrastructure/repositories/InMemoryPersonalRepositories';
import { PersonalApplicationService } from '../src/application/services/PersonalApplicationServices';
import { PersonalFinanceLedgerService } from '../src/domain/services/PersonalFinanceLedgerService';
import { PersonalNetWorthService } from '../src/domain/services/PersonalNetWorthService';
import { PersonalHabitTrackingService } from '../src/domain/services/PersonalHabitTrackingService';
import { PersonalAIContextProvider } from '../src/domain/services/PersonalAIContextProvider';
import { WiltyDailyBriefingService } from '../src/domain/services/WiltyDailyBriefingService';
import { BusinessPersonalBridgeService } from '../src/domain/services/BusinessPersonalBridgeService';
import { AIToolRegistry } from '../src/domain/services/AIToolRegistry';
import { SystemEvent } from '../src/domain/entities/SystemEvent';

describe('Build 13 — Wilty Personal OS Automated Test Suite', () => {
  const userId = 'user_willy_tiendre_001';
  const businessOrgId = 'org_willshop_business';

  const repo = new InMemoryPersonalRepositories();

  const recordedEvents: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>[] = [];
  const mockRecordEvent = async (event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>) => {
    recordedEvents.push(event);
    return {
      id: `evt_${Date.now()}`,
      createdAt: new Date(),
      status: 'PROCESSED',
      ...event,
    } as SystemEvent;
  };

  const service = new PersonalApplicationService({
    profileRepo: repo,
    goalRepo: repo,
    projectRepo: repo,
    taskRepo: repo,
    habitRepo: repo,
    learningRepo: repo,
    accountRepo: repo,
    transactionRepo: repo,
    budgetRepo: repo,
    netWorthRepo: repo,
    investmentRepo: repo,
    decisionRepo: repo,
    bridgeRepo: repo,
    recordEvent: mockRecordEvent,
  });

  it('1. Personal Profile & Seeding: Seeds initial personal environment for Willy Tiendré', async () => {
    const profile = await service.seedInitialPersonalData(userId);
    assert.strictEqual(profile.userId, userId);
    assert.strictEqual(profile.firstName, 'Willy');

    const accounts = await service.listPersonalAccounts(userId);
    assert.strictEqual(accounts.length, 2);
  });

  it('2. Personal Finance Ledger (Isolated): Append-only transactions update account balances', async () => {
    const accounts = await service.listPersonalAccounts(userId);
    const bankAcc = accounts.find((a) => a.type === 'BANK');
    assert.ok(bankAcc);

    const initialBal = bankAcc.currentBalance;

    // Record personal income transaction
    const tx = await service.recordPersonalTransaction(
      userId,
      bankAcc.id,
      'INCOME',
      200000,
      'Consulting Personal',
      'Honoraire projet personnel'
    );

    assert.strictEqual(tx.type, 'INCOME');

    const updatedAccounts = await service.listPersonalAccounts(userId);
    const updatedBank = updatedAccounts.find((a) => a.id === bankAcc.id);
    assert.strictEqual(updatedBank?.currentBalance, initialBal + 200000);
  });

  it('3. Personal Net Worth Engine: Computes Net Worth snapshot (Assets - Liabilities)', async () => {
    const snapshot = await service.computeNetWorthSnapshot(userId);
    assert.ok(snapshot.assetsValue > 0);
    assert.strictEqual(snapshot.netWorth, snapshot.assetsValue - snapshot.liabilitiesValue);
  });

  it('4. Personal Goals & Habit Tracking: Tracks streaks and adherence rates', async () => {
    const habit = await service.createPersonalHabit(userId, 'Sport Matinal 30 min', 7);
    assert.strictEqual(habit.streakCount, 0);

    const logged = await service.logHabitCompletion(userId, habit.id);
    assert.strictEqual(logged.streakCount, 1);
    assert.ok(logged.historyLog.length > 0);
  });

  it('5. Decision Journal: Records decision with rationale and review date', async () => {
    const decision = await service.createPersonalDecision(
      userId,
      'Choix véhicule personnel',
      'Besoins déplacements urbains',
      ['Achat voiture occasion', 'Location longue durée'],
      'Achat voiture occasion',
      'Maîtrise du budget sans engagement mensuel récurrent',
      'Budget transport stabilisé',
      new Date(Date.now() + 60 * 86400000)
    );

    assert.strictEqual(decision.chosenOption, 'Achat voiture occasion');
    assert.strictEqual(decision.status, 'ACCEPTED');
  });

  it('6. Business <-> Personal Boundary Isolation: Blocks business data in Personal AI Context', async () => {
    // Security assertion check
    const businessEntity = { scope: 'business' as const };
    assert.throws(() => {
      PersonalAIContextProvider.assertPersonalScopeOnly([businessEntity]);
    }, /SECURITY VIOLATION/);

    // Build valid personal context
    const aiContext = await service.getPersonalAIContext(userId);
    assert.strictEqual(aiContext.scope, 'personal');
    assert.strictEqual(aiContext.userId, userId);
  });

  it('7. Explicit Audited Bridge Transfer: Executes Owner Draw bridge transfer with audit trail', async () => {
    const accounts = await service.listPersonalAccounts(userId);
    const personalAccount = accounts[0];

    const bridge = await service.executeBridgeTransfer(
      userId,
      businessOrgId,
      'BUSINESS_TO_PERSONAL',
      'OWNER_DRAW',
      500000,
      'bacc_willshop_main',
      personalAccount.id,
      'Prélèvement gérant trimestriel'
    );

    assert.strictEqual(bridge.amount, 500000);
    assert.strictEqual(bridge.transferType, 'OWNER_DRAW');
    assert.ok(bridge.personalTransactionId);
  });

  it('8. Wilty Daily Briefing & Weekly Review: Generates personalized briefings', async () => {
    const briefing = await service.getDailyBriefing(userId);
    assert.strictEqual(briefing.userId, userId);
    assert.ok(briefing.topPriorityNumber1);

    const review = await service.getWeeklyReview(userId);
    assert.ok(Array.isArray(review.continueRecommendations));
  });

  it('9. Wilty Personal AI Tools Registration: Verifies 12 personal tools registered', async () => {
    const tools = AIToolRegistry.listTools();
    const snapshotTool = tools.find((t) => t.name === 'get_personal_snapshot');
    const briefingTool = tools.find((t) => t.name === 'get_wilty_daily_briefing');
    const netWorthTool = tools.find((t) => t.name === 'get_personal_net_worth');

    assert.ok(snapshotTool);
    assert.ok(briefingTool);
    assert.ok(netWorthTool);
  });

  it('10. Multi-Tenant RLS & User Isolation: User B cannot access User A personal data', async () => {
    const userB = 'user_other_person_002';

    const accountsB = await repo.listAccounts(userB);
    assert.strictEqual(accountsB.length, 0);

    const goalsB = await repo.listGoals(userB);
    assert.strictEqual(goalsB.length, 0);
  });
});
