/**
 * WILLShop OS — Wilty Personal OS Repositories Contracts
 * Pure Domain Interfaces — Data Core Contracts.
 */

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
} from '../entities/PersonalEntities';

export interface IPersonalProfileRepository {
  getProfile(userId: string): Promise<PersonalProfile | null>;
  saveProfile(profile: PersonalProfile): Promise<PersonalProfile>;
}

export interface IPersonalGoalRepository {
  createGoal(goal: PersonalGoal): Promise<PersonalGoal>;
  updateGoal(goal: PersonalGoal): Promise<PersonalGoal>;
  findGoalById(userId: string, id: string): Promise<PersonalGoal | null>;
  listGoals(userId: string): Promise<PersonalGoal[]>;
}

export interface IPersonalProjectRepository {
  createProject(project: PersonalProject): Promise<PersonalProject>;
  updateProject(project: PersonalProject): Promise<PersonalProject>;
  findProjectById(userId: string, id: string): Promise<PersonalProject | null>;
  listProjects(userId: string): Promise<PersonalProject[]>;
}

export interface IPersonalTaskRepository {
  createTask(task: PersonalTask): Promise<PersonalTask>;
  updateTask(task: PersonalTask): Promise<PersonalTask>;
  findTaskById(userId: string, id: string): Promise<PersonalTask | null>;
  listTasks(userId: string, filters?: { status?: string; priority?: string }): Promise<PersonalTask[]>;
}

export interface IPersonalHabitRepository {
  createHabit(habit: PersonalHabit): Promise<PersonalHabit>;
  updateHabit(habit: PersonalHabit): Promise<PersonalHabit>;
  findHabitById(userId: string, id: string): Promise<PersonalHabit | null>;
  listHabits(userId: string): Promise<PersonalHabit[]>;
}

export interface IPersonalLearningRepository {
  createItem(item: PersonalLearningItem): Promise<PersonalLearningItem>;
  updateItem(item: PersonalLearningItem): Promise<PersonalLearningItem>;
  listItems(userId: string): Promise<PersonalLearningItem[]>;
}

export interface IPersonalFinancialAccountRepository {
  createAccount(account: PersonalFinancialAccount): Promise<PersonalFinancialAccount>;
  updateAccount(account: PersonalFinancialAccount): Promise<PersonalFinancialAccount>;
  findAccountById(userId: string, id: string): Promise<PersonalFinancialAccount | null>;
  listAccounts(userId: string): Promise<PersonalFinancialAccount[]>;
}

export interface IPersonalTransactionRepository {
  createTransaction(transaction: PersonalTransaction): Promise<PersonalTransaction>;
  listTransactions(userId: string, accountId?: string): Promise<PersonalTransaction[]>;
}

export interface IPersonalBudgetRepository {
  createBudget(budget: PersonalBudget): Promise<PersonalBudget>;
  updateBudget(budget: PersonalBudget): Promise<PersonalBudget>;
  listBudgets(userId: string): Promise<PersonalBudget[]>;
}

export interface IPersonalNetWorthRepository {
  saveSnapshot(snapshot: PersonalNetWorthSnapshot): Promise<PersonalNetWorthSnapshot>;
  listSnapshots(userId: string): Promise<PersonalNetWorthSnapshot[]>;
}

export interface IPersonalInvestmentRepository {
  savePosition(position: PersonalInvestmentPosition): Promise<PersonalInvestmentPosition>;
  listPositions(userId: string): Promise<PersonalInvestmentPosition[]>;
}

export interface IPersonalDecisionRepository {
  createDecision(decision: PersonalDecision): Promise<PersonalDecision>;
  updateDecision(decision: PersonalDecision): Promise<PersonalDecision>;
  listDecisions(userId: string): Promise<PersonalDecision[]>;
}

export interface IBusinessPersonalBridgeRepository {
  recordBridge(record: BusinessPersonalBridgeRecord): Promise<BusinessPersonalBridgeRecord>;
  listBridgeRecords(userId: string): Promise<BusinessPersonalBridgeRecord[]>;
}
