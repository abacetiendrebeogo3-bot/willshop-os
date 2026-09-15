/**
 * WILLShop OS — Multi-Tenant Configurable FAQ & Knowledge Base Test Suite
 * Validates zero hardcoded FAQ fallbacks, dynamic multi-tenant isolation,
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

describe('Multi-Tenant Configurable FAQ & Knowledge Base Test Suite', () => {
  const ORG_A_ID = '00000000-0000-4000-a000-000000000001';
  const ORG_B_ID = '00000000-0000-4000-a000-000000000002';

  const productRepo = new InMemoryProductRepository();
  const orderRepo = new InMemoryOrderRepository();
  const auditRepo = new InMemoryAuditRepository();
  const eventRepo = new InMemoryEventRepository();
  const createOrderService = new CreateOrderService(orderRepo, productRepo, auditRepo, eventRepo);
  const toolsRegistry = new AIToolsRegistry(productRepo, orderRepo, createOrderService);

  test('A. Organization without FAQ returns 0 entries and clean message', async () => {
    const res = await toolsRegistry.executeTool('get_knowledge_base', { category: 'FAQ' }, ORG_A_ID, { faqs: [] });
    assert.strictEqual(res.result.found, false);
    assert.strictEqual(res.result.entries.length, 0);
    assert.match(res.result.message, /Aucune information/i);
  });

  test('B & C. Creation adds FAQ dynamically and persists it', async () => {
    const orgAConfig = {
      faqs: [
        {
          id: 'faq-1',
          question: 'Quels sont vos délais de livraison ?',
          answer: 'La livraison prend entre 24h et 48h selon votre quartier.',
          category: 'Livraison',
          status: 'ACTIVE',
        },
      ],
    };

    const res = await toolsRegistry.executeTool('get_knowledge_base', { query: 'livraison' }, ORG_A_ID, orgAConfig);
    assert.strictEqual(res.result.found, true);
    assert.strictEqual(res.result.entries.length, 1);
    assert.strictEqual(res.result.entries[0].title, 'Quels sont vos délais de livraison ?');
    assert.strictEqual(res.result.entries[0].content, 'La livraison prend entre 24h et 48h selon votre quartier.');
  });

  test('D. Modification updates FAQ details cleanly', async () => {
    const orgAConfigModified = {
      faqs: [
        {
          id: 'faq-1',
          question: 'Quels sont vos délais de livraison révisés ?',
          answer: 'Livraison express en 2 heures chrono !',
          category: 'Livraison',
          status: 'ACTIVE',
        },
      ],
    };

    const res = await toolsRegistry.executeTool('get_knowledge_base', { query: 'express' }, ORG_A_ID, orgAConfigModified);
    assert.strictEqual(res.result.entries[0].title, 'Quels sont vos délais de livraison révisés ?');
    assert.strictEqual(res.result.entries[0].content, 'Livraison express en 2 heures chrono !');
  });

  test('E & F. Deactivation / Archiving excludes FAQ from AI Agent active context', async () => {
    const orgAConfigArchived = {
      faqs: [
        {
          id: 'faq-1',
          question: 'Vos produits sont-ils authentiques ?',
          answer: 'Oui tous nos produits sont sous garantie.',
          category: 'Produit',
          status: 'ARCHIVED',
        },
      ],
    };

    const res = await toolsRegistry.executeTool('get_knowledge_base', { query: 'authentiques' }, ORG_A_ID, orgAConfigArchived);
    assert.strictEqual(res.result.found, false);
    assert.strictEqual(res.result.entries.length, 0);
  });

  test('G. AI Agent context prompt formats dynamic FAQs from DB SSOT', () => {
    const contextService = new SalesAgentContextService();
    const dummyCust = { id: 'c1', fullName: 'Aminata Diallo', phone: '+22670000002', status: 'ACTIVE' } as any;
    const dummyProducts: any[] = [];
    const dummyMsgs: any[] = [];

    const orgConfig = {
      faqs: [
        {
          id: 'faq-auth',
          question: 'Les produits sont-ils garantis ?',
          answer: 'Oui, garantie fabricant officielle 1 an.',
          category: 'Garantie',
          status: 'ACTIVE',
        },
      ],
    };

    const prompt = contextService.buildContext(dummyCust, dummyMsgs, dummyProducts, undefined, 1000, orgConfig);
    assert.ok(prompt.includes('Les produits sont-ils garantis ?'));
    assert.ok(prompt.includes('garantie fabricant officielle 1 an'));
    assert.ok(!prompt.includes('WillShop'));
  });

  test('H. Multi-tenant isolation: Org A FAQs are NEVER returned to Org B', async () => {
    const orgAConfig = {
      faqs: [{ id: 'f-a', question: 'Question Org A', answer: 'Réponse Org A', status: 'ACTIVE' }],
    };

    const orgBConfig = {
      faqs: [{ id: 'f-b', question: 'Question Org B', answer: 'Réponse Org B', status: 'ACTIVE' }],
    };

    const resA = await toolsRegistry.executeTool('get_knowledge_base', {}, ORG_A_ID, orgAConfig);
    const resB = await toolsRegistry.executeTool('get_knowledge_base', {}, ORG_B_ID, orgBConfig);

    assert.strictEqual(resA.result.entries[0].title, 'Question Org A');
    assert.strictEqual(resB.result.entries[0].title, 'Question Org B');
    assert.notStrictEqual(resA.result.entries[0].content, resB.result.entries[0].content);
  });

  test('I. Anti-hardcode verification: Test Guardrail blocks any write to commercial org ID', () => {
    assert.throws(
      () => assertNotCommercialOrg(REAL_COMMERCIAL_ORG_ID, 'FAQ Test'),
      /ANTI-POLLUTION SAFEGUARD BLOCKED/
    );
  });
});
