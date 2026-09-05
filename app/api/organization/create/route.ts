import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/src/infrastructure/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabaseUserClient = await createServerSupabaseClient();

    // 1. Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabaseUserClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { name, sector, country, city, currency, phone } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Le nom de l'entreprise est obligatoire" }, { status: 400 });
    }

    // Use service role key to perform atomic org creation and role assignment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    // Generate unique slug from company name
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

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

    if (orgError || !org) {
      console.error('[Org Creation Error]', orgError?.message);
      return NextResponse.json({ error: `Erreur lors de la création de l'entreprise: ${orgError?.message}` }, { status: 500 });
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
      console.error('[Role Assignment Error]', roleError.message);
      return NextResponse.json({ error: `Erreur d'assignation du rôle d'administration: ${roleError.message}` }, { status: 500 });
    }

    // 4. Create default financial account (Caisse Principale)
    await supabaseAdmin.from('financial_accounts').insert({
      organization_id: org.id,
      account_name: 'Caisse Principale',
      account_type: 'CASH',
      current_balance: 0,
      currency: currency || 'XOF',
      status: 'ACTIVE',
    });

    return NextResponse.json({
      success: true,
      organization: org,
    });
  } catch (error: any) {
    console.error('[Organization API Error]', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}
