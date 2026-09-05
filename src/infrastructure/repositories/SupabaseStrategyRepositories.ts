/**
 * WILLShop OS — Supabase Strategy Repositories
 * Production Supabase PostgreSQL implementation.
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

  // Strategy
  public async createStrategy(strategy: Strategy): Promise<Strategy> {
    const { data, error } = await this.client.from('strategies').insert(strategy).select().single();
    if (error) throw new Error(`Supabase error creating strategy: ${error.message}`);
    return data as Strategy;
  }
  public async updateStrategy(strategy: Strategy): Promise<Strategy> {
    const { data, error } = await this.client
      .from('strategies')
      .update(strategy)
      .eq('organization_id', strategy.organizationId)
      .eq('id', strategy.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating strategy: ${error.message}`);
    return data as Strategy;
  }
  public async findStrategyById(orgId: string, id: string): Promise<Strategy | null> {
    const { data, error } = await this.client
      .from('strategies')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching strategy: ${error.message}`);
    return data ? (data as Strategy) : null;
  }
  public async listStrategies(orgId: string): Promise<Strategy[]> {
    const { data, error } = await this.client.from('strategies').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing strategies: ${error.message}`);
    return (data || []) as Strategy[];
  }

  // Objective
  public async createObjective(objective: StrategicObjective): Promise<StrategicObjective> {
    const { data, error } = await this.client.from('strategic_objectives').insert(objective).select().single();
    if (error) throw new Error(`Supabase error creating objective: ${error.message}`);
    return data as StrategicObjective;
  }
  public async updateObjective(objective: StrategicObjective): Promise<StrategicObjective> {
    const { data, error } = await this.client
      .from('strategic_objectives')
      .update(objective)
      .eq('organization_id', objective.organizationId)
      .eq('id', objective.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating objective: ${error.message}`);
    return data as StrategicObjective;
  }
  public async findObjectiveById(orgId: string, id: string): Promise<StrategicObjective | null> {
    const { data, error } = await this.client
      .from('strategic_objectives')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching objective: ${error.message}`);
    return data ? (data as StrategicObjective) : null;
  }
  public async listObjectives(orgId: string, strategyId?: string): Promise<StrategicObjective[]> {
    let query = this.client.from('strategic_objectives').select('*').eq('organization_id', orgId);
    if (strategyId) query = query.eq('strategy_id', strategyId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing objectives: ${error.message}`);
    return (data || []) as StrategicObjective[];
  }

  // Goal
  public async createGoal(goal: StrategicGoal): Promise<StrategicGoal> {
    const { data, error } = await this.client.from('strategic_goals').insert(goal).select().single();
    if (error) throw new Error(`Supabase error creating goal: ${error.message}`);
    return data as StrategicGoal;
  }
  public async updateGoal(goal: StrategicGoal): Promise<StrategicGoal> {
    const { data, error } = await this.client
      .from('strategic_goals')
      .update(goal)
      .eq('organization_id', goal.organizationId)
      .eq('id', goal.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating goal: ${error.message}`);
    return data as StrategicGoal;
  }
  public async findGoalById(orgId: string, id: string): Promise<StrategicGoal | null> {
    const { data, error } = await this.client
      .from('strategic_goals')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching goal: ${error.message}`);
    return data ? (data as StrategicGoal) : null;
  }
  public async listGoals(orgId: string, filters?: { objectiveId?: string; kpiKey?: string }): Promise<StrategicGoal[]> {
    let query = this.client.from('strategic_goals').select('*').eq('organization_id', orgId);
    if (filters?.objectiveId) query = query.eq('objective_id', filters.objectiveId);
    if (filters?.kpiKey) query = query.eq('kpi_key', filters.kpiKey);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing goals: ${error.message}`);
    return (data || []) as StrategicGoal[];
  }

  // Key Results
  public async createKeyResult(kr: KeyResult): Promise<KeyResult> {
    const { data, error } = await this.client.from('key_results').insert(kr).select().single();
    if (error) throw new Error(`Supabase error creating key result: ${error.message}`);
    return data as KeyResult;
  }
  public async updateKeyResult(kr: KeyResult): Promise<KeyResult> {
    const { data, error } = await this.client
      .from('key_results')
      .update(kr)
      .eq('organization_id', kr.organizationId)
      .eq('id', kr.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating key result: ${error.message}`);
    return data as KeyResult;
  }
  public async listKeyResults(orgId: string, goalId: string): Promise<KeyResult[]> {
    const { data, error } = await this.client
      .from('key_results')
      .select('*')
      .eq('organization_id', orgId)
      .eq('goal_id', goalId);
    if (error) throw new Error(`Supabase error listing key results: ${error.message}`);
    return (data || []) as KeyResult[];
  }

  // Initiative
  public async createInitiative(initiative: Initiative): Promise<Initiative> {
    const { data, error } = await this.client.from('initiatives').insert(initiative).select().single();
    if (error) throw new Error(`Supabase error creating initiative: ${error.message}`);
    return data as Initiative;
  }
  public async updateInitiative(initiative: Initiative): Promise<Initiative> {
    const { data, error } = await this.client
      .from('initiatives')
      .update(initiative)
      .eq('organization_id', initiative.organizationId)
      .eq('id', initiative.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating initiative: ${error.message}`);
    return data as Initiative;
  }
  public async findInitiativeById(orgId: string, id: string): Promise<Initiative | null> {
    const { data, error } = await this.client
      .from('initiatives')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching initiative: ${error.message}`);
    return data ? (data as Initiative) : null;
  }
  public async listInitiatives(orgId: string, filters?: { objectiveId?: string; goalId?: string }): Promise<Initiative[]> {
    let query = this.client.from('initiatives').select('*').eq('organization_id', orgId);
    if (filters?.objectiveId) query = query.eq('objective_id', filters.objectiveId);
    if (filters?.goalId) query = query.eq('goal_id', filters.goalId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing initiatives: ${error.message}`);
    return (data || []) as Initiative[];
  }

  // Milestones
  public async createMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone> {
    const { data, error } = await this.client.from('strategic_milestones').insert(milestone).select().single();
    if (error) throw new Error(`Supabase error creating milestone: ${error.message}`);
    return data as StrategicMilestone;
  }
  public async updateMilestone(milestone: StrategicMilestone): Promise<StrategicMilestone> {
    const { data, error } = await this.client
      .from('strategic_milestones')
      .update(milestone)
      .eq('organization_id', milestone.organizationId)
      .eq('id', milestone.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating milestone: ${error.message}`);
    return data as StrategicMilestone;
  }
  public async listMilestones(orgId: string, initiativeId: string): Promise<StrategicMilestone[]> {
    const { data, error } = await this.client
      .from('strategic_milestones')
      .select('*')
      .eq('organization_id', orgId)
      .eq('initiative_id', initiativeId);
    if (error) throw new Error(`Supabase error listing milestones: ${error.message}`);
    return (data || []) as StrategicMilestone[];
  }

  // Risks
  public async createRisk(risk: StrategyRisk): Promise<StrategyRisk> {
    const { data, error } = await this.client.from('strategy_risks').insert(risk).select().single();
    if (error) throw new Error(`Supabase error creating risk: ${error.message}`);
    return data as StrategyRisk;
  }
  public async updateRisk(risk: StrategyRisk): Promise<StrategyRisk> {
    const { data, error } = await this.client
      .from('strategy_risks')
      .update(risk)
      .eq('organization_id', risk.organizationId)
      .eq('id', risk.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating risk: ${error.message}`);
    return data as StrategyRisk;
  }
  public async listRisks(orgId: string): Promise<StrategyRisk[]> {
    const { data, error } = await this.client.from('strategy_risks').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing risks: ${error.message}`);
    return (data || []) as StrategyRisk[];
  }

  // Assumptions
  public async createAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption> {
    const { data, error } = await this.client.from('strategic_assumptions').insert(assumption).select().single();
    if (error) throw new Error(`Supabase error creating assumption: ${error.message}`);
    return data as StrategicAssumption;
  }
  public async updateAssumption(assumption: StrategicAssumption): Promise<StrategicAssumption> {
    const { data, error } = await this.client
      .from('strategic_assumptions')
      .update(assumption)
      .eq('organization_id', assumption.organizationId)
      .eq('id', assumption.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating assumption: ${error.message}`);
    return data as StrategicAssumption;
  }
  public async listAssumptions(orgId: string, strategyId?: string): Promise<StrategicAssumption[]> {
    let query = this.client.from('strategic_assumptions').select('*').eq('organization_id', orgId);
    if (strategyId) query = query.eq('strategy_id', strategyId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing assumptions: ${error.message}`);
    return (data || []) as StrategicAssumption[];
  }

  // Decisions
  public async createDecision(decision: StrategicDecision): Promise<StrategicDecision> {
    const { data, error } = await this.client.from('strategic_decisions').insert(decision).select().single();
    if (error) throw new Error(`Supabase error creating decision: ${error.message}`);
    return data as StrategicDecision;
  }
  public async updateDecision(decision: StrategicDecision): Promise<StrategicDecision> {
    const { data, error } = await this.client
      .from('strategic_decisions')
      .update(decision)
      .eq('organization_id', decision.organizationId)
      .eq('id', decision.id)
      .select()
      .single();
    if (error) throw new Error(`Supabase error updating decision: ${error.message}`);
    return data as StrategicDecision;
  }
  public async findDecisionById(orgId: string, id: string): Promise<StrategicDecision | null> {
    const { data, error } = await this.client
      .from('strategic_decisions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`Supabase error fetching decision: ${error.message}`);
    return data ? (data as StrategicDecision) : null;
  }
  public async listDecisions(orgId: string): Promise<StrategicDecision[]> {
    const { data, error } = await this.client.from('strategic_decisions').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`Supabase error listing decisions: ${error.message}`);
    return (data || []) as StrategicDecision[];
  }
}
