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

export interface SanitizerMetrics {
  sanitizer_checked_count: number;
  sanitizer_blocked_count: number;
  sanitizer_false_positive_count: number;
  sanitizer_regeneration_count: number;
  sanitizer_handoff_count: number;
}

export const globalSanitizerMetrics: SanitizerMetrics = {
  sanitizer_checked_count: 0,
  sanitizer_blocked_count: 0,
  sanitizer_false_positive_count: 0,
  sanitizer_regeneration_count: 0,
  sanitizer_handoff_count: 0,
};

/**
 * Post-processes AI output to eliminate any internal context leakage, diagnostic text,
 * meta-reasoning, or XML tags before sending to WhatsApp.
 */
export function sanitizeResponseText(rawText: string): { cleanedText: string; hasLeak: boolean } {
  globalSanitizerMetrics.sanitizer_checked_count++;

  if (!rawText || !rawText.trim()) {
    return {
      cleanedText: "Bonjour ! Bienvenue chez WillShop. 😊 Comment puis-je vous aider aujourd'hui ?",
      hasLeak: false,
    };
  }

  let cleaned = rawText.trim();

  // 1. Strip XML tags if present
  cleaned = cleaned
    .replace(/<internal_context>[\s\S]*?<\/internal_context>/gi, '')
    .replace(/<customer_message>[\s\S]*?<\/customer_message>/gi, '')
    .replace(/<marketing_attribution>[\s\S]*?<\/marketing_attribution>/gi, '')
    .replace(/<\/?(?:internal_context|customer_message|marketing_attribution|instructions_commerciales)>/gi, '')
    .trim();

  // 2. Precise leak & diagnostic patterns (avoiding single word false positives)
  const SPECIFIC_LEAK_PATTERNS = [
    /incohérence dans le contexte/i,
    /je remarque une incohérence/i,
    /clarification nécessaire/i,
    /selon le message (?:client )?fourni/i,
    /voici ce que je sais/i,
    /dois-je procéder/i,
    /dernier message indiqué comme/i,
    /escalade humaine en cours/i,
    /contexte interne/i,
    /d'après le contexte/i,
    /d'après les données internes/i,
    /d'après l'historique interne/i,
    /en tant qu'ia/i,
    /en tant qu'intelligence artificielle/i,
    /mon prompt/i,
    /mes instructions/i,
    /modèle claude/i,
    /base de données/i,
    /système d'orchestration/i,
    /le client a-t-il/i,
    /faut-il que je/i,
    /ou y a-t-il une/i,
    /marketing_attribution/i,
  ];

  const hasLeak = SPECIFIC_LEAK_PATTERNS.some((pattern) => pattern.test(cleaned));

  if (hasLeak) {
    globalSanitizerMetrics.sanitizer_blocked_count++;
    console.warn('[SECURITY SANITIZER] Internal context leak or diagnostic phrase detected in raw AI output. Filtering response.');

    const splitLines = cleaned.split('\n').map((l) => l.trim()).filter(Boolean);
    const safeLines = splitLines.filter(
      (line) => !SPECIFIC_LEAK_PATTERNS.some((p) => p.test(line)) && !/^\d+[\.\)]/.test(line)
    );

    if (safeLines.length > 0 && safeLines.join(' ').length > 15 && !safeLines.some((l) => SPECIFIC_LEAK_PATTERNS.some((p) => p.test(l)))) {
      cleaned = safeLines.join('\n');
    } else {
      cleaned = "Bonjour ! Bienvenue chez WillShop. 😊 Comment puis-je vous aider aujourd'hui ?";
    }
  }

  return { cleanedText: cleaned, hasLeak };
}

