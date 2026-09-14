/**
 * WILLShop OS — Delivery Zone Matching & SaaS Configuration Test Suite
 * Tests Unicode normalization, case insensitivity, accent tolerance,
 * and Anthropic tool execution loop without hardcoding.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AIToolsRegistry, normalizeDeliveryLocation } from '../src/application/services/AIToolsRegistry';

describe('Delivery Zone Matching & Unicode Normalization Suite', () => {
  const ORG_ID = 'org-delivery-test-888';

  const mockAiAgentConfig = {
    delivery_zones: [
      {
        id: 'zone-kossodo-1',
        fee: 0,
        name: 'Zone Kossodo',
        delay: '24h',
        notes: 'Livraison gratuite sur campus Kossodo',
        status: 'ACTIVE',
        districts: [
          'Kossodo',
          'Tanghin',
          'tampouy',
          'somgande',
          'noko2',
          'nioko1',
          'saaba',
          'dasaasgho',
          'wayalgin',
          'zone1',
          'zone du bois',
          'wemtenga',
          'dagnoen',
          'saint camille',
          'benego',
          'borgo',
          'paspanga',
          'dapoya',
          'grand marcher',
          'yalagado'
        ]
      }
    ]
  };

  const registry = new AIToolsRegistry(null as any, null as any, null as any);

  test('1. Somgandé avec accent exact returns found=true, zone="Zone Kossodo", fee=0', async () => {
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: 'Somgandé' }, ORG_ID, mockAiAgentConfig);
    assert.strictEqual(res.result.available, true);
    assert.strictEqual(res.result.found, true);
    assert.strictEqual(res.result.zoneName, 'Zone Kossodo');
    assert.strictEqual(res.result.deliveryFee, 0);
    assert.strictEqual(res.result.estimatedDelay, '24h');
  });

  test('2. somgandé en minuscules returns found=true', async () => {
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: 'somgandé' }, ORG_ID, mockAiAgentConfig);
    assert.strictEqual(res.result.available, true);
    assert.strictEqual(res.result.found, true);
    assert.strictEqual(res.result.deliveryFee, 0);
  });

  test('3. SOMGANDÉ en majuscules avec accent returns found=true', async () => {
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: 'SOMGANDÉ' }, ORG_ID, mockAiAgentConfig);
    assert.strictEqual(res.result.available, true);
    assert.strictEqual(res.result.found, true);
  });

  test('4. Somgande sans accent returns found=true', async () => {
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: 'Somgande' }, ORG_ID, mockAiAgentConfig);
    assert.strictEqual(res.result.available, true);
    assert.strictEqual(res.result.found, true);
  });

  test('5. " Somgandé " avec espaces superflus returns found=true', async () => {
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: ' Somgandé ' }, ORG_ID, mockAiAgentConfig);
    assert.strictEqual(res.result.available, true);
    assert.strictEqual(res.result.found, true);
  });

  test('6. Quartier réellement absent returns available=false and fee=null without guessing', async () => {
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: 'Quartier Inexistant 999' }, ORG_ID, mockAiAgentConfig);
    assert.strictEqual(res.result.available, false);
    assert.strictEqual(res.result.found, false);
    assert.strictEqual(res.result.deliveryFee, null);
  });

  test('7. Autre organisation sans cette zone ne voit pas les données de la boutique', async () => {
    const otherOrgConfig = { delivery_zones: [] };
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: 'Somgandé' }, 'org-other-999', otherOrgConfig);
    assert.strictEqual(res.result.available, false);
    assert.strictEqual(res.result.found, false);
  });

  test('8, 9, 10. Fee, zone, et ETA proviennent dynamiquement de la configuration SaaS', async () => {
    const customConfig = {
      delivery_zones: [
        {
          id: 'custom-zone-1',
          fee: 1500,
          name: 'Zone Ouest Specifique',
          delay: '12h',
          status: 'ACTIVE',
          districts: ['somgande']
        }
      ]
    };
    const res = await registry.executeTool('check_delivery_zone', { city: 'Ouagadougou', district: 'Somgandé' }, ORG_ID, customConfig);
    assert.strictEqual(res.result.available, true);
    assert.strictEqual(res.result.zoneName, 'Zone Ouest Specifique');
    assert.strictEqual(res.result.deliveryFee, 1500);
    assert.strictEqual(res.result.estimatedDelay, '12h');
  });

  test('11. normalizeDeliveryLocation normalizes accents, case, and spacing', () => {
    assert.strictEqual(normalizeDeliveryLocation('SOMGANDÉ'), 'somgande');
    assert.strictEqual(normalizeDeliveryLocation(' Somgandé '), 'somgande');
    assert.strictEqual(normalizeDeliveryLocation('Zone du Bois!'), 'zone du bois');
  });
});
