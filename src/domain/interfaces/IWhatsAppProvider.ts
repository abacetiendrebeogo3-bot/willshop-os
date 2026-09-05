/**
 * WILLShop OS — WhatsApp Provider Abstraction Interface
 * Provider-agnostic interface (Meta Cloud API, Evolution Gateway, etc.)
 * Pure Domain Layer — ZERO external dependencies.
 */

export interface SendTextMessageDTO {
  toPhoneNumber: string;
  messageText: string;
  replyToExternalMessageId?: string;
}

export interface SendMediaMessageDTO {
  toPhoneNumber: string;
  mediaUrl: string;
  mediaType: 'image' | 'audio' | 'video' | 'document';
  caption?: string;
}

export interface WhatsAppSendResult {
  externalMessageId: string;
  status: 'SENT' | 'FAILED';
  errorCode?: string;
}

export interface IWhatsAppProvider {
  sendTextMessage(providerPhoneNumberId: string, dto: SendTextMessageDTO): Promise<WhatsAppSendResult>;
  sendMediaMessage(providerPhoneNumberId: string, dto: SendMediaMessageDTO): Promise<WhatsAppSendResult>;
  markMessageAsRead(providerPhoneNumberId: string, externalMessageId: string): Promise<boolean>;
  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean;
}
