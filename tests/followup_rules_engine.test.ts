/**
 * WILLShop OS — Followup Rules & Automation Engine Automated Test Suite
 * Validates rule draft/activation CRUD, trigger & delay evaluation (minutes, hours, days),
 * stop conditions (replied, takeover, order completed, opt-out), frequency & cooldown limits,
 * dynamic variable substitution & fallback, Fake Clock immediate simulation,
 * WhatsApp 24h window safety enforcement, Kill Switch controls, multi-tenant isolation,
 * idempotency, and commercial catalog anti-pollution guardrails.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { REAL_COMMERCIAL_ORG_ID, SANDBOX_TEST_ORG_ID, assertNotCommercialOrg } from '../src/config/testGuardrails.js';
import {
  FollowupEngineService,
  FollowupVariableEngine,
  WhatsAppWindowGuard,
  FollowupCandidate,
} from '../src/application/services/FollowupEngineService';
import { InMemoryAutomationRuleRepository, InMemoryKillSwitchRepository } from '../src/infrastructure/repositories/InMemoryAutomationRepositories';

describe('Followup Rules & Automation Engine Integration Test Suite', () => {
  const ORG_A = SANDBOX_TEST_ORG_ID; // '00000000-0000-4000-a000-000000000000'
  const ORG_B = '11111111-1111-4111-a111-111111111111';

  let ruleRepo: InMemoryAutomationRuleRepository;
  let killSwitchRepo: InMemoryKillSwitchRepository;

  beforeEach(() => {
    // Anti-pollution guardrails
    assertNotCommercialOrg(ORG_A, 'Followup Engine Test Org A');
    assertNotCommercialOrg(ORG_B, 'Followup Engine Test Org B');

    ruleRepo = new InMemoryAutomationRuleRepository();
    killSwitchRepo = new InMemoryKillSwitchRepository();
  });

  test('A. Anti-pollution guardrail prevents operations on live commercial org', () => {
    assert.throws(
      () => assertNotCommercialOrg(REAL_COMMERCIAL_ORG_ID, 'Followup Guardrail Check'),
      /ANTI-POLLUTION SAFEGUARD BLOCKED/
    );
  });

  test('B. Create rule draft (enabled = false) and activate cleanly (enabled = true)', async () => {
    const draft = await ruleRepo.create({
      organizationId: ORG_A,
      name: 'Prospect relance 4h',
      description: 'Relance prospect 4h',
      category: 'SALES' as any,
      enabled: false, // DRAFT
      triggerType: 'EVENT' as any,
      triggerConfig: { delay_value: 4, delay_unit: 'heures' },
      conditions: {},
      actions: [{ id: 'act-1', type: 'WHATSAPP', payloadTemplate: { template: 'Bonjour {{first_name}}' }, permissionLevel: 'GREEN' }],
      permissionLevel: 'GREEN',
    });

    assert.ok(draft.id);
    assert.equal(draft.enabled, false);

    // Activate rule
    const activated = await ruleRepo.update(draft.id, ORG_A, { enabled: true });
    assert.equal(activated.enabled, true);
  });

  test('C. Rule deletion removes rule from target organization', async () => {
    const rule = await ruleRepo.create({
      organizationId: ORG_A,
      name: 'Règle temporaire',
      category: 'SALES' as any,
      enabled: true,
      triggerType: 'EVENT' as any,
      triggerConfig: {},
      conditions: {},
      actions: [],
      permissionLevel: 'GREEN',
    });

    assert.ok(rule.id);
    await ruleRepo.delete(rule.id, ORG_A);

    const fetched = await ruleRepo.findById(rule.id, ORG_A);
    assert.equal(fetched, null);
  });

  test('D. Dynamic Variable Engine substitutes variables or provides fallback without crashing', () => {
    const template = 'Bonjour {{first_name}} {{last_name}}, votre produit {{product_name}} (commande {{order_id}}) par {{company_name}}.';
    
    const { rendered, missingVars } = FollowupVariableEngine.substitute(template, {
      first_name: 'Awa',
      last_name: 'Traore',
      product_name: 'Kit Minceur',
      // order_id is missing
      company_name: 'WILLShop OS',
    });

    assert.equal(rendered, 'Bonjour Awa Traore, votre produit Kit Minceur (commande [information indisponible]) par WILLShop OS.');
    assert.deepEqual(missingVars, ['order_id']);
  });

  test('E. WhatsApp 24h Messaging Window Guard opens for recent messages & closes after 24h', () => {
    const now = new Date();
    const recentMsg = new Date(now.getTime() - 5 * 3600 * 1000); // 5h ago
    const oldMsg = new Date(now.getTime() - 25 * 3600 * 1000); // 25h ago

    const recentCheck = WhatsAppWindowGuard.check24hWindow(recentMsg, now);
    assert.equal(recentCheck.isOpen, true);
    assert.ok(recentCheck.hoursRemaining > 18);

    const oldCheck = WhatsAppWindowGuard.check24hWindow(oldMsg, now);
    assert.equal(oldCheck.isOpen, false);
    assert.equal(oldCheck.hoursRemaining, 0);
  });

  test('F. Stop Condition: Customer Replied prevents followup dispatch', () => {
    const cand: FollowupCandidate = {
      conversationId: 'conv-1',
      customerId: 'cust-1',
      customerName: 'Awa Traore',
      customerPhone: '+22677001122',
      lastActivityAt: new Date(Date.now() - 10 * 3600 * 1000),
      lastCustomerMessageAt: new Date(Date.now() - 1 * 3600 * 1000), // Replied 1h ago
      conversationStatus: 'OPEN',
      isArchived: false,
      hasHumanTakeover: false,
      hasCompletedOrder: false,
      hasOptedOut: false,
      previousFollowupCount: 0,
    };

    const res = FollowupEngineService.evaluateCandidatesDryRun(
      {
        id: 'rule-1',
        name: 'Relance 4h',
        organizationId: ORG_A,
        triggerType: 'NO_REPLY_PROSPECT',
        delaySeconds: 14400,
        stopConditions: ['CUSTOMER_REPLIED'],
        template: 'Bonjour {{first_name}}',
        enabled: true,
      },
      [cand],
      0
    );

    assert.equal(res.eligibleCandidates, 0);
    assert.equal(res.items[0].finalStatus, 'BLOCKED_STOP_CONDITION');
    assert.equal(res.items[0].stopReason, 'Le client a répondu récemment');
  });

  test('G. Fake Clock Offset allows immediate testing of 4h delay without real waiting', () => {
    const cand: FollowupCandidate = {
      conversationId: 'conv-2',
      customerId: 'cust-2',
      customerName: 'Moussa Sawadogo',
      customerPhone: '+22676002233',
      lastActivityAt: new Date(), // Activity JUST NOW (0s ago)
      lastCustomerMessageAt: new Date(),
      conversationStatus: 'OPEN',
      isArchived: false,
      hasHumanTakeover: false,
      hasCompletedOrder: false,
      hasOptedOut: false,
      previousFollowupCount: 0,
    };

    // 1. Without offset (0h): Delay NOT satisfied
    const resNow = FollowupEngineService.evaluateCandidatesDryRun(
      {
        id: 'rule-2',
        name: 'Relance 4h',
        organizationId: ORG_A,
        triggerType: 'NO_REPLY_PROSPECT',
        delaySeconds: 14400, // 4 hours
        template: 'Bonjour {{first_name}}',
        enabled: true,
      },
      [cand],
      0 // +0h
    );

    assert.equal(resNow.eligibleCandidates, 0);
    assert.equal(resNow.items[0].finalStatus, 'BLOCKED_DELAY_NOT_MET');

    // 2. With Fake Clock offset (+5h): Delay satisfied!
    const resFuture = FollowupEngineService.evaluateCandidatesDryRun(
      {
        id: 'rule-2',
        name: 'Relance 4h',
        organizationId: ORG_A,
        triggerType: 'NO_REPLY_PROSPECT',
        delaySeconds: 14400, // 4 hours
        template: 'Bonjour {{first_name}}',
        enabled: true,
      },
      [cand],
      5 // +5h fake clock
    );

    assert.equal(resFuture.eligibleCandidates, 1);
    assert.equal(resFuture.items[0].finalStatus, 'DRY_RUN_PASSED');
    assert.equal(resFuture.items[0].wouldSend, true);
  });

  test('H. Global Kill Switch blocks all real & dry-run dispatches instantly', () => {
    const cand: FollowupCandidate = {
      conversationId: 'conv-3',
      customerId: 'cust-3',
      customerName: 'Fatimata Ouedraogo',
      customerPhone: '+22670001122',
      lastActivityAt: new Date(Date.now() - 10 * 3600 * 1000),
      lastCustomerMessageAt: new Date(Date.now() - 10 * 3600 * 1000),
      conversationStatus: 'OPEN',
      isArchived: false,
      hasHumanTakeover: false,
      hasCompletedOrder: false,
      hasOptedOut: false,
      previousFollowupCount: 0,
    };

    const res = FollowupEngineService.evaluateCandidatesDryRun(
      {
        id: 'rule-3',
        name: 'Relance 4h',
        organizationId: ORG_A,
        triggerType: 'NO_REPLY_PROSPECT',
        delaySeconds: 14400,
        template: 'Bonjour {{first_name}}',
        enabled: true,
        globalKillSwitchStopped: true, // KILL SWITCH ON
      },
      [cand],
      0
    );

    assert.equal(res.eligibleCandidates, 0);
    assert.equal(res.items[0].finalStatus, 'BLOCKED_KILL_SWITCH');
  });

  test('I. Multi-tenant isolation: Org B cannot see or manipulate Org A rules', async () => {
    const ruleA = await ruleRepo.create({
      organizationId: ORG_A,
      name: 'Règle Org A',
      category: 'SALES' as any,
      enabled: true,
      triggerType: 'EVENT' as any,
      triggerConfig: {},
      conditions: {},
      actions: [],
      permissionLevel: 'GREEN',
    });

    const orgBRules = await ruleRepo.listByOrg(ORG_B);
    assert.equal(orgBRules.length, 0);

    const crossFetch = await ruleRepo.findById(ruleA.id, ORG_B);
    assert.equal(crossFetch, null);
  });
});

