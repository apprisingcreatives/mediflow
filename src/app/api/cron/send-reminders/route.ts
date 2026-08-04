import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendSMS } from '@/lib/unisms';
import { normalizeToE164, isValidPHMobile } from '@/lib/phone';
import jwt from 'jsonwebtoken';

const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'mediflow-rebook-secret';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mediflow.apprisingcreatives.com';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { sent: 0, skipped: 0, failed: 0 };

  try {
    // PHT is UTC+8 — calculate current time in PHT
    const now = new Date();
    const nowPHT = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    // 24h window: appointments 23-25 hours from now
    const h24Start = new Date(nowPHT.getTime() + 23 * 60 * 60 * 1000);
    const h24End = new Date(nowPHT.getTime() + 25 * 60 * 60 * 1000);

    // 2h window: appointments 1.5-2.5 hours from now
    const h2Start = new Date(nowPHT.getTime() + 1.5 * 60 * 60 * 1000);
    const h2End = new Date(nowPHT.getTime() + 2.5 * 60 * 60 * 1000);

    // Fetch appointments needing 24h reminders
    const { data: appointments24h } = await supabaseAdmin
      .from('appointments')
      .select(
        `id, appointment_date, appointment_time, patient_id, clinic_id, status,
         patient:patients(id, first_name, phone),
         clinic:clinics(id, name)`,
      )
      .in('status', ['scheduled', 'confirmed'])
      .eq('sms_24hr_sent', false)
      .gte('appointment_date', h24Start.toISOString().split('T')[0])
      .lte('appointment_date', h24End.toISOString().split('T')[0]);

    // Fetch appointments needing 2h reminders
    const { data: appointments2h } = await supabaseAdmin
      .from('appointments')
      .select(
        `id, appointment_date, appointment_time, patient_id, clinic_id, status,
         patient:patients(id, first_name, phone),
         clinic:clinics(id, name)`,
      )
      .in('status', ['scheduled', 'confirmed'])
      .eq('sms_2hr_sent', false)
      .gte('appointment_date', h2Start.toISOString().split('T')[0])
      .lte('appointment_date', h2End.toISOString().split('T')[0]);

    // Process 24h reminders
    if (appointments24h) {
      for (const appt of appointments24h) {
        const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time}+08:00`);
        if (apptDateTime < h24Start || apptDateTime > h24End) continue;
        await processReminder(appt, '24h', results);
      }
    }

    // Process 2h reminders
    if (appointments2h) {
      for (const appt of appointments2h) {
        const apptDateTime = new Date(`${appt.appointment_date}T${appt.appointment_time}+08:00`);
        if (apptDateTime < h2Start || apptDateTime > h2End) continue;
        await processReminder(appt, '2h', results);
      }
    }
  } catch (err) {
    console.error('Send reminders cron error:', err);
  }

  return NextResponse.json({ success: true, ...results });
}

async function processReminder(
  appt: Record<string, any>,
  type: '24h' | '2h',
  results: { sent: number; skipped: number; failed: number },
) {
  const idempotencyKey = `${appt.id}:${type}`;

  // Check idempotency
  const { data: existing } = await supabaseAdmin
    .from('sms_notifications')
    .select('id')
    .eq('idempotency_key', idempotencyKey)
    .single();

  if (existing) {
    results.skipped++;
    return;
  }

  // Get patient phone
  const phone = await getPatientPhone(appt.patient_id, appt.patient?.phone);
  if (!phone) {
    results.skipped++;
    return;
  }

  const patientName = appt.patient?.first_name || 'there';
  const clinicName = appt.clinic?.name || 'the clinic';
  const [h, m] = (appt.appointment_time || '00:00').split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const time = `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;

  const confirmToken = jwt.sign(
    { appointmentId: appt.id, patientId: appt.patient_id, action: 'confirm' },
    jwtSecret,
    { expiresIn: '48h' },
  );
  const cancelToken = jwt.sign(
    { appointmentId: appt.id, patientId: appt.patient_id, action: 'cancel' },
    jwtSecret,
    { expiresIn: '48h' },
  );

  const confirmUrl = `${appUrl}/confirm/${confirmToken}`;
  const cancelUrl = `${appUrl}/cancel/${cancelToken}`;

  let msgBody: string;
  if (type === '24h') {
    msgBody = `Hi ${patientName}, reminder: ${clinicName} appt tomorrow at ${time}.\nConfirm: ${confirmUrl}\nCancel: ${cancelUrl}`;
  } else {
    msgBody = `Hi ${patientName}, your appt at ${clinicName} is in 2 hours (${time}).\nConfirm: ${confirmUrl}\nCancel: ${cancelUrl}`;
  }

  try {
    const { messageId } = await sendSMS(phone, msgBody);

    await supabaseAdmin.from('sms_notifications').insert({
      appointment_id: appt.id,
      patient_id: appt.patient_id,
      clinic_id: appt.clinic_id,
      phone_e164: phone,
      message_body: msgBody,
      reminder_type: type,
      provider_message_id: messageId,
      status: 'sent',
      sent_at: new Date().toISOString(),
      idempotency_key: idempotencyKey,
    });

    const flagColumn = type === '24h' ? 'sms_24hr_sent' : 'sms_2hr_sent';
    await supabaseAdmin
      .from('appointments')
      .update({ [flagColumn]: true })
      .eq('id', appt.id);

    results.sent++;
  } catch (err) {
    console.error(`Failed to send ${type} reminder for ${appt.id}:`, err);

    await supabaseAdmin.from('sms_notifications').insert({
      appointment_id: appt.id,
      patient_id: appt.patient_id,
      clinic_id: appt.clinic_id,
      phone_e164: phone,
      message_body: msgBody,
      reminder_type: type,
      status: 'failed',
      idempotency_key: idempotencyKey,
    });

    results.failed++;
  }
}

async function getPatientPhone(
  patientId: string,
  fallbackPhone?: string | null,
): Promise<string | null> {
  const { data: prefs } = await supabaseAdmin
    .from('patient_notification_preferences')
    .select('phone_e164, sms_enabled, sms_opted_out')
    .eq('patient_id', patientId)
    .single();

  if (prefs?.sms_opted_out || prefs?.sms_enabled === false) return null;

  if (prefs?.phone_e164 && isValidPHMobile(prefs.phone_e164)) {
    return prefs.phone_e164;
  }

  const normalized = normalizeToE164(fallbackPhone);
  if (normalized && isValidPHMobile(normalized)) return normalized;

  return null;
}
