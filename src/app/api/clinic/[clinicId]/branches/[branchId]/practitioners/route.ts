import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { requirePlan } from '@/lib/plan-gating';
import { logStaffAction } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; branchId: string }> },
) {
  try {
    const { clinicId, branchId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId);
    if (!isAuthSuccess(authResult)) return authResult;

    const { data: assignments, error } = await supabaseAdmin
      .from('practitioner_branches')
      .select('id, practitioner_id, branch_id, practitioners(id, name, email, specialization, is_active)')
      .eq('branch_id', branchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const practitioners = (assignments ?? []).map((a: any) => ({
      ...a.practitioners,
      assignment_id: a.id,
    }));

    return NextResponse.json({ practitioners });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; branchId: string }> },
) {
  try {
    const { clinicId, branchId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'branches.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const planCheck = await requirePlan(clinicId, 'enterprise');
    if (planCheck !== true) return planCheck;

    const { practitioner_id } = await request.json();

    if (!practitioner_id) {
      return NextResponse.json({ error: 'practitioner_id is required' }, { status: 400 });
    }

    // Verify practitioner belongs to this clinic
    const { data: practitioner } = await supabaseAdmin
      .from('practitioners')
      .select('id, name')
      .eq('id', practitioner_id)
      .eq('clinic_id', clinicId)
      .single();

    if (!practitioner) {
      return NextResponse.json({ error: 'Practitioner not found in this clinic' }, { status: 404 });
    }

    const { data: assignment, error } = await supabaseAdmin
      .from('practitioner_branches')
      .insert({ practitioner_id, branch_id: branchId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Practitioner already assigned to this branch' }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logStaffAction({
      clinicId,
      actorId: authResult.admin.id,
      actorType: 'clinic_admin',
      action: 'branch.assign_practitioner',
      entityType: 'practitioner_branch',
      entityId: assignment.id,
      metadata: { practitioner_id, branch_id: branchId, practitioner_name: practitioner.name },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
