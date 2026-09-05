/**
 * WILLShop OS — Strategy & Goals Engine Application Services
 * Orchestrates strategic vision, live BI KPI linking, goal progress, trajectory forecasting,
 * initiative prioritization, risk matrix, decision reviews, 90-day plan generation,
 * Stop/Start/Continue analysis, What-If scenario simulation, and event dispatches.
 * Application Layer.
 */

import { SystemEvent } from '../../domain/entities/SystemEvent';
import {
  Strategy,
  StrategicObjective,
  StrategicGoal,
  KeyResult,
  Initiative,
  StrategicMilestone,
  StrategyRisk,
  StrategicAssumption,
  StrategicDecision,
  StrategicPlan90Days,
  StrategicHealthSummary,
  StrategicPriority,
  GoalScopeType,
  LevelRating,
} from '../../domain/entities/StrategyEntities';
import {
  IStrategyRepository,
  IStrategicObjectiveRepository,
  IStrategicGoalRepository,
  IKeyResultRepository,
  IInitiativeRepository,
  IStrategicMilestoneRepository,
  IStrategyRiskRepository,
  IStrategicAssumptionRepository,
  IStrategicDecisionRepository,
} from '../../domain/interfaces/IStrategyRepositories';
import { GoalProgressService, GoalProgressMetrics } from '../../domain/services/GoalProgressService';
import { TrajectoryEngine } from '../../domain/services/TrajectoryEngine';
import { StrategicPrioritizationService } from '../../domain/services/StrategicPrioritizationService';
import { StrategicRiskMatrixService } from '../../domain/services/StrategicRiskMatrixService';
import { StrategicAlignmentEngine, StrategicAlignmentReport } from '../../domain/services/StrategicAlignmentEngine';
import { StopStartContinueEngine, RecommendationItem } from '../../domain/services/StopStartContinueEngine';
import { StrategicHealthEngine } from '../../domain/services/StrategicHealthEngine';
import { TeamTask } from '../../domain/entities/TeamEntities';

export interface StrategyApplicationServiceDependencies {
  strategyRepo: IStrategyRepository;
  objectiveRepo: IStrategicObjectiveRepository;
  goalRepo: IStrategicGoalRepository;
  keyResultRepo: IKeyResultRepository;
  initiativeRepo: IInitiativeRepository;
  milestoneRepo: IStrategicMilestoneRepository;
  riskRepo: IStrategyRiskRepository;
  assumptionRepo: IStrategicAssumptionRepository;
  decisionRepo: IStrategicDecisionRepository;
  fetchLiveKPIMetric?: (orgId: string, kpiKey: string) => Promise<number | null>;
  listTeamTasks?: (orgId: string) => Promise<TeamTask[]>;
  recordEvent?: (event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>) => Promise<SystemEvent>;
}

export class StrategyApplicationService {
  constructor(private deps: StrategyApplicationServiceDependencies) {}

  // --- STRATEGY & OBJECTIVES ---

