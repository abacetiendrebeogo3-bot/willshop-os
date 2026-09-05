/**
 * WILLShop OS — Task Assignment Service
 * Pure Domain Service — Handles manual and automated task assignment based on role, skills, availability, and workload.
 */

import { TeamEmployee, TeamTask, WorkloadSummary, EmployeeRole } from '../entities/TeamEntities';

export class TaskAssignmentService {
  /**
   * Recommends the best employee to assign a task to, based on matching role, skills, availability, and lowest workload score.
   */
  public static recommendAssignee(
    taskPriority: string,
    requiredRole: EmployeeRole,
    requiredSkill: string | undefined,
    eligibleEmployees: TeamEmployee[],
    workloadSummaries: WorkloadSummary[]
  ): TeamEmployee | null {
    // Filter active & non-suspended employees matching the role
    const candidates = eligibleEmployees.filter(
      (e) =>
        e.employmentStatus === 'ACTIVE' &&
        e.role === requiredRole &&
        (requiredSkill ? e.skills.includes(requiredSkill) : true)
    );

    if (candidates.length === 0) {
      // Fallback: any active employee matching role regardless of specific skill
      const fallback = eligibleEmployees.filter(
        (e) => e.employmentStatus === 'ACTIVE' && e.role === requiredRole
      );
      if (fallback.length === 0) return null;
      return fallback[0];
    }

    // Sort candidates by workload summary (least estimated hours & open tasks first)
    candidates.sort((a, b) => {
      const summaryA = workloadSummaries.find((w) => w.employeeId === a.id);
      const summaryB = workloadSummaries.find((w) => w.employeeId === b.id);

      const hoursA = summaryA ? summaryA.estimatedHours : 0;
      const hoursB = summaryB ? summaryB.estimatedHours : 0;

      return hoursA - hoursB;
    });

    return candidates[0];
  }
}
