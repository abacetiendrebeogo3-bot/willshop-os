/**
 * WILLShop OS — Trend Engine
 * Pure Domain Layer — Mathematical Trend Analysis & Period Comparison.
 * NO Generative AI / LLM used for math calculations.
 */

import { MetricComparison } from '../entities/BIEntities';

export class TrendEngine {
  /**
   * Compares current period value vs previous period value.
   */
  static compare(
    currentValue: number,
    previousValue: number,
    higherIsBetter: boolean = true
  ): MetricComparison {
    const absoluteChange = currentValue - previousValue;
    const percentageChange =
      previousValue !== 0 ? (absoluteChange / Math.abs(previousValue)) * 100 : currentValue > 0 ? 100 : 0;

    let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (Math.abs(percentageChange) >= 0.5) {
      trend = percentageChange > 0 ? 'UP' : 'DOWN';
    }

    const isPositiveDirection =
      trend === 'STABLE' ? true : higherIsBetter ? trend === 'UP' : trend === 'DOWN';

    return {
      currentValue,
      previousValue,
      absoluteChange,
      percentageChange: Math.round(percentageChange * 10) / 10,
      trend,
      isPositiveDirection,
    };
  }
}
