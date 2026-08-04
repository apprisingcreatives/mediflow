import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string; waitlistId: string }> },
) {
  const { clinicId, waitlistId } = await params;
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
  } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the waitlist entry
  const { data: entry } = await supabaseAdmin
    .from('appointment_waitlist')
    .select('id, patient_id, clinic_id, status')
    .eq('id', waitlistId)
    .eq('clinic_id', clinicId)
    .single();

  if (!entry) {
    return NextResponse.json({ error: 'Waitlist entry not found' }, { status: 404 });
  }

  if (entry.status !== 'waiting') {
    return NextResponse.json(
      { error: 'Can only cancel entries with waiting status' },
      { status: 400 },
    );
  }

  // Check if patient owns entry or is clinic admin
  const { data: patient } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  const isOwner = patient?.id === entry.patient_id;

  const { data: adminRecord } = await supabaseAdmin
    .from('clinic_admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (!isOwner && !adminRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('appointment_waitlist')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', waitlistId);

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel waitlist entry' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
