/**
 * WILLShop OS — Automation Permission Evaluator
 * Evaluates 3-tier risk permissions (GREEN, YELLOW, RED) right before execution.
 * Pure Domain Service.
 */

import { PermissionLevel } from '../entities/DataCoreEntities';
import { ActionType } from '../entities/AutomationEntities';

export class PermissionEvaluator {
  /**
   * Returns true if the permission level allows automatic background execution (GREEN).
   */
  public static canAutoExecute(level: PermissionLevel): boolean {
    return level === 'GREEN';
  }

  /**
   * Returns true if the action level requires human approval (YELLOW or RED).
   */
  public static requiresApproval(level: PermissionLevel): boolean {
    return level === 'YELLOW' || level === 'RED';
  }

  /**
   * Infers the strict permission level of an action type if not specified.
   */
  public static inferPermission(actionType: ActionType, customLevel?: PermissionLevel): PermissionLevel {
    if (customLevel) return customLevel;

    switch (actionType) {
      case 'NOTIFICATION':
      case 'TASK':
      case 'ALERT':
      case 'TAG':
        return 'GREEN'; // Low risk read/internal write

      case 'WHATSAPP':
      case 'UPDATE':
      case 'CREATE':
      case 'ASSIGN':
      case 'WEBHOOK':
        return 'YELLOW'; // External / state-changing business action

      default:
        return 'RED';
    }
  }
}
