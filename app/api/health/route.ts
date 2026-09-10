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
    const startTime = Date.now();
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 50,
          temperature: 0,
          messages: [{ role: 'user', content: 'Réponds uniquement : TEST_ANTHROPIC_OK' }],
        }),
      });
      const latencyMs = Date.now() - startTime;
      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text || '';
        anthropicDirect = {
          status: text.includes('TEST_ANTHROPIC_OK') ? 'PASS' : 'PARTIAL',
          httpStatus: response.status,
          model,
          latencyMs,
          responseText: text,
        };
      } else {
        const errorText = await response.text().catch(() => '');
        let parsed = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          parsed = jsonErr.error?.message || errorText;
        } catch {}
        anthropicDirect = {
          status: 'FAIL',
          httpStatus: response.status,
          model,
          latencyMs,
          error: `HTTP ${response.status}: ${parsed}`,
        };
      }
    } catch (err: any) {
      anthropicDirect = {
        status: 'FAIL',
        error: `Exception: ${err.message}`,
      };
    }
  }

  return NextResponse.json({
    status: isHealthy ? 'ok' : 'degraded',
    system: 'WILLShop OS Multi-Tenant Platform',
    timestamp: new Date().toISOString(),
    multiTenantRLSEnforced: true,
    envCheck,
    anthropicDirect,
  });
}

