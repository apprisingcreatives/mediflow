import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select(
        `id, clinic_id, appointment_date, appointment_time, payment_status, payment_method, payment_amount, paid_at, refunded_at,
         patient:patients(id, auth_user_id, first_name, last_name, email),
         practitioner:practitioners(id, name, specialization),
         service:clinic_services(id, name, price),
         clinic:clinics(id, name, address, email)`,
      )
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    const patient = appointment.patient as any;
    const isPatient = patient?.auth_user_id === user.id;

    let isClinicAdmin = false;
    if (!isPatient) {
      const { data: admin } = await supabaseAdmin
        .from('clinic_admins')
        .select('id')
        .eq('auth_user_id', user.id)
        .eq('clinic_id', appointment.clinic_id)
        .eq('is_active', true)
        .single();
      isClinicAdmin = !!admin;
    }

    if (!isPatient && !isClinicAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!['paid', 'refunded'].includes(appointment.payment_status)) {
      return NextResponse.json({ error: 'No receipt available — payment not completed' }, { status: 400 });
    }

    const clinic = appointment.clinic as any;
    const service = appointment.service as any;
    const practitioner = appointment.practitioner as any;

    return NextResponse.json({
      receipt: {
        appointment_id: appointment.id,
        date: appointment.appointment_date,
        time: appointment.appointment_time,
        amount: appointment.payment_amount,
        payment_method: appointment.payment_method,
        payment_status: appointment.payment_status,
        paid_at: appointment.paid_at,
        refunded_at: appointment.refunded_at,
        patient: {
          name: `${patient?.first_name || ''} ${patient?.last_name || ''}`.trim(),
          email: patient?.email,
        },
        practitioner: {
          name: practitioner?.name,
          specialization: practitioner?.specialization,
        },
        service: {
          name: service?.name,
          price: service?.price,
        },
        clinic: {
          name: clinic?.name,
          address: clinic?.address,
          email: clinic?.email,
        },
      },
    });
  } catch (error) {
    console.error('Receipt error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
