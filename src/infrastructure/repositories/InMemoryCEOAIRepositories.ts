/**
 * WILLShop OS — In-Memory CEO AI Repositories
 * High-fidelity in-memory implementation for unit testing and local development.
 */

import {
  CEORecommendation,
  RecommendationStatus,
  CEODecision,
  AIUsageLog,
} from '../../domain/entities/CEOAIEntities';
import {
  ICEORecommendationRepository,
  ICEODecisionRepository,
  IAIUsageLogRepository,
} from '../../domain/interfaces/ICEOAIRepositories';

export class InMemoryCEORecommendationRepository implements ICEORecommendationRepository {
  private recs: Map<string, CEORecommendation> = new Map();

  async create(data: Omit<CEORecommendation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CEORecommendation> {
    const id = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();
    const rec: CEORecommendation = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.recs.set(id, rec);
    return rec;
  }

  async findById(id: string, orgId: string): Promise<CEORecommendation | null> {
    const rec = this.recs.get(id);
    if (!rec || rec.organizationId !== orgId) return null;
    return rec;
  }

  async listByOrg(orgId: string, status?: RecommendationStatus): Promise<CEORecommendation[]> {
    return Array.from(this.recs.values()).filter((r) => {
      if (r.organizationId !== orgId) return false;
      if (status && r.status !== status) return false;
      return true;
    });
  }

  async updateStatus(id: string, orgId: string, status: RecommendationStatus): Promise<CEORecommendation> {
    const rec = await this.findById(id, orgId);
    if (!rec) throw new Error(`Recommendation ${id} not found in org ${orgId}`);

    const updated: CEORecommendation = {
      ...rec,
      status,
      updatedAt: new Date(),
    };
    this.recs.set(id, updated);
    return updated;
  }
}

export class InMemoryCEODecisionRepository implements ICEODecisionRepository {
  private decisions: Map<string, CEODecision> = new Map();

  async create(data: Omit<CEODecision, 'id' | 'createdAt' | 'updatedAt'>): Promise<CEODecision> {
    const id = `dec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();
    const decision: CEODecision = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.decisions.set(id, decision);
    return decision;
  }

  async findById(id: string, orgId: string): Promise<CEODecision | null> {
    const dec = this.decisions.get(id);
    if (!dec || dec.organizationId !== orgId) return null;
    return dec;
  }

  async listByOrg(orgId: string): Promise<CEODecision[]> {
    return Array.from(this.decisions.values()).filter((d) => d.organizationId === orgId);
  }

  async supersedeDecision(id: string, orgId: string): Promise<CEODecision> {
    const dec = await this.findById(id, orgId);
    if (!dec) throw new Error(`Decision ${id} not found in org ${orgId}`);

    const updated: CEODecision = {
      ...dec,
      status: 'SUPERSEEDED',
      updatedAt: new Date(),
    };
    this.decisions.set(id, updated);
    return updated;
  }
}

export class InMemoryAIUsageLogRepository implements IAIUsageLogRepository {
  private logs: Map<string, AIUsageLog> = new Map();

  async logUsage(data: Omit<AIUsageLog, 'id' | 'createdAt'>): Promise<AIUsageLog> {
    const id = `usage_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const log: AIUsageLog = {
      ...data,
      id,
      createdAt: new Date(),
    };
    this.logs.set(id, log);
    return log;
  }

  async listLogsByOrg(orgId: string, limit = 50): Promise<AIUsageLog[]> {
    return Array.from(this.logs.values())
      .filter((l) => l.organizationId === orgId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getTotalCostByOrg(orgId: string): Promise<number> {
    let total = 0;
    for (const log of this.logs.values()) {
      if (log.organizationId === orgId) {
        total += log.estimatedCost;
      }
    }
    return Math.round(total * 10000) / 10000;
  }
}
