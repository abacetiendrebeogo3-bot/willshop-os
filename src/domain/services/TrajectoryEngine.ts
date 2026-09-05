/**
 * WILLShop OS — Trajectory Engine
 * Pure Domain Service — Evaluates actual progress vs expected progress timeline to compute trajectory status.
 */

import { StrategicGoal, GoalTrajectoryStatus } from '../entities/StrategyEntities';
import { GoalProgressService } from './GoalProgressService';

export class TrajectoryEngine {
  /**
   * Computes trajectory status based on variance between actual and expected progress:
   * - actual >= 0.9 * expected -> ON_TRACK 🟢
   * - actual between 0.7 * expected and 0.9 * expected -> AT_RISK 🟡
   * - actual < 0.7 * expected -> OFF_TRACK 🔴
   */
  public static evaluateTrajectory(
    goal: StrategicGoal,
    now: Date = new Date()
  ): { status: GoalTrajectoryStatus; forecast: number; explanation: string } {
    if (goal.status === 'ACHIEVED' || goal.status === 'CANCELLED' || goal.status === 'PAUSED' || goal.status === 'FAILED') {
      return {
        status: goal.status,
        forecast: goal.forecastValue ?? goal.currentValue,
        explanation: `Statut statique '${goal.status}'.`,
      };
    }

    const metrics = GoalProgressService.calculateProgress(goal, now);

    if (metrics.current >= metrics.target) {
      return {
        status: 'ACHIEVED',
        forecast: metrics.current,
        explanation: `Cible de ${metrics.target} ${goal.unit} atteinte avec succès (${metrics.current}).`,
      };
    }

    if (metrics.elapsedPercent <= 5 && metrics.progressPercent === 0) {
      return {
        status: 'NOT_STARTED',
        forecast: metrics.target,
        explanation: 'Période d\'exécution venant de démarrer.',
      };
    }

    // Trajectory projection
    const runRate = metrics.elapsedPercent > 0 ? metrics.progressPercent / metrics.elapsedPercent : 1.0;
    const forecast = Math.round(metrics.baseline + (metrics.target - metrics.baseline) * runRate);

    let status: GoalTrajectoryStatus = 'ON_TRACK';
    let explanation = 'Progression conforme ou supérieure à la trajectoire cible.';

    if (runRate < 0.7 || (metrics.expectedProgressPercent > 50 && metrics.variancePercent < -20)) {
      status = 'OFF_TRACK';
      explanation = `Progression insuffisante (${metrics.progressPercent}% réalisée vs ${metrics.expectedProgressPercent}% attendue). Risque d'échec élevé.`;
    } else if (runRate < 0.9 || (metrics.expectedProgressPercent > 30 && metrics.variancePercent < -10)) {
      status = 'AT_RISK';
      explanation = `Léger retard de trajectoire (${metrics.progressPercent}% réalisée vs ${metrics.expectedProgressPercent}% attendue). Attention requise.`;
    }

    return {
      status,
      forecast,
      explanation,
    };
  }
}
