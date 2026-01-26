import { NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { clinicId: string } },
) {
  try {
    const { clinicId } = params;
    console.log(`[API] Fetching features for clinic: ${clinicId}`);

    const { data: features, error } = await supabaseAdmin
      .from('clinic_ai_features')
      .select(
        `
        *,
        ai_features (*)
      `,
      )
      .eq('clinic_id', clinicId);
    
    console.log(`[API] Total features returned: ${features?.length}`);
    console.log(`[API] Features with is_enabled:`, features?.map(f => ({
      name: f.ai_features?.name,
      is_enabled: f.is_enabled,
      id: f.id
    })));
    console.log(`[API] Enabled count: ${features?.filter(f => f.is_enabled).length}`);
    
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
