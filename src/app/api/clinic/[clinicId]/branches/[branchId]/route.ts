import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { requirePlan } from '@/lib/plan-gating';
import { logStaffAction } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; branchId: string }> },
) {
  try {
    const { clinicId, branchId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'branches.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const planCheck = await requirePlan(clinicId, 'professional');
    if (planCheck !== true) return planCheck;

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name.trim();
    if (body.address !== undefined) updates.address = body.address || null;
    if (body.city !== undefined) updates.city = body.city || null;
    if (body.phone !== undefined) updates.phone = body.phone || null;
    if (body.is_active !== undefined) updates.is_active = body.is_active;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    // Block deactivation if future appointments exist at this branch
    if (updates.is_active === false) {
      const { count } = await supabaseAdmin
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('branch_id', branchId)
        .gte('appointment_date', new Date().toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed']);

      if (count && count > 0) {
        return NextResponse.json(
          { error: `Cannot deactivate branch: ${count} future appointment(s) exist. Reassign or cancel them first.` },
          { status: 400 },
        );
      }
    }

    updates.updated_at = new Date().toISOString();

    const { data: branch, error } = await supabaseAdmin
      .from('branches')
      .update(updates)
      .eq('id', branchId)
      .eq('clinic_id', clinicId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logStaffAction({
      clinicId,
      actorId: authResult.admin.id,
      actorType: 'clinic_admin',
      action: updates.is_active === false ? 'branch.deactivate' : 'branch.update',
      entityType: 'branch',
      entityId: branchId,
      metadata: updates,
    });

    return NextResponse.json({ branch });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; branchId: string }> },
) {
  try {
    const { clinicId, branchId } = await params;
    const authResult = await authenticateClinicRequest(request, clinicId, 'branches.manage');
    if (!isAuthSuccess(authResult)) return authResult;

    const planCheck = await requirePlan(clinicId, 'professional');
    if (planCheck !== true) return planCheck;

    // Cannot delete the default branch
    const { data: branch } = await supabaseAdmin
      .from('branches')
      .select('is_default, name')
      .eq('id', branchId)
      .eq('clinic_id', clinicId)
      .single();

    if (!branch) {
      return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
    }

    if (branch.is_default) {
      return NextResponse.json({ error: 'Cannot delete the default branch' }, { status: 400 });
    }

    // Block deletion if any appointments exist at this branch
    const { count } = await supabaseAdmin
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('branch_id', branchId);

    if (count && count > 0) {
      return NextResponse.json(
        { error: `Cannot delete branch: ${count} appointment(s) are linked. Deactivate instead.` },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from('branches')
      .delete()
      .eq('id', branchId)
      .eq('clinic_id', clinicId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logStaffAction({
      clinicId,
      actorId: authResult.admin.id,
      actorType: 'clinic_admin',
      action: 'branch.delete',
      entityType: 'branch',
      entityId: branchId,
      metadata: { name: branch.name },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
