/**
 * WILLShop OS — Stop / Start / Continue Engine
 * Pure Domain Service — Generates evidence-backed strategic recommendations.
 */

import { Initiative, StrategicGoal, StrategyRisk } from '../entities/StrategyEntities';

export interface RecommendationItem {
  action: 'STOP' | 'START' | 'CONTINUE';
  title: string;
  reason: string;
  evidence: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class StopStartContinueEngine {
  public static generateRecommendations(
    initiatives: Initiative[],
    goals: StrategicGoal[],
    risks: StrategyRisk[]
  ): RecommendationItem[] {
    const items: RecommendationItem[] = [];

    // 1. STOP Recommendations: High effort, low impact, negative expected ROI or cancelled
    initiatives.forEach((init) => {
      if (
        (init.effort === 'HIGH' && init.strategicImpact === 'LOW') ||
        (init.expectedRoi < 0 && init.status === 'ACTIVE')
      ) {
        items.push({
          action: 'STOP',
          title: `Arrêter l'initiative '${init.title}'`,
          reason: 'Faible impact stratégique et/ou ROI prévisionnel négatif par rapport à l\'effort investi.',
          evidence: `Effort: ${init.effort}, Impact: ${init.strategicImpact}, ROI attendu: ${init.expectedRoi}%.`,
          confidence: 'HIGH',
        });
      }
    });

    // 2. START Recommendations: High risk items without active mitigation or goals OFF_TRACK missing initiatives
    goals.forEach((goal) => {
      if (goal.status === 'OFF_TRACK') {
        const hasActiveInitiative = initiatives.some((i) => i.goalId === goal.id && i.status === 'ACTIVE');
        if (!hasActiveInitiative) {
          items.push({
            action: 'START',
            title: `Lancer une nouvelle initiative pour l'objectif '${goal.title}'`,
            reason: `L'objectif est étiqueté OFF_TRACK (${goal.currentValue}/${goal.targetValue} ${goal.unit}) et ne dispose d'aucune initiative active associée.`,
            evidence: `Statut objectif: OFF_TRACK, Valeur actuelle: ${goal.currentValue}, Cible: ${goal.targetValue}.`,
            confidence: 'HIGH',
          });
        }
      }
    });

    // 3. CONTINUE Recommendations: Initiatives ON_TRACK with positive ROI
    initiatives.forEach((init) => {
      if (init.status === 'ACTIVE' && init.strategicImpact === 'HIGH' && init.expectedRoi >= 0) {
        items.push({
          action: 'CONTINUE',
          title: `Accélérer l'initiative '${init.title}'`,
          reason: 'Fort impact stratégique et alignement avéré avec les objectifs de rentabilité.',
          evidence: `Impact: HIGH, ROI attendu: ${init.expectedRoi}%.`,
          confidence: 'HIGH',
        });
      }
    });

    if (items.length === 0) {
      items.push({
        action: 'CONTINUE',
        title: 'Maintenir les initiatives stratégiques en cours',
        reason: 'L\'ensemble des initiatives actives est aligné sur les objectifs de WillShop OS.',
        evidence: 'Aucune anomalie stratégique majeure n\'a été détectée.',
        confidence: 'HIGH',
      });
    }

    return items;
  }
}
