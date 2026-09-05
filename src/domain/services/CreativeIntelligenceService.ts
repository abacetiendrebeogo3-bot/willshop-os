/**
 * WILLShop OS — Creative Intelligence & Fatigue Engine
 * Evaluates creative performance (WINNER, WATCH, LOSER, FATIGUE).
 * Pure Domain Service.
 */

import { CreativeStatusTag } from '../entities/MarketingEntities';

export class CreativeIntelligenceService {
  /**
   * Evaluates a creative's performance and detects creative fatigue.
   */
  public static evaluateCreative(
    impressions: number,
    clicks: number,
    conversions: number,
    previousCtr?: number,
    previousCpa?: number,
    currentCpa?: number
  ): { statusTag: CreativeStatusTag; ctr: number; fatigueDetected: boolean; reason?: string } {
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
    let statusTag: CreativeStatusTag = 'WATCH';
    let fatigueDetected = false;
    let reason: string | undefined;

    // Minimum sample size required: 1,000 impressions
    if (impressions < 1000) {
      return { statusTag: 'WATCH', ctr, fatigueDetected: false, reason: 'Échantillon d\'impressions insuffisant (< 1000)' };
    }

    // Fatigue check: CTR dropped by more than 30% OR CPA increased by more than 40%
    if (previousCtr && previousCtr > 0 && ctr < previousCtr * 0.7) {
      fatigueDetected = true;
      statusTag = 'FATIGUE';
      reason = `Fatigue visuelle détectée : Chute du CTR de ${previousCtr}% à ${ctr}% (-${Math.round((1 - ctr / previousCtr) * 100)}%)`;
    } else if (previousCpa && currentCpa && currentCpa > previousCpa * 1.4) {
      fatigueDetected = true;
      statusTag = 'FATIGUE';
      reason = `Fatigue publicitaire détectée : Hausse du CPA de ${previousCpa} XOF à ${currentCpa} XOF (+${Math.round((currentCpa / previousCpa - 1) * 100)}%)`;
    } else if (ctr >= 3.5 && conversions >= 5) {
      statusTag = 'WINNER';
    } else if (ctr < 1.5) {
      statusTag = 'LOSER';
    }

    return { statusTag, ctr, fatigueDetected, reason };
  }
}
