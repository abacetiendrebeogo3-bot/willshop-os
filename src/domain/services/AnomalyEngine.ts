/**
 * WILLShop OS — Anomaly Engine
 * Pure Domain Layer — Rule-based and statistical anomaly detection.
 * Deterministic detection with concrete evidence.
 */

import { AnomalyItem, AnomalySeverity } from '../entities/BIEntities';

export interface RawAnomalyContext {
  organizationId: string;
  deliveryFailureRatePercentage: number;
  revenueChangePercentage: number;
  lowStockItemsCount: number;
  grossMarginPercentage: number;
  unpaidConfirmedOrdersCount: number;
}

export class AnomalyEngine {
  static detect(ctx: RawAnomalyContext): AnomalyItem[] {
    const anomalies: AnomalyItem[] = [];
    const now = new Date();

    // 1. High Delivery Failure Rate Anomaly
    if (ctx.deliveryFailureRatePercentage > 20) {
      const severity: AnomalySeverity = ctx.deliveryFailureRatePercentage > 35 ? 'CRITICAL' : 'HIGH';
      anomalies.push({
        id: `anom-del-${now.getTime()}`,
        organizationId: ctx.organizationId,
        metricKey: 'delivery_failure_rate',
        metricName: 'Taux d\'échec de livraison élevé',
        observedValue: ctx.deliveryFailureRatePercentage,
        expectedValue: 10,
        variancePercentage: ctx.deliveryFailureRatePercentage - 10,
        severity,
        evidence: {
          sourceTable: 'deliveries',
          period: 'Ce mois',
          sampleCount: 1,
          calculationDetails: `Taux d'échec de ${ctx.deliveryFailureRatePercentage}% dépasse le seuil toléré de 10%`,
        },
        detectedAt: now,
      });
    }

    // 2. Revenue Drop Anomaly
    if (ctx.revenueChangePercentage < -15) {
      const severity: AnomalySeverity = ctx.revenueChangePercentage < -30 ? 'CRITICAL' : 'HIGH';
      anomalies.push({
        id: `anom-rev-${now.getTime()}`,
        organizationId: ctx.organizationId,
        metricKey: 'revenue_drop',
        metricName: 'Chute importante du Chiffre d\'Affaires',
        observedValue: ctx.revenueChangePercentage,
        expectedValue: 0,
        variancePercentage: ctx.revenueChangePercentage,
        severity,
        evidence: {
          sourceTable: 'orders',
          period: 'vs Période précédente',
          sampleCount: 1,
          calculationDetails: `Baisse du CA de ${Math.abs(ctx.revenueChangePercentage)}% par rapport à la période précédente`,
        },
        detectedAt: now,
      });
    }

    // 3. Low Stock Anomaly
    if (ctx.lowStockItemsCount > 0) {
      anomalies.push({
        id: `anom-stk-${now.getTime()}`,
        organizationId: ctx.organizationId,
        metricKey: 'low_stock',
        metricName: 'Rupture de stock imminente',
        observedValue: ctx.lowStockItemsCount,
        expectedValue: 0,
        variancePercentage: 100,
        severity: ctx.lowStockItemsCount > 3 ? 'HIGH' : 'MEDIUM',
        evidence: {
          sourceTable: 'product_stock',
          period: 'En temps réel',
          sampleCount: ctx.lowStockItemsCount,
          calculationDetails: `${ctx.lowStockItemsCount} produit(s) ont franchi le seuil d'alerte de stock minimum`,
        },
        detectedAt: now,
      });
    }

    // 4. Low Gross Margin Anomaly
    if (ctx.grossMarginPercentage > 0 && ctx.grossMarginPercentage < 20) {
      anomalies.push({
        id: `anom-mrg-${now.getTime()}`,
        organizationId: ctx.organizationId,
        metricKey: 'gross_margin_low',
        metricName: 'Marge brute anormalement faible',
        observedValue: ctx.grossMarginPercentage,
        expectedValue: 35,
        variancePercentage: ctx.grossMarginPercentage - 35,
        severity: 'MEDIUM',
        evidence: {
          sourceTable: 'transactions / order_items',
          period: 'Ce mois',
          sampleCount: 1,
          calculationDetails: `Marge brute observée de ${ctx.grossMarginPercentage}% inférieure à l'objectif de 35%`,
        },
        detectedAt: now,
      });
    }

    return anomalies;
  }
}
