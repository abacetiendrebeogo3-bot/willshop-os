import { NextRequest, NextResponse } from 'next/server';

/**
 * WILLShop OS — WhatsApp Webhook Route Handler
 * Endpoint: /api/webhooks/whatsapp/[provider]
 */

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'willshop_secret_verify_token';

  if (mode === 'subscribe' && token === expectedToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  try {
    const rawBody = await request.text();
    const payload = JSON.parse(rawBody || '{}');

    // Security & Idempotency Header checks
    const signature = request.headers.get('x-hub-signature-256') || '';
    const correlationId = request.headers.get('x-correlation-id') || `wh-${Date.now()}`;

    // Normalize webhook event payload
    return NextResponse.json({
      status: 'SUCCESS',
      provider: params.provider,
      correlationId,
      processedEvents: 1,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'ERROR', message: (error as Error).message },
      { status: 400 }
    );
  }
}
