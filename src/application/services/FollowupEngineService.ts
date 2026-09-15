/**
 * WILLShop OS — Followup Rules & Automation Engine Service
 * Application Layer.
 * Handles WhatsApp commercial followup rules evaluation, dry-run simulation with Fake Clock,
 * WhatsApp 24h window enforcement, dynamic variable substitution, stop conditions check,
 * and multi-tenant isolation.
 */

export interface FollowupCandidate {
  conversationId: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  lastActivityAt: Date;
  lastCustomerMessageAt?: Date | null;
  lastAiResponseAt?: Date | null;
  conversationStatus: string;
  isArchived: boolean;
  hasHumanTakeover: boolean;
  hasCompletedOrder: boolean;
  hasOptedOut: boolean;
  previousFollowupCount: number;
  lastFollowupAt?: Date | null;
  productId?: string | null;
  productName?: string | null;
  orderId?: string | null;
}

export interface SimulationItemResult {
  candidate: FollowupCandidate;
  delayRequiredSeconds: number;
  delayElapsedSeconds: number;
  isDelaySatisfied: boolean;
  stopReason?: string;
  isStopped: boolean;
  whatsAppWindowOpen: boolean;
  whatsAppWindowHoursRemaining: number;
  renderedMessage: string;
  missingVariables: string[];
  wouldSend: boolean;
  finalStatus: 'DRY_RUN_PASSED' | 'BLOCKED_STOP_CONDITION' | 'BLOCKED_DELAY_NOT_MET' | 'BLOCKED_WHATSAPP_WINDOW_CLOSED' | 'BLOCKED_FREQUENCY_LIMIT' | 'BLOCKED_KILL_SWITCH';
}

export interface SimulationResult {
  ruleId: string;
  ruleName: string;
  organizationId: string;
  simulatedAt: Date;
  fakeClockOffsetHours: number;
  isDryRun: boolean;
  totalCandidates: number;
  eligibleCandidates: number;
  blockedCandidates: number;
  items: SimulationItemResult[];
}

export class FollowupVariableEngine {
  public static substitute(
    template: string,
    context: {
      first_name?: string | null;
      last_name?: string | null;
      full_name?: string | null;
      product_name?: string | null;
      order_id?: string | null;
      company_name?: string | null;
    }
  ): { rendered: string; missingVars: string[] } {
    if (!template) return { rendered: '', missingVars: [] };

    const missingVars: string[] = [];
    const varMap: Record<string, string | null | undefined> = {
      first_name: context.first_name,
      last_name: context.last_name,
      full_name: context.full_name || (context.first_name ? `${context.first_name} ${context.last_name || ''}`.trim() : null),
      product_name: context.product_name,
      order_id: context.order_id,
      company_name: context.company_name || 'WILLShop OS',
    };

    const rendered = template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (match, varName) => {
      const val = varMap[varName];
      if (val !== undefined && val !== null && val !== '') {
        return String(val);
      }
      missingVars.push(varName);
      return '[information indisponible]';
    });

    return { rendered, missingVars };
  }
}

export class WhatsAppWindowGuard {
  public static check24hWindow(lastCustomerMessageAt?: Date | null, now: Date = new Date()): {
    isOpen: boolean;
    hoursRemaining: number;
  } {
    if (!lastCustomerMessageAt) {
      return { isOpen: false, hoursRemaining: 0 };
    }

    const elapsedMs = now.getTime() - lastCustomerMessageAt.getTime();
    const windowMs = 24 * 60 * 60 * 1000;
    const remainingMs = windowMs - elapsedMs;

    if (remainingMs <= 0) {
      return { isOpen: false, hoursRemaining: 0 };
    }

    return {
      isOpen: true,
      hoursRemaining: Math.round((remainingMs / (1000 * 60 * 60)) * 10) / 10,
    };
  }
}

export class FollowupEngineService {
  /**
   * Generates natural language summary for a rule based on its actual parameters.
   */
  public static generateRuleSummary(params: {
    trigger: string;
    delayValue: number;
    delayUnit: 'minutes' | 'heures' | 'jours';
    stopOnReply?: boolean;
    stopOnHuman?: boolean;
    stopOnOrder?: boolean;
    frequencyLimit?: number;
  }): string {
    const unitText = params.delayUnit === 'minutes' ? 'minutes' : params.delayUnit === 'jours' ? 'jours' : 'heures';
    const stopConditionsList: string[] = [];

    if (params.stopOnReply !== false) stopConditionsList.push('s\'ils répondent');
    if (params.stopOnHuman !== false) stopConditionsList.push('si un commercial prend la main');
    if (params.stopOnOrder !== false) stopConditionsList.push('si la commande est finalisée');

    const stopText = stopConditionsList.length > 0 ? `, sauf ${stopConditionsList.join(', ')}` : '';
    const freqText = params.frequencyLimit ? `${params.frequencyLimit} seule fois` : 'une seule fois';

    return `Cette règle relancera les prospects après ${params.delayValue} ${unitText} de silence, ${freqText}${stopText}.`;
  }

