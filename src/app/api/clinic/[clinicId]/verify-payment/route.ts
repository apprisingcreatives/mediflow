import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { retrieveCheckoutSession } from '@/lib/paymongo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  try {
    const { clinicId } = await params;

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

    const { data: adminRecord } = await supabaseAdmin
      .from('clinic_admins')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', clinicId)
      .eq('is_active', true)
      .single();

    if (!adminRecord) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: clinic } = await supabaseAdmin
      .from('clinics')
      .select('paymongo_checkout_session_id, payment_status, subscription_plan')
      .eq('id', clinicId)
      .single();

    if (!clinic?.paymongo_checkout_session_id) {
      return NextResponse.json({ error: 'No checkout session found' }, { status: 404 });
    }

    const session = await retrieveCheckoutSession(clinic.paymongo_checkout_session_id);

    if (session.status !== 'active' && session.status !== 'paid') {
      return NextResponse.json({
        status: 'pending',
        checkout_status: session.status,
      });
    }

    const metadata = session.metadata || {};
    const { plan_slug, billing_cycle, amount } = metadata;

    if (!plan_slug) {
      return NextResponse.json({ error: 'Missing plan metadata' }, { status: 400 });
    }

    // Already on this plan with active payment — no work to do
    if (clinic.payment_status === 'active' && clinic.subscription_plan === plan_slug) {
      return NextResponse.json({ status: 'already_active' });
    }

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
      })
      .eq('id', clinicId);

    const parsedAmount = parseFloat(amount) || 0;
    const planLabel = plan_slug.charAt(0).toUpperCase() + plan_slug.slice(1);
    const cycleLabel = billing_cycle === 'yearly' ? 'Annual' : 'Monthly';

    await supabaseAdmin.from('clinic_payments').insert({
      clinic_id: clinicId,
      amount: parsedAmount,
      currency: 'PHP',
      payment_method: 'paymongo',
      status: 'paid',
      paymongo_checkout_id: clinic.paymongo_checkout_session_id,
      description: `${planLabel} Plan - ${cycleLabel} Subscription`,
      paid_at: new Date().toISOString(),
    });

    return NextResponse.json({
      status: 'activated',
      plan: plan_slug,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
