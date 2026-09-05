/**
 * WILLShop OS — Process Bottleneck Engine
 * Pure Domain Service — Identifies process bottlenecks across domain sources (ORDER, DELIVERY, STOCK, PAYMENT, MARKETING).
 */

import { TeamTask, TaskSource } from '../entities/TeamEntities';

export interface BottleneckAnalysis {
  source: TaskSource;
  totalTasks: number;
  delayedTasksCount: number;
  blockedTasksCount: number;
  averageDelayHours: number;
  bottleneckSeverity: 'HIGH' | 'MEDIUM' | 'LOW';
  insightSummary: string;
}

export class ProcessBottleneckEngine {
  public static analyzeBottlenecks(
    tasks: TeamTask[],
    now: Date = new Date()
  ): BottleneckAnalysis[] {
    const sources: TaskSource[] = ['ORDER', 'DELIVERY', 'STOCK', 'FINANCE', 'MARKETING', 'CUSTOMER'];
    const results: BottleneckAnalysis[] = [];

    for (const src of sources) {
      const srcTasks = tasks.filter((t) => t.source === src);
      if (srcTasks.length === 0) continue;

      const blockedCount = srcTasks.filter((t) => t.status === 'BLOCKED').length;
      const delayedTasks = srcTasks.filter(
        (t) => t.dueAt && new Date(t.dueAt).getTime() < now.getTime()
      );

      let totalDelayHours = 0;
      delayedTasks.forEach((t) => {
        if (t.dueAt) {
          totalDelayHours += (now.getTime() - new Date(t.dueAt).getTime()) / (1000 * 60 * 60);
        }
      });

      const averageDelayHours = delayedTasks.length > 0 ? Math.round(totalDelayHours / delayedTasks.length) : 0;
      const delayedRatio = delayedTasks.length / srcTasks.length;

      let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      if (delayedRatio > 0.3 || blockedCount >= 3 || averageDelayHours > 48) {
        severity = 'HIGH';
      } else if (delayedRatio > 0.15 || blockedCount >= 1 || averageDelayHours > 24) {
        severity = 'MEDIUM';
      }

      let insightSummary = `Processus ${src}: ${delayedTasks.length}/${srcTasks.length} tâches en retard.`;
      if (severity === 'HIGH') {
        insightSummary = `Goulet d'étranglement majeur détecté dans le processus ${src}: ${delayedTasks.length} retards, ${blockedCount} blocages. Retard moyen: ${averageDelayHours}h.`;
      }

      results.push({
        source: src,
        totalTasks: srcTasks.length,
        delayedTasksCount: delayedTasks.length,
        blockedTasksCount: blockedCount,
        averageDelayHours,
        bottleneckSeverity: severity,
        insightSummary,
      });
    }

    return results.sort((a, b) => (b.bottleneckSeverity === 'HIGH' ? 1 : -1));
  }
}
