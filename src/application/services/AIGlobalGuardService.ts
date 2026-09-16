/**
 * WILLShop OS — Central Global AI Guard Service
 * Application Layer.
 * Provides a 100% server-side central guard enforcing WILLShop OS Global AI Modes:
 * - `OBSERVE_ONLY` (Default): AI is ACTIVE for background analysis, CRM structuring,
 *   opportunistic action generation ("MA JOURNÉE"), and morning briefings, but ZERO automated
 *   outbound responses are sent to WhatsApp customers.
 * - `GLOBAL_AI_DISABLED`: Complete server-side suppression of all AI generation & analysis.
 * - `assertNoAIOutbound`: Central server-side assertion blocking any automated customer message dispatch.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type AgentMode = 'OBSERVE_ONLY' | 'GLOBAL_AI_DISABLED' | 'HUMAN_PRIMARY' | 'FOLLOWUP_ONLY' | 'AI_ACTIVE' | 'PAUSED';

export interface AIGuardCheckResult {
  isAIEnabled: boolean;
  isAIOutboundAllowed: boolean;
  agentMode: AgentMode;
  blockedReason?: string;
  globalStopped: boolean;
}

export class AIGlobalGuardService {
  /**
   * Helper evaluating whether outbound automated AI messages (text, voice, image, followup)
   * are permitted to be sent directly to WhatsApp customers.
   */
  public static isAIOutboundAllowed(agentMode: string, globalStopped?: boolean): boolean {
    if (globalStopped === true) return false;
    if (agentMode === 'GLOBAL_AI_DISABLED' || agentMode === 'PAUSED' || agentMode === 'OBSERVE_ONLY' || agentMode === 'HUMAN_PRIMARY') {
      return false;
    }
    return agentMode === 'AI_ACTIVE' || agentMode === 'FOLLOWUP_ONLY';
  }

  /**
   * Evaluates server-side whether AI execution & outbound generation is globally allowed for an organization.
   * Multi-tenant isolated via organizationId.
   */
  public static async checkAIEnabled(
    supabase: SupabaseClient,
    organizationId: string
  ): Promise<AIGuardCheckResult> {
    if (!organizationId) {
      return {
        isAIEnabled: false,
        isAIOutboundAllowed: false,
        agentMode: 'GLOBAL_AI_DISABLED',
        blockedReason: 'ORGANIZATION_ID_MISSING',
        globalStopped: true,
      };
    }

    try {
      // 1. Check DB kill_switches table SSOT
      let ksRow: any = null;
      try {
        const ksQuery: any = supabase
          .from('kill_switches')
          .select('global_stopped')
          .eq('organization_id', organizationId);
        
        const res = typeof ksQuery.maybeSingle === 'function' 
          ? await ksQuery.maybeSingle() 
          : await ksQuery.single();
        ksRow = res?.data;
      } catch (_err) {
        // Row might not exist yet for new organization
      }

      if (ksRow && ksRow.global_stopped === true) {
        return {
          isAIEnabled: false,
          isAIOutboundAllowed: false,
          agentMode: 'GLOBAL_AI_DISABLED',
          blockedReason: 'GLOBAL_KILL_SWITCH_ACTIVE',
          globalStopped: true,
        };
      }

      // 2. Check DB organizations.settings SSOT
      const { data: orgRow } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', organizationId)
        .single();

      const aiConfig = orgRow?.settings?.ai_agent_config || {};
      const agentMode: AgentMode = aiConfig.agent_mode || 'OBSERVE_ONLY';

      if (aiConfig.ai_global_enabled === false || aiConfig.enabled === false || agentMode === 'GLOBAL_AI_DISABLED') {
        return {
          isAIEnabled: false,
          isAIOutboundAllowed: false,
          agentMode: 'GLOBAL_AI_DISABLED',
          blockedReason: 'GLOBAL_AI_DISABLED_IN_SETTINGS',
          globalStopped: true,
        };
      }

      if (agentMode === 'PAUSED') {
        return {
          isAIEnabled: false,
          isAIOutboundAllowed: false,
          agentMode: 'PAUSED',
          blockedReason: 'AI_AGENT_PAUSED',
          globalStopped: false,
        };
      }

      const outboundAllowed = this.isAIOutboundAllowed(agentMode, false);

      return {
        isAIEnabled: true,
        isAIOutboundAllowed: outboundAllowed,
        agentMode,
        blockedReason: outboundAllowed ? undefined : `AI_OUTBOUND_DISABLED_FOR_MODE_${agentMode}`,
        globalStopped: false,
      };
    } catch (err: any) {
      console.error('[AIGlobalGuardService Check Exception]', err);
      return {
        isAIEnabled: false,
        isAIOutboundAllowed: false,
        agentMode: 'GLOBAL_AI_DISABLED',
        blockedReason: `GUARD_CHECK_EXCEPTION: ${err.message}`,
        globalStopped: true,
      };
    }
  }

  /**
   * Central Server-Side Guard Assertion.
   * Call before sending ANY automated AI response, media message, or automated followup.
   * Throws or returns blocked state if mode is OBSERVE_ONLY or outbound is prohibited.
   */
  public static async assertNoAIOutbound(
    supabase: SupabaseClient,
    organizationId: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const check = await this.checkAIEnabled(supabase, organizationId);
    if (!check.isAIEnabled || !check.isAIOutboundAllowed) {
      return {
        allowed: false,
        reason: check.blockedReason || `OUTBOUND_AI_BLOCKED_FOR_MODE_${check.agentMode}`,
      };
    }
    return { allowed: true };
  }

  /**
   * Synchronous check when aiConfig & killSwitchState are already loaded in memory.
   */
  public static checkAIEnabledInMemory(
    aiConfig: any,
    globalKillSwitchStopped?: boolean
  ): AIGuardCheckResult {
    if (globalKillSwitchStopped === true) {
      return {
        isAIEnabled: false,
        isAIOutboundAllowed: false,
        agentMode: 'GLOBAL_AI_DISABLED',
        blockedReason: 'GLOBAL_KILL_SWITCH_ACTIVE',
        globalStopped: true,
      };
    }

    const agentMode: AgentMode = aiConfig?.agent_mode || 'OBSERVE_ONLY';

    if (aiConfig?.ai_global_enabled === false || aiConfig?.enabled === false || agentMode === 'GLOBAL_AI_DISABLED') {
      return {
        isAIEnabled: false,
        isAIOutboundAllowed: false,
        agentMode: 'GLOBAL_AI_DISABLED',
        blockedReason: 'GLOBAL_AI_DISABLED_IN_SETTINGS',
        globalStopped: true,
      };
    }

    if (agentMode === 'PAUSED') {
      return {
        isAIEnabled: false,
        isAIOutboundAllowed: false,
        agentMode: 'PAUSED',
        blockedReason: 'AI_AGENT_PAUSED',
        globalStopped: false,
      };
    }

    const outboundAllowed = this.isAIOutboundAllowed(agentMode, false);

    return {
      isAIEnabled: true,
      isAIOutboundAllowed: outboundAllowed,
      agentMode,
      blockedReason: outboundAllowed ? undefined : `AI_OUTBOUND_DISABLED_FOR_MODE_${agentMode}`,
      globalStopped: false,
    };
  }

  /**
   * Logs an audit record for Global AI Toggle changes into ai_actions table.
   */
  public static async logAIToggleAudit(
    supabase: SupabaseClient,
    organizationId: string,
    userId: string | null,
    previousState: boolean,
    newState: boolean,
    reason?: string
  ): Promise<void> {
    try {
      await supabase.from('ai_actions').insert({
        organization_id: organizationId,
        action_type: newState ? 'AI_GLOBAL_ENABLED' : 'AI_GLOBAL_DISABLED',
        permission_level: 'RED',
        status: 'EXECUTED',
        metadata: {
          previous_state: previousState ? 'ENABLED' : 'DISABLED',
          new_state: newState ? 'ENABLED' : 'DISABLED',
          toggled_by_user_id: userId,
          timestamp: new Date().toISOString(),
          reason: reason || (newState ? 'Global AI reactivated by admin' : 'Global AI Emergency Kill Switch activated'),
        },
      });
    } catch (logErr) {
      console.warn('[AIGlobalGuardService Log Audit Warning]', logErr);
    }
  }
}
