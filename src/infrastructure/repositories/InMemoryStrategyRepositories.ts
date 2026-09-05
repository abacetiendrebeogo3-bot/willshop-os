/**
 * WILLShop OS — In-Memory Strategy Repositories
 * Fast In-Memory Infrastructure implementation for testing and rapid execution.
 */

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
} from '../../domain/entities/StrategyEntities';

export class InMemoryStrategyRepositories
  implements
    IStrategyRepository,
    IStrategicObjectiveRepository,
    IStrategicGoalRepository,
    IKeyResultRepository,
    IInitiativeRepository,
    IStrategicMilestoneRepository,
    IStrategyRiskRepository,
    IStrategicAssumptionRepository,
    IStrategicDecisionRepository
{
  private strategies: Strategy[] = [];
  private objectives: StrategicObjective[] = [];
  private goals: StrategicGoal[] = [];
  private keyResults: KeyResult[] = [];
  private initiatives: Initiative[] = [];
  private milestones: StrategicMilestone[] = [];
  private risks: StrategyRisk[] = [];
  private assumptions: StrategicAssumption[] = [];
  private decisions: StrategicDecision[] = [];

  // Strategy
  public async createStrategy(strategy: Strategy): Promise<Strategy> {
    this.strategies.push(strategy);
    return strategy;
  }
  public async updateStrategy(strategy: Strategy): Promise<Strategy> {
    const idx = this.strategies.findIndex((s) => s.organizationId === strategy.organizationId && s.id === strategy.id);
    if (idx >= 0) this.strategies[idx] = { ...strategy, updatedAt: new Date() };
    else this.strategies.push(strategy);
    return strategy;
  }
  public async findStrategyById(orgId: string, id: string): Promise<Strategy | null> {
    return this.strategies.find((s) => s.organizationId === orgId && s.id === id) || null;
  }
  public async listStrategies(orgId: string): Promise<Strategy[]> {
    return this.strategies.filter((s) => s.organizationId === orgId);
  }

  // Objective
  public async createObjective(objective: StrategicObjective): Promise<StrategicObjective> {
    this.objectives.push(objective);
    return objective;
  }
  public async updateObjective(objective: StrategicObjective): Promise<StrategicObjective> {
    const idx = this.objectives.findIndex((o) => o.organizationId === objective.organizationId && o.id === objective.id);
    if (idx >= 0) this.objectives[idx] = { ...objective, updatedAt: new Date() };
    else this.objectives.push(objective);
    return objective;
  }
  public async findObjectiveById(orgId: string, id: string): Promise<StrategicObjective | null> {
    return this.objectives.find((o) => o.organizationId === orgId && o.id === id) || null;
  }
  public async listObjectives(orgId: string, strategyId?: string): Promise<StrategicObjective[]> {
    let res = this.objectives.filter((o) => o.organizationId === orgId);
    if (strategyId) res = res.filter((o) => o.strategyId === strategyId);
    return res;
  }

  // Goal
  public async createGoal(goal: StrategicGoal): Promise<StrategicGoal> {
    this.goals.push(goal);
    return goal;
  }
  public async updateGoal(goal: StrategicGoal): Promise<StrategicGoal> {
    const idx = this.goals.findIndex((g) => g.organizationId === goal.organizationId && g.id === goal.id);
    if (idx >= 0) this.goals[idx] = { ...goal, updatedAt: new Date() };
    else this.goals.push(goal);
    return goal;
  }
  public async findGoalById(orgId: string, id: string): Promise<StrategicGoal | null> {
    return this.goals.find((g) => g.organizationId === orgId && g.id === id) || null;
  }
  public async listGoals(orgId: string, filters?: { objectiveId?: string; kpiKey?: string }): Promise<StrategicGoal[]> {
    let res = this.goals.filter((g) => g.organizationId === orgId);
    if (filters?.objectiveId) res = res.filter((g) => g.objectiveId === filters.objectiveId);
    if (filters?.kpiKey) res = res.filter((g) => g.kpiKey === filters.kpiKey);
    return res;
  }

  // Key Results
  public async createKeyResult(kr: KeyResult): Promise<KeyResult> {
    this.keyResults.push(kr);
    return kr;
  }
  public async updateKeyResult(kr: KeyResult): Promise<KeyResult> {
    const idx = this.keyResults.findIndex((k) => k.organizationId === kr.organizationId && k.id === kr.id);
    if (idx >= 0) this.keyResults[idx] = { ...kr, updatedAt: new Date() };
    else this.keyResults.push(kr);
    return kr;
  }
  public async listKeyResults(orgId: string, goalId: string): Promise<KeyResult[]> {
    return this.keyResults.filter((k) => k.organizationId === orgId && k.goalId === goalId);
  }

  // Initiative
  public async createInitiative(initiative: Initiative): Promise<Initiative> {
    this.initiatives.push(initiative);
    return initiative;
  }
  public async updateInitiative(initiative: Initiative): Promise<Initiative> {
    const idx = this.initiatives.findIndex((i) => i.organizationId === initiative.organizationId && i.id === initiative.id);
    if (idx >= 0) this.initiatives[idx] = { ...initiative, updatedAt: new Date() };
    else this.initiatives.push(initiative);
    return initiative;
  }
  public async findInitiativeById(orgId: string, id: string): Promise<Initiative | null> {
    return this.initiatives.find((i) => i.organizationId === orgId && i.id === id) || null;
  }
  public async listInitiatives(orgId: string, filters?: { objectiveId?: string; goalId?: string }): Promise<Initiative[]> {
    let res = this.initiatives.filter((i) => i.organizationId === orgId);
    if (filters?.objectiveId) res = res.filter((i) => i.objectiveId === filters.objectiveId);
    if (filters?.goalId) res = res.filter((i) => i.goalId === filters.goalId);
    return res;
  }

  // Milestones
  public async createMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone> {
    this.milestones.push(milestone);
    return milestone;
  }
  public async updateMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone> {
    const idx = this.milestones.findIndex((m) => m.organizationId === milestone.organizationId && m.id === milestone.id);
    if (idx >= 0) this.milestones[idx] = milestone;
    else this.milestones.push(milestone);
    return milestone;
  }
  public async listMilestones(orgId: string, initiativeId: string): Promise<StrategicMilestone[]> {
    return this.milestones.filter((m) => m.organizationId === orgId && m.initiativeId === initiativeId);
  }

  // Risks
  public async createRisk(risk: StrategyRisk): Promise<StrategyRisk> {
    this.risks.push(risk);
    return risk;
  }
  public async updateRisk(risk: StrategyRisk): Promise<StrategyRisk> {
    const idx = this.risks.findIndex((r) => r.organizationId === risk.organizationId && r.id === risk.id);
    if (idx >= 0) this.risks[idx] = risk;
    else this.risks.push(risk);
    return risk;
  }
  public async listRisks(orgId: string): Promise<StrategyRisk[]> {
    return this.risks.filter((r) => r.organizationId === orgId);
  }

  // Assumptions
  public async createAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption> {
    this.assumptions.push(assumption);
    return assumption;
  }
  public async updateAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption> {
    const idx = this.assumptions.findIndex((a) => a.organizationId === assumption.organizationId && a.id === assumption.id);
    if (idx >= 0) this.assumptions[idx] = assumption;
    else this.assumptions.push(assumption);
    return assumption;
  }
  public async listAssumptions(orgId: string, strategyId?: string): Promise<StrategicAssumption[]> {
    let res = this.assumptions.filter((a) => a.organizationId === orgId);
    if (strategyId) res = res.filter((a) => a.strategyId === strategyId);
    return res;
  }

  // Decisions
  public async createDecision(decision: StrategicDecision): Promise<StrategicDecision> {
    this.decisions.push(decision);
    return decision;
  }
  public async updateDecision(decision: StrategicDecision): Promise<StrategicDecision> {
    const idx = this.decisions.findIndex((d) => d.organizationId === decision.organizationId && d.id === decision.id);
    if (idx >= 0) this.decisions[idx] = decision;
    else this.decisions.push(decision);
    return decision;
  }
  public async findDecisionById(orgId: string, id: string): Promise<StrategicDecision | null> {
    return this.decisions.find((d) => d.organizationId === orgId && d.id === id) || null;
  }
  public async listDecisions(orgId: string): Promise<StrategicDecision[]> {
    return this.decisions.filter((d) => d.organizationId === orgId);
  }
}
