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

  /**
   * Creates or fetches an instance on Evolution API v2.
   */
  async createInstance(instanceName: string, webhookUrl?: string): Promise<{
    success: boolean;
    instanceName: string;
    status?: string;
    qrcode?: { code?: string; base64?: string; pairingCode?: string };
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
          reject_call: false,
          always_online: true,
          read_messages: false,
        }),
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        // If instance already exists, proceed to fetch status/qr
        if (response.status === 403 || errText.includes('already exists') || errText.includes('in use')) {
          return { success: true, instanceName, status: 'EXISTS' };
        }
        return { success: false, instanceName, error: `HTTP_${response.status}: ${errText}` };
      }

      const resData = await response.json();
      const qrData = resData?.qrcode || resData?.hash || {};

      if (webhookUrl) {
        await this.setWebhook(instanceName, webhookUrl).catch(() => null);
      }

      return {
        success: true,
        instanceName,
        status: resData?.instance?.status || 'CREATED',
        qrcode: {
          code: qrData?.code || resData?.code,
          base64: qrData?.base64 || resData?.base64,
          pairingCode: qrData?.pairingCode || resData?.pairingCode,
        },
      };
    } catch (err: any) {
      return { success: false, instanceName, error: err.message };
    }
  }

  /**
   * Gets connection state for an instance ('CONNECTED' | 'WAITING_QR' | 'DISCONNECTED' | 'ERROR')
   */
  async getConnectionState(instanceName: string): Promise<{
    state: 'CONNECTED' | 'WAITING_QR' | 'DISCONNECTED' | 'ERROR';
    rawState?: string;
    ownerJid?: string;
    phoneNumber?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: this.apiKey },
      });

      if (!response.ok) {
        return { state: 'DISCONNECTED', error: `HTTP_${response.status}` };
      }

      const data = await response.json();
      const rawState = (
        data?.instance?.state ||
        data?.state ||
        data?.status ||
        'close'
      ).toLowerCase();

      const ownerJid = data?.instance?.ownerJid || data?.ownerJid || data?.owner || '';
      let phoneNumber = '';
      if (ownerJid) {
        const rawUser = ownerJid.split('@')[0].split(':')[0];
        const cleanDigits = rawUser.replace(/[^\d]/g, '');
        if (cleanDigits) {
          phoneNumber = `+${cleanDigits}`;
        }
      }

      if (rawState === 'open' || rawState === 'connected') {
        return { state: 'CONNECTED', rawState, ownerJid, phoneNumber };
      }
      if (rawState === 'connecting' || rawState === 'qrcode' || rawState === 'waiting_qr') {
        return { state: 'WAITING_QR', rawState, ownerJid, phoneNumber };
      }

      return { state: 'DISCONNECTED', rawState, ownerJid, phoneNumber };
    } catch (err: any) {
      return { state: 'ERROR', error: err.message };
    }
  }

  /**
   * Requests a fresh QR Code from Evolution API for the instance.
   */
  async getQrCode(instanceName: string): Promise<{
    success: boolean;
    base64?: string;
    code?: string;
    pairingCode?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/connect/${instanceName}`, {
        headers: { apikey: this.apiKey },
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        return { success: false, error: `HTTP_${response.status}: ${errText}` };
      }

      const data = await response.json();
      const base64 = data?.base64 || data?.qrcode?.base64 || '';
      const code = data?.code || data?.qrcode?.code || '';
      const pairingCode = data?.pairingCode || data?.qrcode?.pairingCode || '';

      return { success: true, base64, code, pairingCode };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Sets up or updates the webhook on Evolution API.
   */
  async setWebhook(instanceName: string, webhookUrl: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/webhook/set/${instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: this.apiKey,
        },
        body: JSON.stringify({
          enabled: true,
          url: webhookUrl,
          byEvents: false,
          base64: false,
          events: [
            'MESSAGES_UPSERT',
            'MESSAGES_UPDATE',
            'CONNECTION_UPDATE',
            'QRCODE_UPDATED',
          ],
        }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Logs out or deletes an instance on Evolution API.
   */
  async logoutInstance(instanceName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/instance/logout/${instanceName}`, {
        method: 'DELETE',
        headers: { apikey: this.apiKey },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Fetches instance identity/profile from Evolution API.
   */
  async getInstanceOwnerInfo(instanceName: string): Promise<{
    phoneNumber?: string;
    displayName?: string;
    ownerJid?: string;
  }> {
    try {
      const stateRes = await this.getConnectionState(instanceName);
      if (stateRes.phoneNumber) {
        return {
          phoneNumber: stateRes.phoneNumber,
          ownerJid: stateRes.ownerJid,
          displayName: `WhatsApp (${stateRes.phoneNumber})`,
        };
      }

      const fetchRes = await fetch(`${this.baseUrl}/instance/fetchInstances?instanceName=${instanceName}`, {
        headers: { apikey: this.apiKey },
      });
      if (fetchRes.ok) {
        const instances = await fetchRes.json();
        const inst = Array.isArray(instances)
          ? instances.find((i: any) => i.name === instanceName || i.instanceName === instanceName)
          : instances;
        if (inst) {
          const ownerJid = inst.ownerJid || inst.owner || '';
          const rawUser = ownerJid.split('@')[0].split(':')[0].replace(/[^\d]/g, '');
          if (rawUser) {
            return {
              phoneNumber: `+${rawUser}`,
              ownerJid,
              displayName: inst.profileName || `WhatsApp (+${rawUser})`,
            };
          }
        }
      }
    } catch (e) {
      console.error('getInstanceOwnerInfo exception:', e);
    }
    return {};
  }
}
