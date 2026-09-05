/**
 * WILLShop OS — Meta WhatsApp Cloud API Provider Adapter
 * Infrastructure Layer.
 */

import {
  IWhatsAppProvider,
  SendTextMessageDTO,
  SendMediaMessageDTO,
  WhatsAppSendResult,
} from '../../domain/interfaces/IWhatsAppProvider';

export class MetaWhatsAppAdapter implements IWhatsAppProvider {
  async sendTextMessage(
    providerPhoneNumberId: string,
    dto: SendTextMessageDTO
  ): Promise<WhatsAppSendResult> {
    // Infrastructure level call to Meta Cloud API endpoint
    const mockExternalId = `wamid.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`;
    return {
      externalMessageId: mockExternalId,
      status: 'SENT',
    };
  }

  async sendMediaMessage(
    providerPhoneNumberId: string,
    dto: SendMediaMessageDTO
  ): Promise<WhatsAppSendResult> {
    const mockExternalId = `wamid.media.${Date.now()}.${Math.random().toString(36).substring(2, 8)}`;
    return {
      externalMessageId: mockExternalId,
      status: 'SENT',
    };
  }

  async markMessageAsRead(
    providerPhoneNumberId: string,
    externalMessageId: string
  ): Promise<boolean> {
    return true;
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    if (!signature || !secret) return false;
    // Mock signature validation helper
    return true;
  }
}
