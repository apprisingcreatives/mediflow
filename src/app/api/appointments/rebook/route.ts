import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import jwt from 'jsonwebtoken';

interface RebookToken {
  appointmentId: string;
  patientId: string;
  clinicId: string;
  practitionerId: string;
  serviceId: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, selected_slot } = body;

    if (!token || !selected_slot?.date || !selected_slot?.time) {
      return NextResponse.json(
        { error: 'Token, date, and time are required' },
        { status: 400 },
      );
    }

    const jwtSecret =
      process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'mediflow-rebook-secret';

    let decoded: RebookToken;
    try {
      decoded = jwt.verify(token, jwtSecret) as RebookToken;
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired rebooking link' },
        { status: 400 },
      );
    }

    // Verify slot is still available
    const { data: isAvailable, error: rpcError } = await supabaseAdmin.rpc(
      'check_appointment_availability',
      {
        p_practitioner_id: decoded.practitionerId,
        p_appointment_date: selected_slot.date,
        p_appointment_time: selected_slot.time,
        p_duration_minutes: 30,
        p_exclude_appointment_id: null,
      },
    );

    if (rpcError || !isAvailable) {
      return NextResponse.json(
        { error: 'This time slot is no longer available. Please select another.' },
        { status: 409 },
      );
    }

    // Create new appointment
    const { data: newAppointment, error: createError } = await supabaseAdmin
      .from('appointments')
      .insert({
        patient_id: decoded.patientId,
        clinic_id: decoded.clinicId,
        practitioner_id: decoded.practitionerId,
        service_id: decoded.serviceId,
        appointment_date: selected_slot.date,
        appointment_time: selected_slot.time,
        status: 'scheduled',
        booked_by: 'patient',
        rebooking_source: 'sms_rebook',
        cancelled_appointment_id: decoded.appointmentId,
      })
      .select('id, appointment_date, appointment_time')
      .single();

    if (createError) {
      return NextResponse.json(
        { error: 'Failed to create appointment' },
        { status: 500 },
      );
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      patient_id: decoded.patientId,
      clinic_id: decoded.clinicId,
      actor_id: null,
      actor_role: 'patient',
      action_type: 'appointment_rebooked',
      entity_type: 'appointment',
      entity_id: newAppointment.id,
      metadata: {
        original_appointment_id: decoded.appointmentId,
        source: 'sms_rebook',
      },
    });

    return NextResponse.json({
      success: true,
      appointment: newAppointment,
    });
  } catch (err) {
    console.error('Rebook error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// GET: Decode token and return available slots for the rebook page
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token required' }, { status: 400 });
  }

  const jwtSecret =
    process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'mediflow-rebook-secret';

  let decoded: RebookToken;
  try {
    decoded = jwt.verify(token, jwtSecret) as RebookToken;
  } catch {
    return NextResponse.json(
      { error: 'Invalid or expired rebooking link' },
      { status: 400 },
    );
  }

  // Get clinic and practitioner info
  const { data: clinic } = await supabaseAdmin
    .from('clinics')
    .select('id, name')
    .eq('id', decoded.clinicId)
    .single();

  const { data: practitioner } = await supabaseAdmin
    .from('practitioners')
    .select('id, name, specialization')
    .eq('id', decoded.practitionerId)
    .single();

  const { data: service } = await supabaseAdmin
    .from('clinic_services')
    .select('id, name, duration_minutes, price')
    .eq('id', decoded.serviceId)
    .single();

  // Get available slots for next 14 days
  const today = new Date().toISOString().split('T')[0];
  const slots: { date: string; times: string[] }[] = [];

  for (let i = 0; i < 14 && slots.length < 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    if (dateStr < today) continue;

    const { data: daySlots } = await supabaseAdmin.rpc('get_available_time_slots', {
      p_practitioner_id: decoded.practitionerId,
      p_date: dateStr,
      p_duration_minutes: service?.duration_minutes || 30,
      p_exclude_appointment_id: null,
    });

    if (daySlots && daySlots.length > 0) {
      slots.push({
        date: dateStr,
        times: daySlots.map((s: any) => s.time_slot || s),
      });
    }
  }

  return NextResponse.json({
    clinic,
    practitioner,
    service,
    available_slots: slots,
  });
}
