/**
 * WILLShop OS — Sales Agent & Context Engine Service
 * Application Layer.
 * Assembles token-budgeted context & generates AI Sales responses via IAIGateway and AIToolsRegistry.
 */

import { IAIGateway } from '../../domain/interfaces/IAIGateway';
import { Customer, Product } from '../../domain/entities/DataCoreEntities';
import { Message } from '../../domain/entities/WhatsAppCRMEntities';
import { AIToolsRegistry, ToolExecutionContextOptions } from './AIToolsRegistry';
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

  private selectModel(userQuery: string): string {
    const defaultHaiku = process.env.ANTHROPIC_HAIKU_MODEL || 'claude-haiku-4-5-20251001';
    const defaultSonnet = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

    const q = userQuery.toLowerCase().trim();

    // 1. Complex Commercial closing, Objections, Negotiations, Orders, Discounts -> Sonnet 5
    const complexPatterns = [
      /cher\b/, /rabais/, /réduction/, /promo/, /négoci/, /remise/,
      /commander/, /achat/, /payer/, /panier/, /facture/, /livrer à/, /livraison à/
    ];

    if (complexPatterns.some((p) => p.test(q))) {
      return defaultSonnet;
    }

    // 2. Simple interactions (Salutations, Thanks, FAQs, Simple Product Info / Stock / Availability queries) -> Haiku 4.5
    const simplePatterns = [
      /^bonjour\b/, /^salut\b/, /^bonsoir\b/, /^coucou\b/, /^hello\b/, /^hi\b/,
      /^merci\b/, /^super\b/, /^d['\s]?accord\b/, /^ok\b/, /^parfait\b/,
      /horaire/, /adresse/, /boutique/, /situé/, /ouvert/, /prix/, /disponible/, /stock/, /avis/, /témoignage/
    ];

    if (simplePatterns.some((p) => p.test(q))) {
      return defaultHaiku;
    }

    // Fallback default to Haiku 4.5 for lightweight chat unless commercial closing
    return defaultHaiku;
  }

  async generateResponse(
    customer: Customer,
    recentMessages: Message[],
    availableProducts: Product[],
    organizationId?: string,
    aiAgentConfig?: any,
    execOptions?: ToolExecutionContextOptions
  ): Promise<{
    responseText: string;
    triggerHandoff: boolean;
    confidence: number;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      cacheCreationInputTokens?: number;
      cacheReadInputTokens?: number;
      totalTokens: number;
      estimatedCostUsd?: number;
      model: string;
    };
  }> {
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
    const selectedModel = this.selectModel(userMessageContent);

    const agentName = aiAgentConfig?.name || 'Sales AI WILLShop';
    const agentTone = aiAgentConfig?.tone || 'Professionnel & Chaleureux';
    const customInstructions = aiAgentConfig?.custom_instructions || aiAgentConfig?.presentation || '';

    const companyInfo = aiAgentConfig?.company_info;
    const paymentMethods = (aiAgentConfig?.payment_methods || []).filter((p: any) => p.status !== 'INACTIVE');
    const faqs = (aiAgentConfig?.faqs || []).filter((f: any) => f.status !== 'ARCHIVED');
    const policies = (aiAgentConfig?.policies || []).filter((p: any) => p.status !== 'INACTIVE');
    const knowledgeBase = (aiAgentConfig?.knowledge_base || []).filter((k: any) => k.status !== 'ARCHIVED');
    const testimonials = (aiAgentConfig?.testimonials || []).filter((t: any) => t.status !== 'ARCHIVED');

    const companyPrompt = companyInfo
      ? `=== IDENTITÉ ENTREPRISE ===
Nom: ${companyInfo.name || 'WILLShop OS'}
Secteur: ${companyInfo.sector || 'Cosmétique & Produits de Beauté'}
Ville: ${companyInfo.city || 'Ouagadougou'}, ${companyInfo.country || 'Burkina Faso'}
Adresse: ${companyInfo.address || 'Koulouba'}
Horaires: ${companyInfo.hours || 'Du Lundi au Samedi: 08h00 - 20h00'}
Description: ${companyInfo.description || ''}
`
      : '';

    const paymentsPrompt = paymentMethods.length > 0
      ? `=== MOYENS DE PAIEMENT ACCEPTÉS ===
${paymentMethods.map((p: any) => `- ${p.name}: ${p.identifier} (${p.instructions || ''})`).join('\n')}
`
      : '';

    const faqsPrompt = faqs.length > 0 || knowledgeBase.length > 0
      ? `=== FOIRE AUX QUESTIONS & CONNAISSANCES MÉTIER ===
${[...faqs, ...knowledgeBase].map((k: any) => `[${k.category || 'FAQ'}] ${k.title || k.question}: ${k.content || k.answer}`).join('\n')}
`
      : '';

    const policiesPrompt = policies.length > 0
      ? `=== POLITIQUES DE LA BOUTIQUE ===
${policies.map((p: any) => `[${p.title}]: ${p.content}`).join('\n')}
`
      : '';

    const testimonialsPrompt = testimonials.length > 0
      ? `=== TÉMOIGNAGES CLIENTS RÉELS ===
${testimonials.map((t: any) => `[Témoignage ID: ${t.id}] ${t.clientName}: "${t.text}"`).join('\n')}
`
      : '';

    const systemPrompt = `Tu es ${agentName}, l'Agent Commercial Virtuel de WILLShop OS.
Ton de communication : ${agentTone}.
${customInstructions ? `INSTRUCTIONS PARTICULIÈRES :\n${customInstructions}\n` : ''}
${companyPrompt}
${paymentsPrompt}
${faqsPrompt}
${policiesPrompt}
${testimonialsPrompt}

REGLES ABSOLUES :
1. Présente toujours les produits avec leurs prix exacts du catalogue.
2. Ne jamais inventer de prix, de stock, de témoignage ou de tarif de livraison.
3. Lorsqu un produit est demandé ou présenté, présente le tarif et utilise l outil send_product_image pour envoyer sa photo officielle au client sur WhatsApp sans lui demander s il souhaite la voir.
4. Si le client a des doutes ou demande des témoignages/avis, utilise search_testimonials ou send_testimonial. Si aucun témoignage n existe, indique-le honnêtement sans en inventer.
5. Si le client demande la livraison dans une zone/quartier, utilise l outil check_delivery_zone.
6. Si le client veut commander ou demande le statut d une commande, utilise les outils mis à ta disposition.
7. Si le client demande un conseiller humain, réponds poliment et utilise l outil escalate_to_human.`;

    const result = await (this.aiGateway as AnthropicAIGateway).generateCompletion({
      agentName,
      model: selectedModel,
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
        const execRes = await this.toolsRegistry.executeTool(toolCall.name, toolCall.input, organizationId, aiAgentConfig, execOptions);
        if (execRes.triggerHandoff) {
          triggerHandoff = true;
        }
      }
    }

    return {
      responseText: result.content || "Merci pour votre message ! Un conseiller est à votre disposition.",
      triggerHandoff,
      confidence: 0.95,
      usage: {
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        cacheCreationInputTokens: result.cacheCreationInputTokens,
        cacheReadInputTokens: result.cacheReadInputTokens,
        totalTokens: result.totalTokens,
        estimatedCostUsd: result.estimatedCostUsd,
        model: result.model,
      },
    };
  }
}
