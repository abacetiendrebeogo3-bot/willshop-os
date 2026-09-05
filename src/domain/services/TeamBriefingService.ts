/**
 * WILLShop OS — Team Briefing Service
 * Pure Domain Service — Generates manager and CEO daily briefings on team workload, blockers, and performance.
 */

import { TeamEmployee, TeamTask, TeamGoal } from '../entities/TeamEntities';

export interface TeamBriefing {
  totalOpenTasks: number;
  overdueTasksCount: number;
  blockedTasksCount: number;
  urgentTasksCount: number;
  goalsAtRiskCount: number;
  topBlockerSummary: string;
  recommendations: string[];
}

export class TeamBriefingService {
  public static generateBriefing(
    employees: TeamEmployee[],
    tasks: TeamTask[],
    goals: TeamGoal[],
    now: Date = new Date()
  ): TeamBriefing {
    const activeTasks = tasks.filter(
      (t) => t.status !== 'DONE' && t.status !== 'CANCELLED' && t.status !== 'ARCHIVED'
    );

    const totalOpenTasks = activeTasks.length;
    const overdueTasksCount = activeTasks.filter(
      (t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime()
    ).length;
    const blockedTasksCount = activeTasks.filter((t) => t.status === 'BLOCKED').length;
    const urgentTasksCount = activeTasks.filter((t) => t.priority === 'URGENT').length;
    const goalsAtRiskCount = goals.filter(
      (g) => g.status === 'AT_RISK' || g.status === 'OFF_TRACK'
    ).length;

    // Analyze main blocker reason
    const blockedTasks = activeTasks.filter((t) => t.status === 'BLOCKED');
    let topBlockerSummary = 'Aucun blocage majeur détecté.';
    if (blockedTasks.length > 0) {
      const reasons = blockedTasks.map((t) => t.blockerReason || 'Raison non spécifiée');
      topBlockerSummary = `${blockedTasks.length} tâche(s) bloquée(s). Motif principal: '${reasons[0]}'.`;
    }

    const recommendations: string[] = [];
    if (overdueTasksCount > 0) {
      recommendations.push(`Réassigner ou intensifier le suivi sur les ${overdueTasksCount} tâches en retard.`);
    }
    if (blockedTasksCount > 0) {
      recommendations.push(`Intervenir pour débloquer les tâches en attente (${blockedTasksCount} bloquées).`);
    }
    if (goalsAtRiskCount > 0) {
      recommendations.push(`Réviser l'allocation de ressources pour les ${goalsAtRiskCount} objectifs à risque.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Exécution fluide et optimale de l\'ensemble de l\'équipe.');
    }

    return {
      totalOpenTasks,
      overdueTasksCount,
      blockedTasksCount,
      urgentTasksCount,
      goalsAtRiskCount,
      topBlockerSummary,
      recommendations,
    };
  }
}
