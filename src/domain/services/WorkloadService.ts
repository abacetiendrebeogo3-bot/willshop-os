/**
 * WILLShop OS — Workload Service
 * Pure Domain Service — Computes employee workload summaries and workload status.
 */

import { TeamEmployee, TeamTask, WorkloadSummary, WorkloadStatus } from '../entities/TeamEntities';

export class WorkloadService {
  /**
   * Calculates the workload summary for a given employee.
   */
  public static computeEmployeeWorkload(
    employee: TeamEmployee,
    tasks: TeamTask[],
    now: Date = new Date()
  ): WorkloadSummary {
    const employeeTasks = tasks.filter(
      (t) => t.assignedTo === employee.id && t.status !== 'DONE' && t.status !== 'CANCELLED' && t.status !== 'ARCHIVED'
    );

    const openTasksCount = employeeTasks.length;
    const urgentTasksCount = employeeTasks.filter((t) => t.priority === 'URGENT').length;
    const overdueTasksCount = employeeTasks.filter(
      (t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime()
    ).length;
    const blockedTasksCount = employeeTasks.filter((t) => t.status === 'BLOCKED').length;

    // Estimate total workload hours (URGENT = 4h, HIGH = 3h, MEDIUM = 2h, LOW = 1h)
    const estimatedHours = employeeTasks.reduce((acc, task) => {
      switch (task.priority) {
        case 'URGENT':
          return acc + 4;
        case 'HIGH':
          return acc + 3;
        case 'MEDIUM':
          return acc + 2;
        case 'LOW':
        default:
          return acc + 1;
      }
    }, 0);

    let status: WorkloadStatus = 'BALANCED';
    if (estimatedHours > 16 || openTasksCount >= 8 || urgentTasksCount >= 3) {
      status = 'OVERLOADED';
    } else if (estimatedHours <= 3 && openTasksCount <= 2) {
      status = 'UNDERUTILIZED';
    }

    return {
      employeeId: employee.id,
      employeeName: `${employee.firstName} ${employee.lastName}`,
      role: employee.role,
      openTasksCount,
      urgentTasksCount,
      overdueTasksCount,
      blockedTasksCount,
      estimatedHours,
      status,
    };
  }

  /**
   * Computes workload summaries across all team employees.
   */
  public static computeAllWorkloads(
    employees: TeamEmployee[],
    tasks: TeamTask[],
    now: Date = new Date()
  ): WorkloadSummary[] {
    return employees.map((emp) => this.computeEmployeeWorkload(emp, tasks, now));
  }
}
