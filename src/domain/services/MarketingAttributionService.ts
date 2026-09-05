/**
 * WILLShop OS — Marketing Attribution Service
 * Attributes leads, orders, and payments to campaigns with explicit touchpoint and confidence.
 * Pure Domain Service.
 */

import {
  MarketingAttribution,
  AttributionTouchpoint,
  AttributionConfidenceLevel,
} from '../entities/MarketingEntities';

export class MarketingAttributionService {
  /**
   * Evaluates attribution for an order/payment. Unknown sources fallback to 'unknown' with 'LOW' confidence.
   */
  public static createAttribution(
    orgId: string,
    campaignId: string | null,
    amount: number,
    rawSource?: string | null,
    orderId?: string | null,
    customerId?: string | null
  ): Omit<MarketingAttribution, 'id'> {
    let touchpoint: AttributionTouchpoint = 'unknown';
    let confidenceLevel: AttributionConfidenceLevel = 'LOW';
    let targetCampaignId = campaignId || 'camp_unknown';

    if (rawSource) {
      const src = rawSource.toLowerCase();
      if (src.includes('whatsapp') || src.includes('wa_ref')) {
        touchpoint = 'whatsapp_source';
        confidenceLevel = 'HIGH';
      } else if (src.includes('meta') || src.includes('facebook') || src.includes('instagram')) {
        touchpoint = 'primary_touch';
        confidenceLevel = 'HIGH';
      } else if (src.includes('manual')) {
        touchpoint = 'manual';
        confidenceLevel = 'MEDIUM';
      }
    } else if (campaignId && campaignId !== 'camp_unknown') {
      touchpoint = 'last_touch';
      confidenceLevel = 'MEDIUM';
    }

    return {
      organizationId: orgId,
      campaignId: targetCampaignId,
      customerId: customerId || null,
      orderId: orderId || null,
      amount,
      touchpoint,
      confidenceLevel,
      timestamp: new Date(),
    };
  }
}
