/**
 * WILLShop OS — Ad Marketing Attribution Automated Test Suite
 * Validates Meta referral normalization, tracking link parsing, first_touch/last_touch retention,
 * SalesAgent contextual greeting rules, anti-leak safeguards, and multi-tenant RLS isolation.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { WhatsAppEventNormalizer } from '../src/infrastructure/whatsapp/WhatsAppEventNormalizer';
import { MarketingAttributionService } from '../src/application/services/MarketingAttributionService';
import { SalesAgentContextService, sanitizeResponseText } from '../src/application/services/SalesAgentService';

// Mock Supabase Client for pure in-memory testing
function createMockSupabaseClient() {
  const attributions: any[] = [];
  const events: any[] = [];
  const conversations: any[] = [];

  return {
    attributions,
    events,
    conversations,
    from: (table: string) => {
      if (table === 'customer_attributions') {
        return {
          select: () => ({
            eq: (field1: string, val1: string) => ({
              eq: (field2: string, val2: string) => ({
                order: () => Promise.resolve({
                  data: attributions.filter((a) => a[field1] === val1 && a[field2] === val2),
                  error: null,
                }),
              }),
            }),
          }),
          insert: (data: any) => {
            const record = { ...data, id: `attr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}` };
            attributions.push(record);
            return {
              select: () => ({
                single: () => Promise.resolve({ data: record, error: null }),
              }),
            };
          },
        };
      }

      if (table === 'attribution_lifecycle_events') {
        return {
          insert: (data: any) => {
            const record = { ...data, id: `evt_${Date.now()}` };
            events.push(record);
            return Promise.resolve({ data: record, error: null });
          },
        };
      }

      if (table === 'conversations') {
        return {
          update: (data: any) => ({
            eq: (f1: string, v1: string) => ({
              eq: (f2: string, v2: string) => {
                conversations.push({ id: v1, organization_id: v2, ...data });
                return Promise.resolve({ data: null, error: null });
              },
            }),
          }),
        };
      }

      return {
        select: () => ({ maybeSingle: () => Promise.resolve({ data: null }) }),
      };
    },
  } as any;
}

test('1. Meta Cloud API Real Facebook Ads Referral Normalization (HIGH confidence)', () => {
  const rawPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: '123456789' },
              contacts: [{ profile: { name: 'Awa Diallo' } }],
              messages: [
                {
                  from: '22670000001',
                  id: 'wamid.FB_001',
                  timestamp: '1700000000',
                  type: 'text',
                  text: { body: 'Salut' },
                  referral: {
                    source_url: 'https://fb.me/ad_kit_minceur',
                    source_type: 'ad',
                    source_id: 'AD_FB_MINCEUR_01',
                    headline: 'Kit Minceur - Offre Spéciale',
                    body: 'Retrouvez votre silhouette idéale',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const normalized = WhatsAppEventNormalizer.normalize('meta', rawPayload);
  assert.notEqual(normalized, null);
  assert.equal(normalized?.provider, 'META_CLOUD_API');
  assert.equal(normalized?.attribution?.source, 'FACEBOOK_ADS');
  assert.equal(normalized?.attribution?.confidence, 'HIGH');
  assert.equal(normalized?.attribution?.adId, 'AD_FB_MINCEUR_01');
  assert.equal(normalized?.attribution?.productName, 'Kit Minceur');
});

test('2. Meta Cloud API Real Instagram Ads Referral Normalization (HIGH confidence)', () => {
  const rawPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: '123456789' },
              messages: [
                {
                  from: '22670000002',
                  id: 'wamid.IG_002',
                  timestamp: '1700000000',
                  type: 'text',
                  text: { body: 'Bonsoir' },
                  referral: {
                    source_url: 'https://instagram.com/p/ad_maca',
                    source_type: 'instagram_ad',
                    source_id: 'AD_IG_MACA_02',
                    headline: 'Maca du Kenedougou',
                  },
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const normalized = WhatsAppEventNormalizer.normalize('meta', rawPayload);
  assert.notEqual(normalized, null);
  assert.equal(normalized?.attribution?.source, 'INSTAGRAM_ADS');
  assert.equal(normalized?.attribution?.confidence, 'HIGH');
  assert.equal(normalized?.attribution?.productName, 'Maca');
});

test('3. Evolution Webhook without Tracking Link (UNKNOWN attribution)', () => {
  const rawPayload = {
    instance: 'willshop_pilot',
    data: {
      key: { remoteJid: '22672019524@s.whatsapp.net', id: 'EVO_MSG_001', fromMe: false },
      pushName: 'Willy',
      message: { conversation: 'Salut' },
    },
  };

  const normalized = WhatsAppEventNormalizer.normalize('evolution', rawPayload);
  assert.notEqual(normalized, null);
  assert.equal(normalized?.attribution?.source, 'UNKNOWN');
  assert.equal(normalized?.attribution?.confidence, 'UNKNOWN');
  assert.equal(normalized?.attribution?.attributionMethod, 'UNKNOWN');
});

test('4. Evolution Webhook with Tracked Link (tracking_id / ref parsing)', () => {
  const rawPayload = {
    instance: 'willshop_pilot',
    data: {
      key: { remoteJid: '22672019524@s.whatsapp.net', id: 'EVO_MSG_TRACKED', fromMe: false },
      pushName: 'Willy',
      message: { conversation: 'Bonjour, je veux des infos [ref:KM_AD03]' },
    },
  };

  const normalized = WhatsAppEventNormalizer.normalize('evolution', rawPayload);
  assert.notEqual(normalized, null);
  assert.equal(normalized?.attribution?.source, 'FACEBOOK_ADS');
  assert.equal(normalized?.attribution?.confidence, 'HIGH');
  assert.equal(normalized?.attribution?.attributionMethod, 'TRACKING_LINK_ID');
  assert.equal(normalized?.attribution?.productName, 'Kit Minceur');
});

test('5. First Touch vs Last Touch Retention (First touch preserved on returning customer)', async () => {
  const mockSupabase = createMockSupabaseClient();
  const service = new MarketingAttributionService(mockSupabase);

  // First touch via Facebook Ad (Kit Minceur)
  const touch1 = await service.recordAttribution({
    organizationId: 'org_001',
    customerId: 'cust_001',
    conversationId: 'conv_001',
    source: 'FACEBOOK_ADS',
    productName: 'Kit Minceur',
    confidence: 'HIGH',
    attributionMethod: 'META_REFERRAL_DIRECT',
  });

  assert.equal(touch1.firstTouch.source, 'FACEBOOK_ADS');
  assert.equal(touch1.firstTouch.productName, 'Kit Minceur');

  // Second touch later via Instagram Ad (Maca)
  const touch2 = await service.recordAttribution({
    organizationId: 'org_001',
    customerId: 'cust_001',
    conversationId: 'conv_002',
    source: 'INSTAGRAM_ADS',
    productName: 'Maca',
    confidence: 'HIGH',
    attributionMethod: 'META_REFERRAL_DIRECT',
  });

  assert.equal(touch2.firstTouch.source, 'FACEBOOK_ADS', 'First touch MUST remain Facebook Ads');
  assert.equal(touch2.firstTouch.productName, 'Kit Minceur', 'First touch product MUST remain Kit Minceur');
  assert.equal(touch2.lastTouch.source, 'INSTAGRAM_ADS', 'Last touch MUST update to Instagram Ads');
  assert.equal(touch2.lastTouch.productName, 'Maca');
});

test('6. Context Engine includes <marketing_attribution> block when confidence is HIGH', () => {
  const contextService = new SalesAgentContextService();
  const mockCustomer: any = { id: 'c1', fullName: 'Amadou', phone: '+22670000000', status: 'ACTIVE' };
  const mockProducts: any[] = [{ id: 'p1', name: 'Kit Minceur', sku: 'KM-01', sellingPrice: 6500, minimumStock: 10 }];
  const mockAttribution: any = {
    source: 'FACEBOOK_ADS',
    platform: 'META_ADS',
    campaignName: 'Campagne Septembre',
    adName: 'Kit Minceur Video 03',
    productId: 'p1',
    productName: 'Kit Minceur',
    confidence: 'HIGH',
    attributionMethod: 'META_REFERRAL_DIRECT',
  };

  const context = contextService.buildContext(mockCustomer, [], mockProducts, mockAttribution);
  assert.ok(context.includes('<marketing_attribution>'));
  assert.ok(context.includes('source: FACEBOOK_ADS'));
  assert.ok(context.includes('product_name: Kit Minceur'));
  assert.ok(context.includes('confidence: HIGH'));
});

test('7. Context Engine omits <marketing_attribution> block when confidence is UNKNOWN', () => {
  const contextService = new SalesAgentContextService();
  const mockCustomer: any = { id: 'c1', fullName: 'Amadou', phone: '+22670000000', status: 'ACTIVE' };
  const mockProducts: any[] = [{ id: 'p1', name: 'Kit Minceur', sku: 'KM-01', sellingPrice: 6500, minimumStock: 10 }];
  const mockAttribution: any = {
    source: 'UNKNOWN',
    confidence: 'UNKNOWN',
  };

  const context = contextService.buildContext(mockCustomer, [], mockProducts, mockAttribution);
  assert.equal(context.includes('<marketing_attribution>'), false);
});

test('8. Anti-Leak Safeguard strips <marketing_attribution> XML tags if AI hallucinated tags in output', () => {
  const rawText = `Bonjour ! <marketing_attribution>source: Facebook Ads</marketing_attribution> Vous êtes intéressé par le Kit Minceur ?`;
  const sanitized = sanitizeResponseText(rawText);

  assert.equal(sanitized.cleanedText.includes('marketing_attribution'), false);
  assert.ok(sanitized.cleanedText.includes('Vous êtes intéressé par le Kit Minceur ?'));
});

test('9. Multi-Tenant Isolation (Attribution scoped strictly by organization_id)', async () => {
  const mockSupabase = createMockSupabaseClient();
  const service = new MarketingAttributionService(mockSupabase);

  await service.recordAttribution({
    organizationId: 'org_A',
    customerId: 'cust_999',
    source: 'FACEBOOK_ADS',
    productName: 'Kit Minceur',
    confidence: 'HIGH',
    attributionMethod: 'META_REFERRAL_DIRECT',
  });

  const profileOrgB = await service.getCustomerAttributionProfile('org_B', 'cust_999');
  assert.equal(profileOrgB.history.length, 0, 'Org B MUST NOT see Org A attributions for same customer ID');
});
