/**
 * WILLShop OS — WhatsApp Event Normalizer
 * Infrastructure Layer.
 * Normalizes raw vendor payloads (Meta Cloud API, Evolution Baileys) into a single InboundWhatsAppEvent domain object.
 */

import {
  InboundWhatsAppEvent,
  WhatsAppMessageType,
} from '../../domain/entities/WhatsAppEventEntities';
import { AdAttribution, AttributionSource } from '../../domain/entities/AdAttributionEntities';

/**
 * Normalizes any raw phone number into a canonical E.164 format (+22672019524).
 */
export function normalizeCanonicalPhone(rawPhone: string): string {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  if (!cleaned) return '';

  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.startsWith('00')) return `+${cleaned.substring(2)}`;
  if (cleaned.length === 8) return `+226${cleaned}`;
  return `+${cleaned}`;
}

export class WhatsAppEventNormalizer {
  /**
   * Normalizes an incoming raw payload from Meta or Evolution.
   */
  static normalize(provider: string, rawPayload: any): InboundWhatsAppEvent | null {
    if (provider === 'evolution' || rawPayload.instance || rawPayload.event?.includes('message')) {
      return this.normalizeEvolution(rawPayload);
    }
    return this.normalizeMeta(rawPayload);
  }

  private static extractAttributionFromText(text: string): Partial<AdAttribution> | null {
    if (!text) return null;

    // Explicit tracking tags (e.g. tracking_id=..., ref=..., utm_campaign=..., [ref:KM_01])
    const refMatch =
      text.match(/(?:ref|tracking_id|utm_campaign|ws_ref)[=:]\s*([A-Za-z0-9_-]+)/i) ||
      text.match(/\[ref:\s*([A-Za-z0-9_-]+)\]/i);

    if (refMatch) {
      const code = refMatch[1];
      let productName: string | undefined;
      let adName = `Tracking Ad (${code})`;

      if (code.toUpperCase().includes('KM') || code.toLowerCase().includes('minceur')) productName = 'Kit Minceur';
      if (code.toUpperCase().includes('MC') || code.toLowerCase().includes('maca')) productName = 'Maca';

      return {
        source: 'FACEBOOK_ADS',
        sourceType: 'tracking_link',
        platform: 'META_ADS',
        adId: code,
        adName,
        productName,
        confidence: 'HIGH',
        attributionMethod: 'TRACKING_LINK_ID',
        metadata: { trackingCode: code },
      };
    }

    return null;
  }

  private static normalizeEvolution(payload: any): InboundWhatsAppEvent | null {
    let msgData = payload.data || payload;
    if (Array.isArray(msgData)) {
      msgData = msgData[msgData.length - 1];
    } else if (msgData?.messages && Array.isArray(msgData.messages)) {
      msgData = msgData.messages[msgData.messages.length - 1];
    }

    if (!msgData) {
      return null;
    }

    const keyObj = msgData.key || payload.key || {};
    const remoteJid = keyObj.remoteJid || msgData.remoteJid || payload.remoteJid || '';
    if (remoteJid.includes('@g.us')) {
      // Ignore group chats in commercial agent
      return null;
    }

    const rawJidUser = (remoteJid || '').split('@')[0].split(':')[0];
    let rawPhone = rawJidUser.replace(/[^\d+]/g, '');
    if (!rawPhone && msgData.from) {
      rawPhone = String(msgData.from).replace(/[^\d+]/g, '');
    }

    const senderPhone = normalizeCanonicalPhone(rawPhone);
    const senderName = msgData.pushName || payload.pushName || (senderPhone ? senderPhone : 'Client WhatsApp');
    const externalMessageId = keyObj.id || msgData.id || `EVO-${Date.now()}`;
    const fromMe = !!keyObj.fromMe || !!msgData.fromMe;
    const providerIdentity = String(payload.instance || payload.sender || payload.instanceName || 'willshop_pilot').trim();

    let messageType: WhatsAppMessageType = 'TEXT';
    let textBody = '';
    let mediaUrl: string | undefined;

    const msgContent = msgData.message || msgData;
    if (msgContent?.conversation) {
      textBody = msgContent.conversation;
    } else if (msgContent?.extendedTextMessage?.text) {
      textBody = msgContent.extendedTextMessage.text;
    } else if (typeof msgContent === 'string') {
      textBody = msgContent;
    } else if (msgData.text) {
      textBody = msgData.text;
    } else if (msgData.messageType === 'imageMessage' || msgContent?.imageMessage) {
      messageType = 'IMAGE';
      textBody = msgContent?.imageMessage?.caption || '[Image]';
      mediaUrl = msgContent?.imageMessage?.url;
    } else if (
      msgData.messageType === 'audioMessage' ||
      msgContent?.audioMessage ||
      msgData.messageType === 'pttMessage' ||
      msgContent?.pttMessage ||
      msgData.type === 'audio'
    ) {
      messageType = 'AUDIO';
      textBody = '[Vocale]';
      mediaUrl = msgContent?.audioMessage?.url || msgContent?.pttMessage?.url || msgData.mediaUrl;
    } else if (msgData.messageType === 'documentMessage' || msgContent?.documentMessage) {
      messageType = 'DOCUMENT';
      textBody = msgContent?.documentMessage?.fileName || '[Document]';
      mediaUrl = msgContent?.documentMessage?.url;
    }

    const base64 =
      payload.base64 ||
      msgData.base64 ||
      msgContent?.base64 ||
      msgContent?.audioMessage?.base64 ||
      msgContent?.pttMessage?.base64;

    if (!senderPhone && !textBody && !base64) {
      return null;
    }

    const extAd = msgContent?.contextInfo?.externalAdReply;
    let attribution: Partial<AdAttribution> | undefined;

    if (extAd) {
      const headline = extAd.title || extAd.body || '';
      let productName: string | undefined;
      if (headline.toLowerCase().includes('minceur')) productName = 'Kit Minceur';
      else if (headline.toLowerCase().includes('maca')) productName = 'Maca';

      attribution = {
        source: 'FACEBOOK_ADS',
        sourceType: 'ad',
        platform: 'META_ADS',
        adId: extAd.sourceId || extAd.sourceUrl || `EVO-AD-${Date.now()}`,
        adName: extAd.title || 'Evolution External Ad',
        productName,
        sourceUrl: extAd.sourceUrl,
        confidence: 'HIGH',
        attributionMethod: 'META_REFERRAL_DIRECT',
        metadata: { rawExternalAd: extAd },
      };
    } else {
      attribution = this.extractAttributionFromText(textBody) || {
        source: 'UNKNOWN',
        sourceType: 'unknown',
        platform: 'UNKNOWN',
        confidence: 'UNKNOWN',
        attributionMethod: 'UNKNOWN',
      };
    }

    return {
      provider: 'EVOLUTION',
      providerIdentity,
      externalMessageId,
      senderPhone,
      senderName,
      messageType,
      textBody,
      mediaUrl,
      base64,
      fromMe,
      timestamp: new Date(msgData.messageTimestamp ? msgData.messageTimestamp * 1000 : Date.now()),
      rawPayload: payload,
      attribution,
    };
  }

