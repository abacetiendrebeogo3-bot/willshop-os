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
