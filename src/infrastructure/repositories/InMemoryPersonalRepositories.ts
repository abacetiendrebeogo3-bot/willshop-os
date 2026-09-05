/**
 * WILLShop OS — In-Memory Personal Repositories
 * Fast In-Memory Infrastructure implementation for testing and rapid execution.
 */

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

export class InMemoryPersonalRepositories
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
  private profiles: PersonalProfile[] = [];
  private goals: PersonalGoal[] = [];
  private projects: PersonalProject[] = [];
  private tasks: PersonalTask[] = [];
  private habits: PersonalHabit[] = [];
  private learningItems: PersonalLearningItem[] = [];
  private accounts: PersonalFinancialAccount[] = [];
  private transactions: PersonalTransaction[] = [];
  private budgets: PersonalBudget[] = [];
  private snapshots: PersonalNetWorthSnapshot[] = [];
  private investments: PersonalInvestmentPosition[] = [];
  private decisions: PersonalDecision[] = [];
  private bridges: BusinessPersonalBridgeRecord[] = [];

  // Profile
  public async getProfile(userId: string): Promise<PersonalProfile | null> {
    return this.profiles.find((p) => p.userId === userId) || null;
  }
  public async saveProfile(profile: PersonalProfile): Promise<PersonalProfile> {
    const idx = this.profiles.findIndex((p) => p.userId === profile.userId);
    if (idx >= 0) this.profiles[idx] = { ...profile, updatedAt: new Date() };
    else this.profiles.push(profile);
    return profile;
  }

  // Goal
  public async createGoal(goal: PersonalGoal): Promise<PersonalGoal> {
    this.goals.push(goal);
    return goal;
  }
  public async updateGoal(goal: PersonalGoal): Promise<PersonalGoal> {
    const idx = this.goals.findIndex((g) => g.userId === goal.userId && g.id === goal.id);
    if (idx >= 0) this.goals[idx] = { ...goal, updatedAt: new Date() };
    else this.goals.push(goal);
    return goal;
  }
  public async findGoalById(userId: string, id: string): Promise<PersonalGoal | null> {
    return this.goals.find((g) => g.userId === userId && g.id === id) || null;
  }
  public async listGoals(userId: string): Promise<PersonalGoal[]> {
    return this.goals.filter((g) => g.userId === userId);
  }

  // Project
  public async createProject(project: PersonalProject): Promise<PersonalProject> {
    this.projects.push(project);
    return project;
  }
  public async updateProject(project: PersonalProject): Promise<PersonalProject> {
    const idx = this.projects.findIndex((p) => p.userId === project.userId && p.id === project.id);
    if (idx >= 0) this.projects[idx] = { ...project, updatedAt: new Date() };
    else this.projects.push(project);
    return project;
  }
  public async findProjectById(userId: string, id: string): Promise<PersonalProject | null> {
    return this.projects.find((p) => p.userId === userId && p.id === id) || null;
  }
  public async listProjects(userId: string): Promise<PersonalProject[]> {
    return this.projects.filter((p) => p.userId === userId);
  }

  // Task
  public async createTask(task: PersonalTask): Promise<PersonalTask> {
    this.tasks.push(task);
    return task;
  }
  public async updateTask(task: PersonalTask): Promise<PersonalTask> {
    const idx = this.tasks.findIndex((t) => t.userId === task.userId && t.id === task.id);
    if (idx >= 0) this.tasks[idx] = { ...task, updatedAt: new Date() };
    else this.tasks.push(task);
    return task;
  }
  public async findTaskById(userId: string, id: string): Promise<PersonalTask | null> {
    return this.tasks.find((t) => t.userId === userId && t.id === id) || null;
  }
  public async listTasks(userId: string, filters?: { status?: string; priority?: string }): Promise<PersonalTask[]> {
    let res = this.tasks.filter((t) => t.userId === userId);
    if (filters?.status) res = res.filter((t) => t.status === filters.status);
    if (filters?.priority) res = res.filter((t) => t.priority === filters.priority);
    return res;
  }

  // Habit
  public async createHabit(habit: PersonalHabit): Promise<PersonalHabit> {
    this.habits.push(habit);
    return habit;
  }
  public async updateHabit(habit: PersonalHabit): Promise<PersonalHabit> {
    const idx = this.habits.findIndex((h) => h.userId === habit.userId && h.id === habit.id);
    if (idx >= 0) this.habits[idx] = { ...habit, updatedAt: new Date() };
    else this.habits.push(habit);
    return habit;
  }
  public async findHabitById(userId: string, id: string): Promise<PersonalHabit | null> {
    return this.habits.find((h) => h.userId === userId && h.id === id) || null;
  }
  public async listHabits(userId: string): Promise<PersonalHabit[]> {
    return this.habits.filter((h) => h.userId === userId);
  }

  // Learning
  public async createItem(item: PersonalLearningItem): Promise<PersonalLearningItem> {
    this.learningItems.push(item);
    return item;
  }
  public async updateItem(item: PersonalLearningItem): Promise<PersonalLearningItem> {
    const idx = this.learningItems.findIndex((l) => l.userId === item.userId && l.id === item.id);
    if (idx >= 0) this.learningItems[idx] = { ...item, updatedAt: new Date() };
    else this.learningItems.push(item);
    return item;
  }
  public async listItems(userId: string): Promise<PersonalLearningItem[]> {
    return this.learningItems.filter((l) => l.userId === userId);
  }

  // Financial Accounts
  public async createAccount(account: PersonalFinancialAccount): Promise<PersonalFinancialAccount> {
    this.accounts.push(account);
    return account;
  }
  public async updateAccount(account: PersonalFinancialAccount): Promise<PersonalFinancialAccount> {
    const idx = this.accounts.findIndex((a) => a.userId === account.userId && a.id === account.id);
    if (idx >= 0) this.accounts[idx] = { ...account, updatedAt: new Date() };
    else this.accounts.push(account);
    return account;
  }
  public async findAccountById(userId: string, id: string): Promise<PersonalFinancialAccount | null> {
    return this.accounts.find((a) => a.userId === userId && a.id === id) || null;
  }
  public async listAccounts(userId: string): Promise<PersonalFinancialAccount[]> {
    return this.accounts.filter((a) => a.userId === userId);
  }

  // Transactions
  public async createTransaction(transaction: PersonalTransaction): Promise<PersonalTransaction> {
    this.transactions.push(transaction);
    return transaction;
  }
  public async listTransactions(userId: string, accountId?: string): Promise<PersonalTransaction[]> {
    let res = this.transactions.filter((t) => t.userId === userId);
    if (accountId) res = res.filter((t) => t.accountId === accountId);
    return res;
  }

  // Budgets
  public async createBudget(budget: PersonalBudget): Promise<PersonalBudget> {
    this.budgets.push(budget);
    return budget;
  }
  public async updateBudget(budget: PersonalBudget): Promise<PersonalBudget> {
    const idx = this.budgets.findIndex((b) => b.userId === budget.userId && b.id === budget.id);
    if (idx >= 0) this.budgets[idx] = { ...budget, updatedAt: new Date() };
    else this.budgets.push(budget);
    return budget;
  }
  public async listBudgets(userId: string): Promise<PersonalBudget[]> {
    return this.budgets.filter((b) => b.userId === userId);
  }

  // Net Worth Snapshots
  public async saveSnapshot(snapshot: PersonalNetWorthSnapshot): Promise<PersonalNetWorthSnapshot> {
    this.snapshots.push(snapshot);
    return snapshot;
  }
  public async listSnapshots(userId: string): Promise<PersonalNetWorthSnapshot[]> {
    return this.snapshots.filter((s) => s.userId === userId);
  }

  // Investments
  public async savePosition(position: PersonalInvestmentPosition): Promise<PersonalInvestmentPosition> {
    const idx = this.investments.findIndex((i) => i.userId === position.userId && i.id === position.id);
    if (idx >= 0) this.investments[idx] = { ...position, updatedAt: new Date() };
    else this.investments.push(position);
    return position;
  }
  public async listPositions(userId: string): Promise<PersonalInvestmentPosition[]> {
    return this.investments.filter((i) => i.userId === userId);
  }

  // Decisions
  public async createDecision(decision: PersonalDecision): Promise<PersonalDecision> {
    this.decisions.push(decision);
    return decision;
  }
  public async updateDecision(decision: PersonalDecision): Promise<PersonalDecision> {
    const idx = this.decisions.findIndex((d) => d.userId === decision.userId && d.id === decision.id);
    if (idx >= 0) this.decisions[idx] = decision;
    else this.decisions.push(decision);
    return decision;
  }
  public async listDecisions(userId: string): Promise<PersonalDecision[]> {
    return this.decisions.filter((d) => d.userId === userId);
  }

  // Bridge Records
  public async recordBridge(record: BusinessPersonalBridgeRecord): Promise<BusinessPersonalBridgeRecord> {
    this.bridges.push(record);
    return record;
  }
  public async listBridgeRecords(userId: string): Promise<BusinessPersonalBridgeRecord[]> {
    return this.bridges.filter((b) => b.userId === userId);
  }
}
