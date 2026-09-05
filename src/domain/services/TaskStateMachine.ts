/**
 * WILLShop OS — Task State Machine
 * Pure Domain Service — Governs valid task transitions, blocker rules, and dependency enforcement.
 */

import { TaskStatus, TeamTask, TaskDependency } from '../entities/TeamEntities';

export class TaskStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
    BACKLOG: ['TODO', 'CANCELLED', 'ARCHIVED'],
    TODO: ['IN_PROGRESS', 'BLOCKED', 'CANCELLED', 'ARCHIVED'],
    IN_PROGRESS: ['BLOCKED', 'DONE', 'CANCELLED'],
    BLOCKED: ['IN_PROGRESS', 'DONE', 'CANCELLED'],
    DONE: ['ARCHIVED', 'IN_PROGRESS'],
    CANCELLED: ['TODO', 'ARCHIVED'],
    ARCHIVED: [],
  };

  /**
   * Validates if a status transition is permitted.
   */
  public static canTransition(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    if (currentStatus === newStatus) return true;
    const allowed = this.ALLOWED_TRANSITIONS[currentStatus] || [];
    return allowed.includes(newStatus);
  }

  /**
   * Asserts transition validity, throwing an Error if illegal.
   */
  public static assertTransition(
    task: TeamTask,
    newStatus: TaskStatus,
    dependencies: TaskDependency[] = [],
    dependentTasks: TeamTask[] = []
  ): void {
    if (!this.canTransition(task.status, newStatus)) {
      throw new Error(
        `Transition de statut invalide pour la tâche '${task.id}': ${task.status} -> ${newStatus}`
      );
    }

    // Check dependency enforcement if transitioning to DONE or IN_PROGRESS
    if (newStatus === 'DONE' || newStatus === 'IN_PROGRESS') {
      const taskDeps = dependencies.filter((d) => d.taskId === task.id);
      const uncompletedDepIds = taskDeps.filter((dep) => {
        const parentTask = dependentTasks.find((t) => t.id === dep.dependsOnTaskId);
        return parentTask && parentTask.status !== 'DONE';
      });

      if (uncompletedDepIds.length > 0) {
        throw new Error(
          `Impossible de passer la tâche '${task.title}' en ${newStatus}: des tâches dépendantes ne sont pas terminées.`
        );
      }
    }
  }
}
