/**
 * WILLShop OS — Goal Progress Service
 * Pure Domain Service — Computes goal baseline, target, progress %, remaining, and elapsed time %.
 */

import { StrategicGoal } from '../entities/StrategyEntities';

export interface GoalProgressMetrics {
  goalId: string;
  baseline: number;
  target: number;
  current: number;
  progressPercent: number; // 0 - 100%
  remaining: number;
  elapsedPercent: number; // 0 - 100% of time window
  expectedProgressPercent: number;
  variancePercent: number; // actual - expected
}

export class GoalProgressService {
  public static calculateProgress(
    goal: StrategicGoal,
    now: Date = new Date()
  ): GoalProgressMetrics {
    const baseline = goal.baselineValue;
    const target = goal.targetValue;
    const current = goal.currentValue;

    const totalSpan = target - baseline;
    let progressPercent = 0;
    if (totalSpan !== 0) {
      progressPercent = Math.min(100, Math.max(0, ((current - baseline) / totalSpan) * 100));
    } else if (current >= target) {
      progressPercent = 100;
    }

    const remaining = Math.max(0, target - current);

    // Elapsed time calculation
    const startTime = new Date(goal.startDate).getTime();
    const dueTime = new Date(goal.dueDate).getTime();
    const currentTime = now.getTime();

    const totalDuration = dueTime - startTime;
    let elapsedPercent = 0;
    if (totalDuration > 0) {
      const elapsedDuration = currentTime - startTime;
      elapsedPercent = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
    }

    const expectedProgressPercent = elapsedPercent;
    const variancePercent = Math.round((progressPercent - expectedProgressPercent) * 10) / 10;

    return {
      goalId: goal.id,
      baseline,
      target,
      current,
      progressPercent: Math.round(progressPercent * 10) / 10,
      remaining,
      elapsedPercent: Math.round(elapsedPercent * 10) / 10,
      expectedProgressPercent: Math.round(expectedProgressPercent * 10) / 10,
      variancePercent,
    };
  }
}
