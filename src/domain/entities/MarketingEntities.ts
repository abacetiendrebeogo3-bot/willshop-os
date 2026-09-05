/**
 * WILLShop OS — Marketing Engine Domain Entities
 * Pure Domain Layer.
 */

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED' | 'ERROR';

export type CreativeStatusTag = 'WINNER' | 'WATCH' | 'LOSER' | 'FATIGUE';

export type AttributionTouchpoint =
  | 'first_touch'
  | 'last_touch'
  | 'primary_touch'
  | 'whatsapp_source'
  | 'manual'
  | 'unknown';

export type AttributionConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AdAccount {
  id: string;
  organizationId: string;
  platform: string; // e.g. 'META_ADS', 'GOOGLE_ADS', 'MANUAL'
  externalAccountId?: string | null;
  name: string;
  currency: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingCampaign {
  id: string;
  organizationId: string;
  adAccountId?: string | null;
  name: string;
  platform: string;
  status: CampaignStatus;
  budget: number; // Planned budget in XOF
  dailyBudget?: number | null;
  targetProducts?: string[]; // Product IDs promoted
  startAt?: Date | null;
  endAt?: Date | null;
  attributedRevenue: number;
  attributedOrdersCount: number;
  totalSpend: number;
  cogs: number;
  deliveryCosts: number;
  contributionProfit: number;
  roas: number;
  roi: number;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdSet {
  id: string;
  organizationId: string;
  campaignId: string;
  name: string;
  targetAudience?: string | null;
  dailyBudget?: number | null;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface Advertisement {
  id: string;
  organizationId: string;
  adSetId: string;
  creativeId?: string | null;
  name: string;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingCreative {
  id: string;
  organizationId: string;
  campaignId?: string | null;
  name: string;
  type: 'IMAGE' | 'VIDEO' | 'CAROUSEL' | 'TEXT';
  assetUrl?: string | null;
  headline?: string | null;
  ctaText?: string | null;
  statusTag: CreativeStatusTag;
  impressions: number;
  clicks: number;
  ctr: number; // %
  cpc: number; // XOF
  attributedConversions: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MarketingSpend {
  id: string;
  organizationId: string;
  provider: string;
  adAccountId?: string | null;
  campaignId?: string | null;
  adSetId?: string | null;
  advertisementId?: string | null;
  date: Date;
  amount: number;
  currency: string;
  externalId?: string | null;
  importedAt: Date;
}

export interface MarketingAttribution {
  id: string;
  organizationId: string;
  campaignId: string;
  customerId?: string | null;
  orderId?: string | null;
  paymentId?: string | null;
  amount: number;
  touchpoint: AttributionTouchpoint;
  confidenceLevel: AttributionConfidenceLevel;
  timestamp: Date;
}

export interface ContributionProfitSummary {
  revenue: number;
  cogs: number;
  adSpend: number;
  deliveryCosts: number;
  commissions: number;
  otherVariableCosts: number;
  grossProfit: number;
  contributionProfit: number;
  contributionMarginPercent: number;
  roas: number;
  roi: number;
}

export interface MarketingFunnelMetrics {
  impressions: number;
  clicks: number;
  conversations: number;
  leads: number;
  qualifiedLeads: number;
  orders: number;
  confirmedOrders: number;
  deliveredOrders: number;
  paidOrders: number;
  ctr: number;
  cpc: number;
  cpa: number;
  conversionRates: {
    clickToConversationRate: number;
    conversationToLeadRate: number;
    leadToOrderRate: number;
    orderToDeliveryRate: number;
  };
  bottleneckDiagnosis?: string | null;
}

export interface MarketingExperiment {
  id: string;
  organizationId: string;
  name: string;
  hypothesis: string;
  variant: string;
  metric: string;
  status: 'DRAFT' | 'RUNNING' | 'CONCLUDED';
  resultSummary?: string | null;
  confidenceLevel?: AttributionConfidenceLevel | null;
  createdAt: Date;
  updatedAt: Date;
}
