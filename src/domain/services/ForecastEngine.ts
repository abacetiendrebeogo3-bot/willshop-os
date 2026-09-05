/**
 * WILLShop OS — Forecasting & Scenario Simulation Engines
 * Simple, deterministic statistical forecasting and what-if simulation without mutating real state.
 * Pure Domain Services.
 */

import { ForecastResult, ScenarioSimulationResult } from '../entities/CEOAIEntities';

export class ForecastEngine {
  /**
   * Generates a 3-period moving average forecast for a series of numbers.
   */
  public static forecastMovingAverage(
    metricName: string,
    historicalValues: number[],
    periodName = 'Prochains 7 jours'
  ): ForecastResult {
    if (historicalValues.length === 0) {
      return {
        metricName,
        baselineValue: 0,
        forecastValue: 0,
        period: periodName,
        confidence: { level: 'LOW', score: 30, reasons: ['Aucune donnée historique'] },
        assumptions: ['Données insuffisantes'],
        method: 'MOVING_AVERAGE_3P',
      };
    }

    const baseline = historicalValues[historicalValues.length - 1];
    const slice = historicalValues.slice(-3);
    const sum = slice.reduce((a, b) => a + b, 0);
    const forecastValue = Math.round(sum / slice.length);

    return {
      metricName,
      baselineValue: baseline,
      forecastValue,
      period: periodName,
      confidence: {
        level: historicalValues.length >= 3 ? 'HIGH' : 'MEDIUM',
        score: historicalValues.length >= 3 ? 90 : 70,
        reasons: [`Calculé sur la moyenne mobile des ${slice.length} dernières périodes`],
      },
      assumptions: ['Stabilité des canaux de distribution', 'Absence d\'anomalies macro-économiques majeures'],
      method: 'MOVING_AVERAGE_3P',
    };
  }
}

export class ScenarioEngine {
  /**
   * Simulates a What-If scenario (e.g. ad budget adjustment or price/volume change) without mutating real data.
   */
  public static simulateScenario(
    scenarioName: string,
    baseline: { revenue: number; cogs: number; adSpend: number; operatingExpenses: number },
    modifiers: { adSpendMultiplier?: number; volumeMultiplier?: number; priceMultiplier?: number }
  ): ScenarioSimulationResult {
    const vol = modifiers.volumeMultiplier || 1.0;
    const price = modifiers.priceMultiplier || 1.0;
    const adMult = modifiers.adSpendMultiplier || 1.0;

    const projRevenue = Math.round(baseline.revenue * vol * price);
    const projCogs = Math.round(baseline.cogs * vol);
    const projAdSpend = Math.round(baseline.adSpend * adMult);
    const projOpEx = baseline.operatingExpenses + (projAdSpend - baseline.adSpend);

    const baselineGrossProfit = baseline.revenue - baseline.cogs;
    const projGrossProfit = projRevenue - projCogs;

    const baselineNet = baselineGrossProfit - baseline.operatingExpenses;
    const projNet = projGrossProfit - projOpEx;

    return {
      scenarioName,
      baseline: {
        revenue: baseline.revenue,
        grossProfit: baselineGrossProfit,
        netProfit: baselineNet,
      },
      projected: {
        revenue: projRevenue,
        grossProfit: projGrossProfit,
        netProfit: projNet,
      },
      deltas: {
        revenueDelta: projRevenue - baseline.revenue,
        grossProfitDelta: projGrossProfit - baselineGrossProfit,
        netProfitDelta: projNet - baselineNet,
      },
      assumptions: [
        `Multiplicateur de volume: ${vol}x`,
        `Multiplicateur de prix: ${price}x`,
        `Multiplicateur dépenses marketing: ${adMult}x`,
      ],
      confidence: {
        level: 'MEDIUM',
        score: 75,
        reasons: ['Modèle de simulation déterministe basé sur les élasticités configurées'],
      },
    };
  }
}
