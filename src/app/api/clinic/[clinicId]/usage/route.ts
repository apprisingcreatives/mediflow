import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId);
    if (!isAuthSuccess(authResult)) return authResult;

    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('subscription_plan')
      .eq('id', clinicId)
      .single();

    if (!clinic) {
      return NextResponse.json({ error: 'Clinic not found' }, { status: 404 });
    }

    const planSlug = clinic.subscription_plan?.replace(/-yearly$/, '') || 'starter';

    const { data: plan } = await supabaseAdmin
      .from('subscription_plans')
      .select('max_practitioners, max_patients, max_branches')
      .eq('slug', planSlug)
      .single();

    const { data: branches } = await supabaseAdmin
      .from('branches')
      .select('id')
      .eq('clinic_id', clinicId)
      .eq('is_active', true);

    const branchIds = (branches ?? []).map((b: { id: string }) => b.id);
    const branchCount = branchIds.length;

    const byBranch: Record<string, number> = {};
    let totalPractitioners = 0;

    for (const branchId of branchIds) {
      const { count } = await supabaseAdmin
        .from('practitioner_branches')
        .select('id, practitioners!inner(is_active)', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .eq('practitioners.is_active', true);

      const c = count ?? 0;
      byBranch[branchId] = c;
      totalPractitioners += c;
    }

    const { count: patientCount } = await supabaseAdmin
      .from('patient_clinics')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId);

    return NextResponse.json({
      plan: planSlug,
      practitioners: {
        current: totalPractitioners,
        max: plan?.max_practitioners ?? null,
        byBranch,
      },
      branches: {
        current: branchCount,
        max: plan?.max_branches ?? null,
      },
      patients: {
        current: patientCount ?? 0,
        max: plan?.max_patients ?? null,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
