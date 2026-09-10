/**
 * WILLShop OS — Sales Agent & Context Engine Service
 * Application Layer.
 * Assembles token-budgeted context & generates AI Sales responses via IAIGateway and AIToolsRegistry.
 */

import { IAIGateway } from '../../domain/interfaces/IAIGateway';
import { Customer, Product } from '../../domain/entities/DataCoreEntities';
import { Message } from '../../domain/entities/WhatsAppCRMEntities';
import { AIToolsRegistry } from './AIToolsRegistry';
import { AnthropicAIGateway } from '../../infrastructure/ai/AnthropicAIGateway';

export interface SalesAgentContext {
  customer: Customer;
  recentMessages: Message[];
  availableProducts: Product[];
  tokenBudget: number;
}

export class SalesAgentContextService {
  /**
   * Assembles token-budgeted context. Uses Storage URLs for media, NEVER base64!
   */
  buildContext(
    customer: Customer,
    recentMessages: Message[],
    availableProducts: Product[],
    tokenBudget = 1000
  ): string {
    const customerInfo = `Client: ${customer.fullName} (${customer.phone}) - Statut: ${customer.status}`;

    const productsInfo = availableProducts
      .map((p) => `- ID: ${p.id} | ${p.name} (SKU: ${p.sku}): ${p.sellingPrice} XOF (Prix fixe)` )
      .join('\n');

    const historyInfo = recentMessages
      .slice(-5)
      .map((m) => `[${m.senderType}]: ${m.content || m.mediaUrl || ''}`)
      .join('\n');

    const rawContext = `=== CONTEXTE COMMERCIAL WILLSHOP ===
${customerInfo}

=== PRODUITS AUTORISÉS (PRIX STRICTS - NE JAMAIS INVENTER) ===
${productsInfo}

=== HISTORIQUE RÉCENT ===
${historyInfo}
`;

    return rawContext.substring(0, tokenBudget * 4);
  }
}

export class SalesAgentService {
  constructor(
    private readonly aiGateway: IAIGateway,
    private readonly contextService: SalesAgentContextService,
    private readonly toolsRegistry?: AIToolsRegistry
  ) {}

  async generateResponse(
    customer: Customer,
    recentMessages: Message[],
    availableProducts: Product[],
    organizationId?: string,
    aiAgentConfig?: any
  ): Promise<{ responseText: string; triggerHandoff: boolean; confidence: number }> {
    const contextPrompt = this.contextService.buildContext(customer, recentMessages, availableProducts);

    const lastMessage = recentMessages[recentMessages.length - 1];
    const userMessageContent = lastMessage ? lastMessage.content || '' : '';

    // Check for human handoff keywords directly
    if (
      userMessageContent.toLowerCase().includes('humain') ||
      userMessageContent.toLowerCase().includes('agent') ||
      userMessageContent.toLowerCase().includes('remboursement')
    ) {
      return {
        responseText: "Je vous mets immédiatement en relation avec un conseiller commercial humain de l'équipe WillShop.",
        triggerHandoff: true,
        confidence: 1.0,
      };
    }

    const toolDefs = AIToolsRegistry.getToolDefinitions();

    const agentName = aiAgentConfig?.name || 'Sales AI WILLShop';
    const agentTone = aiAgentConfig?.tone || 'Professionnel & Chaleureux';
    const customInstructions = aiAgentConfig?.custom_instructions || aiAgentConfig?.presentation || '';

    const systemPrompt = `Tu es ${agentName}, l'Agent Commercial Virtuel de WILLShop OS.
Ton de communication : ${agentTone}.
${customInstructions ? `INSTRUCTIONS PARTICULIÈRES :\n${customInstructions}\n` : ''}
REGLES ABSOLUES :
1. Présente toujours les produits avec leurs prix exacts du catalogue.
2. Ne jamais inventer de prix ni de stock.
3. Si le client veut commander ou demande le statut d'une commande, utilise les outils mis à ta disposition.
4. Si le client demande un conseiller humain, réponds poliment et utilise l'outil escalate_to_human.`;

    const result = await (this.aiGateway as AnthropicAIGateway).generateCompletion({
      agentName,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `${contextPrompt}\n\nMessage client: ${userMessageContent}`,
        },
      ],
      tools: toolDefs,
      maxTokens: 400,
    });

    let triggerHandoff = false;

    // Handle tool execution if LLM requested a tool call
    if (result.toolCalls && result.toolCalls.length > 0 && this.toolsRegistry && organizationId) {
      for (const toolCall of result.toolCalls) {
        const execRes = await this.toolsRegistry.executeTool(toolCall.name, toolCall.input, organizationId);
        if (execRes.triggerHandoff) {
          triggerHandoff = true;
        }
      }
    }

    return {
      responseText: result.content || "Merci pour votre message ! Un conseiller est à votre disposition.",
      triggerHandoff,
      confidence: 0.95,
    };
  }
}
