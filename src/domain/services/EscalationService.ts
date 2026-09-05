/**
 * WILLShop OS — Escalation Service
 * Pure Domain Service — Evaluates task deadlines and triggers multi-level escalations (Reminder -> Manager -> CEO).
 */

import { TeamTask, EscalationRecord } from '../entities/TeamEntities';

export class EscalationService {
  /**
   * Evaluates if a task should be escalated based on overdue duration.
   * Thresholds:
   * Level 1 (Reminder): > 24 hours overdue
   * Level 2 (Manager):  > 48 hours overdue
   * Level 3 (CEO):      > 72 hours overdue
   */
  public static evaluateTaskEscalation(
    task: TeamTask,
    existingEscalations: EscalationRecord[],
    now: Date = new Date()
  ): { shouldEscalate: boolean; nextLevel: number; reason: string } | null {
    if (!task.dueAt || task.status === 'DONE' || task.status === 'CANCELLED' || task.status === 'ARCHIVED') {
      return null;
    }

    const dueTime = new Date(task.dueAt).getTime();
    const nowTime = now.getTime();

    if (nowTime <= dueTime) {
      return null; // Not overdue
    }

    const overdueHours = (nowTime - dueTime) / (1000 * 60 * 60);

    // Find active escalations for this task
    const activeEscalations = existingEscalations.filter(
      (e) => e.taskId === task.id && e.status === 'ACTIVE'
    );
    const highestLevelTriggered = activeEscalations.reduce((max, e) => Math.max(max, e.escalationLevel), 0);

    let targetLevel = 0;
    let reason = '';

    if (overdueHours >= 72) {
      targetLevel = 3;
      reason = `Tâche '${task.title}' en retard de ${Math.round(overdueHours)}h (seuil 72h dépassé) -> Escalade CEO.`;
    } else if (overdueHours >= 48) {
      targetLevel = 2;
      reason = `Tâche '${task.title}' en retard de ${Math.round(overdueHours)}h (seuil 48h dépassé) -> Escalade Manager.`;
    } else if (overdueHours >= 24) {
      targetLevel = 1;
      reason = `Tâche '${task.title}' en retard de ${Math.round(overdueHours)}h (seuil 24h dépassé) -> Rappel automatique.`;
    }

    if (targetLevel > highestLevelTriggered) {
      return {
        shouldEscalate: true,
        nextLevel: targetLevel,
        reason,
      };
    }

    return null;
  }
}
