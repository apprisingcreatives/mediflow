// @ts-nocheck - Deno runtime
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const PAYMONGO_SECRET_KEY = Deno.env.get('PAYMONGO_SECRET_KEY');
const APP_URL = Deno.env.get('APP_URL') || 'https://mediflow.apprisingcreatives.com';
const GRACE_PERIOD_DAYS = 7;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

async function getClinicOwner(clinicId: string) {
  const { data } = await supabase
    .from('clinic_admins')
    .select('auth_user_id, email, name')
    .eq('clinic_id', clinicId)
    .eq('staff_role', 'owner')
    .eq('is_active', true)
    .limit(1)
    .single();
  return data;
}

async function queueEmail(
  clinicId: string,
  recipientEmail: string,
  recipientName: string,
  subject: string,
  body: string,
  htmlBody: string,
  notificationType: string,
) {
  await supabase.from('email_notifications').insert({
    recipient_email: recipientEmail,
    recipient_name: recipientName,
    recipient_type: 'clinic',
    subject,
    body,
    html_body: htmlBody,
    notification_type: notificationType,
    related_entity_type: 'clinic',
    related_entity_id: clinicId,
    status: 'pending',
  });
}

async function createInAppNotification(
  recipientId: string,
  clinicId: string,
  title: string,
  message: string,
  type: string,
) {
  await supabase.from('notifications').insert({
    recipient_id: recipientId,
    recipient_type: 'clinic_admin',
    clinic_id: clinicId,
    type,
    title,
    message,
    action_url: `/clinic/${clinicId}/billing`,
    metadata: {},
  });
}

async function createPayMongoCheckout(
  clinicId: string,
  planSlug: string,
  billingCycle: string,
  price: number,
  planName: string,
): Promise<string | null> {
  if (!PAYMONGO_SECRET_KEY) {
    console.error('PAYMONGO_SECRET_KEY not set — skipping checkout creation');
    return null;
  }

  const amountInCentavos = Math.round(price * 100);
  const cycleLabel = billingCycle === 'yearly' ? 'Annual' : 'Monthly';

  try {
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${PAYMONGO_SECRET_KEY}:`)}`,
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [{
              name: `MediFlow ${planName} Plan`,
              amount: amountInCentavos,
              currency: 'PHP',
              quantity: 1,
              description: `${planName} — ${cycleLabel} Subscription Renewal`,
            }],
            description: `MediFlow ${planName} Plan Renewal`,
            metadata: {
              type: 'clinic_subscription',
              clinic_id: clinicId,
              plan_slug: planSlug,
              billing_cycle: billingCycle,
              amount: String(price),
            },
            success_url: `${APP_URL}/clinic/${clinicId}/billing?payment=success`,
            cancel_url: `${APP_URL}/clinic/${clinicId}/billing?payment=cancelled`,
            payment_method_types: ['card', 'gcash', 'grab_pay', 'paymaya'],
            reference_number: `renewal-${clinicId}-${Date.now()}`,
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
          },
        },
      }),
    });

    const json = await response.json();
    const session = json?.data;
    return session?.attributes?.checkout_url || session?.attributes?.url || null;
  } catch (err) {
    console.error(`Failed to create checkout for clinic ${clinicId}:`, err);
    return null;
  }
}

async function phaseTrialExpiry() {
  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, subscription_plan')
    .eq('is_trial_active', true)
    .lte('trial_end_date', new Date().toISOString());

  if (!clinics?.length) return;
  console.log(`Phase A: ${clinics.length} trial(s) to expire`);

  for (const clinic of clinics) {
    await supabase
      .from('clinics')
      .update({
        is_trial_active: false,
        is_subscription_active: false,
        payment_status: 'expired',
      })
      .eq('id', clinic.id);

    const owner = await getClinicOwner(clinic.id);
    if (owner) {
      await queueEmail(
        clinic.id,
        owner.email,
        owner.name,
        'Your MediFlow trial has ended',
        `Dear ${owner.name}, your 14-day free trial for ${clinic.name} has ended. Subscribe now to continue managing your clinic.`,
        `<h1>Trial Ended</h1><p>Dear ${owner.name},</p><p>Your 14-day free trial for <strong>${clinic.name}</strong> has ended.</p><p>Your clinic is now in read-only mode. <a href="${APP_URL}/clinic/${clinic.id}/billing">Subscribe now</a> to restore full access.</p>`,
        'trial_expired',
      );

      await createInAppNotification(
        owner.auth_user_id,
        clinic.id,
        'Trial Ended',
        'Your free trial has ended. Subscribe to continue.',
        'trial.expiring',
      );
    }
  }
}

