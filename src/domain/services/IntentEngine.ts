/**
 * WILLShop OS — CEO AI Intent Engine
 * Classifies user intent from natural language prompts.
 * Pure Domain Service.
 */

import { CEOIntent } from '../entities/CEOAIEntities';

export class IntentEngine {
  /**
   * Classifies a prompt string into a deterministic CEOIntent.
   */
  public static classifyIntent(prompt: string): CEOIntent {
    const text = prompt.toLowerCase().trim();

    if (text.includes('recommande') || text.includes('conseil') || text.includes('que dois-je faire') || text.includes('que ferais-tu')) {
      return 'RECOMMEND_ACTION';
    }
    if (text.includes('plan') || text.includes('étape') || text.includes('objectif')) {
      return 'GENERATE_PLAN';
    }
    if (text.includes('briefing') || text.includes('bonjour') || text.includes('comment va') || text.includes('résumé')) {
      return 'DAILY_BRIEFING';
    }
    if (text.includes('cash') || text.includes('argent') || text.includes('trésorerie') || text.includes('finance') || text.includes('dépense')) {
      return 'ANALYZE_FINANCE';
    }
    if (text.includes('vente') || text.includes('chiffre d\'affaires') || text.includes('commande')) {
      return 'ANALYZE_SALES';
    }
    if (text.includes('stock') || text.includes('produit') || text.includes('rupture') || text.includes('réapprovisionner')) {
      return 'ANALYZE_STOCK';
    }
    if (text.includes('livraison') || text.includes('livreur') || text.includes('échec') || text.includes('retard')) {
      return 'ANALYZE_DELIVERY';
    }
    if (text.includes('client') || text.includes('fidélité') || text.includes('relancer')) {
      return 'ANALYZE_CUSTOMERS';
    }
    if (text.includes('risq') || text.includes('anomalie') || text.includes('danger') || text.includes('attention')) {
      return 'DETECT_RISK';
    }
    if (text.includes('prévision') || text.includes('futur') || text.includes('prochain') || text.includes('forecast')) {
      return 'FORECAST';
    }
    if (text.includes('recommande') || text.includes('conseil') || text.includes('que dois-je faire')) {
      return 'RECOMMEND_ACTION';
    }
    if (text.includes('plan') || text.includes('étape') || text.includes('objectif')) {
      return 'GENERATE_PLAN';
    }

    return 'ANALYZE_BUSINESS';
  }
}
