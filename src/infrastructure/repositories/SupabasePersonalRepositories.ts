/**
 * WILLShop OS — Supabase Personal Repositories
 * Production Supabase PostgreSQL implementation with RLS (`user_id = auth.uid()`).
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  IPersonalProfileRepository,
  IPersonalGoalRepository,
  IPersonalProjectRepository,
  IPersonalTaskRepository,
  IPersonalHabitRepository,
  IPersonalLearningRepository,
  IPersonalFinancialAccountRepository,
  IPersonalTransactionRepository,
  IPersonalBudgetRepository,
  IPersonalNetWorthRepository,
  IPersonalInvestmentRepository,
  IPersonalDecisionRepository,
  IBusinessPersonalBridgeRepository,
} from '../../domain/interfaces/IPersonalRepositories';
import {
  PersonalProfile,
  PersonalGoal,
  PersonalProject,
  PersonalTask,
  PersonalHabit,
  PersonalLearningItem,
  PersonalFinancialAccount,
  PersonalTransaction,
  PersonalBudget,
  PersonalNetWorthSnapshot,
  PersonalInvestmentPosition,
  PersonalDecision,
  BusinessPersonalBridgeRecord,
} from '../../domain/entities/PersonalEntities';

export class SupabasePersonalRepositories
  implements
    IPersonalProfileRepository,
    IPersonalGoalRepository,
    IPersonalProjectRepository,
    IPersonalTaskRepository,
    IPersonalHabitRepository,
    IPersonalLearningRepository,
    IPersonalFinancialAccountRepository,
    IPersonalTransactionRepository,
    IPersonalBudgetRepository,
    IPersonalNetWorthRepository,
    IPersonalInvestmentRepository,
    IPersonalDecisionRepository,
    IBusinessPersonalBridgeRepository
{
  constructor(private client: SupabaseClient) {}

  public async getProfile(userId: string): Promise<PersonalProfile | null> {
    const { data, error } = await this.client.from('personal_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw new Error(`Supabase error fetching profile: ${error.message}`);
    return data ? (data as PersonalProfile) : null;
  }
  public async saveProfile(profile: PersonalProfile): Promise<PersonalProfile> {
    const { data, error } = await this.client.from('personal_profiles').upsert(profile).select().single();
    if (error) throw new Error(`Supabase error saving profile: ${error.message}`);
    return data as PersonalProfile;
  }

  public async createGoal(goal: PersonalGoal): Promise<PersonalGoal> {
    const { data, error } = await this.client.from('personal_goals').insert(goal).select().single();
    if (error) throw new Error(`Supabase error creating personal goal: ${error.message}`);
    return data as PersonalGoal;
  }
  public async updateGoal(goal: PersonalGoal): Promise<PersonalGoal> {
    const { data, error } = await this.client.from('personal_goals').update(goal).eq('user_id', goal.userId).eq('id', goal.id).select().single();
    if (error) throw new Error(`Supabase error updating personal goal: ${error.message}`);
    return data as PersonalGoal;
  }
  public async findGoalById(userId: string, id: string): Promise<PersonalGoal | null> {
    const { data, error } = await this.client.from('personal_goals').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error fetching goal: ${error.message}`);
    return data ? (data as PersonalGoal) : null;
  }
  public async listGoals(userId: string): Promise<PersonalGoal[]> {
    const { data, error } = await this.client.from('personal_goals').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing goals: ${error.message}`);
    return (data || []) as PersonalGoal[];
  }

  public async createProject(project: PersonalProject): Promise<PersonalProject> {
    const { data, error } = await this.client.from('personal_projects').insert(project).select().single();
    if (error) throw new Error(`Supabase error creating project: ${error.message}`);
    return data as PersonalProject;
  }
  public async updateProject(project: PersonalProject): Promise<PersonalProject> {
    const { data, error } = await this.client.from('personal_projects').update(project).eq('user_id', project.userId).eq('id', project.id).select().single();
    if (error) throw new Error(`Supabase error updating project: ${error.message}`);
    return data as PersonalProject;
  }
  public async findProjectById(userId: string, id: string): Promise<PersonalProject | null> {
    const { data, error } = await this.client.from('personal_projects').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error fetching project: ${error.message}`);
    return data ? (data as PersonalProject) : null;
  }
  public async listProjects(userId: string): Promise<PersonalProject[]> {
    const { data, error } = await this.client.from('personal_projects').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing projects: ${error.message}`);
    return (data || []) as PersonalProject[];
  }

  public async createTask(task: PersonalTask): Promise<PersonalTask> {
    const { data, error } = await this.client.from('personal_tasks').insert(task).select().single();
    if (error) throw new Error(`Supabase error creating task: ${error.message}`);
    return data as PersonalTask;
  }
  public async updateTask(task: PersonalTask): Promise<PersonalTask> {
    const { data, error } = await this.client.from('personal_tasks').update(task).eq('user_id', task.userId).eq('id', task.id).select().single();
    if (error) throw new Error(`Supabase error updating task: ${error.message}`);
    return data as PersonalTask;
  }
  public async findTaskById(userId: string, id: string): Promise<PersonalTask | null> {
    const { data, error } = await this.client.from('personal_tasks').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error fetching task: ${error.message}`);
    return data ? (data as PersonalTask) : null;
  }
  public async listTasks(userId: string, filters?: { status?: string; priority?: string }): Promise<PersonalTask[]> {
    let query = this.client.from('personal_tasks').select('*').eq('user_id', userId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.priority) query = query.eq('priority', filters.priority);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing tasks: ${error.message}`);
    return (data || []) as PersonalTask[];
  }

  public async createHabit(habit: PersonalHabit): Promise<PersonalHabit> {
    const { data, error } = await this.client.from('personal_habits').insert(habit).select().single();
    if (error) throw new Error(`Supabase error creating habit: ${error.message}`);
    return data as PersonalHabit;
  }
  public async updateHabit(habit: PersonalHabit): Promise<PersonalHabit> {
    const { data, error } = await this.client.from('personal_habits').update(habit).eq('user_id', habit.userId).eq('id', habit.id).select().single();
    if (error) throw new Error(`Supabase error updating habit: ${error.message}`);
    return data as PersonalHabit;
  }
  public async findHabitById(userId: string, id: string): Promise<PersonalHabit | null> {
    const { data, error } = await this.client.from('personal_habits').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error fetching habit: ${error.message}`);
    return data ? (data as PersonalHabit) : null;
  }
  public async listHabits(userId: string): Promise<PersonalHabit[]> {
    const { data, error } = await this.client.from('personal_habits').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing habits: ${error.message}`);
    return (data || []) as PersonalHabit[];
  }

  public async createItem(item: PersonalLearningItem): Promise<PersonalLearningItem> {
    const { data, error } = await this.client.from('personal_learning_items').insert(item).select().single();
    if (error) throw new Error(`Supabase error creating learning item: ${error.message}`);
    return data as PersonalLearningItem;
  }
  public async updateItem(item: PersonalLearningItem): Promise<PersonalLearningItem> {
    const { data, error } = await this.client.from('personal_learning_items').update(item).eq('user_id', item.userId).eq('id', item.id).select().single();
    if (error) throw new Error(`Supabase error updating learning item: ${error.message}`);
    return data as PersonalLearningItem;
  }
  public async listItems(userId: string): Promise<PersonalLearningItem[]> {
    const { data, error } = await this.client.from('personal_learning_items').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing learning items: ${error.message}`);
    return (data || []) as PersonalLearningItem[];
  }

  public async createAccount(account: PersonalFinancialAccount): Promise<PersonalFinancialAccount> {
    const { data, error } = await this.client.from('personal_financial_accounts').insert(account).select().single();
    if (error) throw new Error(`Supabase error creating personal account: ${error.message}`);
    return data as PersonalFinancialAccount;
  }
  public async updateAccount(account: PersonalFinancialAccount): Promise<PersonalFinancialAccount> {
    const { data, error } = await this.client.from('personal_financial_accounts').update(account).eq('user_id', account.userId).eq('id', account.id).select().single();
    if (error) throw new Error(`Supabase error updating personal account: ${error.message}`);
    return data as PersonalFinancialAccount;
  }
  public async findAccountById(userId: string, id: string): Promise<PersonalFinancialAccount | null> {
    const { data, error } = await this.client.from('personal_financial_accounts').select('*').eq('user_id', userId).eq('id', id).maybeSingle();
    if (error) throw new Error(`Supabase error fetching personal account: ${error.message}`);
    return data ? (data as PersonalFinancialAccount) : null;
  }
  public async listAccounts(userId: string): Promise<PersonalFinancialAccount[]> {
    const { data, error } = await this.client.from('personal_financial_accounts').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing personal accounts: ${error.message}`);
    return (data || []) as PersonalFinancialAccount[];
  }

  public async createTransaction(transaction: PersonalTransaction): Promise<PersonalTransaction> {
    const { data, error } = await this.client.from('personal_transactions').insert(transaction).select().single();
    if (error) throw new Error(`Supabase error creating personal transaction: ${error.message}`);
    return data as PersonalTransaction;
  }
  public async listTransactions(userId: string, accountId?: string): Promise<PersonalTransaction[]> {
    let query = this.client.from('personal_transactions').select('*').eq('user_id', userId);
    if (accountId) query = query.eq('account_id', accountId);
    const { data, error } = await query;
    if (error) throw new Error(`Supabase error listing personal transactions: ${error.message}`);
    return (data || []) as PersonalTransaction[];
  }

  public async createBudget(budget: PersonalBudget): Promise<PersonalBudget> {
    const { data, error } = await this.client.from('personal_budgets').insert(budget).select().single();
    if (error) throw new Error(`Supabase error creating personal budget: ${error.message}`);
    return data as PersonalBudget;
  }
  public async updateBudget(budget: PersonalBudget): Promise<PersonalBudget> {
    const { data, error } = await this.client.from('personal_budgets').update(budget).eq('user_id', budget.userId).eq('id', budget.id).select().single();
    if (error) throw new Error(`Supabase error updating personal budget: ${error.message}`);
    return data as PersonalBudget;
  }
  public async listBudgets(userId: string): Promise<PersonalBudget[]> {
    const { data, error } = await this.client.from('personal_budgets').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing personal budgets: ${error.message}`);
    return (data || []) as PersonalBudget[];
  }

  public async saveSnapshot(snapshot: PersonalNetWorthSnapshot): Promise<PersonalNetWorthSnapshot> {
    const { data, error } = await this.client.from('personal_net_worth_snapshots').insert(snapshot).select().single();
    if (error) throw new Error(`Supabase error saving net worth snapshot: ${error.message}`);
    return data as PersonalNetWorthSnapshot;
  }
  public async listSnapshots(userId: string): Promise<PersonalNetWorthSnapshot[]> {
    const { data, error } = await this.client.from('personal_net_worth_snapshots').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing net worth snapshots: ${error.message}`);
    return (data || []) as PersonalNetWorthSnapshot[];
  }

  public async savePosition(position: PersonalInvestmentPosition): Promise<PersonalInvestmentPosition> {
    const { data, error } = await this.client.from('personal_investments').upsert(position).select().single();
    if (error) throw new Error(`Supabase error saving investment position: ${error.message}`);
    return data as PersonalInvestmentPosition;
  }
  public async listPositions(userId: string): Promise<PersonalInvestmentPosition[]> {
    const { data, error } = await this.client.from('personal_investments').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing investment positions: ${error.message}`);
    return (data || []) as PersonalInvestmentPosition[];
  }

  public async createDecision(decision: PersonalDecision): Promise<PersonalDecision> {
    const { data, error } = await this.client.from('personal_decisions').insert(decision).select().single();
    if (error) throw new Error(`Supabase error creating decision: ${error.message}`);
    return data as PersonalDecision;
  }
  public async updateDecision(decision: PersonalDecision): Promise<PersonalDecision> {
    const { data, error } = await this.client.from('personal_decisions').update(decision).eq('user_id', decision.userId).eq('id', decision.id).select().single();
    if (error) throw new Error(`Supabase error updating decision: ${error.message}`);
    return data as PersonalDecision;
  }
  public async listDecisions(userId: string): Promise<PersonalDecision[]> {
    const { data, error } = await this.client.from('personal_decisions').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing decisions: ${error.message}`);
    return (data || []) as PersonalDecision[];
  }

  public async recordBridge(record: BusinessPersonalBridgeRecord): Promise<BusinessPersonalBridgeRecord> {
    const { data, error } = await this.client.from('business_personal_bridges').insert(record).select().single();
    if (error) throw new Error(`Supabase error recording bridge transfer: ${error.message}`);
    return data as BusinessPersonalBridgeRecord;
  }
  public async listBridgeRecords(userId: string): Promise<BusinessPersonalBridgeRecord[]> {
    const { data, error } = await this.client.from('business_personal_bridges').select('*').eq('user_id', userId);
    if (error) throw new Error(`Supabase error listing bridge records: ${error.message}`);
    return (data || []) as BusinessPersonalBridgeRecord[];
  }
}
