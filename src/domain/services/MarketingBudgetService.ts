/**
 * WILLShop OS — Marketing Budget Intelligence Service
 * Manages budget pacing, remaining balance, and overspend/underspend alerts.
 * Pure Domain Service.
 */

export interface BudgetPacingSummary {
  plannedBudget: number;
  totalSpent: number;
  remainingBudget: number;
  pacingPercent: number; // % of budget consumed
  daysElapsedPercent: number;
  isOverspending: boolean;
  isUnderspending: boolean;
  statusText: string;
}

export class MarketingBudgetService {
  /**
   * Calculates campaign budget pacing against elapsed time.
   */
  public static calculatePacing(
    plannedBudget: number,
    totalSpent: number,
    startAt?: Date | null,
    endAt?: Date | null
  ): BudgetPacingSummary {
    const remainingBudget = Math.max(0, plannedBudget - totalSpent);
    const pacingPercent = plannedBudget > 0 ? Math.round((totalSpent / plannedBudget) * 1000) / 10 : 0;

    let daysElapsedPercent = 50; // Default fallback
    if (startAt && endAt) {
      const totalDuration = endAt.getTime() - startAt.getTime();
      const elapsed = Date.now() - startAt.getTime();
      if (totalDuration > 0) {
        daysElapsedPercent = Math.max(0, Math.min(100, Math.round((elapsed / totalDuration) * 100)));
      }
    }

    const isOverspending = pacingPercent > daysElapsedPercent + 15;
    const isUnderspending = pacingPercent < daysElapsedPercent - 20;

    let statusText = 'Pacing budgétaire conforme.';
    if (isOverspending) {
      statusText = `⚠️ Dépassement de rythme budgétaire : ${pacingPercent}% consommé pour ${daysElapsedPercent}% du temps écoulé.`;
    } else if (isUnderspending) {
      statusText = `Sous-consommation budgétaire : ${pacingPercent}% consommé pour ${daysElapsedPercent}% du temps écoulé.`;
    }

    return {
      plannedBudget,
      totalSpent,
      remainingBudget,
      pacingPercent,
      daysElapsedPercent,
      isOverspending,
      isUnderspending,
      statusText,
    };
  }
}
