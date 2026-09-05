/**
 * WILLShop OS — Supabase CEO AI Repositories
 * PostgreSQL implementation wrapping Supabase database queries.
 */

import { SupabaseClient } from '@supabase/supabase-js';
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

export class SupabaseCEORecommendationRepository implements ICEORecommendationRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: Omit<CEORecommendation, 'id' | 'createdAt' | 'updatedAt'>): Promise<CEORecommendation> {
    const { data: row, error } = await this.client
      .from('ai_recommendations')
      .insert({
        organization_id: data.organizationId,
        title: data.title,
        problem: data.problem,
        observation: data.observation,
        evidence: data.evidence,
        recommendation: data.recommendation,
        potential_benefit: data.potentialBenefit,
        risk: data.risk,
        confidence: data.confidence,
        urgency: data.urgency,
        proposed_action: data.proposedAction,
        status: data.status,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseCEORecommendationRepository.create error: ${error.message}`);
    return this.mapRec(row);
  }

  async findById(id: string, orgId: string): Promise<CEORecommendation | null> {
    const { data, error } = await this.client
      .from('ai_recommendations')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapRec(data);
  }

  async listByOrg(orgId: string, status?: RecommendationStatus): Promise<CEORecommendation[]> {
    let query = this.client.from('ai_recommendations').select('*').eq('organization_id', orgId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;

    if (error) throw new Error(`SupabaseCEORecommendationRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapRec);
  }

  async updateStatus(id: string, orgId: string, status: RecommendationStatus): Promise<CEORecommendation> {
    const { data, error } = await this.client
      .from('ai_recommendations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`SupabaseCEORecommendationRepository.updateStatus error: ${error.message}`);
    return this.mapRec(data);
  }

  private mapRec(row: any): CEORecommendation {
    return {
      id: row.id,
      organizationId: row.organization_id,
      title: row.title,
      problem: row.problem,
      observation: row.observation,
      evidence: row.evidence || [],
      recommendation: row.recommendation,
      potentialBenefit: row.potential_benefit,
      risk: row.risk,
      confidence: row.confidence,
      urgency: row.urgency,
      proposedAction: row.proposed_action,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export class SupabaseCEODecisionRepository implements ICEODecisionRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: Omit<CEODecision, 'id' | 'createdAt' | 'updatedAt'>): Promise<CEODecision> {
    const { data: row, error } = await this.client
      .from('ai_decisions')
      .insert({
        organization_id: data.organizationId,
        decision_title: data.decisionTitle,
        reason: data.reason,
        expected_outcome: data.expectedOutcome,
        evidence: data.evidence,
        status: data.status,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseCEODecisionRepository.create error: ${error.message}`);
    return this.mapDecision(row);
  }

  async findById(id: string, orgId: string): Promise<CEODecision | null> {
    const { data, error } = await this.client
      .from('ai_decisions')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapDecision(data);
  }

  async listByOrg(orgId: string): Promise<CEODecision[]> {
    const { data, error } = await this.client.from('ai_decisions').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`SupabaseCEODecisionRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapDecision);
  }

  async supersedeDecision(id: string, orgId: string): Promise<CEODecision> {
    const { data, error } = await this.client
      .from('ai_decisions')
      .update({ status: 'SUPERSEEDED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`SupabaseCEODecisionRepository.supersedeDecision error: ${error.message}`);
    return this.mapDecision(data);
  }

  private mapDecision(row: any): CEODecision {
    return {
      id: row.id,
      organizationId: row.organization_id,
      decisionTitle: row.decision_title,
      reason: row.reason,
      expectedOutcome: row.expected_outcome,
      evidence: row.evidence || [],
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export class SupabaseAIUsageLogRepository implements IAIUsageLogRepository {
  constructor(private client: SupabaseClient) {}

  async logUsage(data: Omit<AIUsageLog, 'id' | 'createdAt'>): Promise<AIUsageLog> {
    const { data: row, error } = await this.client
      .from('ai_usage_logs')
      .insert({
        organization_id: data.organizationId,
        provider: data.provider,
        model: data.model,
        prompt_tokens: data.promptTokens,
        completion_tokens: data.completionTokens,
        total_tokens: data.totalTokens,
        estimated_cost: data.estimatedCost,
        latency_ms: data.latencyMs,
        operation: data.operation,
        correlation_id: data.correlationId,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseAIUsageLogRepository.logUsage error: ${error.message}`);
    return this.mapLog(row);
  }

  async listLogsByOrg(orgId: string, limit = 50): Promise<AIUsageLog[]> {
    const { data, error } = await this.client
      .from('ai_usage_logs')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(`SupabaseAIUsageLogRepository.listLogsByOrg error: ${error.message}`);
    return (data || []).map(this.mapLog);
  }

  async getTotalCostByOrg(orgId: string): Promise<number> {
    const { data, error } = await this.client.rpc('get_ai_total_cost_by_org', { p_org_id: orgId });
    if (error) return 0;
    return Number(data || 0);
  }

  private mapLog(row: any): AIUsageLog {
    return {
      id: row.id,
      organizationId: row.organization_id,
      provider: row.provider,
      model: row.model,
      promptTokens: row.prompt_tokens,
      completionTokens: row.completion_tokens,
      totalTokens: row.total_tokens,
      estimatedCost: Number(row.estimated_cost),
      latencyMs: row.latency_ms,
      operation: row.operation,
      correlationId: row.correlation_id,
      createdAt: new Date(row.created_at),
    };
  }
}
