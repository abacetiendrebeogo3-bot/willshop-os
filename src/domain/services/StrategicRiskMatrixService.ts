/**
 * WILLShop OS — Strategic Risk Matrix Service
 * Pure Domain Service — Computes probability x impact scores to populate risk matrix data.
 */

import { StrategyRisk, LevelRating } from '../entities/StrategyEntities';

export class StrategicRiskMatrixService {
  private static ratingToScore(rating: LevelRating): number {
    switch (rating) {
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
   * Calculates numerical risk score (1 to 9).
   */
  public static computeRiskScore(probability: LevelRating, impact: LevelRating): number {
    return this.ratingToScore(probability) * this.ratingToScore(impact);
  }

  /**
   * Categorizes risks into 🟢 LOW (1-2), 🟡 MEDIUM (3-5), 🔴 HIGH (6-9).
   */
  public static categorizeRiskLevel(riskScore: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (riskScore >= 6) return 'HIGH';
    if (riskScore >= 3) return 'MEDIUM';
    return 'LOW';
  }

  public static evaluateRisks(risks: StrategyRisk[]): (StrategyRisk & { category: 'LOW' | 'MEDIUM' | 'HIGH' })[] {
    return risks.map((r) => {
      const score = this.computeRiskScore(r.probability, r.impact);
      return {
        ...r,
        riskScore: score,
        category: this.categorizeRiskLevel(score),
      };
    });
  }
}
