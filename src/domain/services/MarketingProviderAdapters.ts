/**
 * WILLShop OS — Marketing Provider Adapters
 * Provider-agnostic interfaces for Meta Ads, Instagram, Facebook, and manual entry.
 * Pure Domain Layer.
 */

import { MarketingSpend, MarketingCampaign } from '../entities/MarketingEntities';

export interface MarketingProviderMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  cpm: number;
  cpc: number;
  ctr: number;
}

export interface IMarketingProviderAdapter {
  providerName: string;
  fetchSpendData(orgId: string, startDate: Date, endDate: Date): Promise<Omit<MarketingSpend, 'id' | 'importedAt'>[]>;
  fetchCampaignMetrics(orgId: string, externalCampaignId: string): Promise<MarketingProviderMetrics>;
}

export class MetaAdsProviderAdapter implements IMarketingProviderAdapter {
  public providerName = 'META_ADS';

  async fetchSpendData(orgId: string, startDate: Date, endDate: Date): Promise<Omit<MarketingSpend, 'id' | 'importedAt'>[]> {
    // Provider mock adapter returning consistent spend data for org
    return [
      {
        organizationId: orgId,
        provider: 'META_ADS',
        date: startDate,
        amount: 75000,
        currency: 'XOF',
        externalId: `meta_spend_${startDate.getTime()}`,
      },
    ];
  }

  async fetchCampaignMetrics(orgId: string, externalCampaignId: string): Promise<MarketingProviderMetrics> {
    return {
      impressions: 45000,
      clicks: 1800,
      spend: 75000,
      cpm: 1666.67,
      cpc: 41.67,
      ctr: 4.0,
    };
  }
}

export class ManualMarketingProviderAdapter implements IMarketingProviderAdapter {
  public providerName = 'MANUAL';

  async fetchSpendData(orgId: string, startDate: Date, endDate: Date): Promise<Omit<MarketingSpend, 'id' | 'importedAt'>[]> {
    return [];
  }

  async fetchCampaignMetrics(orgId: string, externalCampaignId: string): Promise<MarketingProviderMetrics> {
    return {
      impressions: 0,
      clicks: 0,
      spend: 0,
      cpm: 0,
      cpc: 0,
      ctr: 0,
    };
  }
}
