/**
 * WILLShop OS — CEO AI Evidence & Confidence Engines
 * Pure Domain Services.
 */

import { AIInsightEvidence, ConfidenceScore, ConfidenceLevel } from '../entities/CEOAIEntities';

export class EvidenceEngine {
  /**
   * Creates an immutable AIInsightEvidence object.
   */
  public static createEvidence(
    sourceType: string,
    metric: string,
    value: unknown,
    period: string,
    options?: {
      sourceId?: string;
      comparison?: string;
      delta?: number;
      freshness?: string;
      confidence?: number;
    }
  ): AIInsightEvidence {
    return {
      sourceType,
      sourceId: options?.sourceId || null,
      metric,
      value,
      period,
      comparison: options?.comparison || null,
      delta: options?.delta !== undefined ? options.delta : null,
      freshness: options?.freshness || 'realtime',
      confidence: options?.confidence !== undefined ? options.confidence : 90,
    };
  }
}

export class ConfidenceEngine {
  /**
   * Deterministically calculates a ConfidenceScore based on data quality, sample volume, and freshness.
   */
  public static calculateConfidence(
    dataPointsCount: number,
    dataFreshnessMinutes: number,
    hasMissingFields: boolean
  ): ConfidenceScore {
    let score = 100;
    const reasons: string[] = [];

    if (dataPointsCount < 5) {
      score -= 25;
      reasons.push('Volume de données historiquement limité (< 5 points)');
    }
    if (dataFreshnessMinutes > 60) {
      score -= 15;
      reasons.push('Données datant de plus d\'une heure');
    }
    if (hasMissingFields) {
      score -= 30;
      reasons.push('Certaines métriques obligatoires sont incomplètes');
    }

    score = Math.max(10, Math.min(100, score));

    let level: ConfidenceLevel = 'HIGH';
    if (score < 60) level = 'LOW';
    else if (score < 85) level = 'MEDIUM';

    return { level, score, reasons };
  }
}
