import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId);
    if (!isAuthSuccess(authResult)) return authResult;

    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branch_id');
    const activeOnly = searchParams.get('active_only') !== 'false';
    const includeWorkingHours = searchParams.get('include_working_hours') === 'true';

    const select = includeWorkingHours
      ? '*, working_hours:practitioner_working_hours(id, practitioner_id, day_of_week, start_time, end_time, is_available)'
      : '*';

    if (branchId) {
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

      let query = supabaseAdmin
        .from('practitioners')
        .select(select)
        .eq('clinic_id', clinicId)
        .in('id', practitionerIds)
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ practitioners: data ?? [] });
    }

    let query = supabaseAdmin
      .from('practitioners')
      .select(select)
      .eq('clinic_id', clinicId)
      .order('name', { ascending: true });

    if (activeOnly) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ practitioners: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
