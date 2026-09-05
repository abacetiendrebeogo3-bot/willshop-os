import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    system: 'WILLShop OS',
    build: 'Build 01 — Core Foundation',
    timestamp: new Date().toISOString(),
    organization: 'WillShop',
    rlsEnforced: true,
  });
}
