import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    system: 'WILLShop OS Multi-Tenant Platform',
    timestamp: new Date().toISOString(),
    multiTenantRLSEnforced: true,
  });
}
