/**
 * WILLShop OS — Build 10 Marketing Engine Automated Test Suite
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { ProfitabilityEngine } from '../src/domain/services/ProfitabilityEngine';
import { MarketingAttributionService } from '../src/domain/services/MarketingAttributionService';
import { MarketingFunnelService } from '../src/domain/services/MarketingFunnelService';
import { CreativeIntelligenceService } from '../src/domain/services/CreativeIntelligenceService';
import { MarketingBudgetService } from '../src/domain/services/MarketingBudgetService';
import { MetaAdsProviderAdapter } from '../src/domain/services/MarketingProviderAdapters';
import { AIToolRegistry } from '../src/domain/services/AIToolRegistry';
import {
  InMemoryMarketingCampaignRepository,
  InMemoryMarketingCreativeRepository,
  InMemoryMarketingSpendRepository,
  InMemoryMarketingAttributionRepository,
  InMemoryMarketingExperimentRepository,
} from '../src/infrastructure/repositories/InMemoryMarketingRepositories';
import { MarketingEngineService } from '../src/application/services/MarketingApplicationServices';

describe('Build 10 — Marketing Engine Automated Test Suite', () => {
  const orgId = 'org_mkt_test_001';

  test('Profitability Engine: Should calculate Contribution Profit, ROAS, and ROI accurately', () => {
    // Revenue: 280,000 | COGS: 140,000 | Spend: 75,000 | Delivery: 28,000
    // Contribution Profit = 280,000 - (140,000 + 75,000 + 28,000) = 37,000
    // ROAS = 280,000 / 75,000 = 3.73
    // ROI = 37,000 / 75,000 = 0.49
    const summary = ProfitabilityEngine.calculateContributionProfit(280000, 140000, 75000, 28000);

    assert.strictEqual(summary.grossProfit, 140000);
    assert.strictEqual(summary.contributionProfit, 37000);
    assert.strictEqual(summary.roas, 3.73);
    assert.strictEqual(summary.roi, 0.49);
  });

  test('Attribution Engine: Should assign high confidence for WhatsApp and low for unknown source', () => {
    // Known WhatsApp source
    const attr1 = MarketingAttributionService.createAttribution(orgId, 'camp_1', 20000, 'whatsapp_source', 'ord_1');
    assert.strictEqual(attr1.touchpoint, 'whatsapp_source');
    assert.strictEqual(attr1.confidenceLevel, 'HIGH');

    // Unknown source fallback
    const attr2 = MarketingAttributionService.createAttribution(orgId, null, 15000, null, 'ord_2');
    assert.strictEqual(attr2.campaignId, 'camp_unknown');
    assert.strictEqual(attr2.touchpoint, 'unknown');
    assert.strictEqual(attr2.confidenceLevel, 'LOW');
  });

  test('Funnel Diagnostics: Should compute stage conversion rates and detect bottlenecks', () => {
    const funnel = MarketingFunnelService.analyzeFunnel(
      50000, // impressions
      500,   // clicks (1.0% CTR < 1.5%) -> Creative bottleneck
      50,
      15,
      10,
      9,
      50000
    );

    assert.strictEqual(funnel.ctr, 1.0);
    assert.strictEqual(funnel.bottleneckDiagnosis?.includes('Problème Créatif'), true);
  });

  test('Creative Intelligence: Should classify WINNER and detect creative fatigue with sample size checks', () => {
    // Winner evaluation
    const eval1 = CreativeIntelligenceService.evaluateCreative(25000, 1050, 14);
    assert.strictEqual(eval1.statusTag, 'WINNER');

    // Fatigue evaluation: CTR dropped from 4.0% to 2.0%
    const eval2 = CreativeIntelligenceService.evaluateCreative(15000, 300, 2, 4.0);
    assert.strictEqual(eval2.fatigueDetected, true);
    assert.strictEqual(eval2.statusTag, 'FATIGUE');

    // Small sample size (< 1000) does not flag fatigue
    const eval3 = CreativeIntelligenceService.evaluateCreative(500, 10, 0, 4.0);
    assert.strictEqual(eval3.fatigueDetected, false);
  });

  test('Budget Intelligence: Should calculate pacing and flag overspend', () => {
    const start = new Date(Date.now() - 10 * 86400 * 1000); // 10 days ago
    const end = new Date(Date.now() + 10 * 86400 * 1000);   // 10 days remaining (50% elapsed)

    // Spent 80% of budget in 50% time -> Overspending
    const pacing = MarketingBudgetService.calculatePacing(100000, 80000, start, end);
    assert.strictEqual(pacing.isOverspending, true);
    assert.strictEqual(pacing.remainingBudget, 20000);
  });

  test('Spend Ingestion Idempotency: Duplicate spend with same externalId is deduplicated', async () => {
    const spendRepo = new InMemoryMarketingSpendRepository();
    const startDate = new Date();

    const spend1 = await spendRepo.recordSpend({
      organizationId: orgId,
      provider: 'META_ADS',
      amount: 50000,
      currency: 'XOF',
      date: startDate,
      externalId: 'ext_meta_1001',
    });

    const spend2 = await spendRepo.recordSpend({
      organizationId: orgId,
      provider: 'META_ADS',
      amount: 50000,
      currency: 'XOF',
      date: startDate,
      externalId: 'ext_meta_1001', // Duplicate
    });

    assert.strictEqual(spend1.id, spend2.id);

    const spends = await spendRepo.listSpendsByOrg(orgId);
    assert.strictEqual(spends.length, 1);
  });

  test('Marketing Engine Service: Full campaign creation, spend recording, attribution, and CEO AI Tool integration', async () => {
    const campaignRepo = new InMemoryMarketingCampaignRepository();
    const creativeRepo = new InMemoryMarketingCreativeRepository();
    const spendRepo = new InMemoryMarketingSpendRepository();
    const attributionRepo = new InMemoryMarketingAttributionRepository();
    const experimentRepo = new InMemoryMarketingExperimentRepository();

    let eventRecorded = false;
    const service = new MarketingEngineService({
      campaignRepo,
      creativeRepo,
      spendRepo,
      attributionRepo,
      experimentRepo,
      recordEvent: async () => {
        eventRecorded = true;
        return {} as any;
      },
    });

    // 1. Create Campaign
    const camp = await service.createCampaign(orgId, 'Campagne Test FB', 150000, 'META_ADS', ['prod_1']);
    assert.strictEqual(camp.status, 'ACTIVE');
    assert.strictEqual(eventRecorded, true);

    // 2. Record Spend
    await service.recordSpend(orgId, camp.id, 50000, 'META_ADS', new Date(), 'spend_ext_01');

    // 3. Attribute Order
    await service.attributeOrder(orgId, camp.id, 180000, 'ord_101', 'cust_1', 'meta_ads');

    // 4. Get Marketing Snapshot
    const snapshot = await service.getMarketingSnapshot(orgId);
    assert.strictEqual(snapshot.totalCampaigns, 1);
    assert.strictEqual(snapshot.totalSpend, 50000);
    assert.strictEqual(snapshot.totalRevenue, 180000);
    assert.strictEqual(snapshot.overallRoas, 3.6);

    // 5. Check CEO AI Tools Registered
    const snapshotTool = AIToolRegistry.getTool('get_marketing_snapshot');
    assert.notStrictEqual(snapshotTool, null);
  });
});
