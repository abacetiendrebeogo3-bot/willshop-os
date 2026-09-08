/**
 * WILLShop OS — Evolution API WhatsApp Provider Adapter
 * Infrastructure Layer.
 * Implements IWhatsAppProvider for Baileys / Evolution Gateway.
 */

import {
  IWhatsAppProvider,
  SendTextMessageDTO,
  SendMediaMessageDTO,
  WhatsAppSendResult,
} from '../../domain/interfaces/IWhatsAppProvider';

export class EvolutionWhatsAppAdapter implements IWhatsAppProvider {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(baseUrl?: string, apiKey?: string) {
    this.baseUrl = baseUrl || process.env.EVOLUTION_API_URL || 'https://evolution-api-production-8adef.up.railway.app';
    this.apiKey = apiKey || process.env.EVOLUTION_API_KEY || '';
  }

  async sendTextMessage(
    providerPhoneNumberId: string,
    dto: SendTextMessageDTO
  ): Promise<WhatsAppSendResult> {
    const cleanTo = dto.toPhoneNumber.replace(/[^\d]/g, '');
    const instance = providerPhoneNumberId;

    try {
      const response = await fetch(`${this.baseUrl}/message/sendText/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number: cleanTo,
          textMessage: { text: dto.messageText },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Evolution API sendTextMessage failed [${response.status}]:`, errorText);
        return {
          externalMessageId: `EVO-ERR-${Date.now()}`,
          status: 'FAILED',
          errorCode: `HTTP_${response.status}`,
        };
      }

      const resData = await response.json();
      const externalMessageId = resData?.key?.id || resData?.id || `EVO-SENT-${Date.now()}`;

      return {
        externalMessageId,
        status: 'SENT',
      };
    } catch (err: any) {
      console.error('Evolution API sendTextMessage exception:', err);
      return {
        externalMessageId: `EVO-ERR-${Date.now()}`,
        status: 'FAILED',
        errorCode: err.message,
      };
    }
  }

  async sendMediaMessage(
    providerPhoneNumberId: string,
    dto: SendMediaMessageDTO
  ): Promise<WhatsAppSendResult> {
    const cleanTo = dto.toPhoneNumber.replace(/[^\d]/g, '');
    const instance = providerPhoneNumberId;

    try {
      const response = await fetch(`${this.baseUrl}/message/sendMedia/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          number: cleanTo,
          mediaMessage: {
            mediatype: dto.mediaType,
            media: dto.mediaUrl,
            caption: dto.caption || '',
          },
        }),
      });

      if (!response.ok) {
        return {
          externalMessageId: `EVO-ERR-${Date.now()}`,
          status: 'FAILED',
          errorCode: `HTTP_${response.status}`,
        };
      }

      const resData = await response.json();
      return {
        externalMessageId: resData?.key?.id || `EVO-MEDIA-${Date.now()}`,
        status: 'SENT',
      };
    } catch (err: any) {
      return {
        externalMessageId: `EVO-ERR-${Date.now()}`,
        status: 'FAILED',
        errorCode: err.message,
      };
    }
  }

  async markMessageAsRead(
    providerPhoneNumberId: string,
    externalMessageId: string
  ): Promise<boolean> {
    try {
      const instance = providerPhoneNumberId;
      const response = await fetch(`${this.baseUrl}/chat/markMessageAsRead/${instance}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          read: true,
          messageId: externalMessageId,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    const expectedKey = secret || this.apiKey;
    if (!expectedKey) return true; // Optional check if key is unconfigured
    return signature === expectedKey || signature.includes(expectedKey);
  }
}
