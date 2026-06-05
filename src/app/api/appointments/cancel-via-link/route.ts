import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSMS } from '@/lib/unisms';
import { normalizeToE164, isValidPHMobile } from '@/lib/phone';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'mediflow-rebook-secret';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');
  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 });
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as {
      appointmentId: string;
      patientId: string;
      action: string;
    };

    if (decoded.action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, appointment_date, appointment_time, status, clinic:clinics(name), practitioner:practitioners(name)')
      .eq('id', decoded.appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({
      appointment: {
        id: appointment.id,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        status: appointment.status,
        clinic: (appointment.clinic as any)?.name,
        practitioner: (appointment.practitioner as any)?.name,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 });
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      appointmentId: string;
      patientId: string;
      action: string;
    };

    if (decoded.action !== 'cancel') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select(
        `*, patient:patients(id, first_name, last_name, phone, auth_user_id),
         practitioner:practitioners(id, name, clinic_id),
         service:clinic_services(id, name, duration_minutes, price),
         clinic:clinics(id, name)`,
      )
      .eq('id', decoded.appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.patient_id !== decoded.patientId) {
      return NextResponse.json({ error: 'Token mismatch' }, { status: 403 });
    }

    if (appointment.status === 'cancelled') {
      return NextResponse.json({ success: true, already_cancelled: true });
    }

    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      return NextResponse.json(
        { error: `Appointment is ${appointment.status} and cannot be cancelled` },
        { status: 400 },
      );
    }

    // 1. Cancel
    await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', decoded.appointmentId);

    // 2. Log
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: decoded.patientId,
      clinic_id: appointment.clinic_id,
      actor_id: null,
      actor_role: 'patient',
      action_type: 'appointment_cancelled',
      entity_type: 'appointment',
      entity_id: decoded.appointmentId,
      metadata: { source: 'sms_link' },
    });

    // 3. Waitlist auto-book
    let waitlistFilled = false;
    try {
      waitlistFilled = await tryWaitlistAutoBook(appointment);
    } catch (err) {
      console.error('Waitlist auto-book error:', err);
    }

    // 4. Rebooking SMS (only if waitlist didn't fill)
    if (!waitlistFilled && appointment.patient) {
      try {
        await sendRebookingSMS(appointment);
      } catch (err) {
        console.error('Rebooking SMS error:', err);
      }
    }

    return NextResponse.json({ success: true, waitlist_filled: waitlistFilled });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }
}

async function tryWaitlistAutoBook(appointment: Record<string, any>): Promise<boolean> {
  const { data: waitlistEntries } = await supabaseAdmin
    .from('appointment_waitlist')
    .select('*, patient:patients(id, first_name, last_name, phone, auth_user_id)')
    .eq('clinic_id', appointment.clinic_id)
    .eq('status', 'waiting')
    .lte('preferred_date_start', appointment.appointment_date)
    .gte('preferred_date_end', appointment.appointment_date)
    .order('created_at', { ascending: true })
    .limit(10);

  if (!waitlistEntries || waitlistEntries.length === 0) return false;

  const matches = waitlistEntries.filter((entry: any) => {
    if (entry.practitioner_id && entry.practitioner_id !== appointment.practitioner_id) return false;
    if (entry.service_id && entry.service_id !== appointment.service_id) return false;
    if (entry.preferred_time_start && appointment.appointment_time < entry.preferred_time_start) return false;
    if (entry.preferred_time_end && appointment.appointment_time > entry.preferred_time_end) return false;
    return true;
  });

  if (matches.length === 0) return false;
  const match = matches[0];

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

  await supabaseAdmin
    .from('appointment_waitlist')
    .update({ status: 'booked', booked_appointment_id: newAppointment.id, updated_at: new Date().toISOString() })
    .eq('id', match.id);

  await supabaseAdmin.from('activity_logs').insert({
    patient_id: match.patient_id,
    clinic_id: appointment.clinic_id,
    actor_id: match.patient?.auth_user_id || null,
    actor_role: 'system',
    action_type: 'waitlist_auto_booked',
    entity_type: 'appointment',
    entity_id: newAppointment.id,
    metadata: { waitlist_id: match.id, original_appointment_id: appointment.id },
  });

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

async function sendRebookingSMS(appointment: Record<string, any>): Promise<void> {
  const patient = appointment.patient;
  if (!patient) return;

  const phone = await getPatientPhone(patient.id, patient.phone);
  if (!phone) return;

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mediflow.apprisingcreatives.com';
  const rebookUrl = `${appUrl}/rebook/${rebookToken}`;
  const patientName = patient.first_name || 'there';
  const clinicName = appointment.clinic?.name || 'the clinic';

  const msgBody = `Hi ${patientName}, your appt at ${clinicName} was cancelled. Rebook here: ${rebookUrl}`;

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

async function getPatientPhone(patientId: string, fallbackPhone?: string | null): Promise<string | null> {
  const { data: prefs } = await supabaseAdmin
    .from('patient_notification_preferences')
    .select('phone_e164, sms_enabled, sms_opted_out')
    .eq('patient_id', patientId)
    .single();

  if (prefs?.sms_opted_out || prefs?.sms_enabled === false) return null;
  if (prefs?.phone_e164 && isValidPHMobile(prefs.phone_e164)) return prefs.phone_e164;

  const normalized = normalizeToE164(fallbackPhone);
  if (normalized && isValidPHMobile(normalized)) return normalized;
  return null;
}
