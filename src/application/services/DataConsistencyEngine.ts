/**
 * WILLShop OS — Data Consistency Engine
 * Build 14 System Integration & Consolidation.
 * 
 * Audits cross-domain data integrity, detecting discrepancies between SSOT tables,
 * financial ledgers, stock balances, marketing attributions, strategy KPIs, and personal wealth.
 */

export type InconsistencySeverity = 'CRITICAL' | 'WARNING' | 'INFO';

export interface DataInconsistency {
  id: string;
  category: 'ORDER_PAYMENT' | 'STOCK_BALANCE' | 'FINANCE_PAYMENT' | 'MARKETING_FINANCE' | 'BI_SOURCE' | 'GOAL_KPI' | 'PERSONAL_NET_WORTH';
  severity: InconsistencySeverity;
  sourceDomain: string;
  targetDomain: string;
  expectedValue: number | string;
  actualValue: number | string;
  message: string;
  detectedAt: string;
  resolved: boolean;
}

export interface ConsistencyAuditReport {
  timestamp: string;
  organizationId: string;
  totalChecksExecuted: number;
  inconsistenciesFound: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  isConsistent: boolean;
  inconsistencies: DataInconsistency[];
}

export interface SystemDataSnapshot {
  orders: Array<{ id: string; totalAmount: number; status: string }>;
  payments: Array<{ id: string; orderId?: string; amount: number; status: string }>;
  stockItems: Array<{ id: string; name: string; quantityAvailable: number; reservedQuantity: number }>;
  financialTransactions: Array<{ id: string; paymentId?: string; amount: number; type: string }>;
  marketingSpends: Array<{ campaignId: string; amount: number }>;
  financialMarketingExpenses: number;
  biRevenueTotal: number;
  sourceOrdersRevenueTotal: number;
  goals: Array<{ id: string; title: string; currentValue: number; linkedKpiValue: number }>;
  personalData?: {
    reportedNetWorth: number;
    totalAssets: number;
    totalLiabilities: number;
  };
}

