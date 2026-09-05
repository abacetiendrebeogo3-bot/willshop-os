/**
 * WILLShop OS — Business ↔ Personal Bridge Service
 * Pure Domain Service — Executes EXPLICIT, AUDITED bridge transfers between Business and Personal ledgers.
 * ABSOLUTE SEPARATION RULE: Business and Personal ledgers remain completely isolated.
 * Writes occur ONLY via explicit, authorized bridge records (`business_to_personal_transfer` / `personal_to_business_contribution`).
 */

import { BusinessPersonalBridgeRecord } from '../entities/PersonalEntities';

export class BusinessPersonalBridgeService {
  /**
   * Creates an audited bridge transfer record.
   */
  public static createBridgeRecord(
    userId: string,
    businessOrgId: string,
    direction: 'BUSINESS_TO_PERSONAL' | 'PERSONAL_TO_BUSINESS',
    transferType: 'OWNER_DRAW' | 'CAPITAL_INJECTION' | 'LOAN_REPAYMENT',
    amount: number,
    currency: string,
    businessAccountId: string,
    personalAccountId: string,
    reason: string,
    approvedByUserId: string,
    businessTransactionId?: string,
    personalTransactionId?: string
  ): BusinessPersonalBridgeRecord {
    if (amount <= 0) {
      throw new Error('Le montant du transfert passerelle doit être strictement positif.');
    }

    return {
      id: `bridge_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      businessOrgId,
      direction,
      transferType,
      amount: Math.round(amount * 100) / 100,
      currency,
      businessAccountId,
      personalAccountId,
      businessTransactionId,
      personalTransactionId,
      reason,
      approvedByUserId,
      transferDate: new Date(),
      createdAt: new Date(),
    };
  }
}
