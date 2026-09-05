/**
 * WILLShop OS — Strategic Alignment Engine
 * Pure Domain Service — Analyzes execution tasks/initiatives for alignment with strategic goals.
 */

import { Initiative, StrategicGoal } from '../entities/StrategyEntities';
import { TeamTask } from '../entities/TeamEntities';

export interface StrategicAlignmentReport {
  totalInitiatives: number;
  alignedInitiativesCount: number;
  unalignedInitiatives: Initiative[];
  totalTasks: number;
  alignedTasksCount: number;
  unalignedTasks: TeamTask[];
  alignmentRatio: number; // 0 - 100%
  insightSummary: string;
}

export class StrategicAlignmentEngine {
  public static analyzeAlignment(
    initiatives: Initiative[],
    goals: StrategicGoal[],
    tasks: TeamTask[]
  ): StrategicAlignmentReport {
    const goalIds = new Set(goals.map((g) => g.id));
    const objectiveIds = new Set(goals.map((g) => g.objectiveId).filter(Boolean));

    const alignedInitiatives = initiatives.filter(
      (i) => (i.goalId && goalIds.has(i.goalId)) || (i.objectiveId && objectiveIds.has(i.objectiveId))
    );
    const unalignedInitiatives = initiatives.filter(
      (i) => (!i.goalId || !goalIds.has(i.goalId)) && (!i.objectiveId || !objectiveIds.has(i.objectiveId))
    );

    const alignedTasks = tasks.filter(
      (t) =>
        t.source === 'GOAL' ||
        t.relatedEntityType === 'goal' ||
        initiatives.some((i) => i.id === t.relatedEntityId)
    );

    const unalignedTasks = tasks.filter(
      (t) =>
        t.source !== 'GOAL' &&
        t.relatedEntityType !== 'goal' &&
        !initiatives.some((i) => i.id === t.relatedEntityId)
    );

    const totalExecutionUnits = initiatives.length + tasks.length;
    const alignedUnits = alignedInitiatives.length + alignedTasks.length;

    const alignmentRatio = totalExecutionUnits > 0 ? Math.round((alignedUnits / totalExecutionUnits) * 100) : 100;

    let insightSummary = `Alignement stratégique optimal (${alignmentRatio}%).`;
    if (alignmentRatio < 70) {
      insightSummary = `Avertissement d'alignement: ${unalignedInitiatives.length} initiative(s) et ${unalignedTasks.length} tâche(s) ne contribuent directement à aucun objectif stratégique.`;
    }

    return {
      totalInitiatives: initiatives.length,
      alignedInitiativesCount: alignedInitiatives.length,
      unalignedInitiatives,
      totalTasks: tasks.length,
      alignedTasksCount: alignedTasks.length,
      unalignedTasks,
      alignmentRatio,
      insightSummary,
    };
  }
}
