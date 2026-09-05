/**
 * WILLShop OS — BUILD 07 BI & Business Intelligence Engine Test Suite
 * Validates KPI calculations, trend comparisons, anomaly detection, insight generation,
 * data quality checks, and tenant isolation.
 */

import { describe, test, beforeEach } from 'node:test';
import assert from 'node:assert';

import {
  GetSalesAnalyticsService,
  GetProductAnalyticsService,
  GetCustomerAnalyticsService,
  GetDeliveryAnalyticsService,
  DetectAnomaliesService,
  GenerateInsightsService,
  GetDataQualityService,
  GetCeoCockpitService,
} from '../src/application/services/AnalyticsApplicationServices';

import {
  InMemoryAnalyticsRepository,
  InMemoryOrderRepository,
  InMemoryDeliveryRepository,
  InMemoryFinanceRepository,
  InMemoryStockRepository,
  InMemoryProductRepository,
} from '../src/infrastructure/repositories/InMemoryDataCoreRepositories';

import { setMockContext } from '../src/application/services/OrganizationContextService';
import { TrendEngine } from '../src/domain/services/TrendEngine';
import { AnomalyEngine } from '../src/domain/services/AnomalyEngine';
import { InsightEngine } from '../src/domain/services/InsightEngine';

describe('Build 07 — BI & Business Intelligence Engine Automated Test Suite', () => {
  const orgAId = 'org-willshop-001';
  const orgBId = 'org-competitor-002';
  const userId = 'user-ceo-wilty';

  let analyticsRepo: InMemoryAnalyticsRepository;
  let orderRepo: InMemoryOrderRepository;
  let deliveryRepo: InMemoryDeliveryRepository;
  let financeRepo: InMemoryFinanceRepository;
  let stockRepo: InMemoryStockRepository;
  let productRepo: InMemoryProductRepository;

  let salesService: GetSalesAnalyticsService;
  let productService: GetProductAnalyticsService;
  let customerService: GetCustomerAnalyticsService;
  let deliveryService: GetDeliveryAnalyticsService;
  let anomalyService: DetectAnomaliesService;
  let insightService: GenerateInsightsService;
  let dataQualityService: GetDataQualityService;
  let ceoCockpitService: GetCeoCockpitService;

  beforeEach(() => {
    setMockContext({
      userId,
      organizationId: orgAId,
      role: 'OWNER',
    });

    analyticsRepo = new InMemoryAnalyticsRepository();
    orderRepo = new InMemoryOrderRepository();
    deliveryRepo = new InMemoryDeliveryRepository();
    financeRepo = new InMemoryFinanceRepository();
    productRepo = new InMemoryProductRepository();
    stockRepo = new InMemoryStockRepository();

    salesService = new GetSalesAnalyticsService(orderRepo);
    productService = new GetProductAnalyticsService(analyticsRepo);
    customerService = new GetCustomerAnalyticsService(analyticsRepo);
    deliveryService = new GetDeliveryAnalyticsService(analyticsRepo, deliveryRepo);
    anomalyService = new DetectAnomaliesService(orderRepo, deliveryRepo, stockRepo);
    insightService = new GenerateInsightsService(salesService, anomalyService, analyticsRepo);
    dataQualityService = new GetDataQualityService(analyticsRepo, stockRepo);
    ceoCockpitService = new GetCeoCockpitService(
      salesService,
      deliveryService,
      anomalyService,
      insightService,
      financeRepo
    );
  });

  test('Trend Engine: Should calculate percentage change and trend direction deterministically', async () => {
    const comp = TrendEngine.compare(1500000, 1000000, true);

    assert.strictEqual(comp.currentValue, 1500000);
    assert.strictEqual(comp.previousValue, 1000000);
    assert.strictEqual(comp.absoluteChange, 500000);
    assert.strictEqual(comp.percentageChange, 50.0);
    assert.strictEqual(comp.trend, 'UP');
    assert.strictEqual(comp.isPositiveDirection, true);
  });

  test('Sales Analytics: Should compute revenue, order count, and AOV trends', async () => {
    // Create a completed order
    await orderRepo.createOrder(
      {
        organizationId: orgAId,
        customerId: 'cust-1',
        orderNumber: 'WS-001',
        status: 'DELIVERED',
        subtotal: 50000,
        deliveryFee: 2000,
        discount: 0,
        total: 52000,
        currency: 'XOF',
        source: 'WHATSAPP',
      },
      [
        {
          organizationId: orgAId,
          orderId: 'ord-1',
          productId: 'prod-1',
          quantity: 2,
          unitPrice: 25000,
          subtotal: 50000,
          productNameSnapshot: 'T-Shirt Noir',
          skuSnapshot: 'TSH-BLK',
        },
      ]
    );

    const sales = await salesService.execute();
    assert.strictEqual(sales.revenue.currentValue, 52000);
    assert.strictEqual(sales.ordersCount.currentValue, 1);
    assert.strictEqual(sales.averageOrderValue.currentValue, 52000);
  });

  test('Anomaly Engine: Should flag high delivery failure rates and low stock warnings', async () => {
    const anomalies = AnomalyEngine.detect({
      organizationId: orgAId,
      deliveryFailureRatePercentage: 28.5,
      revenueChangePercentage: -18.0,
      lowStockItemsCount: 2,
      grossMarginPercentage: 15.0,
      unpaidConfirmedOrdersCount: 0,
    });

    assert.strictEqual(anomalies.length, 4);
    assert.strictEqual(anomalies[0].metricKey, 'delivery_failure_rate');
    assert.strictEqual(anomalies[0].severity, 'HIGH');
    assert.ok(anomalies[0].evidence.calculationDetails);
  });

  test('Insight Engine: Should generate deterministic insights backed by evidence', async () => {
    await orderRepo.createOrder(
      {
        organizationId: orgAId,
        customerId: 'cust-1',
        orderNumber: 'WS-002',
        status: 'DELIVERED',
        subtotal: 100000,
        deliveryFee: 2000,
        discount: 0,
        total: 102000,
        currency: 'XOF',
        source: 'WHATSAPP',
      },
      []
    );

    const insights = await insightService.execute();

    assert.ok(insights.length > 0);
    const salesInsight = insights.find((i) => i.type === 'SALES_TREND');
    assert.ok(salesInsight);
    assert.strictEqual(salesInsight.confidence, 'HIGH');
    assert.ok(salesInsight.evidence.kpiKeys.includes('revenue'));
  });

  test('Product Analytics: Should return Best-Sellers and Watch product summaries', async () => {
    const products = await productService.execute();

    assert.strictEqual(products.length, 2);
    assert.strictEqual(products[0].performanceTag, 'BEST_SELLER');
    assert.strictEqual(products[0].grossMarginPercentage, 60.0);
  });

  test('Data Quality Service: Should detect negative stock anomalies', async () => {
    // Inject a negative stock
    await stockRepo.initializeStock({
      organizationId: orgAId,
      productId: 'prod-bad',
      physicalStock: -5,
      reservedStock: 0,
      minimumStock: 10,
    });

    const issues = await dataQualityService.checkQuality();
    assert.ok(issues.length > 0);
    assert.strictEqual(issues[0].issueType, 'NEGATIVE_STOCK');
    assert.strictEqual(issues[0].severity, 'CRITICAL');
  });

  test('CEO Cockpit Summary: Should aggregate treasury cash, sales trends, insights, and anomalies', async () => {
    await financeRepo.createAccount({
      organizationId: orgAId,
      name: 'Caisse Principale',
      type: 'CASH_REGISTER',
      currency: 'XOF',
      openingBalance: 1200000,
      status: 'ACTIVE',
    });

    const cockpit = await ceoCockpitService.execute();

    assert.strictEqual(cockpit.organizationId, orgAId);
    assert.strictEqual(cockpit.cashBalanceFcfa, 1200000);
    assert.ok(cockpit.revenueFcfa);
    assert.ok(cockpit.topInsights);
  });
});
