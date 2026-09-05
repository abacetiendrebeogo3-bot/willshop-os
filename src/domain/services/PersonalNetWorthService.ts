/**
 * WILLShop OS — Personal Net Worth Service
 * Pure Domain Service — Computes personal assets, liabilities, and Net Worth snapshots.
 * Net Worth = Assets - Liabilities.
 */

import {
  PersonalFinancialAccount,
  PersonalInvestmentPosition,
  PersonalNetWorthSnapshot,
} from '../entities/PersonalEntities';

export class PersonalNetWorthService {
  public static calculateNetWorth(
    userId: string,
    accounts: PersonalFinancialAccount[],
    investments: PersonalInvestmentPosition[],
    liabilities: { name: string; amount: number }[] = []
  ): PersonalNetWorthSnapshot {
    const assetBreakdown: Record<string, number> = {};
    let totalCashAndSavings = 0;

    for (const acc of accounts) {
      if (acc.currentBalance > 0) {
        assetBreakdown[`account_${acc.name}`] = acc.currentBalance;
        totalCashAndSavings += acc.currentBalance;
      }
    }

    let totalInvestments = 0;
    for (const inv of investments) {
      assetBreakdown[`investment_${inv.assetName}`] = inv.currentValuation;
      totalInvestments += inv.currentValuation;
    }

    const assetsValue = totalCashAndSavings + totalInvestments;

    const liabilityBreakdown: Record<string, number> = {};
    let liabilitiesValue = 0;

    for (const liab of liabilities) {
      liabilityBreakdown[liab.name] = liab.amount;
      liabilitiesValue += liab.amount;
    }

    const netWorth = assetsValue - liabilitiesValue;

    return {
      id: `nw_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      scope: 'personal',
      snapshotDate: new Date(),
      assetsValue: Math.round(assetsValue * 100) / 100,
      liabilitiesValue: Math.round(liabilitiesValue * 100) / 100,
      netWorth: Math.round(netWorth * 100) / 100,
      assetBreakdown,
      liabilityBreakdown,
      createdAt: new Date(),
    };
  }
}
