/**
 * WILLShop OS — CEO AI Engine Domain Entities
 * Pure Domain Layer.
 */

import { PermissionLevel } from './DataCoreEntities';

export type CEOIntent =
  | 'ANALYZE_BUSINESS'
  | 'ANALYZE_SALES'
  | 'ANALYZE_STOCK'
  | 'ANALYZE_FINANCE'
  | 'ANALYZE_CUSTOMERS'
  | 'ANALYZE_DELIVERY'
  | 'ANALYZE_MARKETING'
  | 'ANALYZE_TEAM'
  | 'ANALYZE_GOALS'
  | 'DETECT_RISK'
  | 'GENERATE_PLAN'
  | 'RECOMMEND_ACTION'
  | 'EXECUTE_ACTION'
  | 'EXPLAIN_DECISION'
  | 'FORECAST'
  | 'DAILY_BRIEFING';

export interface AIInsightEvidence {
  sourceType: string; // e.g. 'bi_daily_sales', 'orders', 'stock', 'finance'
  sourceId?: string | null;
  metric: string;
  value: unknown;
  period: string;
  comparison?: string | null;
  delta?: number | null;
  freshness: string; // e.g. 'realtime', 'updated 5m ago'
  confidence: number; // 0..100
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ConfidenceScore {
  level: ConfidenceLevel;
  score: number; // 0..100
  reasons: string[];
}

export interface CEOBriefing {
  id: string;
  organizationId: string;
  urgent: string[];
  attention: string[];
  opportunities: string[];
  performance: Record<string, unknown>;
  priorities: string[];
  evidence: AIInsightEvidence[];
  generatedAt: Date;
}

export type RecommendationStatus = 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'EXECUTED';

export interface CEORecommendation {
  id: string;
  organizationId: string;
  title: string;
  problem: string;
  observation: string;
  evidence: AIInsightEvidence[];
  recommendation: string;
  potentialBenefit: string;
  risk: string;
  confidence: ConfidenceScore;
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  proposedAction?: {
    actionType: string;
    targetService?: string;
    payload: Record<string, unknown>;
    permissionLevel: PermissionLevel;
  } | null;
  status: RecommendationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionStep {
  stepNumber: number;
  title: string;
  actionType?: string;
  targetService?: string;
  payload?: Record<string, unknown>;
  permissionLevel: PermissionLevel;
  status: 'PENDING' | 'WAITING_APPROVAL' | 'EXECUTED' | 'FAILED';
}

export interface ActionPlan {
  id: string;
  organizationId: string;
  objective: string;
  steps: ActionStep[];
  createdFromRecommendationId?: string | null;
  status: 'PROPOSED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  updatedAt: Date;
}

export interface ForecastResult {
  metricName: string;
  baselineValue: number;
  forecastValue: number;
  period: string;
  confidence: ConfidenceScore;
  assumptions: string[];
  method: string; // e.g. 'MOVING_AVERAGE_3P'
}

export interface ScenarioSimulationResult {
  scenarioName: string;
  baseline: Record<string, number>;
  projected: Record<string, number>;
  deltas: Record<string, number>;
  assumptions: string[];
  confidence: ConfidenceScore;
}

export interface AIUsageLog {
  id: string;
  organizationId: string;
  provider: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  estimatedCost: number;
  latencyMs: number;
  operation: string;
  correlationId?: string | null;
  createdAt: Date;
}

export interface CEODecision {
  id: string;
  organizationId: string;
  decisionTitle: string;
  reason: string;
  expectedOutcome: string;
  evidence: AIInsightEvidence[];
  status: 'ACTIVE' | 'SUPERSEEDED' | 'ARCHIVED';
  createdAt: Date;
  updatedAt: Date;
}
