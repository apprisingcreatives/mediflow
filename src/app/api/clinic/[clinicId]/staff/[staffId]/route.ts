import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createNotifications } from '@/lib/notifications';
import { logStaffAction } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; staffId: string }> },
) {
  const { clinicId, staffId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'staff.manage');
  if (!isAuthSuccess(auth)) return auth;

  const body = await request.json();
  const { staff_role, is_active } = body;

  const { data: target, error: fetchError } = await supabaseAdmin
    .from('clinic_admins')
    .select('id, staff_role, is_active, email')
    .eq('id', staffId)
    .eq('clinic_id', clinicId)
    .single();

  if (fetchError || !target) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
  }

  // Sole-owner protection
  if (target.staff_role === 'owner' && (staff_role !== 'owner' || is_active === false)) {
    const { count } = await supabaseAdmin
      .from('clinic_admins')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('staff_role', 'owner')
      .eq('is_active', true);

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot change role: this is the only Owner. Promote another staff member to Owner first.' },
        { status: 400 },
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (staff_role !== undefined) updateData.staff_role = staff_role;
  if (is_active !== undefined) updateData.is_active = is_active;
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('clinic_admins')
    .update(updateData)
    .eq('id', staffId)
    .eq('clinic_id', clinicId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update staff member' }, { status: 500 });
  }

  const action = is_active === false
    ? 'staff.deactivate'
    : is_active === true && !target.is_active
      ? 'staff.reactivate'
      : 'staff.role_change';

  await logStaffAction({
    clinicId,
    actorId: auth.admin.id,
    actorType: 'clinic_admin',
    action,
    entityType: 'clinic_admin',
    entityId: staffId,
    metadata: {
      previous_role: target.staff_role,
      new_role: staff_role ?? target.staff_role,
      previous_active: target.is_active,
      new_active: is_active ?? target.is_active,
    },
  });

  // Notify clinic owner(s) about staff change
  if (staff_role !== undefined && staff_role !== target.staff_role) {
    const { data: owners } = await supabaseAdmin
      .from('clinic_admins')
      .select('auth_user_id')
      .eq('clinic_id', clinicId)
      .eq('staff_role', 'owner')
      .eq('is_active', true);
    const ownerNotifs = (owners ?? [])
      .filter((o) => o.auth_user_id && o.auth_user_id !== auth.userId)
      .map((o) => ({
        recipientId: o.auth_user_id!,
        recipientType: 'clinic_admin' as const,
        clinicId,
        type: 'staff.role_changed' as const,
        title: 'Staff Role Changed',
        message: `${target.email}'s role changed from ${target.staff_role} to ${staff_role}`,
        actionUrl: `/clinic/${clinicId}/staff`,
      }));
    if (ownerNotifs.length > 0) createNotifications(ownerNotifs);
  }

  return NextResponse.json({ staff: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; staffId: string }> },
) {
  const { clinicId, staffId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'staff.manage');
  if (!isAuthSuccess(auth)) return auth;

  const { data: target } = await supabaseAdmin
    .from('clinic_admins')
    .select('id, staff_role, email')
    .eq('id', staffId)
    .eq('clinic_id', clinicId)
    .single();

  if (!target) {
    return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
  }

  // Sole-owner protection
  if (target.staff_role === 'owner') {
    const { count } = await supabaseAdmin
      .from('clinic_admins')
      .select('id', { count: 'exact', head: true })
      .eq('clinic_id', clinicId)
      .eq('staff_role', 'owner')
      .eq('is_active', true);

    if ((count ?? 0) <= 1) {
      return NextResponse.json(
        { error: 'Cannot deactivate the only Owner.' },
        { status: 400 },
      );
    }
  }

  await supabaseAdmin
    .from('clinic_admins')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', staffId)
    .eq('clinic_id', clinicId);

  await logStaffAction({
    clinicId,
    actorId: auth.admin.id,
    actorType: 'clinic_admin',
    action: 'staff.deactivate',
    entityType: 'clinic_admin',
    entityId: staffId,
    metadata: { deactivated_email: target.email },
  });

  return NextResponse.json({ message: 'Staff member deactivated' });
}
