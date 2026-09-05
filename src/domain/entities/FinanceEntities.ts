/**
 * WILLShop OS — Finance Domain Entities & Types
 * Pure Domain Layer — ZERO external dependencies.
 * 
 * Strict Boundary: Business Finance ONLY (organization = WillShop).
 * Personal finances belong to Wilty Personal OS.
 */

export type FinancialAccountType =
  | 'CASH_REGISTER'
  | 'BANK_ACCOUNT'
  | 'MOBILE_MONEY'
  | 'SAVINGS'
  | 'OTHER_PRO';

export type TransactionDirection = 'INFLOW' | 'OUTFLOW';
export type TransactionStatus = 'PENDING' | 'POSTED' | 'VOIDED';

export type RevenueCategory = 'PRODUCT_SALE' | 'OTHER_REVENUE';

export type DirectCostCategory =
  | 'SUPPLIER_PURCHASE'
  | 'PRODUCT_COST'
  | 'PACKAGING'
  | 'DELIVERY_FEE_COLLECTED'
  | 'COMMISSION';

export type MarketingCategory =
  | 'MARKETING_ADS'
  | 'FACEBOOK_ADS'
  | 'INSTAGRAM_ADS'
  | 'TIKTOK_ADS';

export type OperatingCategory =
  | 'TRANSPORT'
  | 'PHONE_INTERNET'
  | 'RENT'
  | 'UTILITIES'
  | 'SOFTWARE_SUBSCRIPTION'
  | 'OFFICE_SUPPLIES';

export type HRCategory = 'SALARY' | 'COMMISSION_BONUS';

export type EquityCategory =
  | 'OWNER_DRAW'
  | 'OWNER_CONTRIBUTION'
  | 'LOAN_DISBURSEMENT'
  | 'LOAN_REPAYMENT';

export type DeliveryCategory = 'DELIVERY_COST' | 'DELIVERY_FEE_COLLECTED';

export type OtherCategory =
  | 'BANK_FEES'
  | 'RECONCILIATION_ADJUSTMENT'
  | 'OTHER';

export type FinancialCategory =
  | RevenueCategory
  | DirectCostCategory
  | MarketingCategory
  | OperatingCategory
  | HRCategory
  | EquityCategory
  | DeliveryCategory
  | OtherCategory;

export interface FinancialAccountEntity {
  id: string;
  organizationId: string;
  name: string;
  type: FinancialAccountType;
  currency: string; // V1 = XOF
  openingBalance: number;
  currentBalance: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinancialTransactionEntity {
  id: string;
  organizationId: string;
  financialAccountId: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  direction: TransactionDirection;
  amount: number; // Always positive numeric
  currency: string; // V1 = XOF
  category: FinancialCategory;
  status: TransactionStatus;
  referenceType?: 'order' | 'payment' | 'expense' | 'transfer' | 'delivery' | 'supplier_bill' | 'adjustment' | null;
  referenceId?: string | null;
  transferId?: string | null; // Shared ID linking debit and credit transfers
  receiptUrl?: string | null; // Supabase Storage URL
  description?: string | null;
  transactionDate: Date;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, unknown>;
}

export type ObligationType = 'DEBT' | 'RECEIVABLE';
export type ObligationPartyType = 'SUPPLIER' | 'CUSTOMER' | 'EMPLOYEE' | 'OTHER';
export type ObligationStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'CANCELLED';

export interface FinancialObligationEntity {
  id: string;
  organizationId: string;
  type: ObligationType;
  partyType: ObligationPartyType;
  partyId?: string | null;
  partyName: string;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate?: Date | null;
  status: ObligationStatus;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FinanceSummaryMetrics {
  totalCashBalance: number;
  totalInflows: number;
  totalOutflows: number;
  netCashFlow: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercentage: number;
  operatingExpenses: number;
  operatingProfit: number;
  ownerDraws: number;
  ownerContributions: number;
  totalDebts: number;
  totalReceivables: number;
}
