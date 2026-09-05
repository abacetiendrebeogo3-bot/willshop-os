/**
 * WILLShop OS — Pure Deterministic Condition Evaluator
 * Evaluates ConditionNode trees against scoped contexts without using eval.
 * Pure Domain Service.
 */

import { ConditionNode, ConditionOperator } from '../entities/AutomationEntities';

export class ConditionEvaluator {
  /**
   * Evaluates a ConditionNode tree against a context object.
   */
  public static evaluate(node: ConditionNode, context: Record<string, unknown>): boolean {
    if (!node) return true;

    // Handle Logical Groupings (AND / OR)
    if (node.children && node.children.length > 0) {
      const isAnd = (node.logicalOperator || 'AND') === 'AND';
      let groupResult = isAnd;

      for (const child of node.children) {
        const childResult = ConditionEvaluator.evaluate(child, context);
        if (isAnd) {
          groupResult = groupResult && childResult;
          if (!groupResult) break; // Short circuit AND
        } else {
          groupResult = groupResult || childResult;
          if (groupResult) break; // Short circuit OR
        }
      }

      return node.not ? !groupResult : groupResult;
    }

    // Handle Single Leaf Condition
    if (!node.field || !node.operator) {
      return true; // Empty node defaults to true
    }

    const actualValue = ConditionEvaluator.resolvePath(context, node.field);
    const leafResult = ConditionEvaluator.compare(actualValue, node.operator, node.value);

    return node.not ? !leafResult : leafResult;
  }

  /**
   * Safely resolves dot-notation property paths (e.g. "order.totalAmount", "stock.available").
   */
  public static resolvePath(obj: Record<string, unknown>, path: string): unknown {
    if (!obj || typeof obj !== 'object') return undefined;

    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  /**
   * Compares an actual value against an expected value using a supported ConditionOperator.
   */
  private static compare(actual: unknown, operator: ConditionOperator, expected: unknown): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'not_equals':
        return actual !== expected;
      case 'greater_than':
        return typeof actual === 'number' && typeof expected === 'number' && actual > expected;
      case 'greater_or_equal':
        return typeof actual === 'number' && typeof expected === 'number' && actual >= expected;
      case 'less_than':
        return typeof actual === 'number' && typeof expected === 'number' && actual < expected;
      case 'less_or_equal':
        return typeof actual === 'number' && typeof expected === 'number' && actual <= expected;
      case 'contains':
        if (typeof actual === 'string' && typeof expected === 'string') {
          return actual.toLowerCase().includes(expected.toLowerCase());
        }
        if (Array.isArray(actual)) {
          return actual.includes(expected);
        }
        return false;
      case 'not_contains':
        return !ConditionEvaluator.compare(actual, 'contains', expected);
      case 'in':
        if (Array.isArray(expected)) {
          return expected.includes(actual);
        }
        return false;
      case 'not_in':
        return !ConditionEvaluator.compare(actual, 'in', expected);
      case 'exists':
        return actual !== undefined && actual !== null;
      case 'not_exists':
        return actual === undefined || actual === null;
      default:
        return false;
    }
  }
}
