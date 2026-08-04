import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logStaffAction } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'settings.manage');
  if (!isAuthSuccess(auth)) return auth;

  const body = await request.json();
  const {
    name,
    email,
    email_notifications_enabled,
    appointment_reminders_enabled,
    intake_required,
  } = body;

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (email !== undefined) updates.email = email;
  if (email_notifications_enabled !== undefined) {
    updates.email_notifications_enabled = email_notifications_enabled;
  }
  if (appointment_reminders_enabled !== undefined) {
    if (email_notifications_enabled === false) {
      updates.appointment_reminders_enabled = false;
    } else {
      updates.appointment_reminders_enabled = appointment_reminders_enabled;
    }
  }
  if (intake_required !== undefined) {
    updates.intake_required = intake_required;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  const { data: clinic, error: updateError } = await supabaseAdmin
    .from('clinics')
    .update(updates)
    .eq('id', clinicId)
    .select()
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await logStaffAction({
    clinicId,
    actorId: auth.admin.id,
    actorType: 'clinic_admin',
    action: 'settings.update',
    entityType: 'clinic',
    entityId: clinicId,
    metadata: { updated_fields: Object.keys(updates) },
  });

  return NextResponse.json({ clinic });
}
