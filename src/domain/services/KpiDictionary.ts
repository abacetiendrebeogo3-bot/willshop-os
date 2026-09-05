/**
 * WILLShop OS — KPI Dictionary & Standard Definitions
 * Pure Domain Layer — Centralized Single Source of Truth for KPI Definitions.
 */

import { KpiDefinition } from '../entities/BIEntities';

export class KpiDictionary {
  private static readonly DEFINITIONS: Record<string, KpiDefinition> = {
    revenue: {
      key: 'revenue',
      name: 'Chiffre d\'Affaires (Revenue)',
      description: 'Somme des montants totaux des commandes livrées/complétées sur la période.',
      formula: 'SUM(orders.total) WHERE status IN (\'DELIVERED\', \'COMPLETED\')',
      sourceModule: 'ORDERS',
      unit: 'FCFA',
      freshness: 'REALTIME',
      version: '1.0',
    },
    orders_count: {
      key: 'orders_count',
      name: 'Nombre de Commandes Total',
      description: 'Nombre total de commandes créées sur la période.',
      formula: 'COUNT(orders.id)',
      sourceModule: 'ORDERS',
      unit: 'COUNT',
      freshness: 'REALTIME',
      version: '1.0',
    },
    aov: {
      key: 'aov',
      name: 'Panier Moyen (Average Order Value)',
      description: 'Valeur moyenne d\'une commande complétée.',
      formula: 'Revenue / COUNT(completed_orders)',
      sourceModule: 'ORDERS',
      unit: 'FCFA',
      freshness: 'REALTIME',
      version: '1.0',
    },
    cogs: {
      key: 'cogs',
      name: 'Coût des Marchandises Vendues (COGS)',
      description: 'Coût d\'achat des produits contenus dans les commandes livrées.',
      formula: 'SUM(order_items.quantity * products.purchase_price)',
      sourceModule: 'STOCK',
      unit: 'FCFA',
      freshness: 'REALTIME',
      version: '1.0',
    },
    gross_profit: {
      key: 'gross_profit',
      name: 'Marge Brute (Gross Profit)',
      description: 'Bénéfice brut réalisé sur les ventes de produits.',
      formula: 'Revenue - COGS',
      sourceModule: 'FINANCE',
      unit: 'FCFA',
      freshness: 'REALTIME',
      version: '1.0',
    },
    delivery_success_rate: {
      key: 'delivery_success_rate',
      name: 'Taux de Réussite de Livraison',
      description: 'Pourcentage de livraisons ayant abouti à un statut DELIVERED / CLOSED.',
      formula: '(COUNT(delivered) / COUNT(total_deliveries)) * 100',
      sourceModule: 'DELIVERY',
      unit: 'PERCENTAGE',
      freshness: 'REALTIME',
      version: '1.0',
    },
    cash_balance: {
      key: 'cash_balance',
      name: 'Trésorerie Totale Disponible',
      description: 'Somme des soldes réels de tous les comptes financiers actifs de WillShop.',
      formula: 'SUM(financial_accounts.current_balance)',
      sourceModule: 'FINANCE',
      unit: 'FCFA',
      freshness: 'REALTIME',
      version: '1.0',
    },
  };

  static getDefinition(key: string): KpiDefinition | null {
    return this.DEFINITIONS[key] || null;
  }

  static getAllDefinitions(): KpiDefinition[] {
    return Object.values(this.DEFINITIONS);
  }
}
