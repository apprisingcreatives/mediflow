import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createNotifications } from '@/lib/notifications';
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

    if (decoded.action !== 'confirm') {
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

    if (decoded.action !== 'confirm') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
    }

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, status, patient_id, clinic_id')
      .eq('id', decoded.appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.patient_id !== decoded.patientId) {
      return NextResponse.json({ error: 'Token mismatch' }, { status: 403 });
    }

    if (appointment.status === 'confirmed') {
      return NextResponse.json({ success: true, already_confirmed: true });
    }

    if (appointment.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Appointment is ${appointment.status} and cannot be confirmed` },
        { status: 400 },
      );
    }

    await supabaseAdmin
      .from('appointments')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', decoded.appointmentId);

    await supabaseAdmin.from('activity_logs').insert({
      patient_id: decoded.patientId,
      clinic_id: appointment.clinic_id,
      actor_id: null,
      actor_role: 'patient',
      action_type: 'appointment_confirmed',
      entity_type: 'appointment',
      entity_id: decoded.appointmentId,
      metadata: { source: 'sms_link' },
    });

    // Notify clinic owner(s) that appointment was confirmed
    if (appointment.clinic_id) {
      const { data: owners } = await supabaseAdmin
        .from('clinic_admins')
        .select('auth_user_id')
        .eq('clinic_id', appointment.clinic_id)
        .eq('staff_role', 'owner')
        .eq('is_active', true);
      const ownerNotifs = (owners ?? [])
        .filter((o) => o.auth_user_id)
        .map((o) => ({
          recipientId: o.auth_user_id!,
          recipientType: 'clinic_admin' as const,
          clinicId: appointment.clinic_id,
          type: 'appointment.status_changed' as const,
          title: 'Appointment Confirmed',
          message: 'A patient has confirmed their appointment',
          actionUrl: `/clinic/${appointment.clinic_id}/appointments`,
        }));
      if (ownerNotifs.length > 0) createNotifications(ownerNotifs);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 400 });
  }
}
