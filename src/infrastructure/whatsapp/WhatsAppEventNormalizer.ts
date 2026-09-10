/**
 * WILLShop OS — WhatsApp Event Normalizer
 * Infrastructure Layer.
 * Normalizes raw vendor payloads (Meta Cloud API, Evolution Baileys) into a single InboundWhatsAppEvent domain object.
 */

import {
  InboundWhatsAppEvent,
  WhatsAppMessageType,
} from '../../domain/entities/WhatsAppEventEntities';

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
    let senderPhone = rawJidUser.replace(/[^\d+]/g, '');
    if (!senderPhone && msgData.from) {
      senderPhone = String(msgData.from).replace(/[^\d+]/g, '');
    }

    const senderName = msgData.pushName || payload.pushName || (senderPhone ? `+${senderPhone}` : 'Client WhatsApp');
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
    } else if (msgData.messageType === 'audioMessage' || msgContent?.audioMessage) {
      messageType = 'AUDIO';
      textBody = '[Vocale]';
      mediaUrl = msgContent?.audioMessage?.url;
    } else if (msgData.messageType === 'documentMessage' || msgContent?.documentMessage) {
      messageType = 'DOCUMENT';
      textBody = msgContent?.documentMessage?.fileName || '[Document]';
      mediaUrl = msgContent?.documentMessage?.url;
    }

    if (!senderPhone && !textBody) {
      return null;
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
      fromMe,
      timestamp: new Date(msgData.messageTimestamp ? msgData.messageTimestamp * 1000 : Date.now()),
      rawPayload: payload,
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

    const senderPhone = (messageObject.from || '').replace(/[^\d+]/g, '');
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
    };
  }
}
