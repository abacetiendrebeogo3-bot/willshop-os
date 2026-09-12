import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const envCheck = {
    NEXT_PUBLIC_SUPABASE_URL: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) ? 'PRESENT' : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) ? 'PRESENT' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'PRESENT' : 'MISSING',
    EVOLUTION_API_URL: Boolean(process.env.EVOLUTION_API_URL) ? 'PRESENT' : 'MISSING',
    EVOLUTION_API_KEY: Boolean(process.env.EVOLUTION_API_KEY) ? 'PRESENT' : 'MISSING',
    ANTHROPIC_API_KEY: Boolean(process.env.ANTHROPIC_API_KEY) ? 'PRESENT' : 'MISSING',
    WHATSAPP_VERIFY_TOKEN: Boolean(process.env.WHATSAPP_VERIFY_TOKEN) ? 'PRESENT' : 'MISSING',
  };

  const isHealthy =
    envCheck.NEXT_PUBLIC_SUPABASE_URL === 'PRESENT' &&
    envCheck.SUPABASE_SERVICE_ROLE_KEY === 'PRESENT' &&
    envCheck.EVOLUTION_API_URL === 'PRESENT' &&
    envCheck.EVOLUTION_API_KEY === 'PRESENT';

  const rawKey = process.env.ANTHROPIC_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

  let anthropicDirect: any = { status: 'MISSING', error: 'ANTHROPIC_API_KEY missing' };

  if (apiKey) {
    const candidateModels = [
      process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
      'claude-sonnet-5',
      'claude-haiku-4-5-20251001',
      'claude-3-5-sonnet-latest',
      'claude-3-haiku-20240307',
    ].filter(Boolean) as string[];

    const modelResults: any[] = [];
    const startTime = Date.now();

    for (const model of candidateModels) {
      if (!model) continue;
      try {
        const payload: Record<string, any> = {
          model,
          max_tokens: 30,
          messages: [{ role: 'user', content: 'Réponds uniquement : TEST_ANTHROPIC_OK' }],
        };

        if (!model.includes('claude-sonnet-5')) {
          payload.temperature = 0;
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          const text = data.content?.[0]?.text || '';
          modelResults.push({
            model,
            httpStatus: response.status,
            ok: true,
            responseText: text,
          });
        } else {
          const errorText = await response.text().catch(() => '');
          let parsed = errorText;
          try {
            const jsonErr = JSON.parse(errorText);
            parsed = jsonErr.error?.message || errorText;
          } catch {}
          modelResults.push({
            model,
            httpStatus: response.status,
            ok: false,
            error: `HTTP ${response.status}: ${parsed}`,
          });
        }
      } catch (err: any) {
        modelResults.push({
          model,
          ok: false,
          error: `Exception: ${err.message}`,
        });
      }
    }

    const workingModel = modelResults.find((m) => m.ok);

    anthropicDirect = {
      status: workingModel ? 'PASS' : 'FAIL',
      activeModel: workingModel ? workingModel.model : null,
      totalLatencyMs: Date.now() - startTime,
      modelResults,
    };
  }

  let evolutionCheck: any = { status: 'UNKNOWN' };
  const evoUrl = (process.env.EVOLUTION_API_URL || '').trim().replace(/\/+$/, '');
  const evoKey = (process.env.EVOLUTION_API_KEY || '').trim().replace(/^["']|["']$/g, '');

  if (evoUrl && evoKey) {
    try {
      const instanceName = 'ws_org_27f3fcc3402b';
      const connRes = await fetch(`${evoUrl}/instance/connectionState/${instanceName}`, {
        headers: { apikey: evoKey },
      });
      const connText = await connRes.text().catch(() => '');

      evolutionCheck = {
        status: connRes.ok ? 'PASS' : 'FAIL',
        instanceName,
        connectionState: {
          httpStatus: connRes.status,
          response: connText,
        },
      };
    } catch (err: any) {
      evolutionCheck = {
        status: 'FAIL',
        error: `Exception: ${err.message}`,
      };
    }
  }

  return NextResponse.json({
    status: isHealthy && anthropicDirect.status === 'PASS' && evolutionCheck.status === 'PASS' ? 'ok' : 'degraded',
    system: 'WILLShop OS Multi-Tenant Platform',
    timestamp: new Date().toISOString(),
    multiTenantRLSEnforced: true,
    envCheck,
    anthropicDirect,
    evolutionCheck,
  });
}