export class SalesAgentContextService {
  /**
   * Assembles token-budgeted internal context. Uses Storage URLs for media, NEVER base64!
   */
  buildContext(
    customer: Customer,
    recentMessages: Message[],
    availableProducts: Product[],
    adAttribution?: any,
    tokenBudget = 1000
  ): string {
    const customerInfo = `Client: ${customer.fullName} (${customer.phone}) - Statut: ${customer.status}`;

    const productsInfo = availableProducts
      .map((p) => `- ID: ${p.id} | ${p.name} (SKU: ${p.sku}): ${p.sellingPrice} XOF (Prix fixe) ${p.minimumStock > 0 ? `| Stock: ${p.minimumStock}` : '| SUR COMMANDE'}`)
      .join('\n');

    let attributionBlock = '';
    if (adAttribution && adAttribution.confidence !== 'UNKNOWN' && adAttribution.source !== 'UNKNOWN') {
      attributionBlock = `
=== ATTRIBUTION MARKETING ET PROVENANCE PROSPECT ===
<marketing_attribution>
source: ${adAttribution.source}
platform: ${adAttribution.platform || 'META_ADS'}
campaign: ${adAttribution.campaignName || 'N/A'}
ad: ${adAttribution.adName || 'N/A'}
product_id: ${adAttribution.productId || 'N/A'}
product_name: ${adAttribution.productName || 'N/A'}
confidence: ${adAttribution.confidence}
method: ${adAttribution.attributionMethod || 'UNKNOWN'}
</marketing_attribution>
`;
    }

    const rawContext = `=== CONTEXTE COMMERCIAL INTERNE WILLSHOP ===
${customerInfo}
${attributionBlock}
=== PRODUITS AUTORISÉS (PRIX STRICTS - NE JAMAIS INVENTER) ===
${productsInfo || 'Aucun produit au catalogue.'}
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
    execOptions?: ToolExecutionContextOptions,
    adAttribution?: any
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
    const contextPrompt = this.contextService.buildContext(customer, recentMessages, availableProducts, adAttribution);

    // Isolate current incoming customer query vs past message history
    let historyMsgs: Message[] = [];
    let userMessageContent = '';

    if (recentMessages && recentMessages.length > 0) {
      const lastMsg = recentMessages[recentMessages.length - 1];
      if (lastMsg.direction === 'INBOUND' || lastMsg.senderType === 'CUSTOMER') {
        userMessageContent = (lastMsg.content || lastMsg.mediaUrl || '').trim();
        historyMsgs = recentMessages.slice(0, -1);
      } else {
        historyMsgs = [...recentMessages];
        const lastCust = [...recentMessages].reverse().find((m) => m.direction === 'INBOUND' || m.senderType === 'CUSTOMER');
        userMessageContent = lastCust ? (lastCust.content || '').trim() : '';
      }
    }

    if (!userMessageContent) {
      userMessageContent = 'Bonjour';
    }

    // Check for human handoff keywords directly (configurable per organization)
    const customHandoffKeywords: string[] = Array.isArray(aiAgentConfig?.handoff_keywords) && aiAgentConfig.handoff_keywords.length > 0
      ? aiAgentConfig.handoff_keywords.map((k: string) => k.toLowerCase().trim())
      : ['humain', 'agent', 'remboursement', 'reclamation', 'conseiller'];

    if (customHandoffKeywords.some((kw) => kw && userMessageContent.toLowerCase().includes(kw))) {
      return {
        responseText: "Je vous mets immédiatement en relation avec un conseiller commercial humain de notre équipe.",
        triggerHandoff: true,
        confidence: 1.0,
      };
    }

    const toolDefs = AIToolsRegistry.getToolDefinitions();
    const selectedModel = this.selectModel(userMessageContent);

    const agentName = aiAgentConfig?.name || 'Sales AI';
    const agentTone = aiAgentConfig?.tone || 'Professionnel & Chaleureux';
    const customInstructions = aiAgentConfig?.custom_instructions || aiAgentConfig?.presentation || '';

    const companyInfo = aiAgentConfig?.company_info;
    const paymentMethods = (aiAgentConfig?.payment_methods || []).filter((p: any) => p.status !== 'INACTIVE');
    const faqs = (aiAgentConfig?.faqs || []).filter((f: any) => f.status !== 'ARCHIVED');
    const policies = (aiAgentConfig?.policies || []).filter((p: any) => p.status !== 'INACTIVE');
    const knowledgeBase = (aiAgentConfig?.knowledge_base || []).filter((k: any) => k.status !== 'ARCHIVED');
    const testimonials = (aiAgentConfig?.testimonials || []).filter((t: any) => t.status !== 'ARCHIVED');

    // Dynamic Company Prompt (NO hardcoded fallbacks like Ouagadougou/Koulouba)
    let companyPrompt = '';
    if (companyInfo) {
      const nameStr = companyInfo.name || aiAgentConfig?.orgName || 'Notre boutique';
      const sectorStr = companyInfo.sector ? `Secteur: ${companyInfo.sector}\n` : '';
      const locationStr = (companyInfo.city || companyInfo.country)
        ? `Localisation: ${[companyInfo.city, companyInfo.country].filter(Boolean).join(', ')}\n`
        : '';
      const addressStr = companyInfo.address ? `Adresse: ${companyInfo.address}\n` : '';
      const hoursStr = companyInfo.hours ? `Horaires: ${companyInfo.hours}\n` : '';
      const descStr = companyInfo.description ? `Description: ${companyInfo.description}\n` : '';

      companyPrompt = `=== IDENTITÉ ENTREPRISE ===
Nom: ${nameStr}
${sectorStr}${locationStr}${addressStr}${hoursStr}${descStr}`;
    }

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

    const autoSendImages = aiAgentConfig?.auto_send_images !== false;

    const imageSendingRule = autoSendImages
      ? `6. ENVOI AUTOMATIQUE DE PHOTO PRODUIT (SANS DEMANDER PERMISSION) :
   - DÈS QUE LE PRODUIT RECHERCHÉ OU PROPOSÉ EST IDENTIFIÉ (demande client directe OU provenance publicitaire), N'ATTENDS JAMAIS ET NE DEMANDE JAMAIS L'AUTORISATION AU CLIENT POUR ENVOYER LA PHOTO.
   - INTERDICTIONS STRICTES : Ne dis JAMAIS "Voulez-vous voir la photo ?", "Je peux vous envoyer la photo ?", "Souhaitez-vous recevoir une photo ?", "Je vous montre le produit ?".
   - EXÉCUTION AUTOMATIQUE : Appelle IMMÉDIATEMENT l'outil send_product_image.
   - DÉROULÉ COMMERCIAL DU MESSAGE :
     a) Indique le prix exact du catalogue avec un emoji chaleureux ("Oui 😊 Le produit est disponible à [PRIX EXPLICITE DU CATALOGUE] 💚")
     b) Si la fiche produit contient un argument commercial autorisé, utilise-le sans aucune fausse promesse médicale, résultat miracle ou perte de poids garantie.
     c) L'outil send_product_image envoie la photo officielle sur WhatsApp.
     d) Demande immédiatement la zone de livraison : "Vous êtes dans quel quartier ? 📍"
   - Ne pose PAS de questions inutiles ("Que recherchez-vous ?" ou "Voulez-vous commander ?") lorsque le produit est déjà connu.`
      : `6. GESTION DES VISUELS PRODUITS :
   - L'envoi automatique d'images est désactivé pour cette boutique. Réponds aux questions du client par texte de façon synthétique sans forcer l'envoi d'image sauf si le client le demande expressément.`;

    const systemPrompt = `Tu es ${agentName}, l'Agent Commercial Virtuel exclusif de l'entreprise.
