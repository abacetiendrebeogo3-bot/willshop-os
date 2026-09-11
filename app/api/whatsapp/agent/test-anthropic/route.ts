import { NextResponse } from 'next/server';
import { AnthropicAIGateway } from '@/src/infrastructure/ai/AnthropicAIGateway';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const rawKey = process.env.ANTHROPIC_API_KEY || '';
  const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

  if (!apiKey) {
    return NextResponse.json({
      status: 'FAIL',
      error: 'BLOCKED — ANTHROPIC_API_KEY missing in Vercel environment.',
    }, { status: 400 });
  }

  const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

  try {
    const payload: Record<string, any> = {
      model,
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: 'Réponds uniquement : TEST_ANTHROPIC_OK',
        },
      ],
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

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      let parsedError = errorText;
      try {
        const errJson = JSON.parse(errorText);
        parsedError = errJson.error?.message || errorText;
      } catch {}

      return NextResponse.json({
        status: 'FAIL',
        httpStatus: response.status,
        model,
        latencyMs,
        error: `Anthropic HTTP ${response.status}: ${parsedError}`,
      });
    }

    const resData = await response.json();
    const textContent = resData.content?.[0]?.text || '';

    return NextResponse.json({
      status: textContent.includes('TEST_ANTHROPIC_OK') ? 'PASS' : 'PARTIAL',
      httpStatus: response.status,
      model,
      responseText: textContent,
      latencyMs,
      usage: resData.usage,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'FAIL',
      latencyMs: Date.now() - startTime,
      error: `Exception: ${err.message}`,
    }, { status: 500 });
  }
}
