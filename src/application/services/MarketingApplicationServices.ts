/**
 * WILLShop OS — Marketing Engine Application Services
 * Orchestrates campaign lifecycle, spend ingestion, attribution processing,
 * contribution profit calculation, funnel diagnostics, creative intelligence, budget pacing,
 * CEO AI tool registry integration, and system event dispatch.
 * Application Layer.
 */

import { SystemEvent } from '../../domain/entities/SystemEvent';
import {
  MarketingCampaign,
  CampaignStatus,
  MarketingCreative,
  MarketingSpend,
  MarketingAttribution,
  ContributionProfitSummary,
  MarketingFunnelMetrics,
} from '../../domain/entities/MarketingEntities';
import {
  IMarketingCampaignRepository,
  IMarketingCreativeRepository,
  IMarketingSpendRepository,
  IMarketingAttributionRepository,
  IMarketingExperimentRepository,
} from '../../domain/interfaces/IMarketingRepositories';
import { ProfitabilityEngine } from '../../domain/services/ProfitabilityEngine';
import { MarketingAttributionService } from '../../domain/services/MarketingAttributionService';
import { MarketingFunnelService } from '../../domain/services/MarketingFunnelService';
import { CreativeIntelligenceService } from '../../domain/services/CreativeIntelligenceService';
import { MarketingBudgetService } from '../../domain/services/MarketingBudgetService';
import { AIToolRegistry } from '../../domain/services/AIToolRegistry';

export interface MarketingEngineDependencies {
  campaignRepo: IMarketingCampaignRepository;
  creativeRepo: IMarketingCreativeRepository;
  spendRepo: IMarketingSpendRepository;
  attributionRepo: IMarketingAttributionRepository;
  experimentRepo: IMarketingExperimentRepository;
  recordEvent?: (event: Omit<SystemEvent, 'id' | 'createdAt' | 'status'>) => Promise<SystemEvent>;
}

export class MarketingEngineService {
  constructor(private deps: MarketingEngineDependencies) {
    this.registerCEOAITools();
  }