Ton de communication : ${agentTone}.
${customInstructions ? `INSTRUCTIONS PARTICULIÈRES :\n${customInstructions}\n` : ''}
${companyPrompt}
${paymentsPrompt}
${faqsPrompt}
${policiesPrompt}
${testimonialsPrompt}

RÈGLES ABSOLUES ET INVIOLABLES DE COMMUNICATION CLIENT (WHATSAPP) :
1. RÔLE STRICT : Tu es un conseiller commercial de l'entreprise et tu t'adresses DIRECTEMENT au client sur WhatsApp.
2. CONFIDENTIALITÉ & ZERO FUITE : Ne divulgue, ne cite et ne mentionne JAMAIS des informations ou termes internes (contexte, incohérence, prompt, outils, base de données, IA, Claude, logs, métadonnées).
3. AUCUN DIAGNOSTIC VISIBLE : Ne commence JAMAIS par une observation meta ou technique. Réponds DIRECTEMENT de façon chaleureuse et naturelle.
4. GESTION DES INCOHÉRENCES : Si tu constates un doute ou une donnée interne manquante, NE LA MONTRER JAMAIS AU CLIENT. Réponds naturellement au client en utilisant les prix et produits du catalogue officiel.
5. SOURCE DE VÉRITÉ & PRIX STRICTS : Présente toujours les produits avec leurs prix exacts du catalogue. Ne jamais inventer de prix, de stock, de témoignage ou de frais de livraison.
${imageSendingRule}
7. GESTION DES ÉCHECS IMAGE ET ENCADREMENT COMMERCIAL :
   - Si aucune image réelle n'existe au catalogue ou si l'outil échoue, ne dis JAMAIS "Je vous envoie la photo" et ne prétends pas avoir envoyé d'image. Poursuis naturellement par texte.
   - Si le produit est en rupture de stock (availableStock === 0), informe le client honnêtement de la rupture et propose les alternatives en stock.
