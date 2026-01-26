import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  _request: Request,
  { params }: { params: { clinicId: string } },
) {
  const { clinicId } = params;

  if (!clinicId) {
    return NextResponse.json(
      { error: 'clinicId is required' },
      { status: 400 },
    );
  }

  try {
    const { data: clinic, error } = await supabase
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
        practitioners (*),
        slug
      `,
      )
      .eq('id', clinicId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ clinic });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
