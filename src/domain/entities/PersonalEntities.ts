/**
 * WILLShop OS — Wilty Personal OS Entities
 * Pure Domain Layer — ZERO external dependencies.
 * ABSOLUTE SEPARATION: All personal entities enforce scope = 'personal'.
 */

export interface PersonalProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  timezone: string;
  locale: string;
  preferences: {
    theme?: string;
    notificationChannels?: string[];
    dailyBriefingTime?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export type PersonalGoalCategory =
  | 'LIFE'
  | 'FINANCIAL'
  | 'CAREER'
  | 'LEARNING'
  | 'HEALTH'
  | 'RELATIONSHIPS'
  | 'CREATIVE'
  | 'PROJECT'
  | 'HABIT'
  | 'OTHER';

export type PersonalGoalStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export interface PersonalGoal {
  id: string;
  userId: string;
  scope: 'personal';
  category: PersonalGoalCategory;
  title: string;
  description?: string | null;
  rationale?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timeframe: string;
  startDate: Date;
  targetDate: Date;
  status: PersonalGoalStatus;
  baselineValue: number;
  targetValue: number;
  currentValue: number;
  unit: string;
  progressPercent: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  notes?: string | null;
  milestones: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type PersonalProjectStatus =
  | 'IDEA'
  | 'PLANNED'
  | 'ACTIVE'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'ARCHIVED';

export interface PersonalProject {
  id: string;
  userId: string;
  scope: 'personal';
  goalId?: string | null;
  title: string;
  description?: string | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: PersonalProjectStatus;
  deadline?: Date | null;
  budget: number;
  actualCost: number;
  progressPercent: number;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PersonalTaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PersonalTaskStatus = 'TODO' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE' | 'CANCELLED';

export interface PersonalTask {
  id: string;
  userId: string;
  scope: 'personal';
  projectId?: string | null;
  goalId?: string | null;
  title: string;
  description?: string | null;
  priority: PersonalTaskPriority;
  status: PersonalTaskStatus;
  dueDate?: Date | null;
  estimatedDurationMinutes?: number | null;
  actualDurationMinutes?: number | null;
  recurringFrequency?: 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | null;
  source: string;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface PersonalHabit {
  id: string;
  userId: string;
  scope: 'personal';
  goalId?: string | null;
  name: string;
  description?: string | null;
  frequency: HabitFrequency;
  targetDaysPerWeek: number;
  streakCount: number;
  bestStreak: number;
  adherencePercent: number;
  historyLog: string[]; // ISO Date strings 'YYYY-MM-DD'
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalLearningItem {
  id: string;
  userId: string;
  scope: 'personal';
  goalId?: string | null;
  title: string;
  type: 'BOOK' | 'COURSE' | 'SKILL' | 'ARTICLE' | 'PODCAST';
  resourceUrl?: string | null;
  currentLevel: string;
  targetLevel: string;
  progressPercent: number;
  notes?: string | null;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD';
  createdAt: Date;
  updatedAt: Date;
}

export type PersonalAccountType =
  | 'CASH'
  | 'BANK'
  | 'MOBILE_MONEY'
  | 'SAVINGS'
  | 'INVESTMENT'
  | 'OTHER_PERSONAL';

export interface PersonalFinancialAccount {
  id: string;
  userId: string;
  scope: 'personal';
  name: string;
  type: PersonalAccountType;
  currency: string;
  currentBalance: number;
  institution?: string | null;
  status: 'ACTIVE' | 'CLOSED';
  createdAt: Date;
  updatedAt: Date;
}

export type PersonalTransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT';

export interface PersonalTransaction {
  id: string;
  userId: string;
  scope: 'personal';
  accountId: string;
  targetAccountId?: string | null; // For transfers
  type: PersonalTransactionType;
  amount: number;
  currency: string;
  category: string; // e.g. "Housing", "Food", "Transport", "Personal Development", "Business Transfer"
  description: string;
  transactionDate: Date;
  status: 'COMPLETED' | 'PENDING' | 'REVERSED';
  counterparty?: string | null;
  notes?: string | null;
  createdAt: Date;
}

export interface PersonalBudget {
  id: string;
  userId: string;
  scope: 'personal';
  category: string;
  monthlyLimit: number;
  spentCurrentMonth: number;
  period: string; // e.g., "2026-09"
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalNetWorthSnapshot {
  id: string;
  userId: string;
  scope: 'personal';
  snapshotDate: Date;
  assetsValue: number;
  liabilitiesValue: number;
  netWorth: number;
  assetBreakdown: Record<string, number>;
  liabilityBreakdown: Record<string, number>;
  createdAt: Date;
}

export interface PersonalInvestmentPosition {
  id: string;
  userId: string;
  scope: 'personal';
  assetName: string;
  assetCategory: 'STOCKS' | 'CRYPTO' | 'REAL_ESTATE' | 'MUTUAL_FUND' | 'PRIVATE_EQUITY' | 'OTHER';
  quantity: number;
  purchaseUnitPrice: number;
  currentUnitPrice: number;
  investedCapital: number;
  currentValuation: number;
  unrealizedGainLoss: number;
  currency: string;
  brokerAccount?: string | null;
  updatedAt: Date;
  createdAt: Date;
}

export interface PersonalDecision {
  id: string;
  userId: string;
  scope: 'personal';
  question: string;
  context: string;
  options: string[];
  chosenOption: string;
  rationale: string;
  expectedOutcome: string;
  actualOutcome?: string | null;
  reviewDate: Date;
  status: 'PROPOSED' | 'ACCEPTED' | 'REVIEW_DUE' | 'REVIEWED' | 'REJECTED';
  createdAt: Date;
}

export interface BusinessPersonalBridgeRecord {
  id: string;
  userId: string;
  businessOrgId: string;
  direction: 'BUSINESS_TO_PERSONAL' | 'PERSONAL_TO_BUSINESS';
  transferType: 'OWNER_DRAW' | 'CAPITAL_INJECTION' | 'LOAN_REPAYMENT';
  amount: number;
  currency: string;
  businessAccountId: string;
  personalAccountId: string;
  businessTransactionId?: string | null;
  personalTransactionId?: string | null;
  reason: string;
  approvedByUserId: string;
  transferDate: Date;
  createdAt: Date;
}
