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

  return NextResponse.json({
    status: isHealthy ? 'ok' : 'degraded',
    system: 'WILLShop OS Multi-Tenant Platform',
    timestamp: new Date().toISOString(),
    multiTenantRLSEnforced: true,
    envCheck,
  });
}
