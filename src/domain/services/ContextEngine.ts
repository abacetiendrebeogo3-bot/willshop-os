/**
 * WILLShop OS — CEO AI Scoped Context Engine
 * Builds minimal, scoped data snapshots for AI reasoning without sending full database tables.
 * Pure Domain Service.
 */

export interface BusinessSnapshot {
  organizationId: string;
  treasuryCash: number;
  revenueToday: number;
  revenue7Days: number;
  grossProfit7Days: number;
  grossMarginPercent: number;
  ordersTodayCount: number;
  pendingOrdersCount: number;
  failedDeliveriesCount: number;
  lowStockProductsCount: number;
  outOfStockProductsCount: number;
  supplierDebtsTotal: number;
  customerReceivablesTotal: number;
  activeGoalsCount: number;
  dataFreshness: string;
}

export class ContextEngine {
  /**
   * Constructs a minimal Business Snapshot from BI and Data Core summaries.
   */
  public static buildBusinessSnapshot(
    orgId: string,
    biData: {
      cashBalance?: number;
      revenueToday?: number;
      revenue7Days?: number;
      grossProfit7Days?: number;
      ordersCount7Days?: number;
      pendingOrdersCount?: number;
      failedDeliveriesCount?: number;
      lowStockProductsCount?: number;
      outOfStockProductsCount?: number;
      supplierDebtsTotal?: number;
      customerReceivablesTotal?: number;
    }
  ): BusinessSnapshot {
    const rev = biData.revenue7Days || 0;
    const profit = biData.grossProfit7Days || 0;
    const margin = rev > 0 ? Math.round((profit / rev) * 1000) / 10 : 0;

    return {
      organizationId: orgId,
      treasuryCash: biData.cashBalance || 0,
      revenueToday: biData.revenueToday || 0,
      revenue7Days: rev,
      grossProfit7Days: profit,
      grossMarginPercent: margin,
      ordersTodayCount: biData.ordersCount7Days || 0,
      pendingOrdersCount: biData.pendingOrdersCount || 0,
      failedDeliveriesCount: biData.failedDeliveriesCount || 0,
      lowStockProductsCount: biData.lowStockProductsCount || 0,
      outOfStockProductsCount: biData.outOfStockProductsCount || 0,
      supplierDebtsTotal: biData.supplierDebtsTotal || 0,
      customerReceivablesTotal: biData.customerReceivablesTotal || 0,
      activeGoalsCount: 3,
      dataFreshness: 'realtime',
    };
  }

  /**
   * Formats a BusinessSnapshot into a compact prompt string for the LLM.
   */
  public static formatSnapshotForPrompt(snapshot: BusinessSnapshot): string {
    return `
BUSINESS SNAPSHOT (Organization: ${snapshot.organizationId}):
- Trésorerie Banque/Caisse : ${snapshot.treasuryCash.toLocaleString()} XOF
- Revenu 7D : ${snapshot.revenue7Days.toLocaleString()} XOF
- Marge Brute 7D : ${snapshot.grossProfit7Days.toLocaleString()} XOF (${snapshot.grossMarginPercent}%)
- Commandes en attente : ${snapshot.pendingOrdersCount}
- Livraisons échouées : ${snapshot.failedDeliveriesCount}
- Produits en stock critique : ${snapshot.lowStockProductsCount} (Ruptures: ${snapshot.outOfStockProductsCount})
- Créances Clients : ${snapshot.customerReceivablesTotal.toLocaleString()} XOF
- Dettes Fournisseurs : ${snapshot.supplierDebtsTotal.toLocaleString()} XOF
- Fraîcheur des données : ${snapshot.dataFreshness}
`.trim();
  }
}
