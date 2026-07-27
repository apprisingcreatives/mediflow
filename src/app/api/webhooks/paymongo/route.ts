import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { verifyWebhookSignature } from '@/lib/paymongo';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const signature = request.headers.get('paymongo-signature');
    if (!signature || !verifyWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    const event = body?.data?.attributes;

    if (!event?.type) {
      return NextResponse.json({ error: 'Invalid event' }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout_session.payment.paid':
        await handleCheckoutPaid(event.data);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event.data);
        break;
      default:
        console.log(`Unhandled PayMongo event: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayMongo webhook error:', error);
    return NextResponse.json({ received: true });
  }
}

async function handleCheckoutPaid(data: any) {
  const attrs = data?.attributes || {};
  const metadata = attrs.metadata || {};

  if (metadata.type === 'clinic_subscription') {
    await activateClinicSubscription(metadata, data.id);
  } else if (metadata.type === 'appointment_payment') {
    await confirmAppointmentPayment(metadata, attrs);
  }
}

async function activateClinicSubscription(
  metadata: Record<string, string>,
  checkoutSessionId: string,
) {
  const { clinic_id, plan_slug, billing_cycle, amount } = metadata;
  if (!clinic_id || !plan_slug) return;

  const nextBillingDate = new Date();
  if (billing_cycle === 'yearly') {
    nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
  } else {
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  }

  await supabaseAdmin
    .from('clinics')
    .update({
      subscription_plan: plan_slug,
      is_trial_active: false,
      is_subscription_active: true,
      payment_status: 'active',
      last_payment_date: new Date().toISOString(),
      next_billing_date: nextBillingDate.toISOString(),
      paymongo_checkout_session_id: checkoutSessionId,
      pending_checkout_session_id: null,
      reminder_count: 0,
      last_reminder_sent_at: null,
    })
    .eq('id', clinic_id);

  const parsedAmount = parseFloat(amount) || 0;
  const planLabel = plan_slug.charAt(0).toUpperCase() + plan_slug.slice(1);
  const cycleLabel = billing_cycle === 'yearly' ? 'Annual' : 'Monthly';

  await supabaseAdmin.from('clinic_payments').insert({
    clinic_id,
    amount: parsedAmount,
    currency: 'PHP',
    payment_method: 'paymongo',
    status: 'paid',
    paymongo_checkout_id: checkoutSessionId,
    description: `${planLabel} Plan - ${cycleLabel} Subscription`,
    paid_at: new Date().toISOString(),
  });

  const { data: admin } = await supabaseAdmin
    .from('clinic_admins')
    .select('email, name')
    .eq('clinic_id', clinic_id)
    .eq('is_active', true)
    .limit(1)
    .single();

  if (admin) {
    await supabaseAdmin.from('email_notifications').insert({
      recipient_email: admin.email,
      recipient_name: admin.name,
      recipient_type: 'clinic',
      subject: 'Payment Successful - MediFlow Subscription Active',
      body: `Dear ${admin.name}, Your payment of ₱${parsedAmount.toLocaleString()} for the ${planLabel} plan has been processed successfully.`,
      html_body: `<h1>Payment Successful</h1><p>Dear ${admin.name},</p><p>Your payment of <strong>₱${parsedAmount.toLocaleString()}</strong> for the <strong>${planLabel}</strong> plan has been processed.</p><p>Your subscription is now active.</p>`,
      notification_type: 'payment_success',
      related_entity_type: 'clinic',
      related_entity_id: clinic_id,
      status: 'pending',
    });
  }
}

async function confirmAppointmentPayment(
  metadata: Record<string, string>,
  attrs: any,
) {
  const { appointment_id, patient_id, clinic_id } = metadata;
  if (!appointment_id) return;

  const payments = attrs.payments || [];
  const paidPayment = payments.find(
    (p: any) => p.attributes?.status === 'paid',
  );
  const paymentSource = paidPayment?.attributes?.source;

  let paymentMethod = 'card';
  if (paymentSource?.type === 'gcash') paymentMethod = 'gcash';
  else if (paymentSource?.type === 'grab_pay') paymentMethod = 'grab_pay';
  else if (paymentSource?.type === 'paymaya') paymentMethod = 'paymaya';

  await supabaseAdmin
    .from('appointments')
    .update({
      payment_status: 'paid',
      payment_method: paymentMethod,
      paymongo_checkout_id: attrs.id || null,
      paid_at: new Date().toISOString(),
      status: 'confirmed',
    })
    .eq('id', appointment_id);

  if (patient_id && clinic_id) {
    await supabaseAdmin.from('activity_logs').insert({
      patient_id,
      clinic_id,
      actor_id: null,
      actor_role: 'system',
      action_type: 'appointment_payment_received',
      entity_type: 'appointment',
      entity_id: appointment_id,
      metadata: { payment_method: paymentMethod, source: 'paymongo' },
    });
  }

  // Send email receipt to patient
  try {
    const { data: appt } = await supabaseAdmin
      .from('appointments')
      .select('appointment_date, appointment_time, payment_amount, patient:patients(first_name, last_name, email), clinic:clinics(name), service:clinic_services(name)')
      .eq('id', appointment_id)
      .single();

    if (appt) {
      const patient = appt.patient as any;
      const clinic = appt.clinic as any;
      const service = appt.service as any;
      const amount = appt.payment_amount || 0;

      if (patient?.email) {
        await supabaseAdmin.from('email_notifications').insert({
          recipient_email: patient.email,
          recipient_name: `${patient.first_name} ${patient.last_name}`,
          recipient_type: 'patient',
          subject: `Payment Receipt - ${clinic?.name || 'MediFlow'}`,
          body: `Hi ${patient.first_name}, your payment of ₱${amount.toLocaleString()} for ${service?.name || 'your appointment'} at ${clinic?.name || 'the clinic'} on ${appt.appointment_date} has been confirmed.`,
          html_body: `<h1>Payment Confirmed</h1><p>Hi ${patient.first_name},</p><p>Your payment of <strong>₱${amount.toLocaleString()}</strong> for <strong>${service?.name || 'your appointment'}</strong> at <strong>${clinic?.name || 'the clinic'}</strong> on ${appt.appointment_date} at ${appt.appointment_time} has been confirmed.</p><p>Thank you for using MediFlow.</p>`,
          notification_type: 'payment_receipt',
          related_entity_type: 'appointment',
          related_entity_id: appointment_id,
          status: 'pending',
        });
      }
    }
  } catch (err) {
    console.error('Failed to queue payment receipt email:', err);
  }
}

async function handlePaymentFailed(data: any) {
  const attrs = data?.attributes || {};
  const metadata = attrs.metadata || {};

  if (metadata.type === 'appointment_payment' && metadata.appointment_id) {
    await supabaseAdmin
      .from('appointments')
      .update({ payment_status: 'pending' })
      .eq('id', metadata.appointment_id);
  }

  if (metadata.type === 'clinic_subscription' && metadata.clinic_id) {
    await supabaseAdmin
      .from('clinics')
      .update({ payment_status: 'past_due' })
      .eq('id', metadata.clinic_id);
  }
}
