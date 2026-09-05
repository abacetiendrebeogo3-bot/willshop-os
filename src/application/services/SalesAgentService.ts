/**
 * WILLShop OS — Sales Agent & Context Engine Service
 * Application Layer.
 * Assembles token-budgeted context & generates AI Sales responses via provider-agnostic IAIGateway.
 */

import { IAIGateway } from '../../domain/interfaces/IAIGateway';
import { Customer, Product } from '../../domain/entities/DataCoreEntities';
import { Message } from '../../domain/entities/WhatsAppCRMEntities';

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
      .map((p) => `- ${p.name} (SKU: ${p.sku}): ${p.sellingPrice} XOF (Prix fixe)`)
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

    // Truncate to token budget if exceeded
    return rawContext.substring(0, tokenBudget * 4);
  }
}

export class SalesAgentService {
  constructor(
    private readonly aiGateway: IAIGateway,
    private readonly contextService: SalesAgentContextService
  ) {}

  async generateResponse(
    customer: Customer,
    recentMessages: Message[],
    availableProducts: Product[]
  ): Promise<{ responseText: string; triggerHandoff: boolean; confidence: number }> {
    const contextPrompt = this.contextService.buildContext(customer, recentMessages, availableProducts);

    const lastMessage = recentMessages[recentMessages.length - 1];
    const userMessageContent = lastMessage ? lastMessage.content || '' : '';

    // Check for human handoff keywords
    if (userMessageContent.toLowerCase().includes('humain') || userMessageContent.toLowerCase().includes('agent') || userMessageContent.toLowerCase().includes('remboursement')) {
      return {
        responseText: "Je vous mets immédiatement en relation avec un conseiller commercial humain de l'équipe WillShop.",
        triggerHandoff: true,
        confidence: 1.0,
      };
    }

    const result = await this.aiGateway.generateCompletion({
      agentName: 'Sales AI',
      messages: [
        {
          role: 'system',
          content: 'Tu es l Agent Commercial de WillShop. Réponds poliment et présente les produits avec leurs prix exacts. Ne jamais inventer de prix ni de stock.',
        },
        {
          role: 'user',
          content: `${contextPrompt}\n\nMessage client: ${userMessageContent}`,
        },
      ],
      maxTokens: 300,
    });

    return {
      responseText: result.content,
      triggerHandoff: false,
      confidence: 0.95,
    };
  }
}
