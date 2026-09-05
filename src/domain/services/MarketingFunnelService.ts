/**
 * WILLShop OS — Marketing Funnel Diagnostic Service
 * Analyzes conversion rates across funnel stages and diagnoses bottleneck root causes.
 * Pure Domain Service.
 */

import { MarketingFunnelMetrics } from '../entities/MarketingEntities';

export class MarketingFunnelService {
  /**
   * Computes conversion rates and produces a deterministic bottleneck diagnosis.
   */
  public static analyzeFunnel(
    impressions: number,
    clicks: number,
    conversations: number,
    leads: number,
    orders: number,
    deliveredOrders: number,
    adSpend: number
  ): MarketingFunnelMetrics {
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0;
    const cpc = clicks > 0 ? Math.round(adSpend / clicks) : 0;
    const cpa = orders > 0 ? Math.round(adSpend / orders) : 0;

    const clickToConversationRate = clicks > 0 ? Math.round((conversations / clicks) * 1000) / 10 : 0;
    const conversationToLeadRate = conversations > 0 ? Math.round((leads / conversations) * 1000) / 10 : 0;
    const leadToOrderRate = leads > 0 ? Math.round((orders / leads) * 1000) / 10 : 0;
    const orderToDeliveryRate = orders > 0 ? Math.round((deliveredOrders / orders) * 1000) / 10 : 0;

    let bottleneckDiagnosis = 'Flux du tunnel régulier. Aucune anomalie majeure.';

    if (ctr < 1.5 && impressions > 1000) {
      bottleneckDiagnosis = '🟢 Problème Créatif/Message : Faible CTR (< 1.5%). L\'accroche visuelle ou le texte ne capte pas l\'attention.';
    } else if (clickToConversationRate < 10 && clicks > 100) {
      bottleneckDiagnosis = '🟡 Problème d\'Offre/Call-To-Action : Les clics ne se convertissent pas en conversations WhatsApp. Vérifier le lien ou l\'offre.';
    } else if (leadToOrderRate < 20 && leads > 20) {
      bottleneckDiagnosis = '🟡 Problème de Closing/Prix : Faible conversion des leads en commandes (< 20%). Améliorer le script de vente commercial.';
    } else if (orderToDeliveryRate < 80 && orders > 10) {
      bottleneckDiagnosis = '🔴 Problème Opérationnel Livraison : Échecs de livraison élevés (> 20%). Vérifier les créneaux et le processus de confirmation.';
    }

    return {
      impressions,
      clicks,
      conversations,
      leads,
      qualifiedLeads: leads,
      orders,
      confirmedOrders: orders,
      deliveredOrders,
      paidOrders: deliveredOrders,
      ctr,
      cpc,
      cpa,
      conversionRates: {
        clickToConversationRate,
        conversationToLeadRate,
        leadToOrderRate,
        orderToDeliveryRate,
      },
      bottleneckDiagnosis,
    };
  }
}
