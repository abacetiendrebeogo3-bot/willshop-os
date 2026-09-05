/**
 * WILLShop OS — Strategy & Goals Repositories Contracts
 * Pure Domain Interfaces — Data Core Contracts.
 */

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
} from '../entities/StrategyEntities';

export interface IStrategyRepository {
  createStrategy(strategy: Strategy): Promise<Strategy>;
  updateStrategy(strategy: Strategy): Promise<Strategy>;
  findStrategyById(orgId: string, id: string): Promise<Strategy | null>;
  listStrategies(orgId: string): Promise<Strategy[]>;
}

export interface IStrategicObjectiveRepository {
  createObjective(objective: StrategicObjective): Promise<StrategicObjective>;
  updateObjective(objective: StrategicObjective): Promise<StrategicObjective>;
  findObjectiveById(orgId: string, id: string): Promise<StrategicObjective | null>;
  listObjectives(orgId: string, strategyId?: string): Promise<StrategicObjective[]>;
}

export interface IStrategicGoalRepository {
  createGoal(goal: StrategicGoal): Promise<StrategicGoal>;
  updateGoal(goal: StrategicGoal): Promise<StrategicGoal>;
  findGoalById(orgId: string, id: string): Promise<StrategicGoal | null>;
  listGoals(orgId: string, filters?: { objectiveId?: string; kpiKey?: string }): Promise<StrategicGoal[]>;
}

export interface IKeyResultRepository {
  createKeyResult(kr: KeyResult): Promise<KeyResult>;
  updateKeyResult(kr: KeyResult): Promise<KeyResult>;
  listKeyResults(orgId: string, goalId: string): Promise<KeyResult[]>;
}

export interface IInitiativeRepository {
  createInitiative(initiative: Initiative): Promise<Initiative>;
  updateInitiative(initiative: Initiative): Promise<Initiative>;
  findInitiativeById(orgId: string, id: string): Promise<Initiative | null>;
  listInitiatives(orgId: string, filters?: { objectiveId?: string; goalId?: string }): Promise<Initiative[]>;
}

export interface IStrategicMilestoneRepository {
  createMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone>;
  updateMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone>;
  listMilestones(orgId: string, initiativeId: string): Promise<StrategicMilestone[]>;
}

export interface IStrategyRiskRepository {
  createRisk(risk: StrategyRisk): Promise<StrategyRisk>;
  updateRisk(risk: StrategyRisk): Promise<StrategyRisk>;
  listRisks(orgId: string): Promise<StrategyRisk[]>;
}

export interface IStrategicAssumptionRepository {
  createAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption>;
  updateAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption>;
  listAssumptions(orgId: string, strategyId?: string): Promise<StrategicAssumption[]>;
}

export interface IStrategicDecisionRepository {
  createDecision(decision: StrategicDecision): Promise<StrategicDecision>;
  updateDecision(decision: StrategicDecision): Promise<StrategicDecision>;
  findDecisionById(orgId: string, id: string): Promise<StrategicDecision | null>;
  listDecisions(orgId: string): Promise<StrategicDecision[]>;
}
