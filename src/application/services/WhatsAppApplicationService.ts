/**
 * WILLShop OS — WhatsApp Application Orchestrator Service
 * Application Layer.
 * Manages event normalization, org resolution, idempotency, conversation modes (AI_ACTIVE vs HUMAN_ACTIVE),
 * audio transcription, smartphone sync (fromMe), AI trigger, and provider response delivery.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { InboundWhatsAppEvent } from '../../domain/entities/WhatsAppEventEntities';
import { IWhatsAppProvider } from '../../domain/interfaces/IWhatsAppProvider';
import { SalesAgentService, SalesAgentContextService } from './SalesAgentService';
import { AnthropicAIGateway } from '../../infrastructure/ai/AnthropicAIGateway';
import { AIToolsRegistry } from './AIToolsRegistry';
import { SupabaseProductRepository } from '../../infrastructure/repositories/SupabaseDataCoreRepositories';
import { InMemoryOrderRepository } from '../../infrastructure/repositories/InMemoryDataCoreRepositories';
import { CreateOrderService } from './OrderStockApplicationServices';

export class WhatsAppApplicationService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly providerAdapter: IWhatsAppProvider
  ) {}

  /**
   * Transcribes an audio buffer server-side via Whisper API (OpenAI or Groq).
   */
  private async transcribeAudioBuffer(audioBuffer: Buffer, fileName: string): Promise<string | null> {
    const apiKey = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
    if (!apiKey) return null;

    const endpoint = process.env.OPENAI_API_KEY
      ? 'https://api.openai.com/v1/audio/transcriptions'
      : 'https://api.groq.com/openai/v1/audio/transcriptions';
    const model = process.env.OPENAI_API_KEY ? 'whisper-1' : 'whisper-large-v3';

    try {
      const formData = new FormData();
      const uint8 = new Uint8Array(audioBuffer);
      const blob = new Blob([uint8], { type: 'audio/ogg' });
      formData.append('file', blob, fileName);
      formData.append('model', model);
      formData.append('language', 'fr');

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!res.ok) {
        console.warn(`[Whisper API Error] Status ${res.status}`);
        return null;
      }

      const data = await res.json();
      return data.text ? data.text.trim() : null;
    } catch (err) {
      console.warn('[Transcription Exception]', err);
      return null;
    }
  }

  /**
   * Processes an incoming normalized WhatsApp event.
   */
  async processInboundEvent(event: InboundWhatsAppEvent): Promise<{
    status: 'SUCCESS' | 'IGNORED' | 'ERROR';
    message: string;
    organizationId?: string;
    conversationId?: string;
  }> {
    // 1. Strict Organization Resolution
    const providerIdentity = event.providerIdentity ? event.providerIdentity.trim() : '';
    if (!providerIdentity) {
      console.error('[WEBHOOK_REJECTED] providerIdentity missing from inbound event');
      return {
        status: 'ERROR',
        message: 'REJETÉ: providerIdentity absent de l événement entrant.',
      };
    }

    const { data: numRow } = await this.supabase
      .from('whatsapp_numbers')
      .select('organization_id, id, status')
      .or(`provider_identity.eq.${providerIdentity},provider_phone_number_id.eq.${providerIdentity},phone_number.eq.${providerIdentity}`)
      .eq('status', 'ACTIVE')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!numRow || !numRow.organization_id) {
      console.error(`[WEBHOOK_REJECTED] Strict organization lookup failed for providerIdentity '${providerIdentity}'`);
      return {
        status: 'ERROR',
        message: `REJETÉ: Aucune organisation active enregistrée pour providerIdentity '${providerIdentity}'`,
      };
    }

    const targetOrgId = numRow.organization_id;
    const whatsappNumberId = numRow.id;

    // 2. Idempotency Check on external_message_id
    if (event.externalMessageId) {
      const { data: existingMsg } = await this.supabase
        .from('messages')
        .select('id')
        .eq('organization_id', targetOrgId)
        .eq('external_message_id', event.externalMessageId)
        .maybeSingle();

      if (existingMsg) {
        return {
          status: 'IGNORED',
          message: `Duplicate external message ID '${event.externalMessageId}' ignored`,
          organizationId: targetOrgId,
        };
      }
    }

    // 3. Lookup or Create Customer
    let customerId = '';
    const { data: existingCust } = await this.supabase
      .from('customers')
      .select('id')
      .eq('organization_id', targetOrgId)
      .eq('phone', event.senderPhone)
      .maybeSingle();

    if (existingCust) {
      customerId = existingCust.id;
    } else {
      const { data: newCust } = await this.supabase
        .from('customers')
        .insert({
          organization_id: targetOrgId,
          first_name: event.senderName || `Client ${event.senderPhone.slice(-4)}`,
          last_name: 'WhatsApp',
          phone: event.senderPhone,
          status: 'ACTIVE',
        })
        .select()
        .single();

      if (newCust) customerId = newCust.id;
    }

    // 4. Lookup or Create Conversation
    let conversationId = '';
    let conversationMode: 'AI_ACTIVE' | 'HUMAN_ACTIVE' | 'ESCALATED' | 'PAUSED' = 'AI_ACTIVE';

    const { data: existingConv } = await this.supabase
      .from('conversations')
      .select('id, conversation_mode, assigned_agent')
      .eq('organization_id', targetOrgId)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConv) {
      conversationId = existingConv.id;
      conversationMode = (existingConv.conversation_mode as any) || 'AI_ACTIVE';

      await this.supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString(), status: 'OPEN' })
        .eq('id', conversationId);
    } else {
      const initialMode = event.fromMe ? 'HUMAN_ACTIVE' : 'AI_ACTIVE';
      const { data: newConv } = await this.supabase
        .from('conversations')
        .insert({
          organization_id: targetOrgId,
          customer_id: customerId || null,
          whatsapp_number_id: whatsappNumberId,
          channel: 'WHATSAPP',
          status: 'OPEN',
          conversation_mode: initialMode,
          assigned_agent: 'SALES_AI',
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (newConv) {
        conversationId = newConv.id;
        conversationMode = initialMode;
      }
    }

    // 5. Handle Smartphone Sync (fromMe === true)
    if (event.fromMe) {
      const { error: insertErr } = await this.supabase.from('messages').insert({
        organization_id: targetOrgId,
        conversation_id: conversationId,
        customer_id: customerId || null,
        direction: 'OUTBOUND',
        sender_type: 'HUMAN',
        sender_id: event.senderPhone,
        message_type: event.messageType,
        content: event.textBody || '[Media]',
        external_message_id: event.externalMessageId,
        status: 'SENT',
      });

      if (insertErr && (insertErr.code === '23505' || insertErr.message.includes('unique'))) {
        return {
          status: 'IGNORED',
          message: 'Duplicate smartphone message ignored.',
          organizationId: targetOrgId,
          conversationId,
        };
      }

      await this.supabase
        .from('conversations')
        .update({ conversation_mode: 'HUMAN_ACTIVE', assigned_agent: 'HUMAN' })
        .eq('id', conversationId);

      return {
        status: 'SUCCESS',
        message: 'Synced smartphone message (fromMe). Conversation switched to HUMAN_ACTIVE.',
        organizationId: targetOrgId,
        conversationId,
      };
    }

    // 6. Handle AUDIO Messages (WhatsApp Voice Notes)
    if (event.messageType === 'AUDIO') {
      let audioUrl = event.mediaUrl || '';
      let transcribedText: string | null = null;

      if (audioUrl) {
        try {
          const audioRes = await fetch(audioUrl);
          if (audioRes.ok) {
            const arrayBuf = await audioRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);

            const fileName = `audio_${Date.now()}.ogg`;
            const storagePath = `${targetOrgId}/${fileName}`;
            const { error: upErr } = await this.supabase.storage
              .from('whatsapp-media')
              .upload(storagePath, buffer, { contentType: 'audio/ogg', upsert: true });

            if (!upErr) {
              const { data: urlData } = this.supabase.storage
                .from('whatsapp-media')
                .getPublicUrl(storagePath);
              if (urlData?.publicUrl) {
                audioUrl = urlData.publicUrl;
              }
            }

            transcribedText = await this.transcribeAudioBuffer(buffer, fileName);
          }
        } catch (audioErr) {
          console.warn('[Audio Processing Warning]', audioErr);
        }
      }

      if (transcribedText && transcribedText.length >= 2) {
        event.textBody = transcribedText;
        await this.supabase.from('messages').insert({
          organization_id: targetOrgId,
          conversation_id: conversationId,
          customer_id: customerId || null,
          direction: 'INBOUND',
          sender_type: 'CUSTOMER',
          sender_id: event.senderPhone,
          message_type: 'AUDIO',
          content: transcribedText,
          media_url: audioUrl || null,
          external_message_id: event.externalMessageId,
          status: 'RECEIVED',
          metadata: {
            transcription_status: 'COMPLETED',
            transcription: transcribedText,
          },
        });
      } else {
        // Audio is inaudible or failed transcription -> Human Escalation Safeguard!
        await this.supabase.from('messages').insert({
          organization_id: targetOrgId,
          conversation_id: conversationId,
          customer_id: customerId || null,
          direction: 'INBOUND',
          sender_type: 'CUSTOMER',
          sender_id: event.senderPhone,
          message_type: 'AUDIO',
          content: '[Message vocal inaudible / non transcrit]',
          media_url: audioUrl || null,
          external_message_id: event.externalMessageId,
          status: 'RECEIVED',
          metadata: {
            transcription_status: 'INCOMPREHENSIBLE',
          },
        });

        await this.supabase.from('human_handoffs').insert({
          organization_id: targetOrgId,
          conversation_id: conversationId,
          reason: 'Message vocal client inaudible ou impossible à transcrire',
          status: 'PENDING',
        });

        await this.supabase
          .from('conversations')
          .update({ conversation_mode: 'ESCALATED', assigned_agent: 'HUMAN' })
          .eq('id', conversationId);

        const takeoverMsg = "Je vais vous mettre en relation avec un conseiller commercial pour mieux répondre à votre vocal.";
        const sendRes = await this.providerAdapter.sendTextMessage(providerIdentity, {
          toPhoneNumber: event.senderPhone,
          messageText: takeoverMsg,
        });

        await this.supabase.from('messages').insert({
          organization_id: targetOrgId,
          conversation_id: conversationId,
          direction: 'OUTBOUND',
          sender_type: 'AI',
          sender_id: 'SALES_AI',
          message_type: 'TEXT',
          content: takeoverMsg,
          external_message_id: sendRes.status === 'SENT' ? sendRes.externalMessageId : null,
          status: sendRes.status === 'SENT' ? 'SENT' : 'FAILED',
        });

        return {
          status: 'SUCCESS',
          message: 'Message vocal inaudible. Escaladé vers un conseiller humain sans hallucination IA.',
          organizationId: targetOrgId,
          conversationId,
        };
      }
    } else {
      // Standard Inbound Customer Message (TEXT / IMAGE / etc.)
      const { error: msgErr } = await this.supabase.from('messages').insert({
        organization_id: targetOrgId,
        conversation_id: conversationId,
        customer_id: customerId || null,
        direction: 'INBOUND',
        sender_type: 'CUSTOMER',
        sender_id: event.senderPhone,
        message_type: event.messageType,
        content: event.textBody || '[Media]',
        media_url: event.mediaUrl || null,
        external_message_id: event.externalMessageId,
        status: 'RECEIVED',
      });

      if (msgErr && (msgErr.code === '23505' || msgErr.message.includes('unique'))) {
        return {
          status: 'IGNORED',
          message: `Duplicate external_message_id '${event.externalMessageId}' ignored.`,
          organizationId: targetOrgId,
          conversationId,
        };
      }
    }

    // 7. Check if AI Auto-Reply is Suppressed
    if (conversationMode === 'HUMAN_ACTIVE' || conversationMode === 'ESCALATED' || conversationMode === 'PAUSED') {
      return {
        status: 'SUCCESS',
        message: `Inbound message saved. AI response suppressed because conversation_mode is '${conversationMode}'`,
        organizationId: targetOrgId,
        conversationId,
      };
    }

    // 8. Execute AI Agent Completion (AI_ACTIVE)
    try {
      const { data: products } = await this.supabase
        .from('products')
        .select('*')
        .eq('organization_id', targetOrgId);

      const availableProducts = (products || []).map((p) => ({
        id: p.id,
        organizationId: targetOrgId,
        sku: p.sku || 'SKU-001',
        name: p.name,
        category: p.category || 'GENERAL',
        purchasePrice: Number(p.purchase_price || 0),
        sellingPrice: Number(p.selling_price || 0),
        currency: 'XOF',
        minimumStock: Number(p.alert_threshold || 5),
        unit: 'unités',
        status: p.status || 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const { data: historyMsgs } = await this.supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      const mappedMsgs = (historyMsgs || []).map((m) => ({
        id: m.id,
        organizationId: targetOrgId,
        conversationId: m.conversation_id,
        direction: m.direction,
        senderType: m.sender_type,
        messageType: m.message_type,
        content: m.content || '',
        status: m.status,
        metadata: m.metadata || {},
        sentAt: new Date(m.created_at),
        createdAt: new Date(m.created_at),
      }));

      const mockCustomer = {
        id: customerId,
        organizationId: targetOrgId,
        firstName: event.senderName || 'Client',
        lastName: event.senderPhone.slice(-4),
        fullName: event.senderName || `Client ${event.senderPhone.slice(-4)}`,
        phone: event.senderPhone,
        city: 'Ouagadougou',
        source: 'WHATSAPP',
        status: 'ACTIVE' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const { data: orgData } = await this.supabase
        .from('organizations')
        .select('settings')
        .eq('id', targetOrgId)
        .single();

      const aiConfig = orgData?.settings?.ai_agent_config || {};

      if (aiConfig.enabled === false) {
        return {
          status: 'SUCCESS',
          message: 'Inbound message saved. AI response suppressed: AI Agent is disabled in organization settings.',
          organizationId: targetOrgId,
          conversationId,
        };
      }

      // Check Operating Schedule
      if (aiConfig.schedule?.active) {
        const startTime = aiConfig.schedule.startTime || '08:00';
        const endTime = aiConfig.schedule.endTime || '20:00';
        const timezone = aiConfig.schedule.timezone || 'Africa/Ouagadougou';

        try {
          const timeFormatter = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          const currentTime = timeFormatter.format(new Date());

          if (currentTime < startTime || currentTime > endTime) {
            console.log(`[AI BLOCKED — OUTSIDE HOURS] Current: ${currentTime}, Range: ${startTime} - ${endTime}`);
            return {
              status: 'SUCCESS',
              message: `AI BLOCKED — OUTSIDE CONFIGURED HOURS (${startTime} - ${endTime} ${timezone})`,
              organizationId: targetOrgId,
              conversationId,
            };
          }
        } catch (scheduleErr: any) {
          console.warn('[Schedule Check Warning]', scheduleErr);
        }
      }

      const productRepo = new SupabaseProductRepository(this.supabase);
      const orderRepo = new InMemoryOrderRepository();
      const dummyAuditRepo: any = { log: async () => {} };
      const dummyEventRepo: any = { publish: async () => {} };

      const createOrderService = new CreateOrderService(orderRepo, productRepo, dummyAuditRepo, dummyEventRepo);
      const toolsRegistry = new AIToolsRegistry(productRepo, orderRepo, createOrderService);

      const aiGateway = new AnthropicAIGateway();
      const contextService = new SalesAgentContextService();
      const salesAgentService = new SalesAgentService(aiGateway, contextService, toolsRegistry);

      const execOptions = {
        supabase: this.supabase,
        providerAdapter: this.providerAdapter,
        providerIdentity,
        destinationPhone: event.senderPhone,
        conversationId,
      };

      const aiResult = await salesAgentService.generateResponse(
        mockCustomer,
        mappedMsgs,
        availableProducts,
        targetOrgId,
        aiConfig,
        execOptions
      );

      // 9. Send Outbound Message via Provider Adapter FIRST
      const sendResult = await this.providerAdapter.sendTextMessage(providerIdentity, {
        toPhoneNumber: event.senderPhone,
        messageText: aiResult.responseText,
      });

      const isSentOk = sendResult.status === 'SENT';

      if (!isSentOk) {
        console.error(`[OUTBOUND_WHATSAPP_FAILED] Evolution API send failed [${sendResult.errorCode}] for ${event.senderPhone}`);
      }

      // 10. Save Outbound AI Response
      await this.supabase.from('messages').insert({
        organization_id: targetOrgId,
        conversation_id: conversationId,
        customer_id: customerId || null,
        direction: 'OUTBOUND',
        sender_type: 'AI',
        sender_id: 'SALES_AI',
        message_type: 'TEXT',
        content: aiResult.responseText,
        external_message_id: isSentOk ? sendResult.externalMessageId : null,
        status: isSentOk ? 'SENT' : 'FAILED',
        error_code: isSentOk ? null : (sendResult.errorCode || 'OUTBOUND_FAILED'),
      });

      // Handle Handoff if triggered by AI
      if (aiResult.triggerHandoff) {
        await this.supabase.from('human_handoffs').insert({
          organization_id: targetOrgId,
          conversation_id: conversationId,
          reason: 'Le client demande un conseiller humain',
          status: 'PENDING',
        });

        await this.supabase
          .from('conversations')
          .update({ conversation_mode: 'ESCALATED', assigned_agent: 'HUMAN' })
          .eq('id', conversationId);
      }

      return {
        status: 'SUCCESS',
        message: 'Inbound message processed and AI response sent via provider.',
        organizationId: targetOrgId,
        conversationId,
      };
    } catch (aiErr: any) {
      console.warn(`[AI_RESPONSE_BLOCKED] ${aiErr.message}`);
      return {
        status: 'SUCCESS',
        message: `Message entrant enregistré. Réponse IA bloquée : ${aiErr.message}`,
        organizationId: targetOrgId,
        conversationId,
      };
    }
  }
}
