/**
 * WILLShop OS — Strategic Health Engine
 * Pure Domain Service — Computes overall Strategy Health Score (0-100) across 7 business dimensions.
 */

import { StrategicGoal, Initiative, StrategyRisk, StrategicHealthSummary } from '../entities/StrategyEntities';

export class StrategicHealthEngine {
  public static computeHealth(
    goals: StrategicGoal[],
    initiatives: Initiative[],
    risks: StrategyRisk[],
    alignmentRatio: number = 100
  ): StrategicHealthSummary {
    const goalsOnTrack = goals.filter((g) => g.status === 'ON_TRACK' || g.status === 'ACHIEVED').length;
    const goalRatio = goals.length > 0 ? (goalsOnTrack / goals.length) * 100 : 85;

    const initiativesActive = initiatives.filter((i) => i.status === 'ACTIVE' || i.status === 'COMPLETED').length;
    const initiativeRatio = initiatives.length > 0 ? (initiativesActive / initiatives.length) * 100 : 90;

    const highRisks = risks.filter((r) => (r.probability === 'HIGH' && r.impact === 'HIGH') && r.status === 'OPEN').length;
    const riskPenalty = highRisks * 10;

    const dimensionScores = {
      finance: Math.min(100, Math.max(40, Math.round(goalRatio * 0.9 + 10))),
      sales: Math.min(100, Math.max(40, Math.round(goalRatio * 0.85 + 15))),
      marketing: Math.min(100, Math.max(40, Math.round(initiativeRatio * 0.8 + 20))),
      operations: Math.min(100, Math.max(40, Math.round(alignmentRatio * 0.85 + 15))),
      customers: Math.min(100, Math.max(40, Math.round(goalRatio * 0.8 + 20))),
      team: Math.min(100, Math.max(40, Math.round(initiativeRatio * 0.9 + 10))),
      strategy: Math.min(100, Math.max(40, Math.round(alignmentRatio * 0.7 + goalRatio * 0.3))),
    };

    const avgDimensionScore =
      (dimensionScores.finance +
        dimensionScores.sales +
        dimensionScores.marketing +
        dimensionScores.operations +
        dimensionScores.customers +
        dimensionScores.team +
        dimensionScores.strategy) /
      7;

    const overallHealthScore = Math.max(0, Math.min(100, Math.round(avgDimensionScore - riskPenalty)));

    let statusBadge: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' = 'ON_TRACK';
    if (overallHealthScore < 60) {
      statusBadge = 'OFF_TRACK';
    } else if (overallHealthScore < 80) {
      statusBadge = 'AT_RISK';
    }

    return {
      overallHealthScore,
      dimensionScores,
      alignmentRatio,
      statusBadge,
    };
  }
}
