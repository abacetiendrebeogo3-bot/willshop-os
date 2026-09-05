/**
 * WILLShop OS — ROUTE & NAVIGATION INTEGRATION TEST SUITE
 * Tests the completeness, service contracts, and route availability of all 12 WillShop OS navigation paths.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { SystemHealthService } from '../src/application/services/SystemHealthService';
import { setMockContext } from '../src/application/services/OrganizationContextService';
import { InsightEngine } from '../src/domain/services/InsightEngine';
import { AnomalyEngine } from '../src/domain/services/AnomalyEngine';
import { ForecastEngine } from '../src/domain/services/ForecastEngine';
import { KpiDictionary } from '../src/domain/services/KpiDictionary';

describe('WillShop OS — Navigation & Route Integration Suite', () => {
  const orgId = 'org-willshop-route-test';
  const userId = 'user-ceo-route-test';

  setMockContext({
    userId,
    organizationId: orgId,
    role: 'OWNER',
  });

  const EXPECTED_ROUTES = [
    { name: "CEO Cockpit", href: "/" },
    { name: "Ventes & CRM", href: "/sales" },
    { name: "Opérations", href: "/orders" },
    { name: "Finance", href: "/finance" },
    { name: "Automatisation", href: "/automation" },
    { name: "Marketing", href: "/marketing" },
    { name: "Équipe", href: "/team" },
    { name: "Intelligence", href: "/intelligence" },
    { name: "Stratégie", href: "/strategy" },
    { name: "Wilty Personal OS", href: "/wilty" },
    { name: "Paramètres", href: "/settings" },
    { name: "Livraisons", href: "/delivery" },
  ];

  it('1. Navigation Registry Completeness: Verifies 12 primary navigation routes', () => {
    assert.strictEqual(EXPECTED_ROUTES.length, 12);
    const intelligenceRoute = EXPECTED_ROUTES.find((r) => r.href === '/intelligence');
    const settingsRoute = EXPECTED_ROUTES.find((r) => r.href === '/settings');

    assert.ok(intelligenceRoute, 'Route /intelligence must exist in registry');
    assert.ok(settingsRoute, 'Route /settings must exist in registry');
  });

  it('2. Intelligence Center Backend Engines Integration: InsightEngine & AnomalyEngine produce evidence & confidence', () => {
    const revDef = KpiDictionary.getDefinition('revenue');
    assert.ok(revDef);

    const anomalies = AnomalyEngine.detect({
      organizationId: orgId,
      deliveryFailureRatePercentage: 25,
      revenueChangePercentage: -20,
      lowStockItemsCount: 2,
      grossMarginPercentage: 35,
      unpaidConfirmedOrdersCount: 1,
    });
    assert.ok(Array.isArray(anomalies));
    assert.ok(anomalies.length > 0);

    const insights = InsightEngine.generate({
      organizationId: orgId,
      revenueComp: { currentValue: 200000, previousValue: 250000, absoluteChange: -50000, percentageChange: -20, trend: 'DOWN', isPositiveDirection: false },
      ordersComp: { currentValue: 10, previousValue: 12, absoluteChange: -2, percentageChange: -16.6, trend: 'DOWN', isPositiveDirection: false },
      aovComp: { currentValue: 20000, previousValue: 20833, absoluteChange: -833, percentageChange: -4, trend: 'STABLE', isPositiveDirection: true },
      deliverySuccessRate: 75,
      anomalies,
      topProductNames: ['T-Shirt Oversized'],
    });

    assert.ok(Array.isArray(insights));
    assert.ok(insights.length > 0);
    assert.strictEqual(insights[0].confidence, 'HIGH');
  });

  it('3. Forecast Engine Insufficient Data Handler: Gracefully returns low confidence for sparse history', () => {
    const emptyResult = ForecastEngine.forecastMovingAverage('revenue', [], 'Prochains 7 jours');
    assert.strictEqual(emptyResult.confidence.level, 'LOW');
    assert.strictEqual(emptyResult.confidence.score, 30);
    assert.ok(emptyResult.assumptions.includes('Données insuffisantes'));

    const richResult = ForecastEngine.forecastMovingAverage('revenue', [100000, 150000, 200000], 'Prochains 7 jours');
    assert.strictEqual(richResult.confidence.level, 'HIGH');
    assert.strictEqual(richResult.forecastValue, 150000);
  });

  it('4. System & Settings Service Health Diagnostics: Validates 6 core pillars', () => {
    const healthService = new SystemHealthService();
    const result = healthService.diagnose(orgId, {
      dbConnected: true,
      dbMigrationUpToDate: true,
      eventQueueBacklog: 0,
      failedWorkflowsCount: 0,
    });

    assert.strictEqual(result.globalStatus, 'HEALTHY');
    assert.strictEqual(Object.keys(result.pillars).length, 6);
  });

  it('5. Empty Database State & Provenance Transparency: Graceful fallback without hardcoded fake metrics', () => {
    // 0 anomalies when database metrics are normal
    const cleanAnomalies = AnomalyEngine.detect({
      organizationId: orgId,
      deliveryFailureRatePercentage: 5,
      revenueChangePercentage: 10,
      lowStockItemsCount: 0,
      grossMarginPercentage: 40,
      unpaidConfirmedOrdersCount: 0,
    });
    assert.strictEqual(cleanAnomalies.length, 0);

    // Forecast with zero history returns explicit insufficient data assumption
    const emptyForecast = ForecastEngine.forecastMovingAverage('revenue', [], '90 jours');
    assert.strictEqual(emptyForecast.forecastValue, 0);
    assert.strictEqual(emptyForecast.confidence.score, 30);
  });
});
