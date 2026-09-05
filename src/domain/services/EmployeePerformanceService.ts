/**
 * WILLShop OS — Employee Performance Service
 * Pure Domain Service — Computes role-specific performance scorecards with contextual safeguards.
 */

import { TeamEmployee, TeamTask, TeamGoal, EmployeePerformanceScorecard } from '../entities/TeamEntities';

export interface PerformanceContext {
  leadsVolume?: number;
  marketDemandFactor?: number;
  deliveryRouteDifficulty?: number;
}

export class EmployeePerformanceService {
  /**
   * Generates a context-aware performance scorecard for an employee.
   * Safeguard rule: Low performance scores are not auto-attributed to employee fault
   * if lead volume or market factors are depressed.
   */
  public static generateScorecard(
    employee: TeamEmployee,
    period: string,
    tasks: TeamTask[],
    goals: TeamGoal[],
    domainKPIs: Record<string, number>,
    context: PerformanceContext = {}
  ): EmployeePerformanceScorecard {
    const empTasks = tasks.filter((t) => t.assignedTo === employee.id);
    const completedTasks = empTasks.filter((t) => t.status === 'DONE');
    const onTimeTasks = completedTasks.filter((t) => {
      if (!t.dueAt || !t.completedAt) return true;
      return new Date(t.completedAt).getTime() <= new Date(t.dueAt).getTime();
    });

    // 1. Activity Score (completion rate & task volume)
    const taskCompletionRate = empTasks.length > 0 ? (completedTasks.length / empTasks.length) * 100 : 80;
    const activityScore = Math.min(100, Math.round(taskCompletionRate));

    // 2. Reliability Score (on-time rate)
    const onTimeRate = completedTasks.length > 0 ? (onTimeTasks.length / completedTasks.length) * 100 : 90;
    const reliabilityScore = Math.round(onTimeRate);

    // 3. Goal Score
    const empGoals = goals.filter((g) => g.employeeId === employee.id);
    const achievedGoals = empGoals.filter((g) => g.status === 'ACHIEVED' || g.status === 'ON_TRACK');
    const goalScore = empGoals.length > 0 ? Math.round((achievedGoals.length / empGoals.length) * 100) : 85;

    // 4. Quality & Result Scores from domain KPIs (e.g. sales conversion, delivery success rate)
    const resultScore = domainKPIs['result_score'] ?? domainKPIs['conversion_rate'] ?? 75;
    const qualityScore = domainKPIs['quality_score'] ?? domainKPIs['customer_satisfaction'] ?? 80;

    // Calculate Raw Overall Score
    let overallScore = Math.round(
      activityScore * 0.2 + reliabilityScore * 0.2 + goalScore * 0.2 + resultScore * 0.25 + qualityScore * 0.15
    );

    const contextualNotes: string[] = [];
    let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

    // Contextual Safeguards
    if (employee.role === 'COMMERCIAL' && context.leadsVolume !== undefined && context.leadsVolume < 10) {
      contextualNotes.push(
        `Volume de leads très faible (${context.leadsVolume} leads). Les résultats de ventes dépendent fortement de la génération de leads en amont.`
      );
      confidenceLevel = 'MEDIUM';
      // Buffer adjustment for fair evaluation
      overallScore = Math.max(overallScore, 70);
    }

    if (employee.role === 'LIVREUR' && context.deliveryRouteDifficulty && context.deliveryRouteDifficulty > 1.5) {
      contextualNotes.push(
        'Conditions de circulation/route particulièrement difficiles signalées sur les zones assignées.'
      );
      confidenceLevel = 'MEDIUM';
    }

    if (contextualNotes.length === 0) {
      contextualNotes.push('Évaluation basée sur un volume d\'activité représentatif.');
    }

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      role: employee.role,
      period,
      activityScore,
      qualityScore,
      resultScore,
      reliabilityScore,
      goalScore,
      overallScore,
      kpis: domainKPIs,
      contextualNotes,
      confidenceLevel,
    };
  }
}
