import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { requirePlan } from '@/lib/plan-gating';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'analytics.view');
    if (!isAuthSuccess(authResult)) return authResult;

    const planCheck = await requirePlan(clinicId, 'enterprise');
    if (planCheck !== true) return planCheck;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date are required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin.rpc('get_branch_comparison', {
      p_clinic_id: clinicId,
      p_start_date: startDate,
      p_end_date: endDate,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
