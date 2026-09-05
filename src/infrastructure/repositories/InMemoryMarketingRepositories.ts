/**
 * WILLShop OS — In-Memory Marketing Repositories
 * High-fidelity in-memory implementation for unit testing and local development.
 */

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

export class InMemoryMarketingCampaignRepository implements IMarketingCampaignRepository {
  private campaigns: Map<string, MarketingCampaign> = new Map();

  async create(data: Omit<MarketingCampaign, 'id' | 'createdAt' | 'updatedAt' | 'attributedRevenue' | 'attributedOrdersCount' | 'totalSpend' | 'cogs' | 'deliveryCosts' | 'contributionProfit' | 'roas' | 'roi'>): Promise<MarketingCampaign> {
    const id = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();
    const campaign: MarketingCampaign = {
      ...data,
      id,
      attributedRevenue: 0,
      attributedOrdersCount: 0,
      totalSpend: 0,
      cogs: 0,
      deliveryCosts: 0,
      contributionProfit: 0,
      roas: 0,
      roi: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async findById(id: string, orgId: string): Promise<MarketingCampaign | null> {
    const camp = this.campaigns.get(id);
    if (!camp || camp.organizationId !== orgId) return null;
    return camp;
  }

  async listByOrg(orgId: string, status?: CampaignStatus): Promise<MarketingCampaign[]> {
    return Array.from(this.campaigns.values()).filter((c) => {
      if (c.organizationId !== orgId) return false;
      if (status && c.status !== status) return false;
      return true;
    });
  }

  async update(id: string, orgId: string, updates: Partial<MarketingCampaign>): Promise<MarketingCampaign> {
    const camp = await this.findById(id, orgId);
    if (!camp) throw new Error(`Campaign ${id} not found in org ${orgId}`);

    const updated: MarketingCampaign = {
      ...camp,
      ...updates,
      updatedAt: new Date(),
    };
    this.campaigns.set(id, updated);
    return updated;
  }

  async delete(id: string, orgId: string): Promise<void> {
    const camp = await this.findById(id, orgId);
    if (camp) {
      this.campaigns.delete(id);
    }
  }
}

export class InMemoryMarketingCreativeRepository implements IMarketingCreativeRepository {
  private creatives: Map<string, MarketingCreative> = new Map();

  async create(data: Omit<MarketingCreative, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketingCreative> {
    const id = `crea_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();
    const creative: MarketingCreative = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.creatives.set(id, creative);
    return creative;
  }

  async findById(id: string, orgId: string): Promise<MarketingCreative | null> {
    const crea = this.creatives.get(id);
    if (!crea || crea.organizationId !== orgId) return null;
    return crea;
  }

  async listByOrg(orgId: string): Promise<MarketingCreative[]> {
    return Array.from(this.creatives.values()).filter((c) => c.organizationId === orgId);
  }

  async listByCampaign(campaignId: string, orgId: string): Promise<MarketingCreative[]> {
    return Array.from(this.creatives.values()).filter((c) => c.organizationId === orgId && c.campaignId === campaignId);
  }

  async updateTag(id: string, orgId: string, statusTag: CreativeStatusTag): Promise<MarketingCreative> {
    const crea = await this.findById(id, orgId);
    if (!crea) throw new Error(`Creative ${id} not found in org ${orgId}`);

    const updated: MarketingCreative = {
      ...crea,
      statusTag,
      updatedAt: new Date(),
    };
    this.creatives.set(id, updated);
    return updated;
  }
}

export class InMemoryMarketingSpendRepository implements IMarketingSpendRepository {
  private spends: Map<string, MarketingSpend> = new Map();

  async recordSpend(data: Omit<MarketingSpend, 'id' | 'importedAt'>): Promise<MarketingSpend> {
    // Idempotency check: provider + externalId
    if (data.externalId) {
      for (const s of this.spends.values()) {
        if (s.organizationId === data.organizationId && s.provider === data.provider && s.externalId === data.externalId) {
          return s;
        }
      }
    }

    const id = `spend_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const spend: MarketingSpend = {
      ...data,
      id,
      importedAt: new Date(),
    };
    this.spends.set(id, spend);
    return spend;
  }

  async listSpendsByOrg(orgId: string): Promise<MarketingSpend[]> {
    return Array.from(this.spends.values()).filter((s) => s.organizationId === orgId);
  }

  async getTotalSpendByCampaign(campaignId: string, orgId: string): Promise<number> {
    let total = 0;
    for (const s of this.spends.values()) {
      if (s.organizationId === orgId && s.campaignId === campaignId) {
        total += s.amount;
      }
    }
    return total;
  }
}

export class InMemoryMarketingAttributionRepository implements IMarketingAttributionRepository {
  private attributions: Map<string, MarketingAttribution> = new Map();

  async recordAttribution(data: Omit<MarketingAttribution, 'id'>): Promise<MarketingAttribution> {
    const id = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const attr: MarketingAttribution = {
      ...data,
      id,
    };
    this.attributions.set(id, attr);
    return attr;
  }

  async listByOrg(orgId: string): Promise<MarketingAttribution[]> {
    return Array.from(this.attributions.values()).filter((a) => a.organizationId === orgId);
  }

  async listByCampaign(campaignId: string, orgId: string): Promise<MarketingAttribution[]> {
    return Array.from(this.attributions.values()).filter((a) => a.organizationId === orgId && a.campaignId === campaignId);
  }
}

export class InMemoryMarketingExperimentRepository implements IMarketingExperimentRepository {
  private experiments: Map<string, MarketingExperiment> = new Map();

  async create(data: Omit<MarketingExperiment, 'id' | 'createdAt' | 'updatedAt'>): Promise<MarketingExperiment> {
    const id = `exp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date();
    const exp: MarketingExperiment = {
      ...data,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.experiments.set(id, exp);
    return exp;
  }

  async listByOrg(orgId: string): Promise<MarketingExperiment[]> {
    return Array.from(this.experiments.values()).filter((e) => e.organizationId === orgId);
  }
}
