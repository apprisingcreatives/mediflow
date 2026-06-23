import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logStaffAction } from '@/lib/audit';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'staff.manage');
  if (!isAuthSuccess(auth)) return auth;

  const { data: staff, error } = await supabaseAdmin
    .from('clinic_admins')
    .select('id, clinic_id, email, name, role, staff_role, is_active, created_at, updated_at')
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
  }

  return NextResponse.json({ staff: staff ?? [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'staff.manage');
  if (!isAuthSuccess(auth)) return auth;

  const { email, name, staff_role } = await request.json();

  if (!email || !name || !staff_role) {
    return NextResponse.json(
      { error: 'Email, name, and staff_role are required' },
      { status: 400 },
    );
  }

  const validRoles = ['admin', 'receptionist', 'viewer'];
  if (!validRoles.includes(staff_role)) {
    return NextResponse.json(
      { error: 'Invalid role. Must be admin, receptionist, or viewer' },
      { status: 400 },
    );
  }

  const { data: existing } = await supabaseAdmin
    .from('clinic_admins')
    .select('id')
    .eq('clinic_id', clinicId)
    .eq('email', email)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'A staff member with this email already exists in this clinic' },
      { status: 409 },
    );
  }

  const { data: clinic } = await supabaseAdmin
    .from('clinics')
    .select('name')
    .eq('id', clinicId)
    .single();

  const { data: invitedUser, error: inviteError } =
    await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: {
        name,
        role: 'clinic_admin',
        staff_role,
        clinic_id: clinicId,
        clinic_name: clinic?.name ?? '',
      },
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/clinic/setup-account`,
    });

  if (inviteError) {
    return NextResponse.json(
      { error: `Failed to send invitation: ${inviteError.message}` },
      { status: 500 },
    );
  }

  const { data: newStaff, error: insertError } = await supabaseAdmin
    .from('clinic_admins')
    .insert({
      clinic_id: clinicId,
      email,
      name,
      role: 'admin',
      staff_role,
      is_active: false,
      auth_user_id: invitedUser.user.id,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: 'Failed to create staff record' },
      { status: 500 },
    );
  }

  await logStaffAction({
    clinicId,
    actorId: auth.admin.id,
    actorType: 'clinic_admin',
    action: 'staff.invite',
    entityType: 'clinic_admin',
    entityId: newStaff.id,
    metadata: { invited_email: email, assigned_role: staff_role },
  });

  return NextResponse.json(
    { message: 'Invitation sent successfully', staff: newStaff },
    { status: 201 },
  );
}
