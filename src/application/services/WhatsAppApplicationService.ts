/**
 * WILLShop OS — WhatsApp Application Orchestrator Service
 * Application Layer.
 * Manages event normalization, org resolution, idempotency, conversation modes (AI_ACTIVE vs HUMAN_ACTIVE),
 * smartphone sync (fromMe), AI trigger, and provider response delivery.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { InboundWhatsAppEvent } from '../../domain/entities/WhatsAppEventEntities';
import { IWhatsAppProvider } from '../../domain/interfaces/IWhatsAppProvider';
import { SalesAgentService, SalesAgentContextService } from './SalesAgentService';
import { AnthropicAIGateway } from '../../infrastructure/ai/AnthropicAIGateway';

export class WhatsAppApplicationService {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly providerAdapter: IWhatsAppProvider
  ) {}

  /**
   * Processes an incoming normalized WhatsApp event.
   */
  async processInboundEvent(event: InboundWhatsAppEvent): Promise<{
    status: 'SUCCESS' | 'IGNORED' | 'ERROR';
    message: string;
    organizationId?: string;
    conversationId?: string;
  }> {
    // 1. Resolve Organization ID with robust fallback chain
    const providerIdentity = event.providerIdentity || 'willshop_pilot';
    let targetOrgId = '';
    let whatsappNumberId: string | null = null;

    // Stage A: Exact match on whatsapp_numbers
    const { data: numRow } = await this.supabase
      .from('whatsapp_numbers')
      .select('organization_id, id, phone_number')
      .or(`provider_identity.eq.${providerIdentity},provider_phone_number_id.eq.${providerIdentity},phone_number.eq.${providerIdentity}`)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (numRow?.organization_id) {
      targetOrgId = numRow.organization_id;
      whatsappNumberId = numRow.id;
    } else {
      // Stage B: Any EVOLUTION row in whatsapp_numbers
      const { data: fallbackNumRow } = await this.supabase
        .from('whatsapp_numbers')
        .select('organization_id, id')
        .eq('provider', 'EVOLUTION')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (fallbackNumRow?.organization_id) {
        targetOrgId = fallbackNumRow.organization_id;
        whatsappNumberId = fallbackNumRow.id;
      } else {
        // Stage C: Single active organization in organizations table
        const { data: singleOrg } = await this.supabase
          .from('organizations')
          .select('id')
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (singleOrg?.id) {
          targetOrgId = singleOrg.id;
        }
      }
    }

    if (!targetOrgId) {
      return {
        status: 'ERROR',
        message: `No organization found for provider identity '${providerIdentity}'`,
      };
    }

    // 2. Idempotency Check on external_message_id (Application pre-check)
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
      // Save outgoing message sent manually by sales rep from smartphone
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
          message: 'Duplicate smartphone message ignored (Database unique constraint).',
          organizationId: targetOrgId,
          conversationId,
        };
      }

      // Switch conversation mode to HUMAN_ACTIVE and stop AI
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

    // 6. Save Inbound Customer Message (Protected by Postgres Unique Index for concurrent hits)
    const { error: msgErr } = await this.supabase.from('messages').insert({
      organization_id: targetOrgId,
      conversation_id: conversationId,
      customer_id: customerId || null,
      direction: 'INBOUND',
      sender_type: 'CUSTOMER',
      sender_id: event.senderPhone,
      message_type: event.messageType,
      content: event.textBody || '[Media]',
      external_message_id: event.externalMessageId,
      status: 'RECEIVED',
    });

    if (msgErr && (msgErr.code === '23505' || msgErr.message.includes('unique'))) {
      return {
        status: 'IGNORED',
        message: `Concurrent duplicate external_message_id '${event.externalMessageId}' caught by database constraint. Ignored.`,
        organizationId: targetOrgId,
        conversationId,
      };
    }

    // 7. Check if AI Auto-Reply is Suppressed (HUMAN_ACTIVE, ESCALATED, or PAUSED)
    if (conversationMode === 'HUMAN_ACTIVE' || conversationMode === 'ESCALATED' || conversationMode === 'PAUSED') {
      return {
        status: 'SUCCESS',
        message: `Inbound message saved. AI response suppressed because conversation_mode is '${conversationMode}'`,
        organizationId: targetOrgId,
        conversationId,
      };
    }

    // 8. Execute AI Agent Completion (AI_ACTIVE)
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
      metadata: {},
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

    const aiGateway = new AnthropicAIGateway();
    const contextService = new SalesAgentContextService();
    const salesAgentService = new SalesAgentService(aiGateway, contextService);

    const aiResult = await salesAgentService.generateResponse(
      mockCustomer,
      mappedMsgs,
      availableProducts,
      targetOrgId,
      orgData?.settings?.ai_agent_config
    );

    // 9. Save Outbound AI Response
    await this.supabase.from('messages').insert({
      organization_id: targetOrgId,
      conversation_id: conversationId,
      customer_id: customerId || null,
      direction: 'OUTBOUND',
      sender_type: 'AI',
      sender_id: 'SALES_AI',
      message_type: 'TEXT',
      content: aiResult.responseText,
      status: 'SENT',
    });

    // 10. Send Outbound Message via Provider Adapter
    await this.providerAdapter.sendTextMessage(providerIdentity, {
      toPhoneNumber: event.senderPhone,
      messageText: aiResult.responseText,
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
  }
}