  public async createStrategy(
    orgId: string,
    ownerId: string,
    title: string,
    vision: string,
    strategicPeriod: string,
    startDate: Date,
    endDate: Date,
    description?: string,
    mission?: string
  ): Promise<Strategy> {
    const strategy: Strategy = {
      id: `strat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      title,
      description,
      vision,
      mission,
      strategicPeriod,
      startDate,
      endDate,
      status: 'ACTIVE',
      ownerId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.strategyRepo.createStrategy(strategy);
  }

  public async listStrategies(orgId: string): Promise<Strategy[]> {
    return this.deps.strategyRepo.listStrategies(orgId);
  }

  public async createObjective(
    orgId: string,
    strategyId: string,
    ownerId: string,
    title: string,
    strategicPriority: StrategicPriority = 'P2_HIGH',
    timeframe: string = 'Q3-Q4 2026',
    description?: string,
    parentObjectiveId?: string
  ): Promise<StrategicObjective> {
    const obj: StrategicObjective = {
      id: `obj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      strategyId,
      title,
      description,
      strategicPriority,
      ownerId,
      timeframe,
      status: 'ON_TRACK',
      parentObjectiveId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.objectiveRepo.createObjective(obj);
  }

  public async listObjectives(orgId: string, strategyId?: string): Promise<StrategicObjective[]> {
    return this.deps.objectiveRepo.listObjectives(orgId, strategyId);
  }

  // --- GOALS & KPI LINKING ---

  public async createGoal(
    orgId: string,
    createdBy: string,
    ownerId: string,
    title: string,
    baselineValue: number,
    targetValue: number,
    unit: string,
    startDate: Date,
    dueDate: Date,
    goalType: GoalScopeType = 'STRATEGIC',
    objectiveId?: string,
    kpiKey?: string,
    description?: string
  ): Promise<StrategicGoal> {
    const goal: StrategicGoal = {
      id: `sgoal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      objectiveId,
      title,
      description,
      ownerId,
      goalType,
      kpiKey,
      baselineValue,
      baselineDate: new Date(),
      targetValue,
      currentValue: baselineValue,
      unit,
      startDate,
      dueDate,
      status: 'ON_TRACK',
      confidence: 'HIGH',
      forecastValue: targetValue,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.goalRepo.createGoal(goal);
  }

  /**
   * Synchronizes goal currentValue with real BI metrics (if kpiKey is linked).
   */
  public async syncGoalMetrics(orgId: string, goalId: string): Promise<StrategicGoal> {
    const goal = await this.deps.goalRepo.findGoalById(orgId, goalId);
    if (!goal) throw new Error(`Objectif '${goalId}' introuvable.`);

    if (goal.kpiKey && this.deps.fetchLiveKPIMetric) {
      const liveValue = await this.deps.fetchLiveKPIMetric(orgId, goal.kpiKey);
      if (liveValue !== null) {
        goal.currentValue = liveValue;
      }
    }

    // Re-evaluate trajectory
    const trajectory = TrajectoryEngine.evaluateTrajectory(goal);
    goal.status = trajectory.status;
    goal.forecastValue = trajectory.forecast;
    goal.updatedAt = new Date();

    const updated = await this.deps.goalRepo.updateGoal(goal);

    // Trigger alert if AT_RISK or OFF_TRACK
    if ((updated.status === 'AT_RISK' || updated.status === 'OFF_TRACK') && this.deps.recordEvent) {
      await this.deps.recordEvent({
        organizationId: orgId,
        eventType: updated.status === 'OFF_TRACK' ? 'strategy.goal_off_track' : 'strategy.goal_at_risk',
        payload: { goalId: goal.id, title: goal.title, status: updated.status, current: goal.currentValue, target: goal.targetValue },
      });
    }

    return updated;
  }

  public async updateGoalProgress(goalId: string, currentValue: number, orgId: string): Promise<StrategicGoal> {
    const goal = await this.deps.goalRepo.findGoalById(orgId, goalId);
    if (!goal) throw new Error(`Objectif '${goalId}' introuvable.`);
    goal.currentValue = currentValue;
    const trajectory = TrajectoryEngine.evaluateTrajectory(goal);
    goal.status = trajectory.status;
    goal.forecastValue = trajectory.forecast;
    goal.updatedAt = new Date();
    return this.deps.goalRepo.updateGoal(goal);
  }

  public async getGoalProgress(orgId: string, goalId: string): Promise<GoalProgressMetrics> {
    const goal = await this.deps.goalRepo.findGoalById(orgId, goalId);
    if (!goal) throw new Error(`Objectif '${goalId}' introuvable.`);
    return GoalProgressService.calculateProgress(goal);
  }

  public async listGoals(orgId: string): Promise<StrategicGoal[]> {
    return this.deps.goalRepo.listGoals(orgId);
  }

  // --- INITIATIVES & PRIORITIZATION ---

  public async createInitiative(
    orgId: string,
    ownerId: string,
    title: string,
    strategicImpact: LevelRating,
    expectedRevenue: number,
    expectedProfit: number,
    budget: number,
    startDate: Date,
    dueDate: Date,
    objectiveId?: string,
    goalId?: string,
    urgency: LevelRating = 'MEDIUM',
    effort: LevelRating = 'MEDIUM',
    riskLevel: LevelRating = 'MEDIUM',
    description?: string
  ): Promise<Initiative> {
    const expectedRoi = budget > 0 ? Math.round((expectedProfit / budget) * 100) : 0;

    const partialInit: Partial<Initiative> = {
      strategicImpact,
      expectedRevenue,
      urgency,
      effort,
      riskLevel,
    };
    const score = StrategicPrioritizationService.calculatePrioritizationScore(partialInit);

    const initiative: Initiative = {
      id: `init_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      objectiveId,
      goalId,
      title,
      description,
      ownerId,
      status: 'ACTIVE',
      strategicImpact,
      expectedFinancialImpact: expectedRevenue,
      urgency,
      effort,
      riskLevel,
      prioritizationScore: score,
      budget,
      actualCost: 0,
      expectedRevenue,
      expectedProfit,
      expectedRoi,
      startDate,
      dueDate,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.initiativeRepo.createInitiative(initiative);
  }

  public async getPrioritizedInitiatives(orgId: string): Promise<Initiative[]> {
    const initiatives = await this.deps.initiativeRepo.listInitiatives(orgId);
    return StrategicPrioritizationService.rankInitiatives(initiatives);
  }

  // --- RISKS & DECISIONS ---

  public async createRisk(
    orgId: string,
    ownerId: string,
    title: string,
    probability: LevelRating,
    impact: LevelRating,
    mitigationPlan: string,
    reviewDate: Date,
    strategyId?: string,
    objectiveId?: string,
    initiativeId?: string
  ): Promise<StrategyRisk> {
    const score = StrategicRiskMatrixService.computeRiskScore(probability, impact);

    const risk: StrategyRisk = {
      id: `risk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      strategyId,
      objectiveId,
      initiativeId,
      title,
      probability,
      impact,
      riskScore: score,
      mitigationPlan,
      ownerId,
      status: 'OPEN',
      reviewDate,
      createdAt: new Date(),
    };

    const saved = await this.deps.riskRepo.createRisk(risk);

    if (score >= 6 && this.deps.recordEvent) {
      await this.deps.recordEvent({
        organizationId: orgId,
        eventType: 'strategy.risk_high',
        payload: { riskId: saved.id, title: saved.title, score, mitigationPlan },
      });
    }

    return saved;
  }

  public async listRisks(orgId: string): Promise<StrategyRisk[]> {
    return this.deps.riskRepo.listRisks(orgId);
  }

  public async createDecision(
    orgId: string,
    ownerId: string,
    title: string,
    context: string,
    options: string[],
    chosenOption: string,
    reason: string,
    expectedOutcome: string,
    reviewDate: Date,
    strategyId?: string
  ): Promise<StrategicDecision> {
    const decision: StrategicDecision = {
      id: `dec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: orgId,
      strategyId,
      title,
      context,
      options,
      chosenOption,
      reason,
      expectedOutcome,
      ownerId,
      decisionDate: new Date(),
      reviewDate,
      status: 'ACCEPTED',
      createdAt: new Date(),
    };

    return this.deps.decisionRepo.createDecision(decision);
  }

  public async listDecisions(orgId: string): Promise<StrategicDecision[]> {
    return this.deps.decisionRepo.listDecisions(orgId);
  }

  // --- 90-DAY PLAN & ROADMAP ---

  public async getPlan90Days(orgId: string): Promise<StrategicPlan90Days> {
    const objectives = await this.deps.objectiveRepo.listObjectives(orgId);
    const initiatives = await this.getPrioritizedInitiatives(orgId);
    const risks = await this.deps.riskRepo.listRisks(orgId);

    const topPriorities = objectives
      .filter((o) => o.strategicPriority === 'P1_CRITICAL' || o.strategicPriority === 'P2_HIGH')
      .slice(0, 5)
      .map((o) => o.title);

    if (topPriorities.length === 0) {
      topPriorities.push('Atteindre la rentabilité nette cible', 'Fiabiliser le taux de livraison');
    }

    const criticalRisks = risks.filter((r) => r.riskScore >= 6 && r.status === 'OPEN');

    return {
      organizationId: orgId,
      periodName: 'Plan Stratégique 90 Jours WillShop',
      topPriorities,
      activeInitiatives: initiatives.slice(0, 6),
      keyMilestones: [],
      criticalRisks,
    };
  }

  // --- STRATEGIC HEALTH & STOP/START/CONTINUE ---

  public async getStrategyHealth(orgId: string): Promise<StrategicHealthSummary> {
    const goals = await this.deps.goalRepo.listGoals(orgId);
    const initiatives = await this.deps.initiativeRepo.listInitiatives(orgId);
    const risks = await this.deps.riskRepo.listRisks(orgId);
    const tasks = this.deps.listTeamTasks ? await this.deps.listTeamTasks(orgId) : [];

    const alignmentReport = StrategicAlignmentEngine.analyzeAlignment(initiatives, goals, tasks);
    return StrategicHealthEngine.computeHealth(goals, initiatives, risks, alignmentReport.alignmentRatio);
  }

  public async getRecommendations(orgId: string): Promise<RecommendationItem[]> {
    const initiatives = await this.deps.initiativeRepo.listInitiatives(orgId);
    const goals = await this.deps.goalRepo.listGoals(orgId);
    const risks = await this.deps.riskRepo.listRisks(orgId);
    return StopStartContinueEngine.generateRecommendations(initiatives, goals, risks);
  }

  // --- WHAT-IF SCENARIO PLANNING ---

  public async simulateWhatIfScenario(
    orgId: string,
    scenarioName: string,
    targetAdjustmentFactor: number, // e.g. 0.7 for 70% target, 1.3 for +30% revenue
    marketingCostAdjustment: number // e.g. 1.2 for +20% ad spend
  ): Promise<{
    scenarioName: string;
    baselineRevenue: number;
    projectedRevenue: number;
    baselineProfit: number;
    projectedProfit: number;
    riskAssessment: string;
  }> {
    const goals = await this.deps.goalRepo.listGoals(orgId);
    const revGoal = goals.find((g) => g.kpiKey === 'revenue_month') || { currentValue: 2500000, targetValue: 5000000 };

    const baselineRevenue = revGoal.currentValue || 2500000;
    const projectedRevenue = Math.round(baselineRevenue * targetAdjustmentFactor);

    const baselineProfit = Math.round(baselineRevenue * 0.25);
    const projectedProfit = Math.round(projectedRevenue * 0.25 - 150000 * (marketingCostAdjustment - 1));

    let riskAssessment = 'Scénario réaliste avec impact modéré sur la rentabilité.';
    if (targetAdjustmentFactor < 0.8) {
      riskAssessment = 'Risque élevé d\'échec de l\'objectif de rentabilité mensuel.';
    } else if (marketingCostAdjustment > 1.3) {
      riskAssessment = 'Risque de dégradation du CAC et d\'érosion de la marge nette.';
    }

    return {
      scenarioName,
      baselineRevenue,
      projectedRevenue,
      baselineProfit,
      projectedProfit,
      riskAssessment,
    };
  }

  // --- SEED INITIAL STRATEGY DATA ---

  public async seedInitialStrategy(orgId: string, ownerId: string): Promise<Strategy> {
    const existing = await this.deps.strategyRepo.listStrategies(orgId);
    if (existing.length > 0) return existing[0];

    const strategy = await this.createStrategy(
      orgId,
      ownerId,
      'Stratégie de Croissance & Rentabilité WillShop 2026',
      'Devenir la plateforme e-commerce d\'excellence en Afrique de l\'Ouest, reconnue pour la qualité et la fiabilité de ses livraisons.',
      'Q3-Q4 2026',
      new Date(),
      new Date(Date.now() + 180 * 86400000),
      'Aligner le marketing, les ventes, les stocks et la livraison vers une rentabilité nette positive.'
    );

    const obj1 = await this.createObjective(
      orgId,
      strategy.id,
      ownerId,
      'Augmenter la rentabilité et la contribution profit mensuelle',
      'P1_CRITICAL',
      'Q3-Q4 2026'
    );

    const obj2 = await this.createObjective(
      orgId,
      strategy.id,
      ownerId,
      'Optimiser l\'efficacité opérationnelle de livraison et stock',
      'P2_HIGH',
      'Q3-Q4 2026'
    );

    await this.createGoal(
      orgId,
      ownerId,
      ownerId,
      'Atteindre 2 000 000 FCFA de Contribution Profit Mensuelle',
      500000,
      2000000,
      'FCFA',
      new Date(),
      new Date(Date.now() + 90 * 86400000),
      'FINANCIAL',
      obj1.id,
      'contribution_profit'
    );

    await this.createGoal(
      orgId,
      ownerId,
      ownerId,
      'Atteindre un taux de livraison réussie ≥ 92%',
      80.0,
      92.0,
      '%',
      new Date(),
      new Date(Date.now() + 90 * 86400000),
      'OPERATIONS',
      obj2.id,
      'delivery_rate'
    );

    await this.createInitiative(
      orgId,
      ownerId,
      'Campagne Marketing WhatsApp Retargeting Client VIP',
      'HIGH',
      800000,
      350000,
      100000,
      new Date(),
      new Date(Date.now() + 45 * 86400000),
      obj1.id,
      undefined,
      'HIGH',
      'MEDIUM',
      'LOW'
    );

    await this.createRisk(
      orgId,
      ownerId,
      'Hausse des coûts publicitaires Meta (CAC deterioration)',
      'HIGH',
      'MEDIUM',
      'Réguler les budgets pub automatiquement via MarketingBudgetService si ROI < 1.0',
      new Date(Date.now() + 30 * 86400000),
      strategy.id,
      obj1.id
    );

    return strategy;
  }
}
