/**
 * WILLShop OS — CEO AI Tool Registry
 * Schema-validated registry of tools available to the CEO AI Engine.
 * Pure Domain Service.
 */

export interface AIToolDefinition {
  name: string;
  description: string;
  parametersSchema: Record<string, unknown>;
  permissionLevel: 'GREEN' | 'YELLOW' | 'RED';
  requiredRole: 'OWNER' | 'MANAGER' | 'COMMERCIAL' | 'VIEWER';
}

export class AIToolRegistry {
  private static tools: Map<string, AIToolDefinition> = new Map();

  static {
    AIToolRegistry.register({
      name: 'get_business_snapshot',
      description: 'Obtenir la vue synthétique instantanée de la santé globale de WillShop OS',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_sales_kpis',
      description: 'Obtenir les indicateurs clés de performance des ventes et revenus',
      parametersSchema: { type: 'object', properties: { period: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_financial_snapshot',
      description: 'Obtenir la situation exacte de la trésorerie et de la rentabilité',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'get_stock_risks',
      description: 'Lister les produits en stock bas ou en rupture critique',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'create_recommendation',
      description: 'Générer une recommandation managériale basée sur des preuves',
      parametersSchema: { type: 'object', properties: { title: { type: 'string' }, recommendation: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'create_approval_request',
      description: 'Soumettre une action sensible (YELLOW/RED) au centre d\'approbation',
      parametersSchema: { type: 'object', properties: { actionType: { type: 'string' }, payload: { type: 'object' } } },
      permissionLevel: 'YELLOW',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'request_automation',
      description: 'Déclencher un workflow d\'automatisation déterministe autorisé',
      parametersSchema: { type: 'object', properties: { ruleId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    // --- BUILD 11: TEAM & PRODUCTIVITY TOOLS ---
    AIToolRegistry.register({
      name: 'get_team_snapshot',
      description: 'Obtenir la vue synthétique de l\'équipe, membres actifs, tâches ouvertes, en retard et bloquées',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_employee_workload',
      description: 'Obtenir la charge de travail et le statut de surcharge/sous-charge par employé',
      parametersSchema: { type: 'object', properties: { employeeId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'get_overdue_tasks',
      description: 'Lister les tâches en retard nécessitant une attention ou une réassignation',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_blocked_tasks',
      description: 'Lister les tâches bloquées avec les raisons du blocage',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_goal_progress',
      description: 'Obtenir l\'avancement des objectifs d\'entreprise, d\'équipe et individuels',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_employee_scorecard',
      description: 'Obtenir la fiche de performance contextualisée d\'un employé',
      parametersSchema: { type: 'object', properties: { employeeId: { type: 'string' }, period: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'get_team_performance',
      description: 'Obtenir l\'évaluation de performance globale de l\'équipe',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });

    AIToolRegistry.register({
      name: 'get_work_plan',
      description: 'Obtenir le plan de travail quotidien priorisé d\'un membre de l\'équipe',
      parametersSchema: { type: 'object', properties: { employeeId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    // --- BUILD 12: STRATEGY & GOALS TOOLS ---
    AIToolRegistry.register({
      name: 'get_strategy_snapshot',
      description: 'Obtenir la synthèse de la santé stratégique globale, vision et priorités',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_strategic_objectives',
      description: 'Lister les orientations et objectifs stratégiques principaux',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_goal_progress',
      description: 'Obtenir la progression exacte d\'un objectif relié aux KPI réels',
      parametersSchema: { type: 'object', properties: { goalId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_goal_forecast',
      description: 'Obtenir la projection de trajectoire et le risque d\'échec d\'un objectif',
      parametersSchema: { type: 'object', properties: { goalId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_key_results',
      description: 'Lister les résultats clés (Key Results) sous un objectif',
      parametersSchema: { type: 'object', properties: { goalId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_initiatives',
      description: 'Lister les initiatives stratégiques actives, planifiées ou bloquées',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_initiative_score',
      description: 'Obtenir le score de priorisation d\'une initiative (Impact vs Effort vs Risque)',
      parametersSchema: { type: 'object', properties: { initiativeId: { type: 'string' } } },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_strategy_risks',
      description: 'Lister les risques stratégiques évalués (Probabilité x Impact)',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_strategy_dependencies',
      description: 'Analyser les dépendances d\'exécutions stratégiques',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_90_day_plan',
      description: 'Obtenir la vue synthétique du plan stratégique à 90 jours (3-5 priorités)',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_strategy_roadmap',
      description: 'Obtenir la feuille de route stratégique et le chronogramme d\'exécution',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'VIEWER',
    });

    AIToolRegistry.register({
      name: 'get_strategic_decisions',
      description: 'Consulter l\'historique des décisions stratégiques et leurs réévaluations prévues',
      parametersSchema: { type: 'object', properties: {} },
      permissionLevel: 'GREEN',
      requiredRole: 'MANAGER',
    });
  }

  public static register(tool: AIToolDefinition): void {
    AIToolRegistry.tools.set(tool.name, tool);
  }

  public static getTool(name: string): AIToolDefinition | null {
    return AIToolRegistry.tools.get(name) || null;
  }

  public static listTools(): AIToolDefinition[] {
    return Array.from(AIToolRegistry.tools.values());
  }
}