  private static normalizeMeta(payload: any): InboundWhatsAppEvent | null {
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const messageObject = value?.messages?.[0];

    if (!messageObject) {
      return null;
    }

    const rawPhone = (messageObject.from || '').replace(/[^\d+]/g, '');
    const senderPhone = normalizeCanonicalPhone(rawPhone);
    const senderName = value?.contacts?.[0]?.profile?.name || senderPhone;
    const externalMessageId = messageObject.id || `wamid.${Date.now()}`;
    const providerIdentity = String(value?.metadata?.phone_number_id || 'default_id').trim();

    let messageType: WhatsAppMessageType = 'TEXT';
    let textBody = '';

    if (messageObject.type === 'text') {
      textBody = messageObject.text?.body || '';
    } else if (messageObject.type === 'interactive') {
      messageType = 'BUTTON_REPLY';
      textBody = messageObject.interactive?.button_reply?.title || messageObject.interactive?.button_reply?.id || '';
    } else if (messageObject.type === 'image') {
      messageType = 'IMAGE';
      textBody = messageObject.image?.caption || '[Image]';
    } else if (messageObject.type === 'audio') {
      messageType = 'AUDIO';
      textBody = '[Vocale]';
    } else if (messageObject.type === 'document') {
      messageType = 'DOCUMENT';
      textBody = messageObject.document?.filename || '[Document]';
    }

    const referral = messageObject.referral;
    let attribution: Partial<AdAttribution> | undefined;

    if (referral) {
      const sourceUrl = referral.source_url || '';
      const isInstagram = sourceUrl.includes('instagram.com') || referral.source_type === 'instagram_ad';
      const source: AttributionSource = isInstagram ? 'INSTAGRAM_ADS' : 'FACEBOOK_ADS';
      const headline = referral.headline || referral.body || '';

      let productName: string | undefined;
      if (headline.toLowerCase().includes('minceur')) productName = 'Kit Minceur';
      else if (headline.toLowerCase().includes('maca')) productName = 'Maca';

      attribution = {
        source,
        sourceType: referral.source_type || 'ad',
        platform: 'META_ADS',
        adId: referral.source_id,
        adName: referral.headline || 'Meta Ad',
        productName,
        sourceUrl,
        confidence: 'HIGH',
        attributionMethod: 'META_REFERRAL_DIRECT',
        metadata: { rawReferral: referral },
      };
    } else {
      attribution = this.extractAttributionFromText(textBody) || {
        source: 'UNKNOWN',
        sourceType: 'unknown',
        platform: 'UNKNOWN',
        confidence: 'UNKNOWN',
        attributionMethod: 'UNKNOWN',
      };
    }

    return {
      provider: 'META_CLOUD_API',
      providerIdentity,
      externalMessageId,
      senderPhone,
      senderName,
      messageType,
      textBody,
      fromMe: false, // Meta webhooks only deliver inbound customer messages unless echo is enabled
      timestamp: new Date(messageObject.timestamp ? Number(messageObject.timestamp) * 1000 : Date.now()),
      rawPayload: payload,
      attribution,
    };
  }
}
