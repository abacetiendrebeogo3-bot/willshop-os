/**
 * WILLShop OS — Wilty Weekly Review Service
 * Pure Domain Service — Generates weekly review summaries with STOP / START / CONTINUE analysis for Willy Tiendré.
 */

import {
  PersonalGoal,
  PersonalTask,
  PersonalHabit,
  PersonalProject,
} from '../entities/PersonalEntities';

export interface WiltyWeeklyReview {
  userId: string;
  weekLabel: string;
  tasksCompletedCount: number;
  habitsConsistencyPercent: number;
  stopRecommendations: string[];
  startRecommendations: string[];
  continueRecommendations: string[];
  top3NextWeekPriorities: string[];
}

export class WiltyWeeklyReviewService {
  public static generateWeeklyReview(
    userId: string,
    goals: PersonalGoal[],
    tasks: PersonalTask[],
    projects: PersonalProject[],
    habits: PersonalHabit[],
    weekLabel: string = 'Semaine en cours'
  ): WiltyWeeklyReview {
    const completedTasks = tasks.filter((t) => t.status === 'DONE');
    const totalHabitAdherence = habits.length > 0
      ? Math.round(habits.reduce((acc, h) => acc + h.adherencePercent, 0) / habits.length)
      : 100;

    const stopRecs: string[] = [];
    const startRecs: string[] = [];
    const continueRecs: string[] = [];

    // Evaluate habits low adherence
    habits.forEach((h) => {
      if (h.adherencePercent < 40 && h.status === 'ACTIVE') {
        stopRecs.push(`Revoir ou réduire la fréquence de l'habitude '${h.name}' (Adhérence ${h.adherencePercent}%).`);
      } else if (h.adherencePercent >= 80 && h.status === 'ACTIVE') {
        continueRecs.push(`Maintenir l'habitude '${h.name}' (Streak: ${h.streakCount} jours).`);
      }
    });

    // Evaluate blocked projects
    projects.forEach((p) => {
      if (p.status === 'BLOCKED') {
        startRecs.push(`Débloquer le projet '${p.title}' ou réassigner les tâches bloquantes.`);
      }
    });

    if (stopRecs.length === 0) stopRecs.push('Aucune routine obsolète à interrompre cette semaine.');
    if (startRecs.length === 0) startRecs.push('Lancer une session d\'apprentissage sur la compétence cible.');
    if (continueRecs.length === 0) continueRecs.push('Poursuivre la progression régulière sur vos projets actifs.');

    const top3NextWeekPriorities = [
      'Finaliser les tâches personnelles critiques',
      'Consolider le suivi du budget personnel mensuel',
      'Conserver un rythme élevé sur les habitudes actives',
    ];

    return {
      userId,
      weekLabel,
      tasksCompletedCount: completedTasks.length,
      habitsConsistencyPercent: totalHabitAdherence,
      stopRecommendations: stopRecs,
      startRecommendations: startRecs,
      continueRecommendations: continueRecs,
      top3NextWeekPriorities,
    };
  }
}
