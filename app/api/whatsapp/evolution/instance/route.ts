import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/src/infrastructure/supabase/server';
import { EvolutionWhatsAppAdapter } from '@/src/infrastructure/whatsapp/EvolutionWhatsAppAdapter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const rawServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseUrl = rawUrl.trim().replace(/^["']|["']$/g, '');
    const serviceKey = rawServiceKey.trim().replace(/^["']|["']$/g, '');

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: 'Configuration serveur manquante (Supabase credentials)' },
        { status: 500 }
      );
    }

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
        { error: 'Session non authentifiée' },
        { status: 401 }
      );
    }

    // 2. Resolve organization_id server-side
    const { data: userRoles } = await supabaseAdmin
      .from('user_organization_roles')
      .select('organization_id')
      .eq('user_id', user.id)
      .is('deleted_at', null);

    let organizationId = userRoles?.[0]?.organization_id;
    if (!organizationId) {
      const { data: orgs } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .limit(1);
      organizationId = orgs?.[0]?.id;
    }

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Aucune organisation trouvée pour cet utilisateur' },
        { status: 400 }
      );
    }

    // 3. Generate deterministic instance name per organization
    const instanceName = `ws_org_${organizationId.replace(/-/g, '').slice(0, 12)}`;

    // 4. Initialize Evolution Adapter
    const evolutionAdapter = new EvolutionWhatsAppAdapter();

    // Determine Webhook URL for Evolution to post events back to WILLShop OS
    const origin = request.nextUrl.origin || process.env.NEXT_PUBLIC_APP_URL || 'https://willshop-os.vercel.app';
    const webhookUrl = `${origin}/api/webhooks/whatsapp/evolution`;

    // 5. Create or verify instance on Evolution
    const createResult = await evolutionAdapter.createInstance(instanceName, webhookUrl);
    if (!createResult.success) {
      return NextResponse.json(
        { error: `Échec création instance Evolution: ${createResult.error || 'Erreur inconnue'}` },
        { status: 502 }
      );
    }

    // Ensure Webhook is configured
    await evolutionAdapter.setWebhook(instanceName, webhookUrl);

    // 6. Check current connection state
    const connState = await evolutionAdapter.getConnectionState(instanceName);

    if (connState.state === 'CONNECTED') {
      // If instance is already connected, fetch identity and update DB
      const ownerInfo = await evolutionAdapter.getInstanceOwnerInfo(instanceName);
      const realPhone = ownerInfo.phoneNumber || connState.phoneNumber || '';

      if (realPhone) {
        await supabaseAdmin.from('whatsapp_numbers').upsert(
          {
            organization_id: organizationId,
            phone_number: realPhone,
            display_name: ownerInfo.displayName || 'WILLShop Evolution',
            provider: 'EVOLUTION',
            provider_identity: instanceName,
            provider_phone_number_id: instanceName,
            status: 'ACTIVE',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'provider,provider_phone_number_id' }
        );
      }

      return NextResponse.json({
        success: true,
        instanceName,
        state: 'CONNECTED',
        phoneNumber: realPhone,
      });
    }

    // 7. Instance is not yet connected — fetch QR Code
    const qrResult = await evolutionAdapter.getQrCode(instanceName);

    return NextResponse.json({
      success: true,
      instanceName,
      state: 'WAITING_QR',
      qrCode: {
        base64: qrResult.base64 || createResult.qrcode?.base64,
        code: qrResult.code || createResult.qrcode?.code,
        pairingCode: qrResult.pairingCode || createResult.qrcode?.pairingCode,
      },
    });
  } catch (error: any) {
    console.error('Error in POST /api/whatsapp/evolution/instance:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
