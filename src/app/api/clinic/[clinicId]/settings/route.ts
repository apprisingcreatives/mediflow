import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(
  request: Request,
  { params }: { params: { clinicId: string } },
) {
  try {
    const { clinicId } = params;

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userClinicId = user.user_metadata?.clinic_id;
    if (userClinicId !== clinicId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      email,
      email_notifications_enabled,
      appointment_reminders_enabled,
    } = body;

    // Build update object with only provided fields
    const updates: Record<string, unknown> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (email_notifications_enabled !== undefined) {
      updates.email_notifications_enabled = email_notifications_enabled;
    }
    if (appointment_reminders_enabled !== undefined) {
      // If email notifications are off, reminders must also be off
      if (email_notifications_enabled === false) {
        updates.appointment_reminders_enabled = false;
      } else {
        updates.appointment_reminders_enabled = appointment_reminders_enabled;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const { data: clinic, error: updateError } = await supabase
      .from('clinics')
      .update(updates)
      .eq('id', clinicId)
      .select()
      .single();

    if (updateError) {
      console.error('[API] Failed to update clinic settings:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ clinic });
  } catch (err) {
    console.error('[API] Server error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
