import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createCheckoutSession } from '@/lib/paymongo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'https://mediflow.apprisingcreatives.com';

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

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select(
        `*, patient:patients(id, auth_user_id, first_name, last_name, email),
         service:clinic_services(id, name, price),
         clinic:clinics(id, name, paymongo_merchant_id, paymongo_merchant_status)`,
      )
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json(
        { error: 'Appointment not found' },
        { status: 404 },
      );
    }

    if (appointment.patient?.auth_user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (appointment.payment_status === 'paid') {
      return NextResponse.json(
        { error: 'Appointment is already paid' },
        { status: 400 },
      );
    }

    const service = appointment.service as any;
    const clinic = appointment.clinic as any;
    const patient = appointment.patient as any;

    if (!service?.price) {
      return NextResponse.json(
        { error: 'Service price not available' },
        { status: 400 },
      );
    }

    if (!clinic?.paymongo_merchant_id || clinic?.paymongo_merchant_status !== 'activated') {
      return NextResponse.json(
        { error: "This clinic hasn't set up online payments yet. Please pay at the clinic." },
        { status: 400 },
      );
    }

    const amountInCentavos = Math.round(service.price * 100);

    const session = await createCheckoutSession({
      lineItems: [
        {
          name: service.name || 'Medical Service',
          amount: amountInCentavos,
          description: `Appointment at ${clinic?.name || 'clinic'} on ${appointment.appointment_date}`,
        },
      ],
      description: `Payment for appointment at ${clinic?.name || 'the clinic'}`,
      metadata: {
        type: 'appointment_payment',
        appointment_id: appointmentId,
        patient_id: patient.id,
        clinic_id: appointment.clinic_id || '',
      },
      successUrl: `${appUrl}/patient/appointments?payment=success&id=${appointmentId}`,
      cancelUrl: `${appUrl}/patient/appointments?payment=cancelled&id=${appointmentId}`,
      referenceNumber: `appt-${appointmentId}`,
      merchantId: clinic.paymongo_merchant_id,
    });

    await supabaseAdmin
      .from('appointments')
      .update({
        paymongo_checkout_id: session.id,
        payment_amount: service.price,
      })
      .eq('id', appointmentId);

    return NextResponse.json({
      checkout_url: session.checkoutUrl,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Appointment payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
