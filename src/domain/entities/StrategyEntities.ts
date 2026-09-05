/**
 * WILLShop OS — Strategy & Goals Engine Entities
 * Pure Domain Layer — ZERO external dependencies.
 */

export type StrategyStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface Strategy {
  id: string;
  organizationId: string;
  title: string;
  description?: string | null;
  vision: string;
  mission?: string | null;
  strategicPeriod: string; // e.g. "Q3-Q4 2026", "2026-2027"
  startDate: Date;
  endDate: Date;
  status: StrategyStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type StrategicPriority = 'P1_CRITICAL' | 'P2_HIGH' | 'P3_MEDIUM';
export type ObjectiveStatus = 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'ACHIEVED' | 'CANCELLED';

export interface StrategicObjective {
  id: string;
  organizationId: string;
  strategyId: string;
  title: string;
  description?: string | null;
  strategicPriority: StrategicPriority;
  ownerId: string;
  timeframe: string;
  status: ObjectiveStatus;
  parentObjectiveId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type GoalScopeType =
  | 'COMPANY'
  | 'STRATEGIC'
  | 'FINANCIAL'
  | 'SALES'
  | 'MARKETING'
  | 'OPERATIONS'
  | 'CUSTOMER'
  | 'TEAM'
  | 'PERSONAL_BUSINESS';

export type GoalTrajectoryStatus =
  | 'ON_TRACK'
  | 'AT_RISK'
  | 'OFF_TRACK'
  | 'ACHIEVED'
  | 'NOT_STARTED'
  | 'PAUSED'
  | 'FAILED'
  | 'CANCELLED';

export type ConfidenceRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface StrategicGoal {
  id: string;
  organizationId: string;
  objectiveId?: string | null;
  title: string;
  description?: string | null;
  ownerId: string;
  teamId?: string | null;
  goalType: GoalScopeType;
  kpiKey?: string | null; // e.g., 'revenue_month', 'contribution_profit', 'delivery_rate'
  baselineValue: number;
  baselineDate: Date;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: Date;
  dueDate: Date;
  status: GoalTrajectoryStatus;
  confidence: ConfidenceRating;
  forecastValue?: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KeyResult {
  id: string;
  organizationId: string;
  goalId: string;
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  weight: number; // e.g., 1.0
  status: GoalTrajectoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

export type InitiativeLifecycleStatus =
  | 'IDEA'
  | 'PLANNED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ARCHIVED';

export type LevelRating = 'HIGH' | 'MEDIUM' | 'LOW';

export interface Initiative {
  id: string;
  organizationId: string;
  objectiveId?: string | null;
  goalId?: string | null;
  title: string;
  description?: string | null;
  ownerId: string;
  teamId?: string | null;
  status: InitiativeLifecycleStatus;
  strategicImpact: LevelRating;
  expectedFinancialImpact: number;
  urgency: LevelRating;
  effort: LevelRating;
  riskLevel: LevelRating;
  prioritizationScore: number;
  budget: number;
  actualCost: number;
  expectedRevenue: number;
  expectedProfit: number;
  expectedRoi: number;
  startDate: Date;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategicMilestone {
  id: string;
  organizationId: string;
  initiativeId: string;
  title: string;
  ownerId: string;
  deadline: Date;
  status: 'PENDING' | 'COMPLETED' | 'OVERDUE';
  evidence?: string | null;
  completedAt?: Date | null;
  createdAt: Date;
}

export type RiskStatus = 'OPEN' | 'MONITORED' | 'MITIGATED' | 'ACCEPTED' | 'CLOSED';

export interface StrategyRisk {
  id: string;
  organizationId: string;
  strategyId?: string | null;
  objectiveId?: string | null;
  initiativeId?: string | null;
  title: string;
  description?: string | null;
  probability: LevelRating;
  impact: LevelRating;
  riskScore: number; // 1 to 9 (Probability x Impact)
  mitigationPlan: string;
  ownerId: string;
  status: RiskStatus;
  reviewDate: Date;
  createdAt: Date;
}

export interface StrategicAssumption {
  id: string;
  organizationId: string;
  strategyId: string;
  title: string;
  description?: string | null;
  kpiKey?: string | null;
  thresholdCondition: string; // e.g. "cac <= 2500"
  isValid: boolean;
  lastVerifiedAt?: Date | null;
  createdAt: Date;
}

export type DecisionStatus = 'PROPOSED' | 'ACCEPTED' | 'REVIEW_DUE' | 'REVIEWED' | 'REJECTED';

export interface StrategicDecision {
  id: string;
  organizationId: string;
  strategyId?: string | null;
  title: string;
  context: string;
  options: string[];
  chosenOption: string;
  reason: string;
  expectedOutcome: string;
  actualOutcome?: string | null;
  ownerId: string;
  decisionDate: Date;
  reviewDate: Date;
  status: DecisionStatus;
  createdAt: Date;
}

export interface StrategicPlan90Days {
  organizationId: string;
  periodName: string;
  topPriorities: string[];
  activeInitiatives: Initiative[];
  keyMilestones: StrategicMilestone[];
  criticalRisks: StrategyRisk[];
}

export interface StrategicHealthSummary {
  overallHealthScore: number; // 0-100
  dimensionScores: {
    finance: number;
    sales: number;
    marketing: number;
    operations: number;
    customers: number;
    team: number;
    strategy: number;
  };
  alignmentRatio: number; // % of active initiatives/tasks linked to strategy
  statusBadge: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
}
