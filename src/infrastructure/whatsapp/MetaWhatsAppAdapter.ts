/**
 * WILLShop OS — Meta WhatsApp Cloud API Provider Adapter
 * Infrastructure Layer.
 * Implements IWhatsAppProvider for official Meta Cloud API v20.0.
 */

import crypto from 'crypto';
import {
  IWhatsAppProvider,
  SendTextMessageDTO,
  SendMediaMessageDTO,
  WhatsAppSendResult,
} from '../../domain/interfaces/IWhatsAppProvider';

export class MetaWhatsAppAdapter implements IWhatsAppProvider {
  private readonly accessToken: string;
  private readonly graphApiVersion: string;

  constructor(accessToken?: string, graphApiVersion = 'v20.0') {
    this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.graphApiVersion = graphApiVersion;
  }

  async sendTextMessage(
    providerPhoneNumberId: string,
    dto: SendTextMessageDTO
  ): Promise<WhatsAppSendResult> {
    const cleanTo = dto.toPhoneNumber.replace(/[^\d]/g, '');

    if (!this.accessToken || !providerPhoneNumberId) {
      console.error('MetaWhatsAppAdapter: Credentials missing');
      return {
        externalMessageId: `wamid.err.${Date.now()}`,
        status: 'FAILED',
        errorCode: 'CREDENTIALS_MISSING',
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${providerPhoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: {
            preview_url: false,
            body: dto.messageText,
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Meta Cloud API error [${response.status}]:`, errorText);
        return {
          externalMessageId: `wamid.err.${Date.now()}`,
          status: 'FAILED',
          errorCode: `HTTP_${response.status}`,
        };
      }

      const resData = await response.json();
      const externalMessageId = resData?.messages?.[0]?.id || `wamid.${Date.now()}`;

      return {
        externalMessageId,
        status: 'SENT',
      };
    } catch (err: any) {
      console.error('MetaWhatsAppAdapter sendTextMessage exception:', err);
      return {
        externalMessageId: `wamid.err.${Date.now()}`,
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

    if (!this.accessToken || !providerPhoneNumberId) {
      return {
        externalMessageId: `wamid.err.${Date.now()}`,
        status: 'FAILED',
        errorCode: 'CREDENTIALS_MISSING',
      };
    }

    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${providerPhoneNumberId}/messages`;
      const payload: Record<string, any> = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanTo,
        type: dto.mediaType,
      };

      payload[dto.mediaType] = {
        link: dto.mediaUrl,
        caption: dto.caption || '',
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          externalMessageId: `wamid.err.${Date.now()}`,
          status: 'FAILED',
          errorCode: `HTTP_${response.status}`,
        };
      }

      const resData = await response.json();
      return {
        externalMessageId: resData?.messages?.[0]?.id || `wamid.media.${Date.now()}`,
        status: 'SENT',
      };
    } catch (err: any) {
      return {
        externalMessageId: `wamid.err.${Date.now()}`,
        status: 'FAILED',
        errorCode: err.message,
      };
    }
  }

  async markMessageAsRead(
    providerPhoneNumberId: string,
    externalMessageId: string
  ): Promise<boolean> {
    if (!this.accessToken) return false;
    try {
      const url = `https://graph.facebook.com/${this.graphApiVersion}/${providerPhoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          status: 'read',
          message_id: externalMessageId,
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
    const appSecret = secret || process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
      console.warn('MetaWhatsAppAdapter: No app secret configured for signature validation');
      return true;
    }
    if (!signature) return false;

    const parts = signature.split('=');
    if (parts.length !== 2 || parts[0] !== 'sha256') {
      return false;
    }

    const expectedSignature = crypto
      .createHmac('sha256', appSecret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(parts[1]), Buffer.from(expectedSignature));
  }
}
