/**
 * WILLShop OS — Ad Marketing Attribution Pure Domain Entities
 * Pure Domain Layer — ZERO external dependencies.
 */

export type AttributionSource =
  | 'FACEBOOK_ADS'
  | 'INSTAGRAM_ADS'
  | 'WHATSAPP_DIRECT'
  | 'REFERRAL'
  | 'ORGANIC'
  | 'OTHER'
  | 'UNKNOWN';

export type AttributionConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';

export type AttributionMethod =
  | 'META_REFERRAL_DIRECT'
  | 'TRACKING_LINK_ID'
  | 'EXPLICIT_SOURCE_LINK'
  | 'PRODUCT_MATCH'
  | 'ORGANIC_DIRECT'
  | 'UNKNOWN';

export type AttributionTouchType = 'first_touch' | 'last_touch';

export type ConversionLifecycleEventType =
  | 'ATTRIBUTED'
  | 'LEAD'
  | 'QUALIFIED'
  | 'PRODUCT_INTEREST'
  | 'DELIVERY_CHECKED'
  | 'ORDER_STARTED'
  | 'ORDER_CREATED'
  | 'ORDER_CONFIRMED'
  | 'DELIVERED'
  | 'PAID';

export interface AdAttribution {
  id: string;
  organizationId: string;
  customerId: string;
  conversationId?: string | null;
  source: AttributionSource;
  sourceType: string; // 'ad', 'post', 'tracking_link', 'qr', 'unknown'
  platform: string; // 'META_ADS', 'INSTAGRAM', 'FACEBOOK', 'WHATSAPP', 'UNKNOWN'
  campaignId?: string | null;
  campaignName?: string | null;
  adSetId?: string | null;
  adSetName?: string | null;
  adId?: string | null;
  adName?: string | null;
  creativeId?: string | null;
  creativeName?: string | null;
  productId?: string | null;
  productName?: string | null;
  sourceUrl?: string | null;
  metadata?: Record<string, unknown>;
  confidence: AttributionConfidenceLevel;
  attributionMethod: AttributionMethod;
  touchType: AttributionTouchType;
  attributedAt: Date;
  createdAt: Date;
}

export interface CustomerAttributionProfile {
  customerId: string;
  organizationId: string;
  firstTouch?: AdAttribution | null;
  lastTouch?: AdAttribution | null;
  history: AdAttribution[];
}

export interface AttributionLifecycleEvent {
  id: string;
  organizationId: string;
  customerId: string;
  conversationId?: string | null;
  attributionId?: string | null;
  eventType: ConversionLifecycleEventType;
  orderId?: string | null;
  amount: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