  /**
   * Runs a Dry-Run simulation evaluating candidate conversations against rule constraints.
   */
  public static evaluateCandidatesDryRun(
    rule: {
      id: string;
      name: string;
      organizationId: string;
      triggerType: string;
      delaySeconds: number;
      stopConditions?: string[];
      frequencyLimit?: number;
      cooldownSeconds?: number;
      template: string;
      enabled: boolean;
      globalKillSwitchStopped?: boolean;
    },
    candidates: FollowupCandidate[],
    fakeClockOffsetHours: number = 0,
    companyName: string = 'WILLShop OS'
  ): SimulationResult {
    const fakeNow = new Date(Date.now() + fakeClockOffsetHours * 3600 * 1000);
    const results: SimulationItemResult[] = [];

    for (const cand of candidates) {
      // 1. Check Kill Switch
      if (rule.globalKillSwitchStopped) {
        const { rendered, missingVars } = FollowupVariableEngine.substitute(rule.template, {
          first_name: cand.customerName.split(' ')[0],
          last_name: cand.customerName.split(' ')[1] || '',
          product_name: cand.productName,
          order_id: cand.orderId,
          company_name: companyName,
        });
        results.push({
          candidate: cand,
          delayRequiredSeconds: rule.delaySeconds,
          delayElapsedSeconds: Math.floor((fakeNow.getTime() - cand.lastActivityAt.getTime()) / 1000),
          isDelaySatisfied: true,
          stopReason: 'Kill Switch Global Actif — Relances réelles désactivées',
          isStopped: true,
          whatsAppWindowOpen: true,
          whatsAppWindowHoursRemaining: 24,
          renderedMessage: rendered,
          missingVariables: missingVars,
          wouldSend: false,
          finalStatus: 'BLOCKED_KILL_SWITCH',
        });
        continue;
      }

      // 2. Check Stop Conditions
      let stopReason: string | undefined;
      let isStopped = false;

      const stopConds = rule.stopConditions || ['CUSTOMER_REPLIED', 'HUMAN_TAKEOVER', 'ORDER_COMPLETED', 'CONVERSATION_ARCHIVED'];

      if (stopConds.includes('CUSTOMER_REPLIED') && cand.lastCustomerMessageAt && cand.lastCustomerMessageAt > cand.lastActivityAt) {
        stopReason = 'Le client a répondu récemment';
        isStopped = true;
      } else if (stopConds.includes('HUMAN_TAKEOVER') && cand.hasHumanTakeover) {
        stopReason = 'Un commercial humain a pris la main';
        isStopped = true;
      } else if (stopConds.includes('ORDER_COMPLETED') && cand.hasCompletedOrder) {
        stopReason = 'La commande associée a été finalisée';
        isStopped = true;
      } else if (stopConds.includes('CONVERSATION_ARCHIVED') && cand.isArchived) {
        stopReason = 'La conversation est archivée';
        isStopped = true;
      } else if (stopConds.includes('OPT_OUT') && cand.hasOptedOut) {
        stopReason = 'Le client a demandé à ne plus être relancé (Opt-out)';
        isStopped = true;
      } else if (cand.previousFollowupCount >= (rule.frequencyLimit || 1)) {
        stopReason = `Nombre maximum de relances atteint (${cand.previousFollowupCount}/${rule.frequencyLimit || 1})`;
        isStopped = true;
      }

      // 3. Check Delay (with Fake Clock offset)
      const elapsedSeconds = Math.floor((fakeNow.getTime() - cand.lastActivityAt.getTime()) / 1000);
      const isDelaySatisfied = elapsedSeconds >= rule.delaySeconds;

      // 4. Check WhatsApp 24h Window
      const windowCheck = WhatsAppWindowGuard.check24hWindow(cand.lastCustomerMessageAt || cand.lastActivityAt, fakeNow);

      // 5. Render Message Template
      const firstName = cand.customerName ? cand.customerName.split(' ')[0] : null;
      const lastName = cand.customerName && cand.customerName.includes(' ') ? cand.customerName.split(' ').slice(1).join(' ') : null;

      const { rendered, missingVars } = FollowupVariableEngine.substitute(rule.template, {
        first_name: firstName,
        last_name: lastName,
        product_name: cand.productName,
        order_id: cand.orderId,
        company_name: companyName,
      });

      // Determine Final Status
      let finalStatus: SimulationItemResult['finalStatus'] = 'DRY_RUN_PASSED';
      let wouldSend = false;

      if (isStopped) {
        finalStatus = 'BLOCKED_STOP_CONDITION';
      } else if (!isDelaySatisfied) {
        finalStatus = 'BLOCKED_DELAY_NOT_MET';
        stopReason = `Délai non atteint (Ecoulé: ${Math.round(elapsedSeconds / 60)} min, Requis: ${Math.round(rule.delaySeconds / 60)} min)`;
      } else if (!windowCheck.isOpen) {
        finalStatus = 'BLOCKED_WHATSAPP_WINDOW_CLOSED';
        stopReason = 'Fenêtre WhatsApp fermée — aucun template approuvé disponible.';
      } else {
        wouldSend = true;
      }

      results.push({
        candidate: cand,
        delayRequiredSeconds: rule.delaySeconds,
        delayElapsedSeconds: Math.max(0, elapsedSeconds),
        isDelaySatisfied,
        stopReason,
        isStopped: isStopped || !isDelaySatisfied || !windowCheck.isOpen,
        whatsAppWindowOpen: windowCheck.isOpen,
        whatsAppWindowHoursRemaining: windowCheck.hoursRemaining,
        renderedMessage: rendered,
        missingVariables: missingVars,
        wouldSend,
        finalStatus,
      });
    }

    return {
      ruleId: rule.id,
      ruleName: rule.name,
      organizationId: rule.organizationId,
      simulatedAt: fakeNow,
      fakeClockOffsetHours,
      isDryRun: true,
      totalCandidates: candidates.length,
      eligibleCandidates: results.filter((r) => r.wouldSend).length,
      blockedCandidates: results.filter((r) => !r.wouldSend).length,
      items: results,
    };
  }
}
