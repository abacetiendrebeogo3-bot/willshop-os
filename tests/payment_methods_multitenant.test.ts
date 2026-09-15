/**
 * WILLShop OS — Multi-Tenant Configurable Payment Methods Test Suite
 * Validates zero hardcoded payment fallbacks, dynamic multi-tenant isolation,
 * CRUD operations, inactive exclusion from AI Agent, and anti-pollution.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SalesAgentService, SalesAgentContextService } from '../src/application/services/SalesAgentService.js';
import { AIToolsRegistry } from '../src/application/services/AIToolsRegistry.js';
import {
  InMemoryProductRepository,
  InMemoryOrderRepository,
} from '../src/infrastructure/repositories/InMemoryDataCoreRepositories.js';
import { CreateOrderService } from '../src/application/services/OrderStockApplicationServices.js';
import { InMemoryAuditRepository, InMemoryEventRepository } from '../src/infrastructure/repositories/InMemoryRepositories.js';
import { REAL_COMMERCIAL_ORG_ID, assertNotCommercialOrg } from '../src/config/testGuardrails.js';

describe('Multi-Tenant Configurable Payment Methods Test Suite', () => {
  const ORG_A_ID = '00000000-0000-4000-a000-000000000001';
  const ORG_B_ID = '00000000-0000-4000-a000-000000000002';

  const productRepo = new InMemoryProductRepository();
  const orderRepo = new InMemoryOrderRepository();
  const auditRepo = new InMemoryAuditRepository();
  const eventRepo = new InMemoryEventRepository();
  const createOrderService = new CreateOrderService(orderRepo, productRepo, auditRepo, eventRepo);
  const toolsRegistry = new AIToolsRegistry(productRepo, orderRepo, createOrderService);

  test('A. Organization without payment methods returns 0 methods and clean message', async () => {
    const res = await toolsRegistry.executeTool('get_payment_methods', {}, ORG_A_ID, { payment_methods: [] });
    assert.strictEqual(res.result.found, false);
    assert.strictEqual(res.result.paymentMethods.length, 0);
    assert.match(res.result.message, /aucun moyen de paiement/i);
  });

  test('B & C. Creation adds payment method dynamically and persists it', async () => {
    const orgAConfig = {
      payment_methods: [
        {
          id: 'pm-1',
          name: 'Moov Money',
          identifier: '+226 60 00 00 11',
          instructions: 'Envoyer au +226 60 00 00 11 puis transmettre le reçu.',
          status: 'ACTIVE',
        },
      ],
    };

    const res = await toolsRegistry.executeTool('get_payment_methods', {}, ORG_A_ID, orgAConfig);
    assert.strictEqual(res.result.found, true);
    assert.strictEqual(res.result.paymentMethods.length, 1);
    assert.strictEqual(res.result.paymentMethods[0].name, 'Moov Money');
    assert.strictEqual(res.result.paymentMethods[0].identifier, '+226 60 00 00 11');
  });

  test('D. Modification updates payment method details cleanly', async () => {
    const orgAConfigModified = {
      payment_methods: [
        {
          id: 'pm-1',
          name: 'Moov Money Pro',
          identifier: '+226 60 99 88 77',
          instructions: 'Dépôt au +226 60 99 88 77',
          status: 'ACTIVE',
        },
      ],
    };

    const res = await toolsRegistry.executeTool('get_payment_methods', {}, ORG_A_ID, orgAConfigModified);
    assert.strictEqual(res.result.paymentMethods[0].name, 'Moov Money Pro');
    assert.strictEqual(res.result.paymentMethods[0].identifier, '+226 60 99 88 77');
  });

  test('E & F. Deactivation / Archiving excludes method from AI Agent active list', async () => {
    const orgAConfigArchived = {
      payment_methods: [
        {
          id: 'pm-1',
          name: 'Virement Bancaire',
          identifier: 'BF01 2345 6789',
          instructions: 'RIB Bank of Africa',
          status: 'ARCHIVED',
        },
      ],
    };

    const res = await toolsRegistry.executeTool('get_payment_methods', {}, ORG_A_ID, orgAConfigArchived);
    assert.strictEqual(res.result.found, false);
    assert.strictEqual(res.result.paymentMethods.length, 0);
  });

  test('G. AI Agent context prompt formats dynamic payment methods from DB SSOT', () => {
    const contextService = new SalesAgentContextService();
    const dummyCust = { id: 'c1', fullName: 'Moussa Traoré', phone: '+22670000001', status: 'ACTIVE' } as any;
    const dummyProducts: any[] = [];
    const dummyMsgs: any[] = [];

    const orgConfig = {
      payment_methods: [
        {
          id: 'pm-wave',
          name: 'Wave Senegal',
          identifier: '+221 77 111 22 33',
          instructions: 'Scanner le QR Wave',
          status: 'ACTIVE',
        },
      ],
    };

    const prompt = contextService.buildContext(dummyCust, dummyMsgs, dummyProducts, undefined, 1000, orgConfig);
    assert.ok(prompt.includes('Wave Senegal'));
    assert.ok(prompt.includes('+221 77 111 22 33'));
    assert.ok(!prompt.includes('WillShop'));
  });

  test('H. Multi-tenant isolation: Org A payment methods are NEVER returned to Org B', async () => {
    const orgAConfig = {
      payment_methods: [
        { id: 'pm-a', name: 'Org A Mobile Money', identifier: '+226 70 11 11 11', status: 'ACTIVE' },
      ],
    };

    const orgBConfig = {
      payment_methods: [
        { id: 'pm-b', name: 'Org B Wave', identifier: '+221 77 22 22 22', status: 'ACTIVE' },
      ],
    };

    const resA = await toolsRegistry.executeTool('get_payment_methods', {}, ORG_A_ID, orgAConfig);
    const resB = await toolsRegistry.executeTool('get_payment_methods', {}, ORG_B_ID, orgBConfig);

    assert.strictEqual(resA.result.paymentMethods[0].name, 'Org A Mobile Money');
    assert.strictEqual(resB.result.paymentMethods[0].name, 'Org B Wave');
    assert.notStrictEqual(resA.result.paymentMethods[0].identifier, resB.result.paymentMethods[0].identifier);
  });

  test('I. Anti-hardcode verification: Test Guardrail blocks any write to commercial org ID', () => {
    assert.throws(
      () => assertNotCommercialOrg(REAL_COMMERCIAL_ORG_ID, 'Payment Method Test'),
      /ANTI-POLLUTION SAFEGUARD BLOCKED/
    );
  });
});