export class DataConsistencyEngine {
  /**
   * Executes a full cross-domain data consistency audit on a system snapshot.
   */
  public auditSystemData(orgId: string, snapshot: SystemDataSnapshot): ConsistencyAuditReport {
    const inconsistencies: DataInconsistency[] = [];
    let checksCount = 0;

    // 1. Check Orders vs Payments Consistency
    checksCount++;
    const paidOrdersMap = new Map<string, number>();
    for (const p of snapshot.payments) {
      if (p.orderId && (p.status === 'COMPLETED' || p.status === 'VERIFIED')) {
        paidOrdersMap.set(p.orderId, (paidOrdersMap.get(p.orderId) || 0) + p.amount);
      }
    }

    for (const order of snapshot.orders) {
      if (order.status === 'DELIVERED' || order.status === 'CONFIRMED') {
        const paidAmount = paidOrdersMap.get(order.id) || 0;
        if (Math.abs(order.totalAmount - paidAmount) > 0.01) {
          inconsistencies.push({
            id: `inc_ord_${order.id}_${Date.now()}`,
            category: 'ORDER_PAYMENT',
            severity: 'CRITICAL',
            sourceDomain: 'Orders Engine',
            targetDomain: 'Finance Engine',
            expectedValue: order.totalAmount,
            actualValue: paidAmount,
            message: `Order ${order.id} total (${order.totalAmount}) does not match verified payments (${paidAmount}).`,
            detectedAt: new Date().toISOString(),
            resolved: false,
          });
        }
      }
    }

    // 2. Check Stock Balances & Negative Quantities
    checksCount++;
    for (const stock of snapshot.stockItems) {
      if (stock.quantityAvailable < 0 || stock.reservedQuantity < 0) {
        inconsistencies.push({
          id: `inc_stk_${stock.id}_${Date.now()}`,
          category: 'STOCK_BALANCE',
          severity: 'CRITICAL',
          sourceDomain: 'Stock Engine',
          targetDomain: 'Inventory SSOT',
          expectedValue: '>= 0',
          actualValue: `avail: ${stock.quantityAvailable}, res: ${stock.reservedQuantity}`,
          message: `Stock item ${stock.name} (${stock.id}) has negative balance or reserved quantity.`,
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    // 3. Check Financial Ledger Transactions vs Payments
    checksCount++;
    const paymentTxMap = new Set<string>();
    for (const tx of snapshot.financialTransactions) {
      if (tx.paymentId) paymentTxMap.add(tx.paymentId);
    }
    for (const payment of snapshot.payments) {
      if ((payment.status === 'COMPLETED' || payment.status === 'VERIFIED') && !paymentTxMap.has(payment.id)) {
        inconsistencies.push({
          id: `inc_pay_tx_${payment.id}_${Date.now()}`,
          category: 'FINANCE_PAYMENT',
          severity: 'CRITICAL',
          sourceDomain: 'Finance Payments',
          targetDomain: 'Finance Ledger',
          expectedValue: `Transaction entry for payment ${payment.id}`,
          actualValue: 'Missing ledger transaction',
          message: `Verified payment ${payment.id} has no corresponding double-entry financial transaction.`,
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    // 4. Check Marketing Spend vs Finance Marketing Expenses
    checksCount++;
    const totalMarketingSpend = snapshot.marketingSpends.reduce((acc, m) => acc + m.amount, 0);
    if (Math.abs(totalMarketingSpend - snapshot.financialMarketingExpenses) > 0.01) {
      inconsistencies.push({
        id: `inc_mkt_fin_${Date.now()}`,
        category: 'MARKETING_FINANCE',
        severity: 'WARNING',
        sourceDomain: 'Marketing Engine',
        targetDomain: 'Finance Engine',
        expectedValue: totalMarketingSpend,
        actualValue: snapshot.financialMarketingExpenses,
        message: `Marketing total spend (${totalMarketingSpend}) does not reconcile with Financial marketing expenses (${snapshot.financialMarketingExpenses}).`,
        detectedAt: new Date().toISOString(),
        resolved: false,
      });
    }

    // 5. Check BI Revenue vs SSOT Source Orders Revenue
    checksCount++;
    if (Math.abs(snapshot.biRevenueTotal - snapshot.sourceOrdersRevenueTotal) > 0.01) {
      inconsistencies.push({
        id: `inc_bi_src_${Date.now()}`,
        category: 'BI_SOURCE',
        severity: 'CRITICAL',
        sourceDomain: 'BI Engine',
        targetDomain: 'Orders SSOT',
        expectedValue: snapshot.sourceOrdersRevenueTotal,
        actualValue: snapshot.biRevenueTotal,
        message: `BI revenue metric (${snapshot.biRevenueTotal}) deviates from SSOT orders total (${snapshot.sourceOrdersRevenueTotal}).`,
        detectedAt: new Date().toISOString(),
        resolved: false,
      });
    }

    // 6. Check Strategy Goals vs Linked KPI Values
    checksCount++;
    for (const goal of snapshot.goals) {
      if (Math.abs(goal.currentValue - goal.linkedKpiValue) > 0.01) {
        inconsistencies.push({
          id: `inc_goal_${goal.id}_${Date.now()}`,
          category: 'GOAL_KPI',
          severity: 'WARNING',
          sourceDomain: 'Strategy Engine',
          targetDomain: 'BI Engine KPIs',
          expectedValue: goal.linkedKpiValue,
          actualValue: goal.currentValue,
          message: `Strategic Goal '${goal.title}' value (${goal.currentValue}) does not match source KPI (${goal.linkedKpiValue}).`,
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    // 7. Check Personal Net Worth Consistency (Scope Personal)
    if (snapshot.personalData) {
      checksCount++;
      const expectedNetWorth = snapshot.personalData.totalAssets - snapshot.personalData.totalLiabilities;
      if (Math.abs(snapshot.personalData.reportedNetWorth - expectedNetWorth) > 0.01) {
        inconsistencies.push({
          id: `inc_pers_nw_${Date.now()}`,
          category: 'PERSONAL_NET_WORTH',
          severity: 'CRITICAL',
          sourceDomain: 'Wilty Personal OS',
          targetDomain: 'Personal Assets & Liabilities',
          expectedValue: expectedNetWorth,
          actualValue: snapshot.personalData.reportedNetWorth,
          message: `Personal reported net worth (${snapshot.personalData.reportedNetWorth}) does not equal assets minus liabilities (${expectedNetWorth}).`,
          detectedAt: new Date().toISOString(),
          resolved: false,
        });
      }
    }

    const criticalCount = inconsistencies.filter((i) => i.severity === 'CRITICAL').length;
    const warningCount = inconsistencies.filter((i) => i.severity === 'WARNING').length;
    const infoCount = inconsistencies.filter((i) => i.severity === 'INFO').length;

    return {
      timestamp: new Date().toISOString(),
      organizationId: orgId,
      totalChecksExecuted: checksCount,
      inconsistenciesFound: inconsistencies.length,
      criticalCount,
      warningCount,
      infoCount,
      isConsistent: inconsistencies.length === 0,
      inconsistencies,
    };
  }
}
