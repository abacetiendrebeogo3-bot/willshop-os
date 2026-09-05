/**
 * WILLShop OS — BI & Business Intelligence Domain Entities
 * Pure Domain Layer — ZERO external dependencies.
 */

export type TimeGranularity = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export interface KpiDefinition {
  key: string;
  name: string;
  description: string;
  formula: string;
  sourceModule: 'ORDERS' | 'STOCK' | 'DELIVERY' | 'FINANCE' | 'CUSTOMERS';
  unit: 'FCFA' | 'COUNT' | 'PERCENTAGE' | 'DAYS' | 'MINUTES';
  freshness: 'REALTIME' | 'NEAR_REALTIME' | 'SCHEDULED';
  version: string;
}

export interface MetricComparison {
  currentValue: number;
  previousValue: number;
  absoluteChange: number;
  percentageChange: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  isPositiveDirection: boolean;
}

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AnomalyItem {
  id: string;
  organizationId: string;
  metricKey: string;
  metricName: string;
  observedValue: number;
  expectedValue: number;
  variancePercentage: number;
  severity: AnomalySeverity;
  evidence: {
    sourceTable: string;
    period: string;
    sampleCount: number;
    calculationDetails: string;
  };
  detectedAt: Date;
}

export type InsightConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export interface BusinessInsight {
  id: string;
  organizationId: string;
  type: 'SALES_TREND' | 'DELIVERY_BOTTLENECK' | 'STOCK_RISK' | 'FINANCE_MARGIN' | 'CUSTOMER_CHURN';
  title: string;
  summary: string;
  recommendation: string;
  confidence: InsightConfidence;
  evidence: {
    kpiKeys: string[];
    observedData: Record<string, unknown>;
    timeframe: string;
    explanation: string;
  };
  freshnessTimestamp: Date;
}

export type CustomerSegment = 'NEW' | 'ACTIVE' | 'REPEAT' | 'AT_RISK' | 'INACTIVE';

export interface CustomerRfmSegment {
  customerId: string;
  customerName: string;
  recencyDays: number;
  frequencyOrdersCount: number;
  monetaryTotalFcfa: number;
  segment: CustomerSegment;
}

export interface ProductPerformanceSummary {
  productId: string;
  sku: string;
  productName: string;
  unitsSold: number;
  revenueFcfa: number;
  cogsFcfa: number;
  grossProfitFcfa: number;
  grossMarginPercentage: number;
  availableStock: number;
  performanceTag: 'BEST_SELLER' | 'WATCH' | 'POOR_PERFORMER';
}

export interface DriverPerformanceMetrics {
  driverId: string;
  driverName: string;
  totalAssigned: number;
  totalDelivered: number;
  totalFailed: number;
  successRatePercentage: number;
  averageDeliveryMinutes: number;
}

export interface ZoneDeliveryMetrics {
  zoneId: string;
  zoneName: string;
  city: string;
  totalDeliveries: number;
  deliveredCount: number;
  failedCount: number;
  failureRatePercentage: number;
  deliveryFeeCollectedFcfa: number;
  deliveryCostPaidFcfa: number;
  deliveryMarginFcfa: number;
}

export interface DataQualityIssue {
  id: string;
  organizationId: string;
  issueType: 'NEGATIVE_STOCK' | 'UNPAID_CONFIRMED_ORDER' | 'MISSING_PRODUCT_COST' | 'ORPHAN_DELIVERY' | 'INCONSISTENT_TIMESTAMP';
  severity: AnomalySeverity;
  description: string;
  entityType: string;
  entityId: string;
  detectedAt: Date;
  resolvedAt?: Date | null;
}

export interface CeoCockpitSummary {
  organizationId: string;
  timestamp: Date;
  cashBalanceFcfa: number;
  revenueFcfa: MetricComparison;
  grossProfitFcfa: MetricComparison;
  ordersCount: MetricComparison;
  averageOrderValueFcfa: MetricComparison;
  deliverySuccessRatePercentage: MetricComparison;
  lowStockAlertsCount: number;
  topInsights: BusinessInsight[];
  activeAnomalies: AnomalyItem[];
}
