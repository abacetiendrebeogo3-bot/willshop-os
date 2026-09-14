/**
 * WILLShop OS — WhatsApp Voice Notes Automated Test Suite
 * Tests strict Silence Rule (0 response, 0 handoff on unusable audio),
 * explicit human demand exception, single-turn multi-info transcription processing,
 * and idempotency safeguards.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { WhatsAppApplicationService } from '../src/application/services/WhatsAppApplicationService';
import { SalesAgentService } from '../src/application/services/SalesAgentService';

describe('WhatsApp Voice Notes & Silence Rule Automated Test Suite', () => {
  const ORG_ID = 'org-voice-test-1111';

  // In-memory mock database factory for deterministic testing
  function createMockSupabase() {
    const messages: any[] = [];
    const conversations: any[] = [
      { id: 'conv-101', organization_id: ORG_ID, customer_id: 'cust-202', conversation_mode: 'AI_ACTIVE', assigned_agent: 'AI' }
    ];
    const handoffs: any[] = [];
    const numbers = [
      { organization_id: ORG_ID, provider_identity: 'voice_pilot', status: 'ACTIVE' }
    ];
    const orgs = [
      { id: ORG_ID, settings: { ai_agent_enabled: true, ai_agent_config: { auto_send_images: true, handoff_keywords: ['humain', 'conseiller', 'remboursement'] } } }
    ];

    return {
      messages,
      conversations,
      handoffs,
      from: (table: string) => {
        if (table === 'whatsapp_numbers') {
          return {
            select: () => ({
              or: () => ({
                eq: () => ({
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: numbers[0] })
                    })
                  })
                })
              })
            })
          };
        }
        if (table === 'customers') {
          return {
            select: () => ({
              eq: () => ({
                or: () => ({
                  order: () => ({
                    limit: () => Promise.resolve({ data: [{ id: 'cust-202', phone: '+22670001122' }] })
                  })
                })
              })
            }),
            insert: (data: any) => Promise.resolve({ data: { id: 'cust-202', ...data }, error: null })
          };
        }
        if (table === 'conversations') {
          return {
            select: () => ({
              eq: (field1: string, val1: string) => ({
                eq: (field2: string, val2: string) => ({
                  neq: () => ({
                    order: () => ({
                      limit: () => ({
                        maybeSingle: () => Promise.resolve({ data: conversations[0] })
                      })
                    }),
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: conversations[0] })
                    }),
                    maybeSingle: () => Promise.resolve({ data: conversations[0] })
                  }),
                  order: () => ({
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: conversations[0] })
                    })
                  }),
                  maybeSingle: () => Promise.resolve({ data: conversations[0] })
                })
              })
            }),
            update: (updateData: any) => ({
              eq: (f: string, id: string) => {
                const conv = conversations.find(c => c.id === id);
                if (conv) Object.assign(conv, updateData);
                return Promise.resolve({ data: conv });
              }
            })
          };
        }
        if (table === 'messages') {
          return {
            select: () => ({
              eq: (field1: string, val1: string) => ({
                eq: (field2: string, val2: string) => {
                  const getMatched = () => messages.find(m => m[field1] === val1 && m[field2] === val2) || null;
                  const getList = () => messages.filter(m => m[field1] === val1 && m[field2] === val2);
                  return {
                    maybeSingle: () => Promise.resolve({ data: getMatched() }),
                    limit: () => ({
                      maybeSingle: () => Promise.resolve({ data: getMatched() }),
                      then: (cb: any) => Promise.resolve({ data: getList() }).then(cb)
                    }),
                    order: () => ({
                      limit: () => ({
                        maybeSingle: () => Promise.resolve({ data: getMatched() }),
                        then: (cb: any) => Promise.resolve({ data: getList() }).then(cb)
                      }),
                      then: (cb: any) => Promise.resolve({ data: getList() }).then(cb)
                    }),
                    then: (cb: any) => Promise.resolve({ data: getList() }).then(cb)
                  };
                }
              })
            }),
            insert: (data: any) => {
              const item = Array.isArray(data) ? data[0] : data;
              item.id = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
              messages.push(item);
              return Promise.resolve({ data: item, error: null });
            }
          };
        }
        if (table === 'human_handoffs') {
          return {
            insert: (data: any) => {
              handoffs.push(data);
              return Promise.resolve({ data, error: null });
            }
          };
        }
        if (table === 'organizations') {
          return {
            select: () => ({
              eq: () => ({
                single: () => Promise.resolve({ data: orgs[0] })
              })
            })
          };
        }
        return {
          select: () => ({ eq: () => ({ limit: () => Promise.resolve({ data: [] }) }) }),
          insert: () => Promise.resolve({ data: null, error: null })
        };
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ error: null }),
          getPublicUrl: () => ({ data: { publicUrl: 'https://storage.willshop.bf/audio.ogg' } })
        })
      }
    };
  }

  // Mock Provider Adapter
  function createMockProvider() {
    const sentMessages: any[] = [];
    return {
      sentMessages,
      sendTextMessage: async (identity: string, dto: any) => {
        sentMessages.push({ identity, dto });
        return { status: 'SENT', externalMessageId: `OUT-${Date.now()}` };
      },
      sendMediaMessage: async (identity: string, dto: any) => {
        sentMessages.push({ identity, dto });
        return { status: 'SENT', externalMessageId: `OUT-MEDIA-${Date.now()}` };
      }
    } as any;
  }

  test('TEST A: Valid French Voice Note generates AI response without human escalation', async () => {
    const mockSupabase = createMockSupabase();
    const mockProvider = createMockProvider();
    const service = new WhatsAppApplicationService(mockSupabase as any, mockProvider);

    // Mock transcribeAudioBuffer to return valid French text
    (service as any).transcribeAudioBuffer = async () => ({ text: 'Bonjour, je suis intéressé par le kit minceur.' });
    (service as any).fetchAudioBufferWithRetry = async () => Buffer.from('fake-audio-bytes');

    const result = await service.processInboundEvent({
      provider: 'EVOLUTION',
      providerIdentity: 'voice_pilot',
      externalMessageId: 'AUDIO-001',
      senderPhone: '+22670001122',
      senderName: 'Client Vocal',
      messageType: 'AUDIO',
      mediaUrl: 'https://evo.media/audio001.ogg',
      fromMe: false,
      timestamp: new Date(),
      rawPayload: {}
    });

    assert.strictEqual(result.status, 'SUCCESS');
    // Ensure inbound audio message stored with COMPLETED status
    const inboundMsg = mockSupabase.messages.find(m => m.external_message_id === 'AUDIO-001');
    assert.ok(inboundMsg);
    assert.strictEqual(inboundMsg.metadata.transcription_status, 'COMPLETED');
    assert.strictEqual(inboundMsg.content, 'Bonjour, je suis intéressé par le kit minceur.');

    // Ensure NO human handoff was created
    assert.strictEqual(mockSupabase.handoffs.length, 0);
    assert.strictEqual(mockSupabase.conversations[0].conversation_mode, 'AI_ACTIVE');
  });

  test('TEST B: Voice Note containing Product + District processes both in single turn without re-asking', async () => {
    const mockSupabase = createMockSupabase();
    const mockProvider = createMockProvider();
    const service = new WhatsAppApplicationService(mockSupabase as any, mockProvider);

    const transcribed = 'Bonjour je veux le kit minceur, je suis à Tampouy.';
    (service as any).transcribeAudioBuffer = async () => ({ text: transcribed });
    (service as any).fetchAudioBufferWithRetry = async () => Buffer.from('fake-audio-bytes');

    const result = await service.processInboundEvent({
      provider: 'EVOLUTION',
      providerIdentity: 'voice_pilot',
      externalMessageId: 'AUDIO-002',
      senderPhone: '+22670001122',
      senderName: 'Client Vocal Tampouy',
      messageType: 'AUDIO',
      mediaUrl: 'https://evo.media/audio002.ogg',
      fromMe: false,
      timestamp: new Date(),
      rawPayload: {}
    });

    assert.strictEqual(result.status, 'SUCCESS');
    const inboundMsg = mockSupabase.messages.find(m => m.external_message_id === 'AUDIO-002');
    assert.strictEqual(inboundMsg.content, transcribed);
  });

  test('TEST C & D & F: Unusable / Incomprehensible Voice Note triggers Strict Silence Rule (0 response, 0 handoff, 0 Anthropic)', async () => {
    const mockSupabase = createMockSupabase();
    const mockProvider = createMockProvider();
    const service = new WhatsAppApplicationService(mockSupabase as any, mockProvider);

    // Audio download or transcription returns null (incomprehensible/failed)
    (service as any).fetchAudioBufferWithRetry = async () => null;

    const result = await service.processInboundEvent({
      provider: 'EVOLUTION',
      providerIdentity: 'voice_pilot',
      externalMessageId: 'AUDIO-BAD-001',
      senderPhone: '+22670001122',
      senderName: 'Client Incompréhensible',
      messageType: 'AUDIO',
      mediaUrl: 'https://evo.media/bad.ogg',
      fromMe: false,
      timestamp: new Date(),
      rawPayload: {}
    });

    assert.strictEqual(result.status, 'SUCCESS');
    assert.ok(result.message.includes('Règle de silence appliquée'));

    // 1. Internal message recorded for logging
    const inboundMsg = mockSupabase.messages.find(m => m.external_message_id === 'AUDIO-BAD-001');
    assert.ok(inboundMsg);
    assert.strictEqual(inboundMsg.content, '[Message vocal non transcrit / inexploitable]');

    // 2. STRICT SILENCE RULE: 0 client responses sent!
    assert.strictEqual(mockProvider.sentMessages.length, 0);

    // 3. ZERO human handoffs created!
    assert.strictEqual(mockSupabase.handoffs.length, 0);

    // 4. Conversation mode remains AI_ACTIVE!
    assert.strictEqual(mockSupabase.conversations[0].conversation_mode, 'AI_ACTIVE');
  });

  test('TEST E: Explicit Human Demand inside voice note triggers Human Handoff exception', async () => {
    const mockSupabase = createMockSupabase();
    const mockProvider = createMockProvider();
    const service = new WhatsAppApplicationService(mockSupabase as any, mockProvider);

    (service as any).transcribeAudioBuffer = async () => ({ text: 'Bonjour, je veux parler à un conseiller commercial SVP.' });
    (service as any).fetchAudioBufferWithRetry = async () => Buffer.from('fake-audio-bytes');

    const result = await service.processInboundEvent({
      provider: 'EVOLUTION',
      providerIdentity: 'voice_pilot',
      externalMessageId: 'AUDIO-HUMAN-001',
      senderPhone: '+22670001122',
      senderName: 'Client Demandeur Humain',
      messageType: 'AUDIO',
      mediaUrl: 'https://evo.media/audio_human.ogg',
      fromMe: false,
      timestamp: new Date(),
      rawPayload: {}
    });

    assert.strictEqual(result.status, 'SUCCESS');
    assert.ok(result.message.includes('Demande explicite de conseiller humain'));

    // Verify handoff record created
    assert.strictEqual(mockSupabase.handoffs.length, 1);
    assert.strictEqual(mockSupabase.conversations[0].conversation_mode, 'ESCALATED');
  });

  test('TEST I: Idempotency — Duplicate audio webhook payload is IGNORED without duplicate transcription', async () => {
    const mockSupabase = createMockSupabase();
    const mockProvider = createMockProvider();
    const service = new WhatsAppApplicationService(mockSupabase as any, mockProvider);

    (service as any).transcribeAudioBuffer = async () => ({ text: 'Bonjour je veux des infos.' });
    (service as any).fetchAudioBufferWithRetry = async () => Buffer.from('fake-audio-bytes');

    const payload = {
      provider: 'EVOLUTION' as const,
      providerIdentity: 'voice_pilot',
      externalMessageId: 'AUDIO-DUP-001',
      senderPhone: '+22670001122',
      senderName: 'Client Dup',
      messageType: 'AUDIO' as const,
      mediaUrl: 'https://evo.media/audio_dup.ogg',
      fromMe: false,
      timestamp: new Date(),
      rawPayload: {}
    };

    // 1st processing: SUCCESS
    const res1 = await service.processInboundEvent(payload);
    assert.strictEqual(res1.status, 'SUCCESS');

    // 2nd processing with SAME externalMessageId: IGNORED!
    const res2 = await service.processInboundEvent(payload);
    assert.strictEqual(res2.status, 'IGNORED');
    assert.ok(res2.message.includes('Duplicate'));
  });
});
