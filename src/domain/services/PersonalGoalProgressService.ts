/**
 * WILLShop OS — Personal Goal Progress Service
 * Pure Domain Service — Computes progress %, trajectory status, and remaining targets for personal goals.
 */

import { PersonalGoal, PersonalGoalStatus } from '../entities/PersonalEntities';

export class PersonalGoalProgressService {
  public static calculateProgress(
    goal: PersonalGoal,
    now: Date = new Date()
  ): { progressPercent: number; remaining: number; status: PersonalGoalStatus } {
    const totalSpan = goal.targetValue - goal.baselineValue;
    let progressPercent = 0;

    if (totalSpan > 0) {
      progressPercent = Math.min(100, Math.max(0, ((goal.currentValue - goal.baselineValue) / totalSpan) * 100));
    } else if (goal.currentValue >= goal.targetValue) {
      progressPercent = 100;
    }

    const remaining = Math.max(0, goal.targetValue - goal.currentValue);
    let status = goal.status;

    if (progressPercent >= 100) {
      status = 'COMPLETED';
    }

    return {
      progressPercent: Math.round(progressPercent * 10) / 10,
      remaining: Math.round(remaining * 100) / 100,
      status,
    };
  }
}
