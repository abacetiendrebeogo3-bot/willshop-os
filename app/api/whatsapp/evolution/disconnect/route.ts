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
        { error: 'Configuration serveur incomplète : SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL non définie dans Vercel.' },
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

    // 3. Logout on Evolution API
    await evolutionAdapter.logoutInstance(instanceName);

    // 4. Update whatsapp_numbers status in DB
    await supabaseAdmin
      .from('whatsapp_numbers')
      .update({ status: 'DISCONNECTED', updated_at: new Date().toISOString() })
      .eq('organization_id', organizationId)
      .or(`provider_identity.eq.${instanceName},provider_phone_number_id.eq.${instanceName}`);

    return NextResponse.json({
      success: true,
      message: 'Ligne WhatsApp déconnectée avec succès.',
    });
  } catch (error: any) {
    console.error('Error in POST /api/whatsapp/evolution/disconnect:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}
