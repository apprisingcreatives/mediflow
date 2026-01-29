import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { clinicId: string } },
) {
  try {
    const { clinicId } = params;

    const { data: features, error } = await supabaseAdmin
      .from('clinic_ai_features')
      .select(
        `
        *,
        ai_features (*)
      `,
      )
      .eq('clinic_id', clinicId);

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ features });
  } catch (err) {
    console.error('[API] Server error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
