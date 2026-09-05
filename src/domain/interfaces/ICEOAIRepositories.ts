/**
 * WILLShop OS — CEO AI Engine Repository Interfaces
 * Pure Domain Layer.
 */

import {
  CEORecommendation,
  RecommendationStatus,
  CEODecision,
  AIUsageLog,
} from '../entities/CEOAIEntities';

export interface ICEORecommendationRepository {
  create(rec: Omit<CEORecommendation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CEORecommendation>;
  findById(id: string, orgId: string): Promise<CEORecommendation | null>;
  listByOrg(orgId: string, status?: RecommendationStatus): Promise<CEORecommendation[]>;
  updateStatus(id: string, orgId: string, status: RecommendationStatus): Promise<CEORecommendation>;
}

export interface ICEODecisionRepository {
  create(decision: Omit<CEODecision, 'id' | 'createdAt' | 'updatedAt'>): Promise<CEODecision>;
  findById(id: string, orgId: string): Promise<CEODecision | null>;
  listByOrg(orgId: string): Promise<CEODecision[]>;
  supersedeDecision(id: string, orgId: string): Promise<CEODecision>;
}

export interface IAIUsageLogRepository {
  logUsage(entry: Omit<AIUsageLog, 'id' | 'createdAt'>): Promise<AIUsageLog>;
  listLogsByOrg(orgId: string, limit?: number): Promise<AIUsageLog[]>;
  getTotalCostByOrg(orgId: string): Promise<number>;
}
