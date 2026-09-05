/**
 * WILLShop OS — Wilty Personal OS Application Services
 * Orchestrates personal life management, isolated personal finance ledger, personal goals,
 * habits, projects, tasks, decision journal, Wilty Daily Briefing, Weekly Review,
 * Personal AI Context building, and explicit audited bridge transfers.
 * Application Layer.
 */

import { SystemEvent } from '../../domain/entities/SystemEvent';
import {
  PersonalProfile,
  PersonalGoal,
  PersonalGoalCategory,
  PersonalProject,
  PersonalTask,
  PersonalTaskPriority,
  PersonalHabit,
  PersonalLearningItem,
  PersonalFinancialAccount,
  PersonalAccountType,
  PersonalTransaction,
  PersonalTransactionType,
  PersonalBudget,
  PersonalNetWorthSnapshot,
  PersonalInvestmentPosition,
  PersonalDecision,
  BusinessPersonalBridgeRecord,
} from '../../domain/entities/PersonalEntities';
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
import { PersonalFinanceLedgerService } from '../../domain/services/PersonalFinanceLedgerService';
import { PersonalNetWorthService } from '../../domain/services/PersonalNetWorthService';
import { PersonalGoalProgressService } from '../../domain/services/PersonalGoalProgressService';
import { PersonalHabitTrackingService } from '../../domain/services/PersonalHabitTrackingService';
import { PersonalAIContextProvider, WiltyPersonalAIContext } from '../../domain/services/PersonalAIContextProvider';
import { WiltyDailyBriefingService, WiltyDailyBriefing } from '../../domain/services/WiltyDailyBriefingService';
import { WiltyWeeklyReviewService, WiltyWeeklyReview } from '../../domain/services/WiltyWeeklyReviewService';
import { BusinessPersonalBridgeService } from '../../domain/services/BusinessPersonalBridgeService';

export interface PersonalApplicationServiceDependencies {
  profileRepo: IPersonalProfileRepository;
  goalRepo: IPersonalGoalRepository;
  projectRepo: IPersonalProjectRepository;
  taskRepo: IPersonalTaskRepository;
  habitRepo: IPersonalHabitRepository;
  learningRepo: IPersonalLearningRepository;
  accountRepo: IPersonalFinancialAccountRepository;
  transactionRepo: IPersonalTransactionRepository;
  budgetRepo: IPersonalBudgetRepository;
  netWorthRepo: IPersonalNetWorthRepository;
  investmentRepo: IPersonalInvestmentRepository;
  decisionRepo: IPersonalDecisionRepository;
  bridgeRepo: IBusinessPersonalBridgeRepository;
  recordEvent?: (event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>) => Promise<SystemEvent>;
}

export class PersonalApplicationService {
  constructor(private deps: PersonalApplicationServiceDependencies) {}

  // --- PROFILE ---

