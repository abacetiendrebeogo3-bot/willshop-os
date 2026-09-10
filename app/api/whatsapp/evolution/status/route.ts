import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/src/infrastructure/supabase/server';
import { EvolutionWhatsAppAdapter } from '@/src/infrastructure/whatsapp/EvolutionWhatsAppAdapter';

export const dynamic = 'force-dynamic';

const DEFAULT_SUPABASE_URL = 'https://stbzctncpvgqdpybcrmg.supabase.co';
const DEFAULT_SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnpjdG5jcHZncWRweWJjcm1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwMDMyNiwiZXhwIjoyMTA0MTc2MzI2fQ.IE2MN4HMLAOseaIs39ca1plt5c4TiN6FM-b3ELE6zSc';

export async function GET(request: NextRequest) {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_SERVICE_ROLE_KEY;

    const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
    const serviceKey = rawServiceKey.trim().replace(/^["']|["']$/g, '');

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Authenticate user
    let user = null;
    try {
      const supabaseUserClient = await createServerSupabaseClient();
      const { data: cookieAuthData } = await supabaseUserClient.auth.getUser();
      if (cookieAuthData?.user) {
        user = cookieAuthData.user;
      }
    } catch {}

    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const { data: tokenAuthData } = await supabaseAdmin.auth.getUser(token);
        if (tokenAuthData?.user) {
          user = tokenAuthData.user;
        }
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'Session non authentifiée. Veuillez vous reconnecter.' },
        { status: 401 }
      );
    }

    // 2. Resolve organization_id server-side via membership (NO FALLBACK)
    const { data: userRoles } = await supabaseAdmin
      .from('user_organization_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    const organizationId = userRoles?.[0]?.organization_id;
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Aucune organisation valide associée à cet utilisateur.' },
        { status: 403 }
      );
    }

    // 3. Initialize Evolution Adapter and check credentials
    const evolutionAdapter = new EvolutionWhatsAppAdapter();
    if (!evolutionAdapter.isConfigured()) {
      return NextResponse.json(
        { error: evolutionAdapter.getConfigError() },
        { status: 500 }
      );
    }

    const instanceName = `ws_org_${organizationId.replace(/-/g, '').slice(0, 12)}`;

    // 3. Query Evolution connection state
    const connState = await evolutionAdapter.getConnectionState(instanceName);

    if (connState.state === 'CONNECTED') {
      // Fetch connected identity details from Evolution
      const ownerInfo = await evolutionAdapter.getInstanceOwnerInfo(instanceName);
      const realPhone = ownerInfo.phoneNumber || connState.phoneNumber || '';

      if (!realPhone) {
        // Still connected but identity not ready yet
        return NextResponse.json({
          status: 'CONNECTED',
          instanceName,
          phoneNumber: null,
          message: 'Connecté, récupération du numéro en cours...',
        });
      }

      // Upsert into whatsapp_numbers ONLY AFTER real proof of connection
      const { data: numRow, error: upsertErr } = await supabaseAdmin
        .from('whatsapp_numbers')
        .upsert(
          {
            organization_id: organizationId,
            phone_number: realPhone,
            display_name: ownerInfo.displayName || `WILLShop (${realPhone})`,
            provider: 'EVOLUTION',
            provider_identity: instanceName,
            provider_phone_number_id: instanceName,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'organization_id,phone_number' }
        )
        .select()
        .single();

      if (upsertErr) {
        console.error('Error upserting whatsapp_numbers on status CONNECTED:', upsertErr);
      }

      // Verify webhook setting
      const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://willshop-os.vercel.app';
      const webhookUrl = `${origin}/api/webhooks/whatsapp/evolution`;
      await evolutionAdapter.setWebhook(instanceName, webhookUrl).catch(() => null);

      return NextResponse.json({
        status: 'CONNECTED',
        instanceName,
        phoneNumber: realPhone,
        numberInfo: numRow || {
          organization_id: organizationId,
          phone_number: realPhone,
          provider: 'EVOLUTION',
          provider_identity: instanceName,
          status: 'ACTIVE',
        },
      });
    }

    if (connState.state === 'WAITING_QR') {
      // Fetch fresh QR code if available
      const qrResult = await evolutionAdapter.getQrCode(instanceName);

      return NextResponse.json({
        status: 'WAITING_QR',
        instanceName,
        qrCode: {
          base64: qrResult.base64 || null,
          code: qrResult.code || null,
          pairingCode: qrResult.pairingCode || null,
        },
      });
    }

    return NextResponse.json({
      status: connState.state,
      instanceName,
      error: connState.error || null,
    });
  } catch (error: any) {
    console.error('Error in GET /api/whatsapp/evolution/status:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
