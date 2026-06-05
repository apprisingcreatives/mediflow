import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { retrieveCheckoutSession, createRefund } from '@/lib/paymongo';

const cronSecret = process.env.CRON_SECRET;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  const { appointmentId } = await params;

  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.substring(7);
    if (token !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: appointment } = await supabaseAdmin
      .from('appointments')
      .select('id, payment_status, payment_amount, paymongo_checkout_id, refund_attempts, clinic:clinics(paymongo_merchant_id)')
      .eq('id', appointmentId)
      .single();

    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    if (appointment.payment_status !== 'refund_pending') {
      return NextResponse.json({ error: 'Appointment is not pending refund' }, { status: 400 });
    }

    if (!appointment.paymongo_checkout_id) {
      return NextResponse.json({ error: 'No checkout session to refund' }, { status: 400 });
    }

    const session = await retrieveCheckoutSession(appointment.paymongo_checkout_id);
    const paidPayment = session.payments.find((p) => p.status === 'paid');

    if (!paidPayment) {
      return NextResponse.json({ error: 'No paid payment found for this checkout' }, { status: 400 });
    }

    const amountInCentavos = Math.round((appointment.payment_amount || 0) * 100);
    const clinic = appointment.clinic as any;

    const refund = await createRefund({
      paymentId: paidPayment.id,
      amount: amountInCentavos,
      reason: 'requested_by_customer',
      merchantId: clinic?.paymongo_merchant_id || undefined,
    });

    await supabaseAdmin
      .from('appointments')
      .update({
        payment_status: 'refunded',
        refunded_at: new Date().toISOString(),
      })
      .eq('id', appointmentId);

    await supabaseAdmin.from('activity_logs').insert({
      clinic_id: session.metadata.clinic_id || null,
      patient_id: session.metadata.patient_id || null,
      actor_role: 'system',
      action_type: 'appointment_refund_processed',
      entity_type: 'appointment',
      entity_id: appointmentId,
      metadata: { refund_id: refund.id, amount: appointment.payment_amount },
    });

    return NextResponse.json({ refund_id: refund.id, status: refund.status });
  } catch (error) {
    console.error('Refund error:', error);

    const { data: current } = await supabaseAdmin
      .from('appointments')
      .select('refund_attempts')
      .eq('id', appointmentId)
      .single();

    const attempts = (current?.refund_attempts || 0) + 1;
    await supabaseAdmin
      .from('appointments')
      .update({
        refund_attempts: attempts,
        payment_status: attempts >= 3 ? 'refund_failed' : 'refund_pending',
      })
      .eq('id', appointmentId);

    return NextResponse.json({ error: 'Refund failed' }, { status: 500 });
  }
}