async function phaseTrialEndingSoon() {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, trial_end_date, last_reminder_sent_at')
    .eq('is_trial_active', true)
    .gt('trial_end_date', now.toISOString())
    .lte('trial_end_date', threeDaysLater.toISOString());

  if (!clinics?.length) return;
  console.log(`Phase B: ${clinics.length} trial(s) ending soon`);

  for (const clinic of clinics) {
    if (clinic.last_reminder_sent_at && new Date(clinic.last_reminder_sent_at) > oneDayAgo) continue;

    const daysLeft = daysBetween(now, new Date(clinic.trial_end_date));
    const owner = await getClinicOwner(clinic.id);

    if (owner) {
      await queueEmail(
        clinic.id,
        owner.email,
        owner.name,
        `Your MediFlow trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        `Dear ${owner.name}, your free trial for ${clinic.name} ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Subscribe now to avoid losing access.`,
        `<h1>Trial Ending Soon</h1><p>Dear ${owner.name},</p><p>Your free trial for <strong>${clinic.name}</strong> ends in <strong>${daysLeft} day${daysLeft === 1 ? '' : 's'}</strong>.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Subscribe now</a> to keep your clinic running.</p>`,
        'trial_ending',
      );

      await createInAppNotification(
        owner.auth_user_id,
        clinic.id,
        'Trial Ending Soon',
        `Your free trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}. Subscribe now.`,
        'trial.expiring',
      );
    }

    await supabase
      .from('clinics')
      .update({ last_reminder_sent_at: now.toISOString() })
      .eq('id', clinic.id);
  }
}

async function phaseRenewalReminder() {
  const now = new Date();
  const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, subscription_plan, next_billing_date, last_reminder_sent_at')
    .eq('payment_status', 'active')
    .gt('next_billing_date', now.toISOString())
    .lte('next_billing_date', threeDaysLater.toISOString());

  if (!clinics?.length) return;
  console.log(`Phase C: ${clinics.length} renewal reminder(s) to send`);

  for (const clinic of clinics) {
    if (clinic.last_reminder_sent_at && new Date(clinic.last_reminder_sent_at) > oneDayAgo) continue;

    const planSlug = clinic.subscription_plan || 'starter';
    const billingCycle = planSlug.endsWith('-yearly') ? 'yearly' : 'monthly';

    const { data: plan } = await supabase
      .from('subscription_plans')
      .select('name, price')
      .eq('slug', planSlug)
      .eq('is_active', true)
      .single();

    if (!plan) continue;

    const checkoutUrl = await createPayMongoCheckout(
      clinic.id, planSlug, billingCycle, plan.price, plan.name,
    );

    if (checkoutUrl) {
      await supabase
        .from('clinics')
        .update({ pending_checkout_session_id: checkoutUrl })
        .eq('id', clinic.id);
    }

    const owner = await getClinicOwner(clinic.id);
    if (owner) {
      const payLink = checkoutUrl || `${APP_URL}/clinic/${clinic.id}/billing`;
      await queueEmail(
        clinic.id,
        owner.email,
        owner.name,
        'Your MediFlow subscription renews soon',
        `Dear ${owner.name}, your ${plan.name} plan for ${clinic.name} renews in 3 days (₱${plan.price.toLocaleString()}). Pay now to avoid interruption: ${payLink}`,
        `<h1>Subscription Renewal</h1><p>Dear ${owner.name},</p><p>Your <strong>${plan.name}</strong> plan for <strong>${clinic.name}</strong> renews in 3 days.</p><p>Amount: <strong>₱${plan.price.toLocaleString()}</strong></p><p><a href="${payLink}">Pay now</a> to avoid any interruption to your service.</p>`,
        'renewal_reminder',
      );

      await createInAppNotification(
        owner.auth_user_id,
        clinic.id,
        'Subscription Renewal Due',
        `Your ${plan.name} plan renews in 3 days (₱${plan.price.toLocaleString()}).`,
        'payment.status_changed',
      );
    }

    await supabase
      .from('clinics')
      .update({ last_reminder_sent_at: now.toISOString(), reminder_count: 0 })
      .eq('id', clinic.id);
  }
}

async function phaseGracePeriod() {
  const now = new Date();

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, subscription_plan, next_billing_date, reminder_count, payment_status')
    .or(`payment_status.eq.past_due,and(payment_status.eq.active,next_billing_date.lt.${now.toISOString()})`);

  if (!clinics?.length) return;
  console.log(`Phase D: ${clinics.length} clinic(s) in grace period`);

  for (const clinic of clinics) {
    if (!clinic.next_billing_date) continue;

    const overdueDays = daysBetween(new Date(clinic.next_billing_date), now);
    const owner = await getClinicOwner(clinic.id);

    if (overdueDays >= GRACE_PERIOD_DAYS) {
      await supabase
        .from('clinics')
        .update({
          payment_status: 'expired',
          is_subscription_active: false,
        })
        .eq('id', clinic.id);

      if (owner) {
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          'Your MediFlow subscription has been suspended',
          `Dear ${owner.name}, your subscription for ${clinic.name} has been suspended due to non-payment. Your clinic is now in read-only mode.`,
          `<h1>Subscription Suspended</h1><p>Dear ${owner.name},</p><p>Your subscription for <strong>${clinic.name}</strong> has been suspended due to non-payment.</p><p>Your clinic is now in read-only mode. <a href="${APP_URL}/clinic/${clinic.id}/billing">Renew now</a> to restore access.</p>`,
          'subscription_expired',
        );

        await createInAppNotification(
          owner.auth_user_id,
          clinic.id,
          'Subscription Suspended',
          'Your subscription has been suspended. Renew to restore access.',
          'payment.status_changed',
        );
      }
      continue;
    }

    if (clinic.payment_status === 'active') {
      await supabase
        .from('clinics')
        .update({ payment_status: 'past_due', reminder_count: 1 })
        .eq('id', clinic.id);

      if (owner) {
        const daysRemaining = GRACE_PERIOD_DAYS - overdueDays;
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          'Action required: MediFlow payment overdue',
          `Dear ${owner.name}, your payment for ${clinic.name} is overdue. You have ${daysRemaining} days to pay before your clinic is suspended.`,
          `<h1>Payment Overdue</h1><p>Dear ${owner.name},</p><p>Your payment for <strong>${clinic.name}</strong> is overdue.</p><p>You have <strong>${daysRemaining} days</strong> to pay before your clinic is suspended.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Pay now</a></p>`,
          'payment_overdue',
        );

        await createInAppNotification(
          owner.auth_user_id,
          clinic.id,
          'Payment Overdue',
          `Your payment is overdue. ${daysRemaining} days remaining before suspension.`,
          'payment.status_changed',
        );
      }
      continue;
    }

    if (overdueDays >= 4 && (clinic.reminder_count ?? 0) < 2) {
      const daysRemaining = GRACE_PERIOD_DAYS - overdueDays;
      if (owner) {
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          `Urgent: MediFlow payment overdue — ${daysRemaining} days remaining`,
          `Dear ${owner.name}, your payment for ${clinic.name} is ${overdueDays} days overdue. You have ${daysRemaining} days before your clinic is suspended.`,
          `<h1>Urgent: Payment Overdue</h1><p>Dear ${owner.name},</p><p>Your payment for <strong>${clinic.name}</strong> is <strong>${overdueDays} days overdue</strong>.</p><p><strong>${daysRemaining} days remaining</strong> before your clinic is suspended.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Pay now</a></p>`,
          'payment_warning',
        );
      }
      await supabase
        .from('clinics')
        .update({ reminder_count: 2, last_reminder_sent_at: now.toISOString() })
        .eq('id', clinic.id);
    } else if (overdueDays >= 6 && (clinic.reminder_count ?? 0) < 3) {
      if (owner) {
        await queueEmail(
          clinic.id,
          owner.email,
          owner.name,
          'Final warning: MediFlow payment overdue — 1 day remaining',
          `Dear ${owner.name}, FINAL WARNING: your payment for ${clinic.name} is ${overdueDays} days overdue. Your clinic will be suspended tomorrow.`,
          `<h1>Final Warning</h1><p>Dear ${owner.name},</p><p><strong>FINAL WARNING:</strong> Your payment for <strong>${clinic.name}</strong> is <strong>${overdueDays} days overdue</strong>.</p><p>Your clinic will be <strong>suspended tomorrow</strong> if payment is not received.</p><p><a href="${APP_URL}/clinic/${clinic.id}/billing">Pay now</a></p>`,
          'payment_warning',
        );
      }
      await supabase
        .from('clinics')
        .update({ reminder_count: 3, last_reminder_sent_at: now.toISOString() })
        .eq('id', clinic.id);
    }
  }
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ') || authHeader.substring(7) !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Billing lifecycle run starting...');

    await phaseTrialExpiry();
    await phaseTrialEndingSoon();
    await phaseRenewalReminder();
    await phaseGracePeriod();

    console.log('Billing lifecycle run complete.');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Billing lifecycle error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
