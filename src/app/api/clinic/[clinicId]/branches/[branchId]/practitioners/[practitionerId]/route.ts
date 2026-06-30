import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { requirePlan } from '@/lib/plan-gating';
import { logStaffAction } from '@/lib/audit';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; branchId: string; practitionerId: string }> },
) {
  try {
    const { clinicId, branchId, practitionerId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'branches.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const planCheck = await requirePlan(clinicId, 'professional');
    if (planCheck !== true) return planCheck;

    const { error } = await supabaseAdmin
      .from('practitioner_branches')
      .delete()
      .eq('practitioner_id', practitionerId)
      .eq('branch_id', branchId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logStaffAction({
      clinicId,
      actorId: authResult.admin.id,
      actorType: 'clinic_admin',
      action: 'branch.unassign_practitioner',
      entityType: 'practitioner_branch',
      metadata: { practitioner_id: practitionerId, branch_id: branchId },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