  public async getOrCreateProfile(userId: string, firstName: string = 'Willy', lastName: string = 'Tiendré'): Promise<PersonalProfile> {
    const existing = await this.deps.profileRepo.getProfile(userId);
    if (existing) return existing;

    const profile: PersonalProfile = {
      id: `prof_${Date.now()}`,
      userId,
      firstName,
      lastName,
      timezone: 'Africa/Dakar',
      locale: 'fr',
      preferences: { theme: 'dark', notificationChannels: ['app'], dailyBriefingTime: '07:30' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.profileRepo.saveProfile(profile);
  }

  // --- PERSONAL FINANCE LEDGER (ISOLATED) ---

  public async createPersonalAccount(
    userId: string,
    name: string,
    type: PersonalAccountType,
    currency: string = 'FCFA',
    initialBalance: number = 0,
    institution?: string
  ): Promise<PersonalFinancialAccount> {
    const account: PersonalFinancialAccount = {
      id: `pacc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      scope: 'personal',
      name,
      type,
      currency,
      currentBalance: initialBalance,
      institution,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.accountRepo.createAccount(account);
  }

  public async recordPersonalTransaction(
    userId: string,
    accountId: string,
    type: PersonalTransactionType,
    amount: number,
    category: string,
    description: string,
    targetAccountId?: string,
    counterparty?: string
  ): Promise<PersonalTransaction> {
    const account = await this.deps.accountRepo.findAccountById(userId, accountId);
    if (!account) throw new Error(`Compte personnel '${accountId}' introuvable.`);

    let targetAccount: PersonalFinancialAccount | undefined;
    if (type === 'TRANSFER' && targetAccountId) {
      const target = await this.deps.accountRepo.findAccountById(userId, targetAccountId);
      if (target) targetAccount = target;
    }

    const transaction: PersonalTransaction = {
      id: `ptx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      scope: 'personal',
      accountId,
      targetAccountId,
      type,
      amount,
      currency: account.currency,
      category,
      description,
      transactionDate: new Date(),
      status: 'COMPLETED',
      counterparty,
      createdAt: new Date(),
    };

    const savedTx = await this.deps.transactionRepo.createTransaction(transaction);

    // Update balances
    const { updatedAccount, updatedTargetAccount } = PersonalFinanceLedgerService.processTransaction(
      account,
      savedTx,
      targetAccount
    );

    await this.deps.accountRepo.updateAccount(updatedAccount);
    if (updatedTargetAccount) {
      await this.deps.accountRepo.updateAccount(updatedTargetAccount);
    }

    return savedTx;
  }

  public async listPersonalAccounts(userId: string): Promise<PersonalFinancialAccount[]> {
    return this.deps.accountRepo.listAccounts(userId);
  }

  public async computeNetWorthSnapshot(userId: string): Promise<PersonalNetWorthSnapshot> {
    const accounts = await this.deps.accountRepo.listAccounts(userId);
    const investments = await this.deps.investmentRepo.listPositions(userId);

    const snapshot = PersonalNetWorthService.calculateNetWorth(userId, accounts, investments);
    return this.deps.netWorthRepo.saveSnapshot(snapshot);
  }

  // --- EXPLICIT BUSINESS ↔ PERSONAL BRIDGE ---

  public async executeBridgeTransfer(
    userId: string,
    businessOrgId: string,
    direction: 'BUSINESS_TO_PERSONAL' | 'PERSONAL_TO_BUSINESS',
    transferType: 'OWNER_DRAW' | 'CAPITAL_INJECTION' | 'LOAN_REPAYMENT',
    amount: number,
    businessAccountId: string,
    personalAccountId: string,
    reason: string
  ): Promise<BusinessPersonalBridgeRecord> {
    const record = BusinessPersonalBridgeService.createBridgeRecord(
      userId,
      businessOrgId,
      direction,
      transferType,
      amount,
      'FCFA',
      businessAccountId,
      personalAccountId,
      reason,
      userId
    );

    // Record personal transaction reflecting bridge transfer
    const txType = direction === 'BUSINESS_TO_PERSONAL' ? 'INCOME' : 'EXPENSE';
    const txCategory = direction === 'BUSINESS_TO_PERSONAL' ? 'Business Transfer (Owner Draw)' : 'Business Injection';

    const ptx = await this.recordPersonalTransaction(
      userId,
      personalAccountId,
      txType,
      amount,
      txCategory,
      `Passerelle Officielle Business <-> Personal: ${reason}`,
      undefined,
      'WillShop OS Business'
    );

    record.personalTransactionId = ptx.id;
    const savedRecord = await this.deps.bridgeRepo.recordBridge(record);

    if (this.deps.recordEvent) {
      await this.deps.recordEvent({
        organizationId: businessOrgId,
        eventType: 'finance.bridge_transfer_executed',
        payload: { bridgeId: savedRecord.id, direction, amount, reason },
      });
    }

    return savedRecord;
  }

  // --- PERSONAL GOALS, PROJECTS, TASKS, HABITS & LEARNING ---

  public async createPersonalGoal(
    userId: string,
    title: string,
    category: PersonalGoalCategory,
    baselineValue: number,
    targetValue: number,
    unit: string,
    targetDate: Date,
    description?: string
  ): Promise<PersonalGoal> {
    const goal: PersonalGoal = {
      id: `pgoal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      scope: 'personal',
      category,
      title,
      description,
      priority: 'HIGH',
      timeframe: '2026',
      startDate: new Date(),
      targetDate,
      status: 'ACTIVE',
      baselineValue,
      targetValue,
      currentValue: baselineValue,
      unit,
      progressPercent: 0,
      confidence: 'HIGH',
      milestones: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.goalRepo.createGoal(goal);
  }

  public async createPersonalTask(
    userId: string,
    title: string,
    priority: PersonalTaskPriority = 'MEDIUM',
    dueDate?: Date,
    projectId?: string,
    goalId?: string,
    description?: string
  ): Promise<PersonalTask> {
    const task: PersonalTask = {
      id: `ptask_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      scope: 'personal',
      projectId,
      goalId,
      title,
      description,
      priority,
      status: 'TODO',
      dueDate,
      source: 'MANUAL',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.taskRepo.createTask(task);
  }

  public async createPersonalHabit(
    userId: string,
    name: string,
    targetDaysPerWeek: number = 7,
    goalId?: string
  ): Promise<PersonalHabit> {
    const habit: PersonalHabit = {
      id: `phabit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      scope: 'personal',
      goalId,
      name,
      frequency: 'DAILY',
      targetDaysPerWeek,
      streakCount: 0,
      bestStreak: 0,
      adherencePercent: 100,
      historyLog: [],
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.deps.habitRepo.createHabit(habit);
  }

  public async logHabitCompletion(userId: string, habitId: string): Promise<PersonalHabit> {
    const habit = await this.deps.habitRepo.findHabitById(userId, habitId);
    if (!habit) throw new Error(`Habitude '${habitId}' introuvable.`);

    const updated = PersonalHabitTrackingService.logCompletion(habit);
    return this.deps.habitRepo.updateHabit(updated);
  }

  // --- DECISIONS ---

  public async createPersonalDecision(
    userId: string,
    question: string,
    context: string,
    options: string[],
    chosenOption: string,
    rationale: string,
    expectedOutcome: string,
    reviewDate: Date
  ): Promise<PersonalDecision> {
    const decision: PersonalDecision = {
      id: `pdec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      scope: 'personal',
      question,
      context,
      options,
      chosenOption,
      rationale,
      expectedOutcome,
      reviewDate,
      status: 'ACCEPTED',
      createdAt: new Date(),
    };

    return this.deps.decisionRepo.createDecision(decision);
  }

  // --- WILTY PERSONAL AI & BRIEFINGS ---

  public async getPersonalAIContext(userId: string): Promise<WiltyPersonalAIContext> {
    const profile = await this.getOrCreateProfile(userId);
    const goals = await this.deps.goalRepo.listGoals(userId);
    const tasks = await this.deps.taskRepo.listTasks(userId);
    const projects = await this.deps.projectRepo.listProjects(userId);
    const habits = await this.deps.habitRepo.listHabits(userId);
    const learning = await this.deps.learningRepo.listItems(userId);
    const accounts = await this.deps.accountRepo.listAccounts(userId);
    const decisions = await this.deps.decisionRepo.listDecisions(userId);

    // Assert absolute boundary isolation
    PersonalAIContextProvider.assertPersonalScopeOnly(goals);
    PersonalAIContextProvider.assertPersonalScopeOnly(tasks);
    PersonalAIContextProvider.assertPersonalScopeOnly(projects);

    return PersonalAIContextProvider.buildPersonalContext(
      profile,
      goals,
      tasks,
      projects,
      habits,
      learning,
      accounts,
      decisions
    );
  }

  public async getDailyBriefing(userId: string): Promise<WiltyDailyBriefing> {
    const goals = await this.deps.goalRepo.listGoals(userId);
    const tasks = await this.deps.taskRepo.listTasks(userId);
    const projects = await this.deps.projectRepo.listProjects(userId);
    const habits = await this.deps.habitRepo.listHabits(userId);
    const learning = await this.deps.learningRepo.listItems(userId);
    const accounts = await this.deps.accountRepo.listAccounts(userId);

    return WiltyDailyBriefingService.generateDailyBriefing(
      userId,
      goals,
      tasks,
      projects,
      habits,
      learning,
      accounts
    );
  }

  public async getWeeklyReview(userId: string): Promise<WiltyWeeklyReview> {
    const goals = await this.deps.goalRepo.listGoals(userId);
    const tasks = await this.deps.taskRepo.listTasks(userId);
    const projects = await this.deps.projectRepo.listProjects(userId);
    const habits = await this.deps.habitRepo.listHabits(userId);

    return WiltyWeeklyReviewService.generateWeeklyReview(userId, goals, tasks, projects, habits);
  }

  // --- SEED INITIAL PERSONAL DATA FOR WILLY TIENDRÉ ---

  public async seedInitialPersonalData(userId: string): Promise<PersonalProfile> {
    const profile = await this.getOrCreateProfile(userId, 'Willy', 'Tiendré');

    const existingAccounts = await this.deps.accountRepo.listAccounts(userId);
    if (existingAccounts.length > 0) return profile;

    // Seed Personal Accounts
    const bank = await this.createPersonalAccount(userId, 'Compte Bancaire Personnel BOA', 'BANK', 'FCFA', 1500000, 'BOA Sénégal');
    const cash = await this.createPersonalAccount(userId, 'Caisse Personnelle & Wave', 'MOBILE_MONEY', 'FCFA', 350000, 'Wave / Orange');

    // Seed Personal Goal
    const goal = await this.createPersonalGoal(
      userId,
      'Constituer un fond de sécurité personnel de 5 000 000 FCFA',
      'FINANCIAL',
      1850000,
      5000000,
      'FCFA',
      new Date(Date.now() + 180 * 86400000),
      'Épargne de précaution personnelle'
    );

    // Seed Personal Habit
    await this.createPersonalHabit(userId, 'Lecture quotidienne 30 min (Business/Stratégie)', 7, goal.id);

    // Seed Personal Tasks
    await this.createPersonalTask(userId, 'Revue hebdomadaire du patrimoine personnel', 'HIGH', new Date(), undefined, goal.id);
    await this.createPersonalTask(userId, 'Planification session apprentissage IA & Agentic Coding', 'MEDIUM', new Date());

    return profile;
  }
}
