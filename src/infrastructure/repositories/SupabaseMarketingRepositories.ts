/**
 * WILLShop OS — Supabase Marketing Repositories
 * PostgreSQL implementation wrapping Supabase database queries.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  MarketingCampaign,
  CampaignStatus,
  MarketingCreative,
  CreativeStatusTag,
  MarketingSpend,
  MarketingAttribution,
  MarketingExperiment,
} from '../../domain/entities/MarketingEntities';
import {
  IMarketingCampaignRepository,
  IMarketingCreativeRepository,
  IMarketingSpendRepository,
  IMarketingAttributionRepository,
  IMarketingExperimentRepository,
} from '../../domain/interfaces/IMarketingRepositories';

export class SupabaseMarketingCampaignRepository implements IMarketingCampaignRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: Omit<MarketingCampaign, 'id' | 'createdAt' | 'updatedAt' | 'attributedRevenue' | 'attributedOrdersCount' | 'totalSpend' | 'cogs' | 'deliveryCosts' | 'contributionProfit' | 'roas' | 'roi'>): Promise<MarketingCampaign> {
    const { data: row, error } = await this.client
      .from('marketing_campaigns')
      .insert({
        organization_id: data.organizationId,
        ad_account_id: data.adAccountId,
        name: data.name,
        platform: data.platform,
        status: data.status,
        budget: data.budget,
        daily_budget: data.dailyBudget,
        target_products: data.targetProducts || [],
        start_at: data.startAt ? data.startAt.toISOString() : null,
        end_at: data.endAt ? data.endAt.toISOString() : null,
        created_by: data.createdBy,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseMarketingCampaignRepository.create error: ${error.message}`);
    return this.mapCampaign(row);
  }

  async findById(id: string, orgId: string): Promise<MarketingCampaign | null> {
    const { data, error } = await this.client
      .from('marketing_campaigns')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapCampaign(data);
  }

  async listByOrg(orgId: string, status?: CampaignStatus): Promise<MarketingCampaign[]> {
    let query = this.client.from('marketing_campaigns').select('*').eq('organization_id', orgId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;

    if (error) throw new Error(`SupabaseMarketingCampaignRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapCampaign);
  }

  async update(id: string, orgId: string, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.status !== undefined) patch.status = updates.status;
    if (updates.budget !== undefined) patch.budget = updates.budget;
    if (updates.attributedRevenue !== undefined) patch.attributed_revenue = updates.attributedRevenue;
    if (updates.totalSpend !== undefined) patch.total_spend = updates.totalSpend;
    if (updates.contributionProfit !== undefined) patch.contribution_profit = updates.contributionProfit;
    if (updates.roas !== undefined) patch.roas = updates.roas;
    if (updates.roi !== undefined) patch.roi = updates.roi;

    const { data, error } = await this.client
      .from('marketing_campaigns')
      .update(patch)
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`SupabaseMarketingCampaignRepository.update error: ${error.message}`);
    return this.mapCampaign(data);
  }

  async delete(id: string, orgId: string): Promise<void> {
    const { error } = await this.client.from('marketing_campaigns').delete().eq('id', id).eq('organization_id', orgId);
    if (error) throw new Error(`SupabaseMarketingCampaignRepository.delete error: ${error.message}`);
  }

  private mapCampaign(row: any): MarketingCampaign {
    return {
      id: row.id,
      organizationId: row.organization_id,
      adAccountId: row.ad_account_id,
      name: row.name,
      platform: row.platform,
      status: row.status,
      budget: Number(row.budget),
      dailyBudget: row.daily_budget ? Number(row.daily_budget) : null,
      targetProducts: row.target_products || [],
      startAt: row.start_at ? new Date(row.start_at) : null,
      endAt: row.end_at ? new Date(row.end_at) : null,
      attributedRevenue: Number(row.attributed_revenue || 0),
      attributedOrdersCount: Number(row.attributed_orders_count || 0),
      totalSpend: Number(row.total_spend || 0),
      cogs: Number(row.cogs || 0),
      deliveryCosts: Number(row.delivery_costs || 0),
      contributionProfit: Number(row.contribution_profit || 0),
      roas: Number(row.roas || 0),
      roi: Number(row.roi || 0),
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export class SupabaseMarketingCreativeRepository implements IMarketingCreativeRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: Omit<MarketingCreative, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketingCreative> {
    const { data: row, error } = await this.client
      .from('marketing_creatives')
      .insert({
        organization_id: data.organizationId,
        campaign_id: data.campaignId,
        name: data.name,
        type: data.type,
        asset_url: data.assetUrl,
        headline: data.headline,
        cta_text: data.ctaText,
        status_tag: data.statusTag,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: data.ctr,
        cpc: data.cpc,
        attributed_conversions: data.attributedConversions,
        metadata: data.metadata || {},
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseMarketingCreativeRepository.create error: ${error.message}`);
    return this.mapCreative(row);
  }

  async findById(id: string, orgId: string): Promise<MarketingCreative | null> {
    const { data, error } = await this.client
      .from('marketing_creatives')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .single();

    if (error || !data) return null;
    return this.mapCreative(data);
  }

  async listByOrg(orgId: string): Promise<MarketingCreative[]> {
    const { data, error } = await this.client.from('marketing_creatives').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`SupabaseMarketingCreativeRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapCreative);
  }

  async listByCampaign(campaignId: string, orgId: string): Promise<MarketingCreative[]> {
    const { data, error } = await this.client
      .from('marketing_creatives')
      .select('*')
      .eq('organization_id', orgId)
      .eq('campaign_id', campaignId);

    if (error) throw new Error(`SupabaseMarketingCreativeRepository.listByCampaign error: ${error.message}`);
    return (data || []).map(this.mapCreative);
  }

  async updateTag(id: string, orgId: string, statusTag: CreativeStatusTag): Promise<MarketingCreative> {
    const { data, error } = await this.client
      .from('marketing_creatives')
      .update({ status_tag: statusTag, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('organization_id', orgId)
      .select()
      .single();

    if (error) throw new Error(`SupabaseMarketingCreativeRepository.updateTag error: ${error.message}`);
    return this.mapCreative(data);
  }

  private mapCreative(row: any): MarketingCreative {
    return {
      id: row.id,
      organizationId: row.organization_id,
      campaignId: row.campaign_id,
      name: row.name,
      type: row.type,
      assetUrl: row.asset_url,
      headline: row.headline,
      ctaText: row.cta_text,
      statusTag: row.status_tag,
      impressions: Number(row.impressions || 0),
      clicks: Number(row.clicks || 0),
      ctr: Number(row.ctr || 0),
      cpc: Number(row.cpc || 0),
      attributedConversions: Number(row.attributed_conversions || 0),
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}

export class SupabaseMarketingSpendRepository implements IMarketingSpendRepository {
  constructor(private client: SupabaseClient) {}

  async recordSpend(data: Omit<MarketingSpend, 'id' | 'importedAt'>): Promise<MarketingSpend> {
    const { data: row, error } = await this.client
      .from('marketing_spends')
      .insert({
        organization_id: data.organizationId,
        provider: data.provider,
        ad_account_id: data.adAccountId,
        campaign_id: data.campaignId,
        ad_set_id: data.adSetId,
        advertisement_id: data.advertisementId,
        date: data.date.toISOString(),
        amount: data.amount,
        currency: data.currency,
        external_id: data.externalId,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseMarketingSpendRepository.recordSpend error: ${error.message}`);
    return this.mapSpend(row);
  }

  async listSpendsByOrg(orgId: string): Promise<MarketingSpend[]> {
    const { data, error } = await this.client.from('marketing_spends').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`SupabaseMarketingSpendRepository.listSpendsByOrg error: ${error.message}`);
    return (data || []).map(this.mapSpend);
  }

  async getTotalSpendByCampaign(campaignId: string, orgId: string): Promise<number> {
    const { data, error } = await this.client
      .from('marketing_spends')
      .select('amount')
      .eq('organization_id', orgId)
      .eq('campaign_id', campaignId);

    if (error || !data) return 0;
    return data.reduce((acc, row) => acc + Number(row.amount), 0);
  }

  private mapSpend(row: any): MarketingSpend {
    return {
      id: row.id,
      organizationId: row.organization_id,
      provider: row.provider,
      adAccountId: row.ad_account_id,
      campaignId: row.campaign_id,
      adSetId: row.ad_set_id,
      advertisementId: row.advertisement_id,
      date: new Date(row.date),
      amount: Number(row.amount),
      currency: row.currency,
      externalId: row.external_id,
      importedAt: new Date(row.imported_at),
    };
  }
}

export class SupabaseMarketingAttributionRepository implements IMarketingAttributionRepository {
  constructor(private client: SupabaseClient) {}

  async recordAttribution(data: Omit<MarketingAttribution, 'id'>): Promise<MarketingAttribution> {
    const { data: row, error } = await this.client
      .from('marketing_attributions')
      .insert({
        organization_id: data.organizationId,
        campaign_id: data.campaignId,
        customer_id: data.customerId,
        order_id: data.orderId,
        payment_id: data.paymentId,
        amount: data.amount,
        touchpoint: data.touchpoint,
        confidence_level: data.confidenceLevel,
        timestamp: data.timestamp.toISOString(),
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseMarketingAttributionRepository.recordAttribution error: ${error.message}`);
    return this.mapAttr(row);
  }

  async listByOrg(orgId: string): Promise<MarketingAttribution[]> {
    const { data, error } = await this.client.from('marketing_attributions').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`SupabaseMarketingAttributionRepository.listByOrg error: ${error.message}`);
    return (data || []).map(this.mapAttr);
  }

  async listByCampaign(campaignId: string, orgId: string): Promise<MarketingAttribution[]> {
    const { data, error } = await this.client
      .from('marketing_attributions')
      .select('*')
      .eq('organization_id', orgId)
      .eq('campaign_id', campaignId);

    if (error) throw new Error(`SupabaseMarketingAttributionRepository.listByCampaign error: ${error.message}`);
    return (data || []).map(this.mapAttr);
  }

  private mapAttr(row: any): MarketingAttribution {
    return {
      id: row.id,
      organizationId: row.organization_id,
      campaignId: row.campaign_id,
      customerId: row.customer_id,
      orderId: row.order_id,
      paymentId: row.payment_id,
      amount: Number(row.amount),
      touchpoint: row.touchpoint,
      confidenceLevel: row.confidence_level,
      timestamp: new Date(row.timestamp),
    };
  }
}

export class SupabaseMarketingExperimentRepository implements IMarketingExperimentRepository {
  constructor(private client: SupabaseClient) {}

  async create(data: Omit<MarketingExperiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketingExperiment> {
    const { data: row, error } = await this.client
      .from('marketing_experiments')
      .insert({
        organization_id: data.organizationId,
        name: data.name,
        hypothesis: data.hypothesis,
        variant: data.variant,
        metric: data.metric,
        status: data.status,
        result_summary: data.resultSummary,
        confidence_level: data.confidenceLevel,
      })
      .select()
      .single();

    if (error) throw new Error(`SupabaseMarketingExperimentRepository.create error: ${error.message}`);
    return {
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      hypothesis: row.hypothesis,
      variant: row.variant,
      metric: row.metric,
      status: row.status,
      resultSummary: row.result_summary,
      confidenceLevel: row.confidence_level,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async listByOrg(orgId: string): Promise<MarketingExperiment[]> {
    const { data, error } = await this.client.from('marketing_experiments').select('*').eq('organization_id', orgId);
    if (error) throw new Error(`SupabaseMarketingExperimentRepository.listByOrg error: ${error.message}`);
    return (data || []).map((row) => ({
      id: row.id,
      organizationId: row.organization_id,
      name: row.name,
      hypothesis: row.hypothesis,
      variant: row.variant,
      metric: row.metric,
      status: row.status,
      resultSummary: row.result_summary,
      confidenceLevel: row.confidence_level,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }));
  }
}
