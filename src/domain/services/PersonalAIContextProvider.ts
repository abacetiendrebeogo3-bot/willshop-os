/**
 * WILLShop OS — Personal AI Context Provider
 * Pure Domain Service — Filters and structures personal context (`scope = personal` ONLY) for Wilty Personal AI.
 * ENFORCES ABSOLUTE SEPARATION: Rejects business context contamination.
 */

import {
  PersonalProfile,
  PersonalGoal,
  PersonalTask,
  PersonalProject,
  PersonalFinancialAccount,
  PersonalHabit,
  PersonalLearningItem,
  PersonalDecision,
} from '../entities/PersonalEntities';

export interface WiltyPersonalAIContext {
  userId: string;
  scope: 'personal';
  profile: PersonalProfile;
  activeGoals: PersonalGoal[];
  urgentTasks: PersonalTask[];
  activeProjects: PersonalProject[];
  habitStreaks: PersonalHabit[];
  learningProgress: PersonalLearningItem[];
  financialSummary: {
    totalCashAvailable: number;
    monthlyExpenses: number;
    currency: string;
  };
  recentDecisions: PersonalDecision[];
}

export class PersonalAIContextProvider {
  public static buildPersonalContext(
    profile: PersonalProfile,
    goals: PersonalGoal[],
    tasks: PersonalTask[],
    projects: PersonalProject[],
    habits: PersonalHabit[],
    learning: PersonalLearningItem[],
    accounts: PersonalFinancialAccount[],
    decisions: PersonalDecision[]
  ): WiltyPersonalAIContext {
    // Verify scope boundary
    const personalGoals = goals.filter((g) => g.scope === 'personal');
    const personalTasks = tasks.filter((t) => t.scope === 'personal');
    const personalProjects = projects.filter((p) => p.scope === 'personal');
    const personalHabits = habits.filter((h) => h.scope === 'personal');
    const personalLearning = learning.filter((l) => l.scope === 'personal');
    const personalAccounts = accounts.filter((a) => a.scope === 'personal');
    const personalDecisions = decisions.filter((d) => d.scope === 'personal');

    const totalCashAvailable = personalAccounts.reduce((acc, a) => acc + a.currentBalance, 0);

    return {
      userId: profile.userId,
      scope: 'personal',
      profile,
      activeGoals: personalGoals.filter((g) => g.status === 'ACTIVE'),
      urgentTasks: personalTasks.filter((t) => t.priority === 'HIGH' || t.priority === 'CRITICAL'),
      activeProjects: personalProjects.filter((p) => p.status === 'ACTIVE'),
      habitStreaks: personalHabits.filter((h) => h.status === 'ACTIVE'),
      learningProgress: personalLearning.filter((l) => l.status === 'IN_PROGRESS'),
      financialSummary: {
        totalCashAvailable: Math.round(totalCashAvailable * 100) / 100,
        monthlyExpenses: 0, // Computed from ledger
        currency: 'FCFA',
      },
      recentDecisions: personalDecisions.slice(-5),
    };
  }

  /**
   * Security Assertion: Rejects any attempt to pass business data into Wilty Personal AI context.
   */
  public static assertPersonalScopeOnly(entities: { scope?: string }[]): void {
    const invalid = entities.filter((e) => e.scope && e.scope !== 'personal');
    if (invalid.length > 0) {
      throw new Error('SECURITY VIOLATION: Tentative de contamination du contexte Wilty Personal AI par des données non personnelles (scope != personal).');
    }
  }
}
