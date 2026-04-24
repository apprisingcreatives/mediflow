import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { validateTwilioSignature } from '@/lib/twilio';
import { normalizeToE164 } from '@/lib/phone';
import { twiml } from 'twilio';

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const params = Object.fromEntries(new URLSearchParams(rawBody));

  // Validate Twilio signature
  const signature = request.headers.get('x-twilio-signature') || '';
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/twilio/incoming`;

  if (!validateTwilioSignature(signature, url, params)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  const fromPhone = normalizeToE164(params.From);
  const messageBody = (params.Body || '').trim().toUpperCase();
  const response = new twiml.MessagingResponse();

  if (!fromPhone) {
    response.message('Sorry, we could not process your message.');
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Look up patient by phone
  const { data: prefs } = await supabaseAdmin
    .from('patient_notification_preferences')
    .select('patient_id, sms_opted_out')
    .eq('phone_e164', fromPhone)
    .single();

  // Fallback: search patients.phone
  let patientId = prefs?.patient_id;
  if (!patientId) {
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .or(`phone.eq.${params.From},phone.eq.${fromPhone}`)
      .limit(1)
      .single();
    patientId = patient?.id;
  }

  if (!patientId) {
    response.message('We could not find your account. Please contact the clinic directly.');
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Handle opt-out
  if (['STOP', 'CANCEL', 'END', 'QUIT', 'UNSUBSCRIBE'].includes(messageBody)) {
    await supabaseAdmin
      .from('patient_notification_preferences')
      .upsert(
        {
          patient_id: patientId,
          phone_e164: fromPhone,
          sms_opted_out: true,
          opted_out_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'patient_id' },
      );

    response.message('You have been unsubscribed from SMS reminders. Reply START to resubscribe.');
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Handle re-subscribe
  if (['START', 'YES', 'SUBSCRIBE'].includes(messageBody)) {
    await supabaseAdmin
      .from('patient_notification_preferences')
      .upsert(
        {
          patient_id: patientId,
          phone_e164: fromPhone,
          sms_opted_out: false,
          sms_enabled: true,
          opted_out_at: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'patient_id' },
      );

    response.message('You have been resubscribed to SMS reminders.');
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Find patient's next upcoming appointment
  const { data: nextAppt } = await supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, clinic:clinics(name)')
    .eq('patient_id', patientId)
    .in('status', ['scheduled', 'confirmed'])
    .gte('appointment_date', new Date().toISOString().split('T')[0])
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })
    .limit(1)
    .single();

  if (!nextAppt) {
    response.message('You have no upcoming appointments. Reply STOP to opt out.');
    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Handle confirm
  if (messageBody === 'C' || messageBody === 'CONFIRM') {
    if (nextAppt.status === 'confirmed') {
      response.message(
        `Your appointment on ${nextAppt.appointment_date} at ${nextAppt.appointment_time?.slice(0, 5)} is already confirmed. See you then!`,
      );
    } else {
      await supabaseAdmin
        .from('appointments')
        .update({ status: 'confirmed', updated_at: new Date().toISOString() })
        .eq('id', nextAppt.id);

      const clinicName = (nextAppt.clinic as any)?.name || 'the clinic';
      response.message(
        `Confirmed! See you on ${nextAppt.appointment_date} at ${nextAppt.appointment_time?.slice(0, 5)} at ${clinicName}.`,
      );
    }

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Handle cancel
  if (messageBody === 'X' || messageBody === 'NO') {
    await supabaseAdmin
      .from('appointments')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', nextAppt.id);

    await supabaseAdmin.from('activity_logs').insert({
      patient_id: patientId,
      clinic_id: (nextAppt as any).clinic_id || null,
      actor_id: null,
      actor_role: 'patient',
      action_type: 'appointment_cancelled',
      entity_type: 'appointment',
      entity_id: nextAppt.id,
      metadata: { source: 'sms' },
    });

    response.message('Cancelled. We\'ll send you rebooking options shortly.');

    return new NextResponse(response.toString(), {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  // Unrecognized message
  response.message('Reply C to confirm or X to cancel your next appointment. Reply STOP to opt out.');
  return new NextResponse(response.toString(), {
    headers: { 'Content-Type': 'text/xml' },
  });
}
