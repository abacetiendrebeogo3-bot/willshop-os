/**
 * WILLShop OS — Insight Engine
 * Pure Domain Layer — Data -> KPI -> Insight -> Recommendation.
 * Every insight includes evidence, source metrics, confidence, and actionable recommendations.
 */

import { BusinessInsight, MetricComparison, AnomalyItem } from '../entities/BIEntities';

export interface InsightGenerationContext {
  organizationId: string;
  revenueComp: MetricComparison;
  ordersComp: MetricComparison;
  aovComp: MetricComparison;
  deliverySuccessRate: number;
  anomalies: AnomalyItem[];
  topProductNames: string[];
}

export class InsightEngine {
  static generate(ctx: InsightGenerationContext): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    const now = new Date();

    // 1. Sales Trend Insight
    if (ctx.revenueComp.trend === 'UP') {
      insights.push({
        id: `ins-sales-${now.getTime()}`,
        organizationId: ctx.organizationId,
        type: 'SALES_TREND',
        title: 'Croissance du Chiffre d\'Affaires',
        summary: `Le CA a augmenté de +${ctx.revenueComp.percentageChange}% par rapport à la période précédente.`,
        recommendation: 'Maintenir la dynamique publicitaire et s\'assurer du stock suffisant sur les Best-Sellers.',
        confidence: 'HIGH',
        evidence: {
          kpiKeys: ['revenue', 'orders_count'],
          observedData: {
            currentRevenue: ctx.revenueComp.currentValue,
            previousRevenue: ctx.revenueComp.previousValue,
            percentageChange: ctx.revenueComp.percentageChange,
          },
          timeframe: 'vs Période précédente',
          explanation: 'La hausse du CA est tirée par l\'augmentation du volume de commandes complétées.',
        },
        freshnessTimestamp: now,
      });
    } else if (ctx.revenueComp.trend === 'DOWN') {
      const cause =
        ctx.ordersComp.trend === 'DOWN'
          ? 'un recul du volume de commandes'
          : 'une baisse du panier moyen (AOV)';
      insights.push({
        id: `ins-sales-${now.getTime()}`,
        organizationId: ctx.organizationId,
        type: 'SALES_TREND',
        title: 'Recul du Chiffre d\'Affaires',
        summary: `Le CA enregistre une baisse de ${ctx.revenueComp.percentageChange}%.`,
        recommendation: `Action requise sur la relance commerciale : le recul s'explique par ${cause}.`,
        confidence: 'HIGH',
        evidence: {
          kpiKeys: ['revenue', 'orders_count', 'aov'],
          observedData: {
            revenueChange: ctx.revenueComp.percentageChange,
            ordersChange: ctx.ordersComp.percentageChange,
            aovChange: ctx.aovComp.percentageChange,
          },
          timeframe: 'vs Période précédente',
          explanation: `Le diagnostic mathématique indique que la baisse globale s'explique par ${cause}.`,
        },
        freshnessTimestamp: now,
      });
    }

    // 2. Delivery Bottleneck Insight
    if (ctx.deliverySuccessRate < 80) {
      insights.push({
        id: `ins-del-${now.getTime()}`,
        organizationId: ctx.organizationId,
        type: 'DELIVERY_BOTTLENECK',
        title: 'Taux d\'échec de livraison critique',
        summary: `Seulement ${ctx.deliverySuccessRate}% des livraisons aboutissent.`,
        recommendation: 'Vérifier la pré-qualification des adresses et la disponibilité téléphonique avant le départ du livreur.',
        confidence: 'HIGH',
        evidence: {
          kpiKeys: ['delivery_success_rate'],
          observedData: {
            deliverySuccessRate: ctx.deliverySuccessRate,
            failureRate: 100 - ctx.deliverySuccessRate,
          },
          timeframe: '30 derniers jours',
          explanation: 'Un taux de livraison inférieur à 80% génère des frais de transport perdus et des dégradations de stock.',
        },
        freshnessTimestamp: now,
      });
    }

    // 3. Stock Risk Insight
    const stockAnomaly = ctx.anomalies.find((a) => a.metricKey === 'low_stock');
    if (stockAnomaly) {
      insights.push({
        id: `ins-stk-${now.getTime()}`,
        organizationId: ctx.organizationId,
        type: 'STOCK_RISK',
        title: 'Risque de rupture sur les Best-Sellers',
        summary: `${stockAnomaly.observedValue} produit(s) sont sous le seuil d'alerte.`,
        recommendation: 'Passer une commande de réapprovisionnement auprès des fournisseurs principaux.',
        confidence: 'HIGH',
        evidence: {
          kpiKeys: ['available_stock', 'minimum_stock'],
          observedData: {
            lowStockItemsCount: stockAnomaly.observedValue,
          },
          timeframe: 'Temps réel',
          explanation: 'Rupture de stock imminente sur les références clés, entraînant un risque de manque à gagner.',
        },
        freshnessTimestamp: now,
      });
    }

    return insights;
  }
}
