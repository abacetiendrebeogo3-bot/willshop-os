/**
 * WILLShop OS — Marketing Attribution & Conversion Lifecycle Service
 * Application Layer.
 * Manages customer acquisition attribution, first_touch / last_touch retention,
 * multi-tenant security isolation, and conversion funnel tracking.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  AdAttribution,
  AttributionConfidenceLevel,
  AttributionMethod,
  AttributionSource,
  ConversionLifecycleEventType,
  CustomerAttributionProfile,
} from '../../domain/entities/AdAttributionEntities';

export interface RecordAttributionParams {
  organizationId: string;
  customerId: string;
  conversationId?: string | null;
  source: AttributionSource;
  sourceType?: string;
  platform?: string;
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
}

export class MarketingAttributionService {
  constructor(private readonly supabase: SupabaseClient) {}

  /**
   * Records an inbound attribution for a customer/conversation while preserving historical first_touch origin.
   */
  async recordAttribution(params: RecordAttributionParams): Promise<{
    firstTouch: AdAttribution;
    lastTouch: AdAttribution;
  }> {
    const { organizationId, customerId, conversationId, confidence } = params;

    if (!organizationId || !customerId) {
      throw new Error('organizationId and customerId are required for attribution recording');
    }

    const now = new Date();

    // 1. Check existing attributions for customer in this organization
    const { data: existingAttributions } = await this.supabase
      .from('customer_attributions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    const firstTouchRow = existingAttributions?.find((a) => a.touch_type === 'first_touch');
    const isNewCustomer = !firstTouchRow;

    // 2. Prepare new attribution object
    const attrRecord: Partial<AdAttribution> = {
      organizationId,
      customerId,
      conversationId: conversationId || null,
      source: params.source || 'UNKNOWN',
      sourceType: params.sourceType || 'unknown',
      platform: params.platform || 'UNKNOWN',
      campaignId: params.campaignId || null,
      campaignName: params.campaignName || null,
      adSetId: params.adSetId || null,
      adSetName: params.adSetName || null,
      adId: params.adId || null,
      adName: params.adName || null,
      creativeId: params.creativeId || null,
      creativeName: params.creativeName || null,
      productId: params.productId || null,
      productName: params.productName || null,
      sourceUrl: params.sourceUrl || null,
      metadata: params.metadata || {},
      confidence: confidence || 'UNKNOWN',
      attributionMethod: params.attributionMethod || 'UNKNOWN',
      attributedAt: now,
      createdAt: now,
    };

    let firstTouchAttr: AdAttribution;
    let lastTouchAttr: AdAttribution;

    if (isNewCustomer) {
      // First interaction: Save as both first_touch and last_touch
      const { data: insertedFirst } = await this.supabase
        .from('customer_attributions')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          conversation_id: conversationId || null,
          source: attrRecord.source,
          source_type: attrRecord.sourceType,
          platform: attrRecord.platform,
          campaign_id: attrRecord.campaignId,
          campaign_name: attrRecord.campaignName,
          ad_set_id: attrRecord.adSetId,
          ad_set_name: attrRecord.adSetName,
          ad_id: attrRecord.adId,
          ad_name: attrRecord.adName,
          creative_id: attrRecord.creativeId,
          creative_name: attrRecord.creativeName,
          product_id: attrRecord.productId,
          product_name: attrRecord.productName,
          source_url: attrRecord.sourceUrl,
          metadata: attrRecord.metadata,
          confidence: attrRecord.confidence,
          attribution_method: attrRecord.attributionMethod,
          touch_type: 'first_touch',
          attributed_at: now.toISOString(),
        })
        .select()
        .single();

      firstTouchAttr = this.mapRowToAdAttribution(insertedFirst || { ...attrRecord, touch_type: 'first_touch', id: `ft_${Date.now()}` });
      lastTouchAttr = { ...firstTouchAttr, touchType: 'last_touch' };
    } else {
      // Returning customer: Keep existing first_touch intact, record new last_touch
      firstTouchAttr = this.mapRowToAdAttribution(firstTouchRow);

      const { data: insertedLast } = await this.supabase
        .from('customer_attributions')
        .insert({
          organization_id: organizationId,
          customer_id: customerId,
          conversation_id: conversationId || null,
          source: attrRecord.source,
          source_type: attrRecord.sourceType,
          platform: attrRecord.platform,
          campaign_id: attrRecord.campaignId,
          campaign_name: attrRecord.campaignName,
          ad_set_id: attrRecord.adSetId,
          ad_set_name: attrRecord.adSetName,
          ad_id: attrRecord.adId,
          ad_name: attrRecord.adName,
          creative_id: attrRecord.creativeId,
          creative_name: attrRecord.creativeName,
          product_id: attrRecord.productId,
          product_name: attrRecord.productName,
          source_url: attrRecord.sourceUrl,
          metadata: attrRecord.metadata,
          confidence: attrRecord.confidence,
          attribution_method: attrRecord.attributionMethod,
          touch_type: 'last_touch',
          attributed_at: now.toISOString(),
        })
        .select()
        .single();

      lastTouchAttr = this.mapRowToAdAttribution(insertedLast || { ...attrRecord, touch_type: 'last_touch', id: `lt_${Date.now()}` });
    }

    // 3. Update Conversation & Customer Metadata for CRM UI visibility
    if (conversationId) {
      await this.supabase
        .from('conversations')
        .update({
          metadata: {
            attribution: {
              source: lastTouchAttr.source,
              platform: lastTouchAttr.platform,
              campaignName: lastTouchAttr.campaignName,
              adName: lastTouchAttr.adName,
              productName: lastTouchAttr.productName,
              confidence: lastTouchAttr.confidence,
              method: lastTouchAttr.attributionMethod,
              attributedAt: lastTouchAttr.attributedAt.toISOString(),
            },
          },
        })
        .eq('id', conversationId)
        .eq('organization_id', organizationId);
    }

    // 4. Record initial conversion lifecycle event
    await this.recordLifecycleEvent({
      organizationId,
      customerId,
      conversationId: conversationId || null,
      attributionId: lastTouchAttr.id,
      eventType: 'ATTRIBUTED',
      amount: 0,
      metadata: { source: lastTouchAttr.source, confidence: lastTouchAttr.confidence },
    });

    return {
      firstTouch: firstTouchAttr,
      lastTouch: lastTouchAttr,
    };
  }

  /**
   * Tracks a conversion lifecycle event along the customer journey.
   */
  async recordLifecycleEvent(params: {
    organizationId: string;
    customerId: string;
    conversationId?: string | null;
    attributionId?: string | null;
    eventType: ConversionLifecycleEventType;
    orderId?: string | null;
    amount?: number;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const { organizationId, customerId, eventType, orderId, amount = 0, metadata = {} } = params;

    await this.supabase.from('attribution_lifecycle_events').insert({
      organization_id: organizationId,
      customer_id: customerId,
      conversation_id: params.conversationId || null,
      attribution_id: params.attributionId || null,
      event_type: eventType,
      order_id: orderId || null,
      amount,
      metadata,
    });
  }

  /**
   * Retrieves the full attribution profile for a customer.
   */
  async getCustomerAttributionProfile(
    organizationId: string,
    customerId: string
  ): Promise<CustomerAttributionProfile> {
    const { data: rows } = await this.supabase
      .from('customer_attributions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: true });

    if (!rows || rows.length === 0) {
      return {
        customerId,
        organizationId,
        firstTouch: null,
        lastTouch: null,
        history: [],
      };
    }

    const mapped = rows.map((r) => this.mapRowToAdAttribution(r));
    const firstTouch = mapped.find((m) => m.touchType === 'first_touch') || mapped[0];
    const lastTouch = mapped.slice().reverse().find((m) => m.touchType === 'last_touch') || mapped[mapped.length - 1];

    return {
      customerId,
      organizationId,
      firstTouch,
      lastTouch,
      history: mapped,
    };
  }

  private mapRowToAdAttribution(row: any): AdAttribution {
    return {
      id: row.id,
      organizationId: row.organization_id,
      customerId: row.customer_id,
      conversationId: row.conversation_id,
      source: row.source || 'UNKNOWN',
      sourceType: row.source_type || 'unknown',
      platform: row.platform || 'UNKNOWN',
      campaignId: row.campaign_id,
      campaignName: row.campaign_name,
      adSetId: row.ad_set_id,
      adSetName: row.ad_set_name,
      adId: row.ad_id,
      adName: row.ad_name,
      creativeId: row.creative_id,
      creativeName: row.creative_name,
      productId: row.product_id,
      productName: row.product_name,
      sourceUrl: row.source_url,
      metadata: row.metadata || {},
      confidence: row.confidence || 'UNKNOWN',
      attributionMethod: row.attribution_method || 'UNKNOWN',
      touchType: row.touch_type || 'last_touch',
      attributedAt: row.attributed_at ? new Date(row.attributed_at) : new Date(),
      createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    };
  }
}
