import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/src/infrastructure/supabase/server';

const DEFAULT_SUPABASE_URL = 'https://stbzctncpvgqdpybcrmg.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0YnpjdG5jcHZncWRweWJjcm1nIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwMDMyNiwiZXhwIjoyMTA0MTc2MzI2fQ.IE2MN4HMLAOseaIs39ca1plt5c4TiN6FM-b3ELE6zSc';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
        ? process.env.NEXT_PUBLIC_SUPABASE_URL
        : DEFAULT_SUPABASE_URL;

    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20
        ? process.env.SUPABASE_SERVICE_ROLE_KEY
        : DEFAULT_SERVICE_ROLE_KEY;

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // 1. Authenticate user via Cookies or Authorization Bearer Header
    let user = null;

    // Method A: Check Cookie Auth
    try {
      const supabaseUserClient = await createServerSupabaseClient();
      const { data: cookieAuthData } = await supabaseUserClient.auth.getUser();
      if (cookieAuthData?.user) {
        user = cookieAuthData.user;
      }
    } catch {
      // Cookie check fallback
    }

    // Method B: Check Bearer Header if Cookie Auth returned null
    if (!user) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const { data: tokenAuthData, error: tokenError } = await supabaseAdmin.auth.getUser(token);
        if (tokenAuthData?.user) {
          user = tokenAuthData.user;
        } else if (tokenError) {
          console.error('[Org API Bearer Token Auth Error]', tokenError.message);
        }
      }
    }

    if (!user) {
      console.error('[Org API Auth Error] User not authenticated via Cookies or Bearer token');
      return NextResponse.json(
        { error: 'Session non authentifiée. Veuillez vous déconnecter et vous reconnecter.' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corps de requête JSON invalide' }, { status: 400 });
    }

    const { name, sector, country, city, currency, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Le nom de l'entreprise est obligatoire." }, { status: 400 });
    }

    // Generate unique slug from company name
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slug = `${baseSlug || 'org'}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Insert Organization
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: name.trim(),
        slug,
        country: country || 'Burkina Faso',
        currency: currency || 'XOF',
        timezone: 'Africa/Ouagadougou',
        settings: {
          sector: sector || 'COMMERCE',
          city: city || 'Ouagadougou',
          company_phone: phone || '',
          onboarding_step: 'WHATSAPP',
          onboarding_completed: false,
        },
        created_by: user.id,
      })
      .select('*')
      .single();

    if (orgError) {
      console.error('[Org Creation Error]', orgError);
      return NextResponse.json(
        { error: `Erreur base de données lors de la création d'entreprise: ${orgError.message}` },
        { status: 500 }
      );
    }

    if (!org) {
      return NextResponse.json({ error: "Impossible d'enregistrer l'organisation." }, { status: 500 });
    }

    // 3. Insert User Role as OWNER
    const { error: roleError } = await supabaseAdmin
      .from('user_organization_roles')
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: 'OWNER',
        permissions: ['*'],
        created_by: user.id,
      });

    if (roleError) {
      console.error('[Role Assignment Error]', roleError);
      return NextResponse.json(
        { error: `Erreur d'assignation du rôle d'administration (OWNER): ${roleError.message}` },
        { status: 500 }
      );
    }

    // 4. Create default financial account (Caisse Principale)
    const { error: finError } = await supabaseAdmin.from('financial_accounts').insert({
      organization_id: org.id,
      name: 'Caisse Principale',
      type: 'CASH_REGISTER',
      opening_balance: 0,
      current_balance: 0,
      currency: currency || 'XOF',
      status: 'ACTIVE',
    });

    if (finError) {
      console.warn('[Default Caisse Warning]', finError.message);
    }

    return NextResponse.json({
      success: true,
      organization: org,
    });
  } catch (error: any) {
    console.error('[Organization API Exception]', error);
    return NextResponse.json({ error: error?.message || 'Erreur serveur imprévue' }, { status: 500 });
  }
}
