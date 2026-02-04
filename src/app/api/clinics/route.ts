import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const { data: clinics, error } = await supabase
      .from('clinics')
      .select(
        `
        id,
        name,
        email,
        phone,
        address,
        city,
        logo_url,
        description,
        is_active,
        subscription_plan,
        clinic_services (*),
        practitioners (*)
      `,
      )
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clinics });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
