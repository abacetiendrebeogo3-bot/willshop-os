/**
 * WILLShop OS — Automation Kill Switch Service
 * Evaluates whether execution is blocked by global, org, category, or automation kill switch.
 * Pure Domain Service.
 */

import { AutomationCategory, KillSwitchConfig } from '../entities/AutomationEntities';

export class KillSwitchService {
  /**
   * Evaluates whether an automation execution is blocked by the active KillSwitchConfig.
   */
  public static isExecutionBlocked(
    config: KillSwitchConfig | null,
    automationId: string,
    category: AutomationCategory
  ): { blocked: boolean; reason?: string } {
    if (!config) {
      return { blocked: false };
    }

    // 1. Global Kill Switch
    if (config.globalStopped) {
      return {
        blocked: true,
        reason: `Global Kill Switch is active for organization ${config.organizationId}`,
      };
    }

    // 2. Category Kill Switch
    if (config.stoppedCategories && config.stoppedCategories.includes(category)) {
      return {
        blocked: true,
        reason: `Category '${category}' is currently paused by Kill Switch`,
      };
    }

    // 3. Single Automation Kill Switch
    if (config.stoppedAutomationIds && config.stoppedAutomationIds.includes(automationId)) {
      return {
        blocked: true,
        reason: `Automation '${automationId}' is individually paused by Kill Switch`,
      };
    }

    return { blocked: false };
  }
}
