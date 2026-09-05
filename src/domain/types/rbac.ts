/**
 * WILLShop OS — RBAC & Permission Matrix
 * Pure Domain Layer — ZERO external dependencies.
 */

export type UserRole = 'OWNER' | 'MANAGER' | 'COMMERCIAL' | 'LIVREUR' | 'VIEWER';

export type ActionPermission =
  | 'org:read'
  | 'org:write'
  | 'user:manage'
  | 'audit:read'
  | 'crm:read'
  | 'crm:write'
  | 'order:read'
  | 'order:write'
  | 'stock:read'
  | 'stock:write'
  | 'delivery:read'
  | 'delivery:write'
  | 'finance:read'
  | 'finance:write'
  | 'settings:manage';

export const ROLE_PERMISSIONS: Record<UserRole, ActionPermission[]> = {
  OWNER: [
    'org:read',
    'org:write',
    'user:manage',
    'audit:read',
    'crm:read',
    'crm:write',
    'order:read',
    'order:write',
    'stock:read',
    'stock:write',
    'delivery:read',
    'delivery:write',
    'finance:read',
    'finance:write',
    'settings:manage',
  ],
  MANAGER: [
    'org:read',
    'audit:read',
    'crm:read',
    'crm:write',
    'order:read',
    'order:write',
    'stock:read',
    'stock:write',
    'delivery:read',
    'delivery:write',
    'finance:read',
  ],
  COMMERCIAL: [
    'org:read',
    'crm:read',
    'crm:write',
    'order:read',
    'order:write',
    'stock:read',
  ],
  LIVREUR: [
    'delivery:read',
    'delivery:write',
    'order:read',
  ],
  VIEWER: [
    'org:read',
    'crm:read',
    'order:read',
    'stock:read',
    'delivery:read',
  ],
};

export function hasPermission(role: UserRole, action: ActionPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(action);
}
