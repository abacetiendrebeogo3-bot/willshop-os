/**
 * WILLShop OS — Strategic Prioritization Service
 * Pure Domain Service — Computes initiative prioritization scores based on transparent formula.
 */

import { Initiative, LevelRating } from '../entities/StrategyEntities';

export class StrategicPrioritizationService {
  private static levelToVal(level: LevelRating): number {
    switch (level) {
      case 'HIGH':
        return 3;
      case 'MEDIUM':
        return 2;
      case 'LOW':
      default:
        return 1;
    }
  }

  /**
   * Transparent formula for initiative prioritization score:
   * Score = (StrategicImpact x 3) + (FinancialImpactWeight x 2) - (Effort x 1.5) - (Risk x 1.5) + (Urgency x 1)
   */
  public static calculatePrioritizationScore(initiative: Partial<Initiative>): number {
    const impactVal = this.levelToVal(initiative.strategicImpact || 'MEDIUM');
    const urgencyVal = this.levelToVal(initiative.urgency || 'MEDIUM');
    const effortVal = this.levelToVal(initiative.effort || 'MEDIUM');
    const riskVal = this.levelToVal(initiative.riskLevel || 'MEDIUM');

    let finImpactVal = 2;
    if (initiative.expectedRevenue && initiative.expectedRevenue > 500000) {
      finImpactVal = 3;
    } else if (initiative.expectedRevenue && initiative.expectedRevenue < 100000) {
      finImpactVal = 1;
    }

    const score = impactVal * 3 + finImpactVal * 2 - effortVal * 1.5 - riskVal * 1.5 + urgencyVal * 1;
    return Math.round(score * 10) / 10;
  }

  /**
   * Prioritizes and ranks a list of initiatives.
   */
  public static rankInitiatives(initiatives: Initiative[]): Initiative[] {
    return initiatives
      .map((init) => ({
        ...init,
        prioritizationScore: this.calculatePrioritizationScore(init),
      }))
      .sort((a, b) => b.prioritizationScore - a.prioritizationScore);
  }
}
