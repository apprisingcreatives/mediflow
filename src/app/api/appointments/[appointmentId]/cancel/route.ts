import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createNotifications } from '@/lib/notifications';
import { sendSMS } from '@/lib/unisms';
import { normalizeToE164, isValidPHMobile } from '@/lib/phone';
import jwt from 'jsonwebtoken';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface CancelBody {
  reason?: string;
  source?: 'sms' | 'web';
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CancelBody = await request.json().catch(() => ({}));

    // Fetch appointment with relations
    const { data: appointment, error: fetchError } = await supabaseAdmin
      .from('appointments')
      .select(
        `*, patient:patients(id, first_name, last_name, phone, auth_user_id),
         practitioner:practitioners(id, name, clinic_id),
         service:clinic_services(id, name, duration_minutes, price),
         clinic:clinics(id, name)`,
      )
      .eq('id', appointmentId)
      .single();

    if (fetchError || !appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 },
      );
    }

    // Verify caller is the patient or a clinic admin
    const isPatientOwner = appointment.patient?.auth_user_id === user.id;
    let isClinicAdmin = false;
    if (!isPatientOwner) {
      const { data: adminRecord } = await supabaseAdmin
        .from('clinic_admins')
        .select('id')
        .eq('auth_user_id', user.id)
        .eq('clinic_id', appointment.clinic_id)
        .eq('is_active', true)
        .single();
      isClinicAdmin = !!adminRecord;
    }

    if (!isPatientOwner && !isClinicAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check appointment is cancellable
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: 'Appointment cannot be cancelled in its current state' },
        { status: 400 },
      );
    }

    // 1. Cancel the appointment + schedule refund if paid
    const refundDelay = 24 * 60 * 60 * 1000; // 24 hours
    const shouldRefund = appointment.payment_status === 'paid';

    const { error: cancelError } = await supabaseAdmin
      .from('appointments')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        ...(shouldRefund && {
          payment_status: 'refund_pending',
          refund_scheduled_at: new Date(Date.now() + refundDelay).toISOString(),
        }),
      })
      .eq('id', appointmentId);

    if (cancelError) {
      return NextResponse.json(
        { error: 'Failed to cancel appointment' },
        { status: 500 },
      );
    }

    // 2. Log activity
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: appointment.patient_id,
      clinic_id: appointment.clinic_id,
      actor_id: user.id,
      actor_role: isClinicAdmin ? 'clinic_admin' : 'patient',
      action_type: 'appointment_cancelled',
      entity_type: 'appointment',
      entity_id: appointmentId,
      metadata: {
        reason: body.reason || null,
        source: body.source || 'web',
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
      },
    });

    // 3. Fire-and-forget in-app notifications
    {
      const [hh, mm] = (appointment.appointment_time || '00:00').split(':').map(Number);
      const time = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
      const dateObj = new Date(appointment.appointment_date + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const patientName = appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'A patient';
      const cancelMsg = `Appointment on ${dateStr} at ${time} has been cancelled`;
      const items: Parameters<typeof createNotifications>[0] = [];

      // Notify practitioner
      if (appointment.practitioner_id) {
        const { data: prac } = await supabaseAdmin
          .from('practitioners')
          .select('auth_user_id')
          .eq('id', appointment.practitioner_id)
          .single();
        if (prac?.auth_user_id && prac.auth_user_id !== user.id) {
          items.push({
            recipientId: prac.auth_user_id,
            recipientType: 'practitioner',
            clinicId: appointment.clinic_id,
            type: 'appointment.cancelled',
            title: 'Appointment Cancelled',
            message: `${patientName} — ${cancelMsg}`,
            actionUrl: `/clinic/${appointment.clinic_id}/appointments`,
          });
        }
      }

      // Notify patient (if cancelled by admin)
      if (isClinicAdmin && appointment.patient?.auth_user_id) {
        items.push({
          recipientId: appointment.patient.auth_user_id,
          recipientType: 'patient',
          clinicId: appointment.clinic_id,
          type: 'appointment.cancelled',
          title: 'Appointment Cancelled',
          message: `Your appointment on ${dateStr} at ${time}${appointment.clinic?.name ? ` at ${appointment.clinic.name}` : ''} has been cancelled`,
          actionUrl: '/patient/appointments',
        });
      }

      // Notify clinic owner(s) (if cancelled by patient)
      if (isPatientOwner && appointment.clinic_id) {
        const { data: owners } = await supabaseAdmin
          .from('clinic_admins')
          .select('auth_user_id')
          .eq('clinic_id', appointment.clinic_id)
          .eq('staff_role', 'owner')
          .eq('is_active', true);
        for (const owner of owners ?? []) {
          if (owner.auth_user_id) {
            items.push({
              recipientId: owner.auth_user_id,
              recipientType: 'clinic_admin',
              clinicId: appointment.clinic_id,
              type: 'appointment.cancelled',
              title: 'Appointment Cancelled',
              message: `${patientName} cancelled their appointment on ${dateStr} at ${time}`,
              actionUrl: `/clinic/${appointment.clinic_id}/appointments`,
            });
          }
        }
      }

      if (items.length > 0) createNotifications(items);
    }

    // 4. Waitlist auto-book (priority over rebooking)
    let waitlistFilled = false;
    try {
      waitlistFilled = await tryWaitlistAutoBook(appointment);
    } catch (err) {
      console.error('Waitlist auto-book error:', err);
    }

    // 4. Auto-rebooking SMS (only if waitlist didn't fill the slot)
    if (!waitlistFilled && appointment.patient) {
      try {
        await sendRebookingSMS(appointment);
      } catch (err) {
        console.error('Rebooking SMS error:', err);
      }
    }

    return NextResponse.json({
      success: true,
      waitlist_filled: waitlistFilled,
      refund_scheduled: shouldRefund,
    });
  } catch (err) {
    console.error('Cancel appointment error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

async function tryWaitlistAutoBook(
  appointment: Record<string, any>,
): Promise<boolean> {
  // Find matching waitlist entry using raw SQL for FOR UPDATE SKIP LOCKED
  const { data: waitlistEntries, error: wlError } = await supabaseAdmin
    .from('appointment_waitlist')
    .select(
      '*, patient:patients(id, first_name, last_name, phone, auth_user_id)',
    )
    .eq('clinic_id', appointment.clinic_id)
    .eq('status', 'waiting')
    .lte('preferred_date_start', appointment.appointment_date)
    .gte('preferred_date_end', appointment.appointment_date)
    .order('created_at', { ascending: true })
    .limit(10);

  if (wlError || !waitlistEntries || waitlistEntries.length === 0) return false;

  // Filter by practitioner match (null = any practitioner)
  const matches = waitlistEntries.filter((entry: any) => {
    if (
      entry.practitioner_id &&
      entry.practitioner_id !== appointment.practitioner_id
    ) {
      return false;
    }
    if (entry.service_id && entry.service_id !== appointment.service_id) {
      return false;
    }
    // Check time preferences if specified
    if (
      entry.preferred_time_start &&
      appointment.appointment_time < entry.preferred_time_start
    ) {
      return false;
    }
    if (
      entry.preferred_time_end &&
      appointment.appointment_time > entry.preferred_time_end
    ) {
      return false;
    }
    return true;
  });

  if (matches.length === 0) return false;

  const match = matches[0];

  // Create new appointment for waitlisted patient
  const { data: newAppointment, error: createError } = await supabaseAdmin
    .from('appointments')
    .insert({
      patient_id: match.patient_id,
      clinic_id: appointment.clinic_id,
      practitioner_id: appointment.practitioner_id,
      service_id: appointment.service_id,
      appointment_date: appointment.appointment_date,
      appointment_time: appointment.appointment_time,
      status: 'confirmed',
      booked_by: 'clinic_admin',
      notes: 'Auto-booked from waitlist',
      rebooking_source: 'waitlist',
      cancelled_appointment_id: appointment.id,
    })
    .select('id')
    .single();

  if (createError || !newAppointment) return false;

  // Update waitlist entry
  await supabaseAdmin
    .from('appointment_waitlist')
    .update({
      status: 'booked',
      booked_appointment_id: newAppointment.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', match.id);

  // Log activity
  await supabaseAdmin.from('activity_logs').insert({
    patient_id: match.patient_id,
    clinic_id: appointment.clinic_id,
    actor_id: match.patient?.auth_user_id || null,
    actor_role: 'system',
    action_type: 'waitlist_auto_booked',
    entity_type: 'appointment',
    entity_id: newAppointment.id,
    metadata: {
      waitlist_id: match.id,
      original_appointment_id: appointment.id,
    },
  });

  // Send SMS to waitlisted patient
  try {
    const phone = await getPatientPhone(match.patient_id, match.patient?.phone);
    if (phone) {
      const patientName = match.patient?.first_name || 'there';
      const clinicName = appointment.clinic?.name || 'the clinic';
      const [hh, mm] = (appointment.appointment_time || '00:00').split(':').map(Number);
      const time = `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${hh >= 12 ? 'PM' : 'AM'}`;
      const dateObj = new Date(appointment.appointment_date + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      const msgBody = `Hi ${patientName}, great news! You've been booked for ${dateStr} at ${time} at ${clinicName}.`;

      const { messageId } = await sendSMS(phone, msgBody);
      await supabaseAdmin.from('sms_notifications').insert({
        appointment_id: newAppointment.id,
        patient_id: match.patient_id,
        clinic_id: appointment.clinic_id,
        phone_e164: phone,
        message_body: msgBody,
        reminder_type: 'waitlist_booked',
        provider_message_id: messageId,
        status: 'sent',
        sent_at: new Date().toISOString(),
        idempotency_key: `waitlist:${match.id}:${newAppointment.id}`,
      });
    }
  } catch (err) {
    console.error('Failed to send waitlist SMS:', err);
  }

  return true;
}

async function sendRebookingSMS(
  appointment: Record<string, any>,
): Promise<void> {
  const patient = appointment.patient;
  if (!patient) return;

  const phone = await getPatientPhone(patient.id, patient.phone);
  if (!phone) return;

  // Get next 3 available slots
  const { data: slots } = await supabaseAdmin.rpc('get_available_time_slots', {
    p_practitioner_id: appointment.practitioner_id,
    p_date: appointment.appointment_date,
    p_duration_minutes: appointment.service?.duration_minutes || 30,
    p_exclude_appointment_id: null,
  });

  // Generate rebooking token
  const jwtSecret =
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'mediflow-rebook-secret';
  const rebookToken = jwt.sign(
    {
      appointmentId: appointment.id,
      patientId: patient.id,
      clinicId: appointment.clinic_id,
      practitionerId: appointment.practitioner_id,
      serviceId: appointment.service_id,
    },
    jwtSecret,
    { expiresIn: '72h' },
  );

  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://mediflow.apprisingcreatives.com';
  const rebookUrl = `${appUrl}/rebook/${rebookToken}`;

  const patientName = patient.first_name || 'there';
  const clinicName = appointment.clinic?.name || 'the clinic';
  const cancelDateObj = new Date(appointment.appointment_date + 'T00:00:00');
  const cancelDateStr = cancelDateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  let msgBody: string;
  if (slots && slots.length > 0) {
    msgBody = `Hi ${patientName}, your appt at ${clinicName} was cancelled. Rebook here: ${rebookUrl}`;
  } else {
    msgBody = `Hi ${patientName}, your appt at ${clinicName} on ${cancelDateStr} has been cancelled. Call the clinic to reschedule.`;
  }

  try {
    const { messageId } = await sendSMS(phone, msgBody);
    await supabaseAdmin.from('sms_notifications').insert({
      appointment_id: appointment.id,
      patient_id: patient.id,
      clinic_id: appointment.clinic_id,
      phone_e164: phone,
      message_body: msgBody,
      reminder_type: 'rebooking',
      provider_message_id: messageId,
      status: 'sent',
      sent_at: new Date().toISOString(),
      idempotency_key: `rebook:${appointment.id}`,
    });
  } catch (err) {
    console.error('Failed to send rebooking SMS:', err);
  }
}

async function getPatientPhone(
  patientId: string,
  fallbackPhone?: string | null,
): Promise<string | null> {
  // Check notification preferences first
  const { data: prefs } = await supabaseAdmin
    .from('patient_notification_preferences')
    .select('phone_e164, sms_enabled, sms_opted_out')
    .eq('patient_id', patientId)
    .single();

  if (prefs?.sms_opted_out || prefs?.sms_enabled === false) return null;

  if (prefs?.phone_e164 && isValidPHMobile(prefs.phone_e164)) {
    return prefs.phone_e164;
  }

  // Fallback to patients.phone normalized
  const normalized = normalizeToE164(fallbackPhone);
  if (normalized && isValidPHMobile(normalized)) {
    return normalized;
  }

  return null;
}
