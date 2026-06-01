import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function PATCH(
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

    const { paymongo_merchant_id } = await request.json();

    if (paymongo_merchant_id === null) {
      const { error: updateError } = await supabaseAdmin
        .from('clinics')
        .update({
          paymongo_merchant_id: null,
          paymongo_merchant_status: 'pending',
        })
        .eq('id', clinicId);

      if (updateError) throw updateError;

      return NextResponse.json({ connected: false });
    }

    if (
      typeof paymongo_merchant_id !== 'string' ||
      !paymongo_merchant_id.startsWith('org_') ||
      paymongo_merchant_id.length < 8
    ) {
      return NextResponse.json(
        { error: 'Invalid PayMongo merchant ID. Must start with "org_" and be at least 8 characters.' },
        { status: 400 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from('clinics')
      .update({
        paymongo_merchant_id: paymongo_merchant_id,
        paymongo_merchant_status: 'activated',
      })
      .eq('id', clinicId);

    if (updateError) throw updateError;

    return NextResponse.json({
      connected: true,
      paymongo_merchant_id,
    });
  } catch (error) {
    console.error('PayMongo connection error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
