/**
 * WILLShop OS — Daily Work Plan Service
 * Pure Domain Service — Generates personalized daily work plans for employees.
 */

import { TeamEmployee, TeamTask } from '../entities/TeamEntities';

export interface DailyWorkPlan {
  employeeId: string;
  employeeName: string;
  urgentAndOverdueTasks: TeamTask[];
  importantTasks: TeamTask[];
  regularTasks: TeamTask[];
  topPriorityRecommendation: string;
}

export class DailyWorkPlanService {
  public static generateWorkPlan(
    employee: TeamEmployee,
    tasks: TeamTask[],
    now: Date = new Date()
  ): DailyWorkPlan {
    const employeeTasks = tasks.filter(
      (t) =>
        t.assignedTo === employee.id &&
        t.status !== 'DONE' &&
        t.status !== 'CANCELLED' &&
        t.status !== 'ARCHIVED'
    );

    const urgentAndOverdue = employeeTasks.filter(
      (t) =>
        t.priority === 'URGENT' ||
        (t.dueAt && new Date(t.dueAt).getTime() < now.getTime())
    );

    const important = employeeTasks.filter(
      (t) =>
        t.priority === 'HIGH' &&
        !urgentAndOverdue.some((u) => u.id === t.id)
    );

    const regular = employeeTasks.filter(
      (t) =>
        !urgentAndOverdue.some((u) => u.id === t.id) &&
        !important.some((i) => i.id === t.id)
    );

    let topPriority = 'Continuer le traitement fluide des tâches courantes.';
    if (urgentAndOverdue.length > 0) {
      topPriority = `Priorité #1: Traiter immédiatement '${urgentAndOverdue[0].title}' (${urgentAndOverdue.length} tâches urgentes/en retard).`;
    } else if (important.length > 0) {
      topPriority = `Priorité #1: Finaliser '${important[0].title}'.`;
    }

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      urgentAndOverdueTasks: urgentAndOverdue,
      importantTasks: important,
      regularTasks: regular,
      topPriorityRecommendation: topPriority,
    };
  }
}
