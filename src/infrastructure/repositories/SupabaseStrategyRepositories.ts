/**
 * WILLShop OS — Supabase Strategy Repositories
 * Production Supabase PostgreSQL implementation with snake_case column mapping.
 */

import { SupabaseClient } from '@supabase/supabase-js';
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

export class SupabaseStrategyRepositories
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
  constructor(private client: SupabaseClient) {}

  // --- MAPPERS ---

  private mapDBToStrategy(row: any): Strategy {
    return {
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      description: row.description,
      vision: row.vision,
      mission: row.mission,
      strategicPeriod: row.strategic_period,
      startDate: row.start_date ? new Date(row.start_date) : new Date(),
      endDate: row.end_date ? new Date(row.end_date) : new Date(),
      status: row.status,
      ownerId: row.owner_id,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapStrategyToDB(strat: Partial<Strategy>): any {
    const db: any = {};
    if (strat.id !== undefined) db.id = strat.id;
    if (strat.organizationId !== undefined) db.organization_id = strat.organizationId;
    if (strat.title !== undefined) db.title = strat.title;
    if (strat.description !== undefined) db.description = strat.description;
    if (strat.vision !== undefined) db.vision = strat.vision;
    if (strat.mission !== undefined) db.mission = strat.mission;
    if (strat.strategicPeriod !== undefined) db.strategic_period = strat.strategicPeriod;
    if (strat.startDate !== undefined) db.start_date = strat.startDate;
    if (strat.endDate !== undefined) db.end_date = strat.endDate;
    if (strat.status !== undefined) db.status = strat.status;
    if (strat.ownerId !== undefined) db.owner_id = strat.ownerId;
    if (strat.createdAt !== undefined) db.created_at = strat.createdAt;
    if (strat.updatedAt !== undefined) db.updated_at = strat.updatedAt;
    return db;
  }

  private mapDBToObjective(row: any): StrategicObjective {
    return {
      id: row.id,
      organizationId: row.organization_id,
      strategyId: row.strategy_id,
      title: row.title,
      description: row.description,
      strategicPriority: row.strategic_priority,
      ownerId: row.owner_id,
      timeframe: row.timeframe,
      status: row.status,
      parentObjectiveId: row.parent_objective_id,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapObjectiveToDB(obj: Partial<StrategicObjective>): any {
    const db: any = {};
    if (obj.id !== undefined) db.id = obj.id;
    if (obj.organizationId !== undefined) db.organization_id = obj.organizationId;
    if (obj.strategyId !== undefined) db.strategy_id = obj.strategyId;
    if (obj.title !== undefined) db.title = obj.title;
    if (obj.description !== undefined) db.description = obj.description;
    if (obj.strategicPriority !== undefined) db.strategic_priority = obj.strategicPriority;
    if (obj.ownerId !== undefined) db.owner_id = obj.ownerId;
    if (obj.timeframe !== undefined) db.timeframe = obj.timeframe;
    if (obj.status !== undefined) db.status = obj.status;
    if (obj.parentObjectiveId !== undefined) db.parent_objective_id = obj.parentObjectiveId;
    if (obj.createdAt !== undefined) db.created_at = obj.createdAt;
    if (obj.updatedAt !== undefined) db.updated_at = obj.updatedAt;
    return db;
  }

  private mapDBToGoal(row: any): StrategicGoal {
    return {
      id: row.id,
      organizationId: row.organization_id,
      objectiveId: row.objective_id,
      title: row.title,
      description: row.description,
      ownerId: row.owner_id,
      teamId: row.team_id,
      goalType: row.goal_type,
      kpiKey: row.kpi_key,
      baselineValue: Number(row.baseline_value || 0),
      baselineDate: row.baseline_date ? new Date(row.baseline_date) : new Date(),
      targetValue: Number(row.target_value || 0),
      currentValue: Number(row.current_value || 0),
      unit: row.unit || 'units',
      startDate: row.start_date ? new Date(row.start_date) : new Date(),
      dueDate: row.due_date ? new Date(row.due_date) : new Date(),
      status: row.status,
      confidence: row.confidence || 'HIGH',
      forecastValue: row.forecast_value !== null && row.forecast_value !== undefined ? Number(row.forecast_value) : undefined,
      createdBy: row.created_by,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapGoalToDB(goal: Partial<StrategicGoal>): any {
    const db: any = {};
    if (goal.id !== undefined) db.id = goal.id;
    if (goal.organizationId !== undefined) db.organization_id = goal.organizationId;
    if (goal.objectiveId !== undefined) db.objective_id = goal.objectiveId;
    if (goal.title !== undefined) db.title = goal.title;
    if (goal.description !== undefined) db.description = goal.description;
    if (goal.ownerId !== undefined) db.owner_id = goal.ownerId;
    if (goal.teamId !== undefined) db.team_id = goal.teamId;
    if (goal.goalType !== undefined) db.goal_type = goal.goalType;
    if (goal.kpiKey !== undefined) db.kpi_key = goal.kpiKey;
    if (goal.baselineValue !== undefined) db.baseline_value = goal.baselineValue;
    if (goal.baselineDate !== undefined) db.baseline_date = goal.baselineDate;
    if (goal.targetValue !== undefined) db.target_value = goal.targetValue;
    if (goal.currentValue !== undefined) db.current_value = goal.currentValue;
    if (goal.unit !== undefined) db.unit = goal.unit;
    if (goal.startDate !== undefined) db.start_date = goal.startDate;
    if (goal.dueDate !== undefined) db.due_date = goal.dueDate;
    if (goal.status !== undefined) db.status = goal.status;
    if (goal.confidence !== undefined) db.confidence = goal.confidence;
    if (goal.forecastValue !== undefined) db.forecast_value = goal.forecastValue;
    if (goal.createdBy !== undefined) db.created_by = goal.createdBy;
    if (goal.createdAt !== undefined) db.created_at = goal.createdAt;
    if (goal.updatedAt !== undefined) db.updated_at = goal.updatedAt;
    return db;
  }

  private mapDBToInitiative(row: any): Initiative {
    return {
      id: row.id,
      organizationId: row.organization_id,
      objectiveId: row.objective_id,
      goalId: row.goal_id,
      title: row.title,
      description: row.description,
      ownerId: row.owner_id,
      teamId: row.team_id,
      status: row.status,
      strategicImpact: row.strategic_impact,
      expectedFinancialImpact: Number(row.expected_financial_impact || 0),
      urgency: row.urgency,
      effort: row.effort,
      riskLevel: row.risk_level,
      prioritizationScore: Number(row.prioritization_score || 0),
      budget: Number(row.budget || 0),
      actualCost: Number(row.actual_cost || 0),
      expectedRevenue: Number(row.expected_revenue || 0),
      expectedProfit: Number(row.expected_profit || 0),
      expectedRoi: Number(row.expected_roi || 0),
      startDate: row.start_date ? new Date(row.start_date) : new Date(),
      dueDate: row.due_date ? new Date(row.due_date) : new Date(),
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
      updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
    };
  }

  private mapInitiativeToDB(init: Partial<Initiative>): any {
    const db: any = {};
    if (init.id !== undefined) db.id = init.id;
    if (init.organizationId !== undefined) db.organization_id = init.organizationId;
    if (init.objectiveId !== undefined) db.objective_id = init.objectiveId;
    if (init.goalId !== undefined) db.goal_id = init.goalId;
    if (init.title !== undefined) db.title = init.title;
    if (init.description !== undefined) db.description = init.description;
    if (init.ownerId !== undefined) db.owner_id = init.ownerId;
    if (init.teamId !== undefined) db.team_id = init.teamId;
    if (init.status !== undefined) db.status = init.status;
    if (init.strategicImpact !== undefined) db.strategic_impact = init.strategicImpact;
    if (init.expectedFinancialImpact !== undefined) db.expected_financial_impact = init.expectedFinancialImpact;
    if (init.urgency !== undefined) db.urgency = init.urgency;
    if (init.effort !== undefined) db.effort = init.effort;
    if (init.riskLevel !== undefined) db.risk_level = init.riskLevel;
    if (init.prioritizationScore !== undefined) db.prioritization_score = init.prioritizationScore;
    if (init.budget !== undefined) db.budget = init.budget;
    if (init.actualCost !== undefined) db.actual_cost = init.actualCost;
    if (init.expectedRevenue !== undefined) db.expected_revenue = init.expectedRevenue;
    if (init.expectedProfit !== undefined) db.expected_profit = init.expectedProfit;
    if (init.expectedRoi !== undefined) db.expected_roi = init.expectedRoi;
    if (init.startDate !== undefined) db.start_date = init.startDate;
    if (init.dueDate !== undefined) db.due_date = init.dueDate;
    if (init.createdAt !== undefined) db.created_at = init.createdAt;
    if (init.updatedAt !== undefined) db.updated_at = init.updatedAt;
    return db;
  }

  private mapDBToRisk(row: any): StrategyRisk {
    return {
      id: row.id,
      organizationId: row.organization_id,
      strategyId: row.strategy_id,
      objectiveId: row.objective_id,
      initiativeId: row.initiative_id,
      title: row.title,
      description: row.description,
      probability: row.probability,
      impact: row.impact,
      riskScore: Number(row.risk_score || 0),
      mitigationPlan: row.mitigation_plan,
      ownerId: row.owner_id,
      status: row.status,
      reviewDate: row.review_date ? new Date(row.review_date) : new Date(),
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

  private mapRiskToDB(risk: Partial<StrategyRisk>): any {
    const db: any = {};
    if (risk.id !== undefined) db.id = risk.id;
    if (risk.organizationId !== undefined) db.organization_id = risk.organizationId;
    if (risk.strategyId !== undefined) db.strategy_id = risk.strategyId;
    if (risk.objectiveId !== undefined) db.objective_id = risk.objectiveId;
    if (risk.initiativeId !== undefined) db.initiative_id = risk.initiativeId;
    if (risk.title !== undefined) db.title = risk.title;
    if (risk.description !== undefined) db.description = risk.description;
    if (risk.probability !== undefined) db.probability = risk.probability;
    if (risk.impact !== undefined) db.impact = risk.impact;
    if (risk.riskScore !== undefined) db.risk_score = risk.riskScore;
    if (risk.mitigationPlan !== undefined) db.mitigation_plan = risk.mitigationPlan;
    if (risk.ownerId !== undefined) db.owner_id = risk.ownerId;
    if (risk.status !== undefined) db.status = risk.status;
    if (risk.reviewDate !== undefined) db.review_date = risk.reviewDate;
    if (risk.createdAt !== undefined) db.created_at = risk.createdAt;
    return db;
  }

  private mapDBToDecision(row: any): StrategicDecision {
    return {
      id: row.id,
      organizationId: row.organization_id,
      strategyId: row.strategy_id,
      title: row.title,
      context: row.context,
      options: row.options || [],
      chosenOption: row.chosen_option,
      reason: row.reason,
      expectedOutcome: row.expected_outcome,
      actualOutcome: row.actual_outcome,
      ownerId: row.owner_id,
      decisionDate: row.decision_date ? new Date(row.decision_date) : new Date(),
      reviewDate: row.review_date ? new Date(row.review_date) : new Date(),
      status: row.status,
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }

  private mapDecisionToDB(dec: Partial<StrategicDecision>): any {
    const db: any = {};
    if (dec.id !== undefined) db.id = dec.id;
    if (dec.organizationId !== undefined) db.organization_id = dec.organizationId;
    if (dec.strategyId !== undefined) db.strategy_id = dec.strategyId;
    if (dec.title !== undefined) db.title = dec.title;
    if (dec.context !== undefined) db.context = dec.context;
    if (dec.options !== undefined) db.options = dec.options;
    if (dec.chosenOption !== undefined) db.chosen_option = dec.chosenOption;
    if (dec.reason !== undefined) db.reason = dec.reason;
    if (dec.expectedOutcome !== undefined) db.expected_outcome = dec.expectedOutcome;
    if (dec.actualOutcome !== undefined) db.actual_outcome = dec.actualOutcome;
    if (dec.ownerId !== undefined) db.owner_id = dec.ownerId;
    if (dec.decisionDate !== undefined) db.decision_date = dec.decisionDate;
    if (dec.reviewDate !== undefined) db.review_date = dec.reviewDate;
    if (dec.status !== undefined) db.status = dec.status;
    if (dec.createdAt !== undefined) db.created_at = dec.createdAt;
    return db;
  }

  // --- REPOSITORY IMPLEMENTATIONS ---

  // Strategy
  public async createStrategy(strategy: Strategy): Promise<Strategy> {
    const dbPayload = this.mapStrategyToDB(strategy);
    const { data, error } = await this.client.from('strategies').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating strategy: ${error.message}`);
    return this.mapDBToStrategy(data);
  }
  public async updateStrategy(strategy: Strategy): Promise<Strategy> {
    const dbPayload = this.mapStrategyToDB(strategy);
    const { data, error } = await this.client
      .from('strategies')
      .update(dbPayload)
      .eq('organization_id', strategy.organizationId)
      .eq('id', strategy.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating strategy: ${error.message}`);
    return this.mapDBToStrategy(data);
  }
  public async findStrategyById(orgId: string, id: string): Promise<Strategy | null> {
    const { data, error } = await this.client
      .from('strategies')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching strategy: ${error.message}`);
    return data ? this.mapDBToStrategy(data) : null;
  }
  public async listStrategies(orgId: string): Promise<Strategy[]> {
    const { data, error } = await this.client.from('strategies').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing strategies: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToStrategy(row));
  }

  // Objective
  public async createObjective(objective: StrategicObjective): Promise<StrategicObjective> {
    const dbPayload = this.mapObjectiveToDB(objective);
    const { data, error } = await this.client.from('strategic_objectives').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating objective: ${error.message}`);
    return this.mapDBToObjective(data);
  }
  public async updateObjective(objective: StrategicObjective): Promise<StrategicObjective> {
    const dbPayload = this.mapObjectiveToDB(objective);
    const { data, error } = await this.client
      .from('strategic_objectives')
      .update(dbPayload)
      .eq('organization_id', objective.organizationId)
      .eq('id', objective.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating objective: ${error.message}`);
    return this.mapDBToObjective(data);
  }
  public async findObjectiveById(orgId: string, id: string): Promise<StrategicObjective | null> {
    const { data, error } = await this.client
      .from('strategic_objectives')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching objective: ${error.message}`);
    return data ? this.mapDBToObjective(data) : null;
  }
  public async listObjectives(orgId: string, strategyId?: string): Promise<StrategicObjective[]> {
    let query = this.client.from('strategic_objectives').select('*').eq('organization_id', orgId);
    if (strategyId) query = query.eq('strategy_id', strategyId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing objectives: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToObjective(row));
  }

  // Goal
  public async createGoal(goal: StrategicGoal): Promise<StrategicGoal> {
    const dbPayload = this.mapGoalToDB(goal);
    const { data, error } = await this.client.from('strategic_goals').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating goal: ${error.message}`);
    return this.mapDBToGoal(data);
  }
  public async updateGoal(goal: StrategicGoal): Promise<StrategicGoal> {
    const dbPayload = this.mapGoalToDB(goal);
    const { data, error } = await this.client
      .from('strategic_goals')
      .update(dbPayload)
      .eq('organization_id', goal.organizationId)
      .eq('id', goal.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating goal: ${error.message}`);
    return this.mapDBToGoal(data);
  }
  public async findGoalById(orgId: string, id: string): Promise<StrategicGoal | null> {
    const { data, error } = await this.client
      .from('strategic_goals')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching goal: ${error.message}`);
    return data ? this.mapDBToGoal(data) : null;
  }
  public async listGoals(orgId: string, filters?: { objectiveId?: string; kpiKey?: string }): Promise<StrategicGoal[]> {
    let query = this.client.from('strategic_goals').select('*').eq('organization_id', orgId);
    if (filters?.objectiveId) query = query.eq('objective_id', filters.objectiveId);
    if (filters?.kpiKey) query = query.eq('kpi_key', filters.kpiKey);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing goals: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToGoal(row));
  }

  // Key Results
  public async createKeyResult(kr: KeyResult): Promise<KeyResult> {
    const dbPayload = {
      id: kr.id,
      organization_id: kr.organizationId,
      goal_id: kr.goalId,
      title: kr.title,
      target_value: kr.targetValue,
      current_value: kr.currentValue,
      unit: kr.unit,
      weight: kr.weight,
      status: kr.status,
      created_at: kr.createdAt,
      updated_at: kr.updatedAt,
    };
    const { data, error } = await this.client.from('key_results').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating key result: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      goalId: data.goal_id,
      title: data.title,
      targetValue: Number(data.target_value || 0),
      currentValue: Number(data.current_value || 0),
      unit: data.unit,
      weight: Number(data.weight || 1),
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
  public async updateKeyResult(kr: KeyResult): Promise<KeyResult> {
    const dbPayload = {
      id: kr.id,
      organization_id: kr.organizationId,
      goal_id: kr.goalId,
      title: kr.title,
      target_value: kr.targetValue,
      current_value: kr.currentValue,
      unit: kr.unit,
      weight: kr.weight,
      status: kr.status,
      created_at: kr.createdAt,
      updated_at: kr.updatedAt,
    };
    const { data, error } = await this.client
      .from('key_results')
      .update(dbPayload)
      .eq('organization_id', kr.organizationId)
      .eq('id', kr.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating key result: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      goalId: data.goal_id,
      title: data.title,
      targetValue: Number(data.target_value || 0),
      currentValue: Number(data.current_value || 0),
      unit: data.unit,
      weight: Number(data.weight || 1),
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }
  public async listKeyResults(orgId: string, goalId: string): Promise<KeyResult[]> {
    const { data, error } = await this.client
      .from('key_results')
      .select('*')
      .eq('organization_id', orgId)
      .eq('goal_id', goalId);
    if (error) throw new Error(`Supabase error listing key results: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      goalId: row.goal_id,
      title: row.title,
      targetValue: Number(row.target_value || 0),
      currentValue: Number(row.current_value || 0),
      unit: row.unit,
      weight: Number(row.weight || 1),
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }

  // Initiative
  public async createInitiative(initiative: Initiative): Promise<Initiative> {
    const dbPayload = this.mapInitiativeToDB(initiative);
    const { data, error } = await this.client.from('initiatives').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating initiative: ${error.message}`);
    return this.mapDBToInitiative(data);
  }
  public async updateInitiative(initiative: Initiative): Promise<Initiative> {
    const dbPayload = this.mapInitiativeToDB(initiative);
    const { data, error } = await this.client
      .from('initiatives')
      .update(dbPayload)
      .eq('organization_id', initiative.organizationId)
      .eq('id', initiative.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating initiative: ${error.message}`);
    return this.mapDBToInitiative(data);
  }
  public async findInitiativeById(orgId: string, id: string): Promise<Initiative | null> {
    const { data, error } = await this.client
      .from('initiatives')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching initiative: ${error.message}`);
    return data ? this.mapDBToInitiative(data) : null;
  }
  public async listInitiatives(orgId: string, filters?: { goalId?: string; objectiveId?: string }): Promise<Initiative[]> {
    let query = this.client.from('initiatives').select('*').eq('organization_id', orgId);
    if (filters?.goalId) query = query.eq('goal_id', filters.goalId);
    if (filters?.objectiveId) query = query.eq('objective_id', filters.objectiveId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing initiatives: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToInitiative(row));
  }

  // Milestone
  public async createMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone> {
    const dbPayload = {
      id: milestone.id,
      organization_id: milestone.organizationId,
      initiative_id: milestone.initiativeId,
      title: milestone.title,
      owner_id: milestone.ownerId,
      deadline: milestone.deadline,
      status: milestone.status,
      evidence: milestone.evidence,
      completed_at: milestone.completedAt,
      created_at: milestone.createdAt,
    };
    const { data, error } = await this.client.from('strategic_milestones').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating milestone: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      initiativeId: data.initiative_id,
      title: data.title,
      ownerId: data.owner_id,
      deadline: new Date(data.deadline),
      status: data.status,
      evidence: data.evidence,
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      createdAt: new Date(data.created_at),
    };
  }
  public async updateMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone> {
    const dbPayload = {
      id: milestone.id,
      organization_id: milestone.organizationId,
      initiative_id: milestone.initiativeId,
      title: milestone.title,
      owner_id: milestone.ownerId,
      deadline: milestone.deadline,
      status: milestone.status,
      evidence: milestone.evidence,
      completed_at: milestone.completedAt,
      created_at: milestone.createdAt,
    };
    const { data, error } = await this.client
      .from('strategic_milestones')
      .update(dbPayload)
      .eq('organization_id', milestone.organizationId)
      .eq('id', milestone.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating milestone: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      initiativeId: data.initiative_id,
      title: data.title,
      ownerId: data.owner_id,
      deadline: new Date(data.deadline),
      status: data.status,
      evidence: data.evidence,
      completedAt: data.completed_at ? new Date(data.completed_at) : null,
      createdAt: new Date(data.created_at),
    };
  }
  public async listMilestones(orgId: string, initiativeId: string): Promise<StrategicMilestone[]> {
    const { data, error } = await this.client
      .from('strategic_milestones')
      .select('*')
      .eq('organization_id', orgId)
      .eq('initiative_id', initiativeId);
    if (error) throw new Error(`Supabase error listing milestones: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      initiativeId: row.initiative_id,
      title: row.title,
      ownerId: row.owner_id,
      deadline: new Date(row.deadline),
      status: row.status,
      evidence: row.evidence,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      createdAt: new Date(row.created_at),
    }));
  }

  // Risk
  public async createRisk(risk: StrategyRisk): Promise<StrategyRisk> {
    const dbPayload = this.mapRiskToDB(risk);
    const { data, error } = await this.client.from('strategy_risks').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating risk: ${error.message}`);
    return this.mapDBToRisk(data);
  }
  public async updateRisk(risk: StrategyRisk): Promise<StrategyRisk> {
    const dbPayload = this.mapRiskToDB(risk);
    const { data, error } = await this.client
      .from('strategy_risks')
      .update(dbPayload)
      .eq('organization_id', risk.organizationId)
      .eq('id', risk.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating risk: ${error.message}`);
    return this.mapDBToRisk(data);
  }
  public async findRiskById(orgId: string, id: string): Promise<StrategyRisk | null> {
    const { data, error } = await this.client
      .from('strategy_risks')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching risk: ${error.message}`);
    return data ? this.mapDBToRisk(data) : null;
  }
  public async listRisks(orgId: string, filters?: { strategyId?: string; initiativeId?: string }): Promise<StrategyRisk[]> {
    let query = this.client.from('strategy_risks').select('*').eq('organization_id', orgId);
    if (filters?.strategyId) query = query.eq('strategy_id', filters.strategyId);
    if (filters?.initiativeId) query = query.eq('initiative_id', filters.initiativeId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing risks: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToRisk(row));
  }

  // Assumption
  public async createAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption> {
    const dbPayload = {
      id: assumption.id,
      organization_id: assumption.organizationId,
      strategy_id: assumption.strategyId,
      title: assumption.title,
      description: assumption.description,
      kpi_key: assumption.kpiKey,
      threshold_condition: assumption.thresholdCondition,
      is_valid: assumption.isValid,
      last_verified_at: assumption.lastVerifiedAt,
      created_at: assumption.createdAt,
    };
    const { data, error } = await this.client.from('strategic_assumptions').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating assumption: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      strategyId: data.strategy_id,
      title: data.title,
      description: data.description,
      kpiKey: data.kpi_key,
      thresholdCondition: data.threshold_condition,
      isValid: data.is_valid,
      lastVerifiedAt: data.last_verified_at ? new Date(data.last_verified_at) : null,
      createdAt: new Date(data.created_at),
    };
  }
  public async updateAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption> {
    const dbPayload = {
      id: assumption.id,
      organization_id: assumption.organizationId,
      strategy_id: assumption.strategyId,
      title: assumption.title,
      description: assumption.description,
      kpi_key: assumption.kpiKey,
      threshold_condition: assumption.thresholdCondition,
      is_valid: assumption.isValid,
      last_verified_at: assumption.lastVerifiedAt,
      created_at: assumption.createdAt,
    };
    const { data, error } = await this.client
      .from('strategic_assumptions')
      .update(dbPayload)
      .eq('organization_id', assumption.organizationId)
      .eq('id', assumption.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating assumption: ${error.message}`);
    return {
      id: data.id,
      organizationId: data.organization_id,
      strategyId: data.strategy_id,
      title: data.title,
      description: data.description,
      kpiKey: data.kpi_key,
      thresholdCondition: data.threshold_condition,
      isValid: data.is_valid,
      lastVerifiedAt: data.last_verified_at ? new Date(data.last_verified_at) : null,
      createdAt: new Date(data.created_at),
    };
  }
  public async listAssumptions(orgId: string, strategyId?: string): Promise<StrategicAssumption[]> {
    let query = this.client.from('strategic_assumptions').select('*').eq('organization_id', orgId);
    if (strategyId) query = query.eq('strategy_id', strategyId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing assumptions: ${error.message}`);
    return (data || []).map((row: any) => ({
      id: row.id,
      organizationId: row.organization_id,
      strategyId: row.strategy_id,
      title: row.title,
      description: row.description,
      kpiKey: row.kpi_key,
      thresholdCondition: row.threshold_condition,
      isValid: row.is_valid,
      lastVerifiedAt: row.last_verified_at ? new Date(row.last_verified_at) : null,
      createdAt: new Date(row.created_at),
    }));
  }

  // Decision
  public async createDecision(decision: StrategicDecision): Promise<StrategicDecision> {
    const dbPayload = this.mapDecisionToDB(decision);
    const { data, error } = await this.client.from('strategic_decisions').insert(dbPayload).select().single();
    if (error) throw new Error(`Supabase error creating decision: ${error.message}`);
    return this.mapDBToDecision(data);
  }
  public async updateDecision(decision: StrategicDecision): Promise<StrategicDecision> {
    const dbPayload = this.mapDecisionToDB(decision);
    const { data, error } = await this.client
      .from('strategic_decisions')
      .update(dbPayload)
      .eq('organization_id', decision.organizationId)
      .eq('id', decision.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating decision: ${error.message}`);
    return this.mapDBToDecision(data);
  }
  public async findDecisionById(orgId: string, id: string): Promise<StrategicDecision | null> {
    const { data, error } = await this.client
      .from('strategic_decisions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching decision: ${error.message}`);
    return data ? this.mapDBToDecision(data) : null;
  }
  public async listDecisions(orgId: string, strategyId?: string): Promise<StrategicDecision[]> {
    let query = this.client.from('strategic_decisions').select('*').eq('organization_id', orgId);
    if (strategyId) query = query.eq('strategy_id', strategyId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing decisions: ${error.message}`);
    return (data || []).map((row: any) => this.mapDBToDecision(row));
  }
}
