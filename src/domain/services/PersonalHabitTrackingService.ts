/**
 * WILLShop OS — Personal Habit Tracking Service
 * Pure Domain Service — Computes streak counts, best streak records, and adherence percentages.
 */

import { PersonalHabit } from '../entities/PersonalEntities';

export class PersonalHabitTrackingService {
  /**
   * Logs completion for today's date ('YYYY-MM-DD') and updates habit streaks and adherence.
   */
  public static logCompletion(
    habit: PersonalHabit,
    todayISO: string = new Date().toISOString().split('T')[0]
  ): PersonalHabit {
    if (habit.historyLog.includes(todayISO)) {
      return habit; // Already logged today
    }

    const historyLog = [...habit.historyLog, todayISO].sort();
    const streakCount = habit.streakCount + 1;
    const bestStreak = Math.max(habit.bestStreak, streakCount);

    // Compute 30-day adherence rate
    const recentLogs = historyLog.slice(-30);
    const adherencePercent = Math.min(100, Math.round((recentLogs.length / (habit.targetDaysPerWeek * 4)) * 100));

    return {
      ...habit,
      historyLog,
      streakCount,
      bestStreak,
      adherencePercent,
      updatedAt: new Date(),
    };
  }
}
