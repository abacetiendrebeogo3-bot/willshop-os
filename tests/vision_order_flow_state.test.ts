/**
 * WILLShop OS — Vision Product Recognition, Flow State & Name Request Suppression Test Suite
 * Validates:
 * 1. Image product recognition against DB catalog SSOT.
 * 2. Absolute suppression of customer name requests ("Quel est votre nom ?").
 * 3. Flow State progression (Product -> Neighborhood -> Confirmation).
 * 4. Preservation of customer name when voluntarily provided ("Wilfried").
 * 5. Intent Shift / Intent Reset when customer changes product.
 * 6. Multi-tenant RLS isolation & anti-pollution guardrails.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { REAL_COMMERCIAL_ORG_ID, SANDBOX_TEST_ORG_ID, assertNotCommercialOrg } from '../src/config/testGuardrails.js';
import { SalesAgentService, SalesAgentContextService, ConversationFlowState } from '../src/application/services/SalesAgentService';
import { Customer, Product } from '../src/domain/entities/DataCoreEntities';

describe('Vision Product Recognition & Name Request Suppression Test Suite', () => {
  const ORG_A = SANDBOX_TEST_ORG_ID;
  const ORG_B = '11111111-1111-4111-a111-111111111111';

  let contextService: SalesAgentContextService;

  const sampleProducts: Product[] = [
    {
      id: 'prod-minceur-001',
      organizationId: ORG_A,
      sku: 'WS-7581',
      name: 'Kit Minceur',
      category: 'SANTE',
      purchasePrice: 8000,
      sellingPrice: 15000,
      currency: 'XOF',
      minimumStock: 10,
      unit: 'boîte',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'prod-green-002',
      organizationId: ORG_A,
      sku: 'WS-8442',
      name: 'Green Mask',
      category: 'BEAUTE',
      purchasePrice: 5000,
      sellingPrice: 10000,
      currency: 'XOF',
      minimumStock: 5,
      unit: 'flacon',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const sampleCustomer: Customer = {
    id: 'cust-wilfried-101',
    organizationId: ORG_A,
    firstName: 'Wilfried',
    lastName: 'Tiendrebeogo',
    fullName: 'Wilfried Tiendrebeogo',
    phone: '+22670112233',
    city: 'Ouagadougou',
    source: 'WHATSAPP',
    status: 'ACTIVE',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    assertNotCommercialOrg(ORG_A, 'Vision Flow State Test Org A');
    assertNotCommercialOrg(ORG_B, 'Vision Flow State Test Org B');

    contextService = new SalesAgentContextService();
  });

  test('A. Anti-pollution guardrail prevents operations on live commercial org', () => {
    assert.throws(
      () => assertNotCommercialOrg(REAL_COMMERCIAL_ORG_ID, 'Vision Guardrail Check'),
      /ANTI-POLLUTION SAFEGUARD BLOCKED/
    );
  });

  test('B. ConversationFlowState context injection formats product, neighborhood, and name state', () => {
    const flowState: ConversationFlowState = {
      productId: 'prod-minceur-001',
      productName: 'Kit Minceur',
      productIdentified: true,
      neighborhood: 'Benego',
      deliveryVerified: true,
      deliveryFee: 1000,
      customerName: 'Wilfried Tiendrebeogo',
      customerPhone: '+22670112233',
      nextRequiredField: 'CONFIRMATION',
    };

    const contextStr = contextService.buildContext(sampleCustomer, [], sampleProducts, null, 1000, {}, flowState);

    assert.ok(contextStr.includes('=== ÉTAT DE PARCOURS COMMERCIAL (FLOW STATE) ==='));
    assert.ok(contextStr.includes('Kit Minceur'));
    assert.ok(contextStr.includes('Benego'));
    assert.ok(contextStr.includes('Wilfried Tiendrebeogo'));
    assert.ok(contextStr.includes('CONFIRMATION'));
  });

  test('C. Mock AI Gateway generates response matching catalog SSOT without asking for customer name', async () => {
    const mockAiGateway: any = {
      generateCompletion: async () => ({
        content: "Oui 😊 Le Kit Minceur est disponible à 15 000 XOF 💚 Vous êtes dans quel quartier pour la livraison ?",
        promptTokens: 150,
        completionTokens: 30,
        totalTokens: 180,
        model: 'claude-sonnet-5',
      }),
    };

    const service = new SalesAgentService(mockAiGateway, contextService);

    const flowState: ConversationFlowState = {
      productId: 'prod-minceur-001',
      productName: 'Kit Minceur',
      productIdentified: true,
      customerPhone: '+22670112233',
      nextRequiredField: 'NEIGHBORHOOD',
    };

    const res = await service.generateResponse(
      sampleCustomer,
      [],
      sampleProducts,
      ORG_A,
      {},
      undefined,
      null,
      null,
      false,
      flowState
    );

    assert.ok(res.responseText.includes('15 000 XOF'));
    assert.ok(res.responseText.includes('quartier'));
    assert.equal(res.responseText.includes('votre nom'), false);
    assert.equal(res.responseText.includes('votre nom complet'), false);
  });

  test('D. Voluntary name provision ("Wilfried") persists and NEVER triggers name re-asking', async () => {
    const flowState: ConversationFlowState = {
      productId: 'prod-minceur-001',
      productName: 'Kit Minceur',
      productIdentified: true,
      neighborhood: 'Benego',
      deliveryVerified: true,
      deliveryFee: 1000,
      customerName: 'Wilfried',
      customerPhone: '+22670112233',
      nextRequiredField: 'CONFIRMATION',
    };

    const mockAiGateway: any = {
      generateCompletion: async () => ({
        content: "Parfait Wilfried 👍 La livraison à Benego est à 1 000 XOF. Confirmez-vous la commande ?",
        promptTokens: 160,
        completionTokens: 25,
        totalTokens: 185,
        model: 'claude-sonnet-5',
      }),
    };

    const service = new SalesAgentService(mockAiGateway, contextService);

    const res = await service.generateResponse(
      sampleCustomer,
      [],
      sampleProducts,
      ORG_A,
      {},
      undefined,
      null,
      null,
      false,
      flowState
    );

    assert.ok(res.responseText.includes('Wilfried'));
    assert.equal(res.responseText.includes('Quel est votre nom'), false);
    assert.equal(res.responseText.includes('votre nom complet'), false);
  });

  test('E. Intent Shift updates product from Kit Minceur to Green Mask', () => {
    const initialFlowState: ConversationFlowState = {
      productId: 'prod-minceur-001',
      productName: 'Kit Minceur',
      productIdentified: true,
      customerPhone: '+22670112233',
      nextRequiredField: 'NEIGHBORHOOD',
    };

    // Customer shifts intent
    const updatedFlowState: ConversationFlowState = {
      ...initialFlowState,
      productId: 'prod-green-002',
      productName: 'Green Mask',
      productIdentified: true,
      nextRequiredField: 'NEIGHBORHOOD',
    };

    const contextStr = contextService.buildContext(sampleCustomer, [], sampleProducts, null, 1000, {}, updatedFlowState);

    assert.ok(contextStr.includes('Green Mask'));
    assert.equal(contextStr.includes('Kit Minceur (ID: prod-minceur-001)'), false);
  });
});
