/**
 * WILLShop OS — Normalized WhatsApp Event Domain Entities
 * Pure Domain Layer — ZERO external dependencies.
 */

export type WhatsAppProviderType = 'EVOLUTION' | 'META_CLOUD_API';
export type WhatsAppMessageType = 'TEXT' | 'IMAGE' | 'AUDIO' | 'VIDEO' | 'DOCUMENT' | 'BUTTON_REPLY' | 'UNKNOWN';

export interface InboundWhatsAppEvent {
  provider: WhatsAppProviderType;
  providerIdentity: string; // instance (Evolution) or phone_number_id (Meta)
  externalMessageId: string;
  senderPhone: string; // E.164 format without spaces
  senderName: string;
  messageType: WhatsAppMessageType;
  textBody?: string;
  mediaUrl?: string;
  mediaMimeType?: string;
  fromMe: boolean; // True if sent from commercial's WhatsApp app
  timestamp: Date;
  rawPayload: Record<string, any>;
}

export interface NormalizedWhatsAppSendDTO {
  toPhoneNumber: string;
  messageText: string;
  replyToExternalMessageId?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  caption?: string;
}
