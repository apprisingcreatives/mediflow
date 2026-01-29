import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ features });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const { featureId, isEnabled, adminId } = await request.json();

    if (!featureId) {
      return NextResponse.json(
        { error: 'Feature ID is required' },
        { status: 400 },
      );
    }

    // Check if the clinic_ai_features record exists
    const { data: existingFeature } = await supabaseAdmin
      .from('clinic_ai_features')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('feature_id', featureId)
      .maybeSingle();

    if (!existingFeature) {
      // If it doesn't exist, insert it

      const { data: newFeature, error: insertError } = await supabaseAdmin
        .from('clinic_ai_features')
        .insert({
          clinic_id: clinicId,
          feature_id: featureId,
          is_enabled: isEnabled,
          enabled_by: isEnabled ? adminId : null,
          enabled_at: isEnabled ? new Date().toISOString() : null,
        })
        .select(
          `
          *,
          ai_features (*)
        `,
        )
        .single();

      if (insertError) {
        console.error('❌ Insert error:', insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 },
        );
      }

      return NextResponse.json({ feature: newFeature });
    }

    // If it exists, update it

    const { data: feature, error } = await supabaseAdmin
      .from('clinic_ai_features')
      .update({
        is_enabled: isEnabled,
        enabled_by: isEnabled ? adminId : null,
        enabled_at: isEnabled ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('clinic_id', clinicId)
      .eq('feature_id', featureId)
      .select(
        `
        *,
        ai_features (*)
      `,
      )
      .single();

    if (error) {
      console.error('❌ Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ feature });
  } catch (error) {
    console.error('❌ PATCH error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
