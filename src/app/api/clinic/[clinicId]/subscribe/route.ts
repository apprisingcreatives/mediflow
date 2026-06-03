import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createCheckoutSession } from '@/lib/paymongo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const appUrl =
  process.env.NEXT_PUBLIC_APP_URL || 'https://mediflow.apprisingcreatives.com';

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

    const { plan, billing_cycle } = await request.json();

    if (!plan || !billing_cycle) {
      return NextResponse.json(
        { error: 'Missing plan or billing_cycle' },
        { status: 400 },
      );
    }

    const { data: planData } = await supabaseAdmin
      .from('subscription_plans')
      .select('name, price, slug')
      .eq('slug', plan)
      .eq('billing_cycle', billing_cycle)
      .eq('is_active', true)
      .single();

    if (!planData) {
      return NextResponse.json(
        { error: 'Invalid plan or billing cycle' },
        { status: 400 },
      );
    }

    const amountInCentavos = Math.round(planData.price * 100);

    const session = await createCheckoutSession({
      lineItems: [
        {
          name: `MediFlow ${planData.name} Plan`,
          amount: amountInCentavos,
          description: `${planData.name} — ${billing_cycle === 'yearly' ? 'Annual' : 'Monthly'} Subscription`,
        },
      ],
      description: `MediFlow ${planData.name} Plan Subscription`,
      metadata: {
        type: 'clinic_subscription',
        clinic_id: clinicId,
        plan_slug: plan,
        billing_cycle,
        amount: String(planData.price),
      },
      successUrl: `${appUrl}/clinic/${clinicId}/billing?payment=success`,
      cancelUrl: `${appUrl}/clinic/${clinicId}/billing?payment=cancelled`,
      referenceNumber: `sub-${clinicId}-${Date.now()}`,
    });

    await supabaseAdmin
      .from('clinics')
      .update({ paymongo_checkout_session_id: session.id })
      .eq('id', clinicId);

    return NextResponse.json({
      checkout_url: session.checkoutUrl,
      session_id: session.id,
    });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
