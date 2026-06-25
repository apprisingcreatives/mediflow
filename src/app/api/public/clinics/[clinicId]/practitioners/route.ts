import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id');

    if (branchId) {
      // Get practitioner IDs assigned to this branch
      const { data: assignments, error: assignError } = await supabaseAdmin
        .from('practitioner_branches')
        .select('practitioner_id')
        .eq('branch_id', branchId);

      if (assignError) {
        return NextResponse.json({ error: assignError.message }, { status: 500 });
      }

      const practitionerIds = (assignments ?? []).map((a) => a.practitioner_id);

      if (practitionerIds.length === 0) {
        return NextResponse.json({ practitioners: [] });
      }

      const { data, error } = await supabaseAdmin
        .from('practitioners')
        .select('id, name, specialization')
        .eq('clinic_id', clinicId)
        .eq('is_active', true)
        .in('id', practitionerIds)
        .order('name');

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ practitioners: data ?? [] });
    }

    const { data, error } = await supabaseAdmin
      .from('practitioners')
      .select('id, name, specialization')
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ practitioners: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
