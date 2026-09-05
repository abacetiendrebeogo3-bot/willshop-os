/**
 * WILLShop OS — Finance Domain Invariants & Rules
 * Pure Domain Layer — Strict business rules and financial math.
 */

import {
  FinancialTransactionEntity,
  FinancialCategory,
  TransactionDirection,
  FinanceSummaryMetrics,
} from '../entities/FinanceEntities';
import { ValidationError } from '../errors/AppErrors';

export class FinanceInvariants {
  /**
   * Asserts that a posted transaction is never modified in place.
   */
  static assertTransactionImmutability(existingTx: FinancialTransactionEntity, newAmount?: number, newCategory?: FinancialCategory): void {
    if (existingTx.status === 'POSTED') {
      if (newAmount !== undefined && newAmount !== existingTx.amount) {
        throw new ValidationError('Forbidden: Cannot modify amount of a POSTED financial transaction. Use a void or counter-entry.');
      }
      if (newCategory !== undefined && newCategory !== existingTx.category) {
        throw new ValidationError('Forbidden: Cannot modify category of a POSTED financial transaction.');
      }
    }
  }

  /**
   * Validates fund transfer parameters.
   */
  static validateTransfer(sourceAccountId: string, destinationAccountId: string, amount: number): void {
    if (!sourceAccountId || !destinationAccountId) {
      throw new ValidationError('Source and destination accounts are required for a fund transfer.');
    }
    if (sourceAccountId === destinationAccountId) {
      throw new ValidationError('Source and destination accounts must be different.');
    }
    if (amount <= 0) {
      throw new ValidationError('Transfer amount must be strictly greater than 0.');
    }
  }

  /**
   * Classifies direction based on category or type.
   */
  static getDirectionForCategory(category: FinancialCategory): TransactionDirection {
    switch (category) {
      case 'PRODUCT_SALE':
      case 'OTHER_REVENUE':
      case 'DELIVERY_FEE_COLLECTED':
      case 'OWNER_CONTRIBUTION':
      case 'LOAN_DISBURSEMENT':
        return 'INFLOW';
      case 'SUPPLIER_PURCHASE':
      case 'PRODUCT_COST':
      case 'PACKAGING':
      case 'COMMISSION':
      case 'MARKETING_ADS':
      case 'FACEBOOK_ADS':
      case 'INSTAGRAM_ADS':
      case 'TIKTOK_ADS':
      case 'TRANSPORT':
      case 'PHONE_INTERNET':
      case 'RENT':
      case 'UTILITIES':
      case 'SOFTWARE_SUBSCRIPTION':
      case 'OFFICE_SUPPLIES':
      case 'SALARY':
      case 'COMMISSION_BONUS':
      case 'OWNER_DRAW':
      case 'LOAN_REPAYMENT':
      case 'DELIVERY_COST':
      case 'BANK_FEES':
        return 'OUTFLOW';
      default:
        return 'INFLOW';
    }
  }

  /**
   * Checks if a category is an Operating Expense (OpEx).
   * Note: OWNER_DRAW is strictly EXCLUDED from OpEx.
   */
  static isOperatingExpense(category: FinancialCategory): boolean {
    const opexCategories: FinancialCategory[] = [
      'MARKETING_ADS',
      'FACEBOOK_ADS',
      'INSTAGRAM_ADS',
      'TIKTOK_ADS',
      'TRANSPORT',
      'PHONE_INTERNET',
      'RENT',
      'UTILITIES',
      'SOFTWARE_SUBSCRIPTION',
      'OFFICE_SUPPLIES',
      'SALARY',
      'COMMISSION_BONUS',
      'BANK_FEES',
    ];
    return opexCategories.includes(category);
  }

  /**
   * Calculates financial metrics from transactions.
   */
  static calculateMetrics(
    accountsBalances: number[],
    transactions: FinancialTransactionEntity[],
    debts: number,
    receivables: number
  ): FinanceSummaryMetrics {
    const totalCashBalance = accountsBalances.reduce((sum, b) => sum + b, 0);

    let totalInflows = 0;
    let totalOutflows = 0;
    let revenue = 0;
    let cogs = 0;
    let operatingExpenses = 0;
    let ownerDraws = 0;
    let ownerContributions = 0;

    for (const tx of transactions) {
      if (tx.status !== 'POSTED') continue;

      if (tx.direction === 'INFLOW') {
        totalInflows += tx.amount;
      } else if (tx.direction === 'OUTFLOW') {
        totalOutflows += tx.amount;
      }

      // Revenue
      if (tx.category === 'PRODUCT_SALE' || tx.category === 'OTHER_REVENUE') {
        revenue += tx.amount;
      }

      // COGS (Direct costs)
      if (
        tx.category === 'SUPPLIER_PURCHASE' ||
        tx.category === 'PRODUCT_COST' ||
        tx.category === 'PACKAGING' ||
        tx.category === 'COMMISSION'
      ) {
        cogs += tx.amount;
      }

      // OpEx
      if (this.isOperatingExpense(tx.category)) {
        operatingExpenses += tx.amount;
      }

      // Owner Draw (Equity Outflow)
      if (tx.category === 'OWNER_DRAW') {
        ownerDraws += tx.amount;
      }

      // Owner Contribution (Equity Inflow)
      if (tx.category === 'OWNER_CONTRIBUTION') {
        ownerContributions += tx.amount;
      }
    }

    const netCashFlow = totalInflows - totalOutflows;
    const grossProfit = revenue - cogs;
    const grossMarginPercentage = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
    const operatingProfit = grossProfit - operatingExpenses;

    return {
      totalCashBalance,
      totalInflows,
      totalOutflows,
      netCashFlow,
      revenue,
      cogs,
      grossProfit,
      grossMarginPercentage,
      operatingExpenses,
      operatingProfit,
      ownerDraws,
      ownerContributions,
      totalDebts: debts,
      totalReceivables: receivables,
    };
  }
}
