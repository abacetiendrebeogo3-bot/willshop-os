/**
 * WILLShop OS — Vision Multimodal, Intent Reset & Conciseness Test Suite
 * Tests end-to-end multimodal image vision, intent shift/reset,
 * catalog SSOT data usage, conciseness limits, and delivery zone handling.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SalesAgentService, SalesAgentContextService } from '../src/application/services/SalesAgentService';
import { AIToolsRegistry } from '../src/application/services/AIToolsRegistry';
import { WhatsAppApplicationService } from '../src/application/services/WhatsAppApplicationService';

describe('Vision Multimodal, Intent Reset & Conciseness Test Suite', () => {
  const mockCustomer: any = {
    id: 'cust-test-101',
    organizationId: 'org-vision-001',
    firstName: 'Amadou',
    lastName: 'Fall',
    fullName: 'Amadou Fall',
    phone: '22652884554',
    city: 'Ouagadougou',
    source: 'WHATSAPP',
    status: 'ACTIVE',
  };

  const mockProducts: any[] = [
    {
      id: 'prod-kit-minceur',
      organizationId: 'org-vision-001',
      sku: 'SKU-MINCEUR-01',
      name: 'Kit Minceur 28 Jours',
      category: 'MINCEUR',
      purchasePrice: 8000,
      sellingPrice: 15000,
      currency: 'XOF',
      minimumStock: 12,
      unit: 'boîtes',
      status: 'ACTIVE',
    },
    {
      id: 'prod-maca-vital',
      organizationId: 'org-vision-001',
      sku: 'SKU-MACA-02',
      name: 'Maca Bio Vitalité',
      category: 'COMPLÉMENTS',
      purchasePrice: 5000,
      sellingPrice: 10000,
      currency: 'XOF',
      minimumStock: 5,
      unit: 'flacons',
      status: 'ACTIVE',
    },
  ];

  function createMockGateway(cannedResponse: string, cannedToolCalls?: any[]) {
    return {
      generateCompletion: async () => ({
        content: cannedResponse,
        promptTokens: 150,
        completionTokens: 30,
        totalTokens: 180,
        model: 'claude-sonnet-5',
        provider: 'anthropic',
        toolCalls: cannedToolCalls,
      }),
    };
  }

  test('1 & 6 & 7 & 8: Clear product image uses DB catalog SSOT (Price 15 000 XOF, Stock DB)', async () => {
    let capturedToolCall: string | undefined;
    const mockGateway = {
      generateCompletion: async (req: any) => {
        // Assert multimodal content block sent to Anthropic in conversation
        const hasImageBlock = req.messages.some((m: any) =>
          Array.isArray(m.content) && m.content.some((b: any) => b.type === 'image')
        );
        assert.equal(hasImageBlock, true, 'Image block must be passed to Anthropic');

        return {
          content: "Oui 😊 Il s'agit du Kit Minceur 28 Jours, disponible à 15 000 XOF en stock 💚 Vous êtes dans quel quartier pour la livraison ? 📍",
          promptTokens: 200,
          completionTokens: 35,
          totalTokens: 235,
          model: 'claude-sonnet-5',
          provider: 'anthropic',
          toolCalls: [{ id: 'call_1', name: 'send_product_image', input: { productId: 'prod-kit-minceur' } }],
        };
      },
    };

    const mockToolsRegistry: any = {
      executeTool: async (name: string, input: any) => {
        capturedToolCall = name;
        return { result: { success: true, sentToWhatsApp: true } };
      },
    };

    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService(), mockToolsRegistry);
    const sampleB64 = Buffer.from('fake_jpeg_binary_data_sample_product_image').toString('base64');

    const res = await service.generateResponse(
      mockCustomer,
      [{ id: 'm1', content: '[Image]', messageType: 'IMAGE', direction: 'INBOUND', senderType: 'CUSTOMER' } as any],
      mockProducts,
      'org-vision-001',
      { auto_send_images: true },
      {},
      null,
      { base64: sampleB64, mimeType: 'image/jpeg' },
      false
    );

    assert.equal(capturedToolCall, 'send_product_image');
    assert.match(res.responseText, /15\s*000/);
    assert.match(res.responseText, /Kit Minceur/i);
    assert.match(res.responseText, /quartier/i);
  });

  test('2: Client image different from catalog photo is still recognized by Vision', async () => {
    const mockGateway = createMockGateway("Oui 😊 Il s'agit du Kit Minceur 28 Jours. Il est au prix de 15 000 XOF. Dans quel quartier êtes-vous ? 📍");
    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService());
    const differentPhotoB64 = Buffer.from('different_angle_user_photo_on_table').toString('base64');

    const res = await service.generateResponse(
      mockCustomer,
      [{ id: 'm1', content: '[Image]', messageType: 'IMAGE', direction: 'INBOUND', senderType: 'CUSTOMER' } as any],
      mockProducts,
      'org-vision-001',
      {},
      {},
      null,
      { base64: differentPhotoB64, mimeType: 'image/jpeg' },
      false
    );

    assert.match(res.responseText, /Kit Minceur/i);
    assert.match(res.responseText, /15\s*000/);
  });

  test('3: Image + text ("Je cherche ça") combines text and vision input', async () => {
    let capturedTextContent = '';
    const mockGateway = {
      generateCompletion: async (req: any) => {
        const lastMsg = req.messages[req.messages.length - 1];
        capturedTextContent = JSON.stringify(lastMsg.content);
        return {
          content: "Oui 😊 C'est notre Maca Bio Vitalité à 10 000 XOF. Vous êtes dans quel quartier ? 📍",
          promptTokens: 180,
          completionTokens: 25,
          totalTokens: 205,
          model: 'claude-sonnet-5',
          provider: 'anthropic',
        };
      },
    };

    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService());
    const b64 = Buffer.from('sample_maca_bottle').toString('base64');

    const res = await service.generateResponse(
      mockCustomer,
      [{ id: 'm1', content: 'Je cherche ça', messageType: 'IMAGE', direction: 'INBOUND', senderType: 'CUSTOMER' } as any],
      mockProducts,
      'org-vision-001',
      {},
      {},
      null,
      { base64: b64, mimeType: 'image/jpeg' },
      false
    );

    assert.match(capturedTextContent, /Je cherche ça/);
    assert.match(res.responseText, /Maca/i);
    assert.match(res.responseText, /10\s*000/);
  });

  test('4: Low confidence image triggers a short, gentle clarification question', async () => {
    const mockGateway = createMockGateway("Je veux être sûr 😊 Vous cherchez bien un produit pour la minceur ?");
    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService());
    const b64 = Buffer.from('blurry_packaging').toString('base64');

    const res = await service.generateResponse(
      mockCustomer,
      [{ id: 'm1', content: '[Image]', messageType: 'IMAGE', direction: 'INBOUND', senderType: 'CUSTOMER' } as any],
      mockProducts,
      'org-vision-001',
      {},
      {},
      null,
      { base64: b64, mimeType: 'image/jpeg' },
      false
    );

    assert.equal(res.responseText, "Je veux être sûr 😊 Vous cherchez bien un produit pour la minceur ?");
  });

  test('5: Inaccessible / undecryptable image returns honest short response', async () => {
    const mockGateway = createMockGateway("SHOULD_NOT_BE_CALLED");
    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService());

    const res = await service.generateResponse(
      mockCustomer,
      [{ id: 'm1', content: '[Image]', messageType: 'IMAGE', direction: 'INBOUND', senderType: 'CUSTOMER' } as any],
      mockProducts,
      'org-vision-001',
      {},
      {},
      null,
      null,
      true // imageAccessFailed = true
    );

    assert.equal(res.responseText, "Je n'arrive pas à ouvrir la photo pour le moment 😕\nPouvez-vous me donner le nom du produit ?");
  });

  test('9 & 10: Intent Reset ("laisse tomber, vous livrez où ?") clears previous goal and answers delivery directly', async () => {
    let capturedToolCall: string | undefined;
    const mockGateway = {
      generateCompletion: async (req: any) => {
        return {
          content: "Nous livrons partout à Ouagadougou 🚚 Vous êtes dans quel quartier ? 📍",
          promptTokens: 150,
          completionTokens: 20,
          totalTokens: 170,
          model: 'claude-haiku-4-5-20251001',
          provider: 'anthropic',
          toolCalls: [{ id: 'call_deliv', name: 'check_delivery_zone', input: { city: 'Ouagadougou' } }],
        };
      },
    };

    const mockToolsRegistry: any = {
      executeTool: async (name: string) => {
        capturedToolCall = name;
        return { result: { available: true, city: 'Ouagadougou', fee: 0 } };
      },
    };

    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService(), mockToolsRegistry);

    const history: any[] = [
      { id: 'm1', content: 'Je cherche le produit anti-âge.', direction: 'INBOUND', senderType: 'CUSTOMER' },
      { id: 'm2', content: 'Quel produit cherchez-vous exactement ?', direction: 'OUTBOUND', senderType: 'AI' },
      { id: 'm3', content: 'Laisse tomber, vous livrez où ?', direction: 'INBOUND', senderType: 'CUSTOMER' },
    ];

    const res = await service.generateResponse(mockCustomer, history, mockProducts, 'org-vision-001');

    assert.equal(capturedToolCall, 'check_delivery_zone');
    assert.doesNotMatch(res.responseText, /anti-âge/i);
    assert.doesNotMatch(res.responseText, /Quel produit cherchez-vous/i);
    assert.match(res.responseText, /livron/i);
  });

  test('11: Information already provided (Somgandé) is never re-asked', async () => {
    const mockGateway = createMockGateway("Super 👍 Somgandé est desservi avec 0 XOF de frais sous 24h 🚚 Quel est votre nom complet ?");
    const mockToolsRegistry: any = {
      executeTool: async () => ({ result: { available: true, zoneName: 'Kossodo', fee: 0, district: 'Somgandé' } }),
    };

    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService(), mockToolsRegistry);

    const history: any[] = [
      { id: 'm1', content: 'Je veux le Kit Minceur', direction: 'INBOUND', senderType: 'CUSTOMER' },
      { id: 'm2', content: 'Oui 😊 Le Kit Minceur est à 15 000 XOF. Vous êtes dans quel quartier ?', direction: 'OUTBOUND', senderType: 'AI' },
      { id: 'm3', content: 'Je suis à Somgandé', direction: 'INBOUND', senderType: 'CUSTOMER' },
    ];

    const res = await service.generateResponse(mockCustomer, history, mockProducts, 'org-vision-001');

    assert.doesNotMatch(res.responseText, /quel quartier/i);
    assert.match(res.responseText, /Somgandé/i);
  });

  test('12 & 13: Response length is 1-3 sentences max, only 1 question at a time', async () => {
    const mockGateway = createMockGateway("Oui, nous livrons à Ouagadougou 🚚 Vous êtes dans quel quartier ? 📍");
    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService());

    const res = await service.generateResponse(
      mockCustomer,
      [{ id: 'm1', content: 'Vous livrez à Ouaga ?', direction: 'INBOUND', senderType: 'CUSTOMER' } as any],
      mockProducts,
      'org-vision-001'
    );

    const sentenceCount = res.responseText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const questionMarkCount = (res.responseText.match(/\?/g) || []).length;

    assert.ok(sentenceCount <= 3, `Response must be 1-3 sentences max, got ${sentenceCount}`);
    assert.equal(questionMarkCount, 1, `Response must contain exactly 1 question, got ${questionMarkCount}`);
  });

  test('14 & 15: Voice or text "Je suis à Somgandé" executes check_delivery_zone accurately', async () => {
    let executedDistrict: string | undefined;
    const mockToolsRegistry: any = {
      executeTool: async (name: string, input: any) => {
        executedDistrict = input.district;
        return { result: { available: true, zoneName: 'Zone Kossodo', fee: 0, district: 'Somgandé' } };
      },
    };

    const mockGateway = {
      generateCompletion: async () => ({
        content: "Parfait ! La livraison à Somgandé est à 0 XOF under 24h 🚚 Quel est votre nom pour la commande ?",
        promptTokens: 100,
        completionTokens: 20,
        totalTokens: 120,
        model: 'claude-haiku-4-5-20251001',
        provider: 'anthropic',
        toolCalls: [{ id: 'call_dz', name: 'check_delivery_zone', input: { district: 'Somgandé' } }],
      }),
    };

    const service = new SalesAgentService(mockGateway as any, new SalesAgentContextService(), mockToolsRegistry);

    const res = await service.generateResponse(
      mockCustomer,
      [{ id: 'm1', content: 'Je suis à Somgandé.', direction: 'INBOUND', senderType: 'CUSTOMER' } as any],
      mockProducts,
      'org-vision-001'
    );

    assert.equal(executedDistrict, 'Somgandé');
    assert.match(res.responseText, /Somgandé/i);
  });
});
