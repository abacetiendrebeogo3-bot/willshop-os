/**
 * WILLShop OS — Marketing Profitability Engine
 * Deterministically calculates Gross Profit, Contribution Profit, ROAS, ROI, and CAC.
 * Pure Domain Service.
 */

import { ContributionProfitSummary } from '../entities/MarketingEntities';

export class ProfitabilityEngine {
  /**
   * Calculates complete Marketing Contribution Profit and ROI metrics.
   * Contribution Profit = Revenue - COGS - AdSpend - DeliveryCosts - Commissions - OtherVariableCosts.
   */
  public static calculateContributionProfit(
    revenue: number,
    cogs: number,
    adSpend: number,
    deliveryCosts = 0,
    commissions = 0,
    otherVariableCosts = 0
  ): ContributionProfitSummary {
    const grossProfit = Math.max(0, revenue - cogs);
    const totalVariableCosts = cogs + adSpend + deliveryCosts + commissions + otherVariableCosts;
    const contributionProfit = revenue - totalVariableCosts;

    const contributionMarginPercent = revenue > 0 ? Math.round((contributionProfit / revenue) * 1000) / 10 : 0;
    const roas = adSpend > 0 ? Math.round((revenue / adSpend) * 100) / 100 : 0;
    const roi = adSpend > 0 ? Math.round((contributionProfit / adSpend) * 100) / 100 : 0;

    return {
      revenue,
      cogs,
      adSpend,
      deliveryCosts,
      commissions,
      otherVariableCosts,
      grossProfit,
      contributionProfit,
      contributionMarginPercent,
      roas,
      roi,
    };
  }

  /**
   * Calculates Customer Acquisition Cost (CAC) for new acquired customers.
   */
  public static calculateCAC(totalAdSpend: number, newCustomersCount: number): number {
    if (newCustomersCount <= 0) return 0;
    return Math.round(totalAdSpend / newCustomersCount);
  }
}
