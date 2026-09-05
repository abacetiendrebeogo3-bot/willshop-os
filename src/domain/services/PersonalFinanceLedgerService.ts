/**
 * WILLShop OS — Personal Finance Ledger Service
 * Pure Domain Service — Governs personal financial account balances, append-only transactions, and budgets.
 * ABSOLUTE SEPARATION: Operates ONLY on Personal Financial Accounts (scope = 'personal').
 */

import {
  PersonalFinancialAccount,
  PersonalTransaction,
  PersonalBudget,
} from '../entities/PersonalEntities';

export class PersonalFinanceLedgerService {
  /**
   * Processes a new personal financial transaction, updating account current balances.
   * Transactions are append-only; historical transactions are never silently overwritten.
   */
  public static processTransaction(
    account: PersonalFinancialAccount,
    transaction: PersonalTransaction,
    targetAccount?: PersonalFinancialAccount
  ): { updatedAccount: PersonalFinancialAccount; updatedTargetAccount?: PersonalFinancialAccount } {
    let newBalance = account.currentBalance;

    if (transaction.type === 'INCOME') {
      newBalance += transaction.amount;
    } else if (transaction.type === 'EXPENSE') {
      newBalance -= transaction.amount;
    } else if (transaction.type === 'TRANSFER') {
      newBalance -= transaction.amount;
    } else if (transaction.type === 'ADJUSTMENT') {
      newBalance += transaction.amount; // Signed adjustment amount
    }

    const updatedAccount: PersonalFinancialAccount = {
      ...account,
      currentBalance: Math.round(newBalance * 100) / 100,
      updatedAt: new Date(),
    };

    let updatedTargetAccount: PersonalFinancialAccount | undefined;
    if (transaction.type === 'TRANSFER' && targetAccount) {
      updatedTargetAccount = {
        ...targetAccount,
        currentBalance: Math.round((targetAccount.currentBalance + transaction.amount) * 100) / 100,
        updatedAt: new Date(),
      };
    }

    return { updatedAccount, updatedTargetAccount };
  }

  /**
   * Evaluates personal budget threshold for a category.
   */
  public static evaluateBudgetStatus(
    budget: PersonalBudget,
    addedExpenseAmount: number
  ): { updatedBudget: PersonalBudget; isOverBudget: boolean; remaining: number } {
    const spentCurrentMonth = budget.spentCurrentMonth + addedExpenseAmount;
    const remaining = budget.monthlyLimit - spentCurrentMonth;
    const isOverBudget = spentCurrentMonth > budget.monthlyLimit;

    const updatedBudget: PersonalBudget = {
      ...budget,
      spentCurrentMonth,
      updatedAt: new Date(),
    };

    return { updatedBudget, isOverBudget, remaining };
  }
}
