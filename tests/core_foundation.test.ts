/**
 * WILLShop OS — Core Foundation Automated Tests Suite
 * Tests Auth, Organization Context, RBAC, Audit, Events & Idempotency
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import {
  InMemoryOrganizationRepository,
  InMemoryAuditRepository,
  InMemoryEventRepository,
  InMemoryIdempotencyRepository,
} from '../src/infrastructure/repositories/InMemoryRepositories';

import { OrganizationContextService } from '../src/application/services/OrganizationContextService';
import { AuditService } from '../src/application/services/AuditService';
import { EventDispatcherService, IdempotencyService } from '../src/application/services/IdempotencyService';
import { hasPermission, UserRole } from '../src/domain/types/rbac';
import {
  UnauthorizedError,
  ForbiddenError,
  IdempotencyMismatchError,
} from '../src/domain/errors/AppErrors';
import { MockAIGateway } from '../src/infrastructure/ai/MockAIGateway';

describe('Build 01 — Core Foundation Test Suite', () => {
  const orgRepo = new InMemoryOrganizationRepository();
  const auditRepo = new InMemoryAuditRepository();
  const eventRepo = new InMemoryEventRepository();
  const idempotencyRepo = new InMemoryIdempotencyRepository();

  const orgContextService = new OrganizationContextService(orgRepo);
  const auditService = new AuditService(auditRepo);
  const eventDispatcher = new EventDispatcherService(eventRepo);
  const idempotencyService = new IdempotencyService(idempotencyRepo);
  const aiGateway = new MockAIGateway();

  const testOrgId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
  const ownerUserId = 'user-owner-123';
  const viewerUserId = 'user-viewer-456';
  const outsiderUserId = 'user-outsider-789';

  // Seed user roles
  orgRepo.assignUserRole(ownerUserId, {
    userId: ownerUserId,
    organizationId: testOrgId,
    role: 'OWNER',
    permissions: [],
  });

  orgRepo.assignUserRole(viewerUserId, {
    userId: viewerUserId,
    organizationId: testOrgId,
    role: 'VIEWER',
    permissions: [],
  });

  // --------------------------------------------------------------------------
  // 1. Authentication & Organization Context Tests
  // --------------------------------------------------------------------------
  test('Auth: Unauthenticated user should throw UnauthorizedError', async () => {
    await assert.rejects(
      async () => {
        await orgContextService.getOrganizationContext(null);
      },
      (err: Error) => err instanceof UnauthorizedError
    );
  });

  test('Org Context: User with no assigned org should throw ForbiddenError', async () => {
    await assert.rejects(
      async () => {
        await orgContextService.getOrganizationContext(outsiderUserId);
      },
      (err: Error) => err instanceof ForbiddenError
    );
  });

  test('Org Context: Valid user should return server-resolved context', async () => {
    const ctx = await orgContextService.getOrganizationContext(ownerUserId);
    assert.strictEqual(ctx.userId, ownerUserId);
    assert.strictEqual(ctx.organization.slug, 'willshop');
    assert.strictEqual(ctx.role, 'OWNER');
    assert.ok(ctx.permissions.includes('settings:manage'));
  });

  // --------------------------------------------------------------------------
  // 2. RBAC Matrix & Server Permissions Tests
  // --------------------------------------------------------------------------
  test('RBAC: OWNER role should have full permissions', () => {
    assert.strictEqual(hasPermission('OWNER', 'settings:manage'), true);
    assert.strictEqual(hasPermission('OWNER', 'finance:write'), true);
    assert.strictEqual(hasPermission('OWNER', 'order:write'), true);
  });

  test('RBAC: VIEWER role should not have write permissions', () => {
    assert.strictEqual(hasPermission('VIEWER', 'order:read'), true);
    assert.strictEqual(hasPermission('VIEWER', 'order:write'), false);
    assert.strictEqual(hasPermission('VIEWER', 'finance:write'), false);
    assert.strictEqual(hasPermission('VIEWER', 'settings:manage'), false);
  });

  test('RBAC: Server-side verifyPermission should throw ForbiddenError on unauthorized action', async () => {
    const viewerCtx = await orgContextService.getOrganizationContext(viewerUserId);
    assert.throws(
      () => {
        orgContextService.verifyPermission(viewerCtx, 'finance:write');
      },
      (err: Error) => err instanceof ForbiddenError
    );
  });

  // --------------------------------------------------------------------------
  // 3. Central Audit Log Tests
  // --------------------------------------------------------------------------
  test('Audit: Should record audit entry with full context', async () => {
    const logEntry = await auditService.log({
      organizationId: testOrgId,
      actorId: ownerUserId,
      action: 'user.role.update',
      targetEntity: 'user_organization_roles',
      targetId: 'role-123',
      beforeState: { role: 'VIEWER' },
      afterState: { role: 'MANAGER' },
      reason: 'Promoted commercial manager',
      correlationId: 'corr-001',
    });

    assert.ok(logEntry.id);
    assert.strictEqual(logEntry.action, 'user.role.update');
    assert.strictEqual(logEntry.actorId, ownerUserId);

    const logs = await auditService.getLogs(testOrgId);
    assert.strictEqual(logs.length, 1);
  });

  // --------------------------------------------------------------------------
  // 4. System Events Tests
  // --------------------------------------------------------------------------
  test('Events: Should record system event (user.login)', async () => {
    const event = await eventDispatcher.dispatch({
      organizationId: testOrgId,
      eventType: 'user.login',
      payload: { ip: '127.0.0.1', userAgent: 'Mozilla/5.0' },
      actorId: ownerUserId,
      correlationId: 'login-corr-001',
    });

    assert.ok(event.id);
    assert.strictEqual(event.eventType, 'user.login');
    assert.strictEqual(event.status, 'PENDING');
  });

  // --------------------------------------------------------------------------
  // 5. Idempotency Infrastructure Tests
  // --------------------------------------------------------------------------
  test('Idempotency: Same key + same payload should return cached result', async () => {
    const key = 'idem-key-001';
    const payload = { action: 'confirm_order', orderId: 'ord-100' };
    let executionCount = 0;

    const op = async () => {
      executionCount++;
      return { status: 'SUCCESS', orderId: 'ord-100' };
    };

    // First call
    const res1 = await idempotencyService.execute(key, testOrgId, payload, op);
    assert.strictEqual(res1.isCachedResponse, false);
    assert.strictEqual(executionCount, 1);

    // Second call with SAME payload
    const res2 = await idempotencyService.execute(key, testOrgId, payload, op);
    assert.strictEqual(res2.isCachedResponse, true);
    assert.strictEqual(res2.data.status, 'SUCCESS');
    assert.strictEqual(executionCount, 1); // Operation did NOT re-run
  });

  test('Idempotency: Same key + different payload should throw IdempotencyMismatchError', async () => {
    const key = 'idem-key-002';
    const payload1 = { action: 'pay', amount: 5000 };
    const payload2 = { action: 'pay', amount: 10000 };

    await idempotencyService.execute(key, testOrgId, payload1, async () => ({ ok: true }));

    await assert.rejects(
      async () => {
        await idempotencyService.execute(key, testOrgId, payload2, async () => ({ ok: true }));
      },
      (err: Error) => err instanceof IdempotencyMismatchError
    );
  });

  // --------------------------------------------------------------------------
  // 6. AI Gateway Abstraction Tests
  // --------------------------------------------------------------------------
  test('AI Gateway: Provider-agnostic abstraction should complete mock request', async () => {
    const response = await aiGateway.generateCompletion({
      agentName: 'CEO AI',
      messages: [{ role: 'user', content: 'Status check' }],
    });

    assert.ok(response.content.includes('CEO AI'));
    assert.strictEqual(response.provider, 'mock-provider');
    assert.ok(response.totalTokens > 0);
  });
});
