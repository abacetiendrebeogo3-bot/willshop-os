/**
 * WILLShop OS — Multi-Tenant RLS Simulation Test Suite
 * Simulates SQL RLS security policies & server-side authorization filters.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';

import { OrganizationContextService } from '../src/application/services/OrganizationContextService';
import { InMemoryOrganizationRepository } from '../src/infrastructure/repositories/InMemoryRepositories';
import { ForbiddenError, UnauthorizedError } from '../src/domain/errors/AppErrors';

describe('Build 01 — RLS Multi-Tenant Security & Isolation Test Suite', () => {
  const orgRepo = new InMemoryOrganizationRepository();
  const contextService = new OrganizationContextService(orgRepo);

  const orgAId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'; // WillShop
  const orgBId = 'b1ffcd88-8b0a-3ef7-aa5c-5aa8ac270b22'; // OtherOrg

  const userAId = 'user-a-willshop-owner';
  const userBId = 'user-b-otherorg-owner';
  const outsiderId = 'user-c-outsider';

  // Seed Org B
  orgRepo.seedOrganization({
    id: orgBId,
    name: 'OtherOrg',
    slug: 'otherorg',
    country: 'Burkina Faso',
    currency: 'XOF',
    timezone: 'Africa/Ouagadougou',
    settings: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Assign user roles
  orgRepo.assignUserRole(userAId, {
    userId: userAId,
    organizationId: orgAId,
    role: 'OWNER',
    permissions: [],
  });

  orgRepo.assignUserRole(userBId, {
    userId: userBId,
    organizationId: orgBId,
    role: 'OWNER',
    permissions: [],
  });

  // --------------------------------------------------------------------------
  // RLS Isolation Tests
  // --------------------------------------------------------------------------

  test('RLS: User A should access Organization A successfully', async () => {
    const ctxA = await contextService.getOrganizationContext(userAId, orgAId);
    assert.strictEqual(ctxA.organization.id, orgAId);
    assert.strictEqual(ctxA.organization.name, 'WillShop');
  });

  test('RLS: User B should access Organization B successfully', async () => {
    const ctxB = await contextService.getOrganizationContext(userBId, orgBId);
    assert.strictEqual(ctxB.organization.id, orgBId);
    assert.strictEqual(ctxB.organization.name, 'OtherOrg');
  });

  test('RLS Isolation: User A CANNOT access Organization B (Throws ForbiddenError)', async () => {
    await assert.rejects(
      async () => {
        await contextService.getOrganizationContext(userAId, orgBId);
      },
      (err: Error) => {
        assert.ok(err instanceof ForbiddenError);
        assert.ok(err.message.includes('Access denied'));
        return true;
      }
    );
  });

  test('RLS Isolation: User B CANNOT access Organization A (Throws ForbiddenError)', async () => {
    await assert.rejects(
      async () => {
        await contextService.getOrganizationContext(userBId, orgAId);
      },
      (err: Error) => {
        assert.ok(err instanceof ForbiddenError);
        assert.ok(err.message.includes('Access denied'));
        return true;
      }
    );
  });

  test('RLS Isolation: Outsider User C CANNOT access Organization A or B', async () => {
    await assert.rejects(
      async () => {
        await contextService.getOrganizationContext(outsiderId, orgAId);
      },
      (err: Error) => err instanceof ForbiddenError
    );

    await assert.rejects(
      async () => {
        await contextService.getOrganizationContext(outsiderId, orgBId);
      },
      (err: Error) => err instanceof ForbiddenError
    );
  });
});
