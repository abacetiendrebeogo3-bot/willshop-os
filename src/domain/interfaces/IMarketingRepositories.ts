/**
 * WILLShop OS — Marketing Engine Repository Interfaces
 * Pure Domain Layer.
 */

import {
  MarketingCampaign,
  CampaignStatus,
  MarketingCreative,
  CreativeStatusTag,
  MarketingSpend,
  MarketingAttribution,
  MarketingExperiment,
} from '../entities/MarketingEntities';

export interface IMarketingCampaignRepository {
  create(campaign: Omit<MarketingCampaign, 'id' | 'createdAt' | 'updatedAt' | 'attributedRevenue' | 'attributedOrdersCount' | 'totalSpend' | 'cogs' | 'deliveryCosts' | 'contributionProfit' | 'roas' | 'roi'>): Promise<MarketingCampaign>;
  findById(id: string, orgId: string): Promise<MarketingCampaign | null>;
  listByOrg(orgId: string, status?: CampaignStatus): Promise<MarketingCampaign[]>;
  update(id: string, orgId: string, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign>;
  delete(id: string, orgId: string): Promise<void>;
}

export interface IMarketingCreativeRepository {
  create(creative: Omit<MarketingCreative, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketingCreative>;
  findById(id: string, orgId: string): Promise<MarketingCreative | null>;
  listByOrg(orgId: string): Promise<MarketingCreative[]>;
  listByCampaign(campaignId: string, orgId: string): Promise<MarketingCreative[]>;
  updateTag(id: string, orgId: string, statusTag: CreativeStatusTag): Promise<MarketingCreative>;
}

export interface IMarketingSpendRepository {
  recordSpend(spend: Omit<MarketingSpend, 'id' | 'importedAt'>): Promise<MarketingSpend>;
  listSpendsByOrg(orgId: string): Promise<MarketingSpend[]>;
  getTotalSpendByCampaign(campaignId: string, orgId: string): Promise<number>;
}

export interface IMarketingAttributionRepository {
  recordAttribution(attribution: Omit<MarketingAttribution, 'id'>): Promise<MarketingAttribution>;
  listByOrg(orgId: string): Promise<MarketingAttribution[]>;
  listByCampaign(campaignId: string, orgId: string): Promise<MarketingAttribution[]>;
}

export interface IMarketingExperimentRepository {
  create(experiment: Omit<MarketingExperiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketingExperiment>;
  listByOrg(orgId: string): Promise<MarketingExperiment[]>;
}
