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

    const instanceName = `ws_org_${organizationId.replace(/-/g, '').slice(0, 12)}`;
    const evolutionAdapter = new EvolutionWhatsAppAdapter();

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