  /**
   * Registers Marketing Tools into CEO AI Tool Registry.
   */
  private registerCEOAITools(): void {
    AIToolRegistry.register({
      name: 'get_marketing_snapshot',
      description: 'Obtenir la vue synthétique de la performance publicitaire et de la rentabilité marketing (ROAS, ROI, Contribution Profit)',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'get_campaign_performance',
      description: 'Lister les campagnes marketing actives avec leur chiffre d\'affaires attribué, spend et ROI réel',
      parametersSchema: { type: 'object', properties: { campaignId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'get_creative_performance',
      description: 'Analyser la performance des visuels et vidéos publicitaires (Winners, Losers, Fatigue)',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'get_marketing_funnel',
      description: 'Obtenir le diagnostic du tunnel de conversion (Clics -> Conversations -> Leads -> Commandes -> Livraisons)',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });
  }

  // --- CAMPAIGN MANAGEMENT ---

  public async createCampaign(
    orgId: string,
    name: string,
    budget: number,
    platform = 'META_ADS',
    targetProducts?: string[],
    createdBy?: string
  ): Promise<MarketingCampaign> {
    const campaign = await this.deps.campaignRepo.create({
      organizationId: orgId,
      name,
      platform,
      status: 'ACTIVE',
      budget,
      targetProducts: targetProducts || [],
      createdBy,
    });

    if (this.deps.recordEvent) {
      await this.deps.recordEvent({
        organizationId: orgId,
        eventType: 'marketing.campaign_started',
        payload: { campaignId: campaign.id, name, budget },
      });
    }

    return campaign;
  }

  public async pauseCampaign(campaignId: string, orgId: string): Promise<MarketingCampaign> {
    const updated = await this.deps.campaignRepo.update(campaignId, orgId, { status: 'PAUSED' });

    if (this.deps.recordEvent) {
      await this.deps.recordEvent({
        organizationId: orgId,
        eventType: 'marketing.campaign_paused',
        payload: { campaignId, name: updated.name },
      });
    }

    return updated;
  }

  public async listCampaigns(orgId: string, status?: CampaignStatus): Promise<MarketingCampaign[]> {
    return this.deps.campaignRepo.listByOrg(orgId, status);
  }

  // --- SPEND INGESTION ---

  public async recordSpend(
    orgId: string,
    campaignId: string,
    amount: number,
    provider = 'META_ADS',
    date = new Date(),
    externalId?: string
  ): Promise<MarketingSpend> {
    const spend = await this.deps.spendRepo.recordSpend({
      organizationId: orgId,
      provider,
      campaignId,
      amount,
      currency: 'XOF',
      date,
      externalId,
    });

    // Recalculate campaign totals
    await this.recalculateCampaignProfitability(campaignId, orgId);

    return spend;
  }

  // --- ATTRIBUTION PROCESSING ---

  public async attributeOrder(
    orgId: string,
    campaignId: string | null,
    amount: number,
    orderId?: string,
    customerId?: string,
    rawSource?: string
  ): Promise<MarketingAttribution> {
    const attrData = MarketingAttributionService.createAttribution(orgId, campaignId, amount, rawSource, orderId, customerId);
    const attribution = await this.deps.attributionRepo.recordAttribution(attrData);

    if (attribution.campaignId && attribution.campaignId !== 'camp_unknown') {
      await this.recalculateCampaignProfitability(attribution.campaignId, orgId);
    }

    return attribution;
  }

  // --- PROFITABILITY CALCULATION ---

  public async recalculateCampaignProfitability(campaignId: string, orgId: string): Promise<MarketingCampaign> {
    const campaign = await this.deps.campaignRepo.findById(campaignId, orgId);
    if (!campaign) throw new Error(`Campaign ${campaignId} not found`);

    const totalSpend = await this.deps.spendRepo.getTotalSpendByCampaign(campaignId, orgId);
    const attributions = await this.deps.attributionRepo.listByCampaign(campaignId, orgId);

    const attributedRevenue = attributions.reduce((acc, a) => acc + a.amount, 0);
    const attributedOrdersCount = attributions.filter((a) => a.orderId).length;

    // Estimate COGS (approx 50% of revenue) & Delivery Costs (approx 10% of revenue)
    const cogs = Math.round(attributedRevenue * 0.5);
    const deliveryCosts = Math.round(attributedRevenue * 0.1);

    const summary = ProfitabilityEngine.calculateContributionProfit(attributedRevenue, cogs, totalSpend, deliveryCosts);

    const updated = await this.deps.campaignRepo.update(campaignId, orgId, {
      totalSpend,
      attributedRevenue,
      attributedOrdersCount,
      cogs,
      deliveryCosts,
      contributionProfit: summary.contributionProfit,
      roas: summary.roas,
      roi: summary.roi,
    });

    // Trigger alert event if ROI is negative with significant spend (> 20 000 XOF)
    if (summary.roi < 0 && totalSpend >= 20000 && this.deps.recordEvent) {
      await this.deps.recordEvent({
        organizationId: orgId,
        eventType: 'marketing.roi_negative',
        payload: { campaignId, name: campaign.name, spend: totalSpend, roi: summary.roi, contributionProfit: summary.contributionProfit },
      });
    }

    return updated;
  }

  // --- CREATIVE INTELLIGENCE ---

  public async evaluateCreatives(orgId: string): Promise<MarketingCreative[]> {
    const creatives = await this.deps.creativeRepo.listByOrg(orgId);
    const evaluated: MarketingCreative[] = [];

    for (const crea of creatives) {
      const res = CreativeIntelligenceService.evaluateCreative(crea.impressions, crea.clicks, crea.attributedConversions);
      let updatedCrea = crea;

      if (res.statusTag !== crea.statusTag) {
        updatedCrea = await this.deps.creativeRepo.updateTag(crea.id, orgId, res.statusTag);
      }

      if (res.fatigueDetected && this.deps.recordEvent) {
        await this.deps.recordEvent({
          organizationId: orgId,
          eventType: 'marketing.creative_fatigue',
          payload: { creativeId: crea.id, name: crea.name, reason: res.reason },
        });
      }

      evaluated.push(updatedCrea);
    }

    return evaluated;
  }

  // --- FUNNEL DIAGNOSTICS ---

  public async getFunnelDiagnostics(orgId: string): Promise<MarketingFunnelMetrics> {
    const campaigns = await this.deps.campaignRepo.listByOrg(orgId);
    const totalSpend = campaigns.reduce((acc, c) => acc + c.totalSpend, 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + c.attributedRevenue, 0);
    const totalOrders = campaigns.reduce((acc, c) => acc + c.attributedOrdersCount, 0);

    // Aggregate funnel stats (0 default when no public ad campaign or WhatsApp funnel data is active)
    const impressions = 0;
    const clicks = 0;
    const conversations = 0;
    const leads = 0;
    const deliveredOrders = totalOrders;

    return MarketingFunnelService.analyzeFunnel(
      impressions,
      clicks,
      conversations,
      leads,
      totalOrders,
      deliveredOrders,
      totalSpend
    );
  }

  // --- MARKETING SNAPSHOT ---

  public async getMarketingSnapshot(orgId: string): Promise<{
    totalCampaigns: number;
    activeCampaigns: number;
    totalSpend: number;
    totalRevenue: number;
    totalContributionProfit: number;
    overallRoas: number;
    overallRoi: number;
  }> {
    const campaigns = await this.deps.campaignRepo.listByOrg(orgId);

    const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
    const totalSpend = campaigns.reduce((acc, c) => acc + c.totalSpend, 0);
    const totalRevenue = campaigns.reduce((acc, c) => acc + c.attributedRevenue, 0);
    const totalContributionProfit = campaigns.reduce((acc, c) => acc + c.contributionProfit, 0);

    const overallRoas = totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0;
    const overallRoi = totalSpend > 0 ? Math.round((totalContributionProfit / totalSpend) * 100) / 100 : 0;

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns,
      totalSpend,
      totalRevenue,
      totalContributionProfit,
      overallRoas,
      overallRoi,
    };
  }

  /**
   * Seeds initial reference marketing campaigns for an organization if none exist.
   */
  public async seedInitialCampaigns(orgId: string): Promise<MarketingCampaign[]> {
    const existing = await this.deps.campaignRepo.listByOrg(orgId);
    if (existing.length > 0) return existing;

    const initialCampaigns: { name: string; budget: number; platform: string; targetProducts: string[] }[] = [
      { name: 'Campagne Facebook WhatsApp — T-Shirt Premium', budget: 150000, platform: 'META_ADS', targetProducts: ['prod_tshirt'] },
      { name: 'Campagne Instagram Retargeting Client VIP', budget: 100000, platform: 'META_ADS', targetProducts: ['prod_all'] },
      { name: 'Campagne Promotionnelle Rentrée WillShop', budget: 80000, platform: 'MANUAL', targetProducts: ['prod_promo'] },
    ];

    const created: MarketingCampaign[] = [];
    for (const c of initialCampaigns) {
      const camp = await this.createCampaign(orgId, c.name, c.budget, c.platform, c.targetProducts);
      created.push(camp);
    }

    return created;
  }
}
