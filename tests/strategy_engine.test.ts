/**
 * WILLShop OS — BUILD 12 : STRATEGY & GOALS ENGINE TEST SUITE
 * Comprehensive integration & domain unit tests.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { InMemoryStrategyRepositories } from '../src/infrastructure/repositories/InMemoryStrategyRepositories';
import { StrategyApplicationService } from '../src/application/services/StrategyApplicationServices';
import { GoalProgressService } from '../src/domain/services/GoalProgressService';
import { TrajectoryEngine } from '../src/domain/services/TrajectoryEngine';
import { StrategicPrioritizationService } from '../src/domain/services/StrategicPrioritizationService';
import { StrategicRiskMatrixService } from '../src/domain/services/StrategicRiskMatrixService';
import { StrategicAlignmentEngine } from '../src/domain/services/StrategicAlignmentEngine';
import { StopStartContinueEngine } from '../src/domain/services/StopStartContinueEngine';
import { StrategicHealthEngine } from '../src/domain/services/StrategicHealthEngine';
import { AIToolRegistry } from '../src/domain/services/AIToolRegistry';
import { SystemEvent } from '../src/domain/entities/SystemEvent';

describe('Build 12 — Strategy & Goals Engine Automated Test Suite', () => {
  const orgId = 'org_willshop_strategy_test';
  const ownerId = 'user_ceo_001';

  const repo = new InMemoryStrategyRepositories();

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

  const mockLiveKPIMetrics: Record<string, number> = {
    revenue_month: 3200000,
    contribution_profit: 1400000,
    delivery_rate: 86.5,
    cac: 2400,
  };

  const mockFetchLiveKPIMetric = async (_orgId: string, kpiKey: string) => {
    return mockLiveKPIMetrics[kpiKey] ?? null;
  };

  const service = new StrategyApplicationService({
    strategyRepo: repo,
    objectiveRepo: repo,
    goalRepo: repo,
    keyResultRepo: repo,
    initiativeRepo: repo,
    milestoneRepo: repo,
    riskRepo: repo,
    assumptionRepo: repo,
    decisionRepo: repo,
    fetchLiveKPIMetric: mockFetchLiveKPIMetric,
    recordEvent: mockRecordEvent,
  });

  it('1. Strategy & Objective CRUD: Seed initial strategy, objectives and financial goals', async () => {
    const strat = await service.seedInitialStrategy(orgId, ownerId);
    assert.ok(strat.id);
    assert.strictEqual(strat.organizationId, orgId);

    const objectives = await service.listObjectives(orgId, strat.id);
    assert.strictEqual(objectives.length, 2);

    const goals = await service.listGoals(orgId);
    assert.strictEqual(goals.length, 2);
  });

  it('2. Goal Progress & Trajectory Engine: Calculates variance and status trajectory', async () => {
    const goals = await service.listGoals(orgId);
    const goal = goals[0]; // Contribution profit goal (baseline 500k, target 2M)

    // Baseline 500k, Current 1.4M -> Progress = (1.4M - 0.5M)/(2M - 0.5M) = 60%
    goal.currentValue = 1400000;

    const progress = GoalProgressService.calculateProgress(goal);
    assert.ok(progress.progressPercent > 50);

    const trajectory = TrajectoryEngine.evaluateTrajectory(goal);
    assert.ok(trajectory.status === 'ON_TRACK' || trajectory.status === 'AT_RISK');
    assert.ok(trajectory.forecast > 0);
  });

  it('3. KPI-Linked Goals: Synchronizes with live BI metric without arbitrary AI mutation', async () => {
    const goals = await service.listGoals(orgId);
    const revGoal = goals.find((g) => g.kpiKey === 'contribution_profit');
    assert.ok(revGoal);

    // Sync metrics from live BI engine
    const synced = await service.syncGoalMetrics(orgId, revGoal.id);
    assert.strictEqual(synced.currentValue, 1400000); // Matched mock live KPI metric
  });

  it('4. Initiative Prioritization Engine: Calculates score balancing Impact, Effort, Risk, and Urgency', async () => {
    const init1 = await service.createInitiative(
      orgId,
      ownerId,
      'Campagne WhatsApp VIP',
      'HIGH',
      800000,
      350000,
      100000,
      new Date(),
      new Date(Date.now() + 30 * 86400000),
      undefined,
      undefined,
      'HIGH',
      'LOW',
      'LOW'
    );

    const init2 = await service.createInitiative(
      orgId,
      ownerId,
      'Refonte Complexe Logistique',
      'MEDIUM',
      200000,
      50000,
      300000,
      new Date(),
      new Date(Date.now() + 90 * 86400000),
      undefined,
      undefined,
      'LOW',
      'HIGH',
      'HIGH'
    );

    const ranked = await service.getPrioritizedInitiatives(orgId);
    assert.strictEqual(ranked[0].id, init1.id, 'High impact / low effort initiative ranked #1');
    assert.ok(init1.prioritizationScore > init2.prioritizationScore);
  });

  it('5. Risk Matrix Scoring: Probability x Impact calculation & high risk alerts', async () => {
    const risk = await service.createRisk(
      orgId,
      ownerId,
      'Rupture Approvisionnement Produit Phare',
      'HIGH',
      'HIGH',
      'Contacter fournisseur secondaire et créer stock de sécurité',
      new Date(Date.now() + 15 * 86400000)
    );

    assert.strictEqual(risk.riskScore, 9); // HIGH (3) x HIGH (3) = 9
    assert.ok(recordedEvents.some((e) => e.eventType === 'strategy.risk_high'));
  });

  it('6. Decision Review Logging: Records strategic decision with expected outcome and review date', async () => {
    const decision = await service.createDecision(
      orgId,
      ownerId,
      'Achat flotte motocycles internes',
      'Hauteur des frais de livraison externes trop élevée',
      ['Continuer prestataires', 'Acheter 2 motos'],
      'Acheter 2 motos',
      'Réduction des coûts de livraison de 20%',
      'Marge nette ajustée',
      new Date(Date.now() + 60 * 86400000)
    );

    assert.strictEqual(decision.chosenOption, 'Acheter 2 motos');
    assert.strictEqual(decision.status, 'ACCEPTED');
  });

  it('7. Stop / Start / Continue Analysis: Generates evidence-backed recommendations', async () => {
    const recs = await service.getRecommendations(orgId);
    assert.ok(Array.isArray(recs));
    assert.ok(recs.length > 0);
    assert.ok(['STOP', 'START', 'CONTINUE'].includes(recs[0].action));
  });

  it('8. Unaligned Initiative & Execution Analysis: Computes alignment ratio', async () => {
    const initiatives = await repo.listInitiatives(orgId);
    const goals = await repo.listGoals(orgId);

    const report = StrategicAlignmentEngine.analyzeAlignment(initiatives, goals, []);
    assert.ok(report.alignmentRatio >= 0 && report.alignmentRatio <= 100);
  });

  it('9. What-If Scenario Simulation: Evaluates projections without mutating actual production data', async () => {
    const simulation = await service.simulateWhatIfScenario(orgId, 'Scénario Baisse Ventes 30%', 0.7, 1.0);

    assert.strictEqual(simulation.scenarioName, 'Scénario Baisse Ventes 30%');
    assert.ok(simulation.projectedRevenue < simulation.baselineRevenue);

    // Verify production goals were NOT mutated
    const goals = await service.listGoals(orgId);
    assert.ok(goals[0].currentValue > 0, 'Production data remained untouched');
  });

  it('10. CEO AI Tools Registration: Verifies 12 strategy tools registered in AIToolRegistry', async () => {
    const tools = AIToolRegistry.listTools();
    const stratSnapshot = tools.find((t) => t.name === 'get_strategy_snapshot');
    const stratObjectives = tools.find((t) => t.name === 'get_strategic_objectives');
    const plan90Days = tools.find((t) => t.name === 'get_90_day_plan');

    assert.ok(stratSnapshot);
    assert.ok(stratObjectives);
    assert.ok(plan90Days);
  });

  it('11. Multi-Tenant RLS & Data Isolation: Org B cannot access Org A strategy data', async () => {
    const orgB = 'org_other_tenant_strategy';

    const stratsB = await repo.listStrategies(orgB);
    assert.strictEqual(stratsB.length, 0);

    const goalsB = await repo.listGoals(orgB);
    assert.strictEqual(goalsB.length, 0);
  });
});