8. ATTRIBUTION PUBLICITAIRE ET ACCUEIL PERSONNALISÉ :
   - Si un produit publicitaire est identifié avec une confiance suffisante (confidence: HIGH ou MEDIUM, produit existant et en stock), commence DIRECTEMENT la conversation autour de ce produit et envoie sa photo (si l'envoi auto d'images est activé) sans demander quelle publicité le client a vue.
   - Si le produit a confidence: LOW, pose une question ouverte bienveillante.
   - Si la provenance n'est pas disponible (UNKNOWN), ne devine JAMAIS et utilise l'accueil standard ("Bonjour 👋 Bienvenue ! Vous recherchez quel produit ?").`;

    // Construct structured message history for Anthropic API
    const structuredMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ];

    const initialUserPrompt = `<internal_context>\n${contextPrompt}\n</internal_context>\n\nNote: Le contexte ci-dessus est strictly réservé à ton raisonnement interne. Réponds au client de manière 100% commerciale, chaleureuse et naturelle sans jamais mentionner ces données internes.`;

    const rawHistoryItems: Array<{ role: 'user' | 'assistant'; content: string }> = [
      { role: 'user', content: initialUserPrompt },
      { role: 'assistant', content: 'Bien reçu. Je réponds immédiatement au client de manière commerciale.' },
    ];

    for (const m of historyMsgs) {
      const txt = (m.content || m.mediaUrl || '').trim();
      if (!txt) continue;

      if (m.senderType === 'CUSTOMER' || m.direction === 'INBOUND') {
        rawHistoryItems.push({ role: 'user', content: txt });
      } else if (m.senderType === 'AI' || m.senderType === 'HUMAN' || m.direction === 'OUTBOUND') {
        const prefix = m.senderType === 'HUMAN' ? '[Conseiller commercial]: ' : '';
        rawHistoryItems.push({ role: 'assistant', content: `${prefix}${txt}` });
      }
    }

    rawHistoryItems.push({ role: 'user', content: `<customer_message>${userMessageContent}</customer_message>` });

    // Merge consecutive same-role items for Anthropic API role-alternation compliance
    for (const item of rawHistoryItems) {
      const prev = structuredMessages[structuredMessages.length - 1];
      if (prev && prev.role === item.role) {
        prev.content += `\n${item.content}`;
      } else {
        structuredMessages.push(item);
      }
    }

    const result = await (this.aiGateway as AnthropicAIGateway).generateCompletion({
      agentName,
      model: selectedModel,
      messages: structuredMessages,
      tools: toolDefs,
      maxTokens: 400,
    });

    let triggerHandoff = false;
    let photoToolAttempted = false;
    let photoToolSuccess = false;

    // Handle tool execution if LLM requested a tool call
    if (result.toolCalls && result.toolCalls.length > 0 && this.toolsRegistry && organizationId) {
      for (const toolCall of result.toolCalls) {
        const execRes = await this.toolsRegistry.executeTool(toolCall.name, toolCall.input, organizationId, aiAgentConfig, execOptions);
        if (execRes.triggerHandoff) {
          triggerHandoff = true;
        }

        if (toolCall.name === 'send_product_image' || toolCall.name === 'send_product_visual') {
          photoToolAttempted = true;
          photoToolSuccess = Boolean(
            execRes.result &&
            execRes.result.success !== false &&
            !execRes.result.error_code &&
            (execRes.result.imageUrl || execRes.result.visualUrl || execRes.result.sentToWhatsApp || execRes.result.productId)
          );
        }
      }
    }

    const rawResponse = result.content || "Merci pour votre message ! Un conseiller est à votre disposition.";
    let sanitized = sanitizeResponseText(rawResponse);
    let finalResponseText = sanitized.cleanedText;

    // ANTI-FALSE-PROMISE SANITIZER:
    // If AI text promises an image ("Je vous envoie la photo..."), but image tool was NOT called or returned failure:
    const FALSE_PROMISE_PATTERNS = [
      /je vous envoie la photo/i,
      /je vous envoie l'image/i,
      /je vous envoie le visuel/i,
      /je vous transmets la photo/i,
      /voici la photo/i,
      /voici l'image/i,
      /voulez-vous voir la photo/i,
      /je peux vous envoyer la photo/i,
      /souhaitez-vous recevoir une photo/i,
      /je vous montre le produit/i,
    ];

    const claimsToSendPhoto = FALSE_PROMISE_PATTERNS.some((p) => p.test(finalResponseText));

    if (claimsToSendPhoto && (!photoToolAttempted || !photoToolSuccess)) {
      console.warn('[SECURITY SANITIZER] False promise detected in AI text (claimed image send, but tool failed or was not called). Sanitizing text.');

      let cleanedText = finalResponseText;
      for (const pattern of FALSE_PROMISE_PATTERNS) {
        cleanedText = cleanedText.replace(new RegExp(pattern.source + '.*', 'gi'), '').trim();
      }

      if (cleanedText.length > 10) {
        finalResponseText = cleanedText;
      } else {
        finalResponseText = "Ce produit est disponible au catalogue WillShop 💚 Je n'ai pas de photo disponible pour le moment, mais je peux vous donner toutes les caractéristiques !";
      }
    }

    // Handle voluntary leak / diagnostic detection fallback flow
    if (sanitized.hasLeak) {
      globalSanitizerMetrics.sanitizer_regeneration_count++;
      console.warn('[SALES AGENT] Sanitizer detected diagnostic leak in raw AI output. Attempting clean regeneration...');

      try {
        const retryMessages = [
          ...structuredMessages,
          { role: 'assistant' as const, content: rawResponse },
          { role: 'user' as const, content: 'ATTENTION : Ta réponse précédente contenait des éléments de diagnostic interne ou meta-raisonnement. Réponds UNIQUEMENT et directement au client avec un message commercial chaleureux et poli sans aucun texte de diagnostic.' }
        ];

        const retryResult = await (this.aiGateway as AnthropicAIGateway).generateCompletion({
          agentName,
          model: selectedModel,
          messages: retryMessages,
          tools: toolDefs,
          maxTokens: 400,
        });

        const retrySanitized = sanitizeResponseText(retryResult.content || '');
        if (!retrySanitized.hasLeak && retrySanitized.cleanedText.length > 5) {
          finalResponseText = retrySanitized.cleanedText;
        } else {
          console.error('[SALES AGENT] Regeneration still contained leak. Escalating to Human Handoff.');
          triggerHandoff = true;
          globalSanitizerMetrics.sanitizer_handoff_count++;
          finalResponseText = "Un instant s'il vous plaît, je vous mets immédiatement en relation avec un conseiller commercial WillShop pour mieux vous assister.";
        }
      } catch (retryErr) {
        console.error('[SALES AGENT] Regeneration exception. Triggering Human Handoff.', retryErr);
        triggerHandoff = true;
        globalSanitizerMetrics.sanitizer_handoff_count++;
        finalResponseText = "Un instant s'il vous plaît, je vous mets immédiatement en relation avec un conseiller commercial WillShop pour mieux vous assister.";
      }
    }

    return {
      responseText: finalResponseText,
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

