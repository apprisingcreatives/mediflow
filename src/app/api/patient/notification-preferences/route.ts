import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeToE164, isValidPHMobile } from '@/lib/phone';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function authenticatePatient(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(token);
  if (!user) return null;

  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();

  return patient ? { userId: user.id, patientId: patient.id } : null;
}

export async function GET(request: NextRequest) {
  const auth = await authenticatePatient(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data } = await supabaseAdmin
    .from('patient_notification_preferences')
    .select('*')
    .eq('patient_id', auth.patientId)
    .single();

  return NextResponse.json({ preferences: data || { sms_enabled: true, sms_opted_out: false, phone_e164: null } });
}

export async function PUT(request: NextRequest) {
  const auth = await authenticatePatient(request);
  if (!auth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { phone, sms_enabled } = body;

  const phoneE164 = phone ? normalizeToE164(phone) : null;

  if (phone && !phoneE164) {
    return NextResponse.json(
      { error: 'Invalid phone number format. Use 09XX or +639XX format.' },
      { status: 400 },
    );
  }

  if (phoneE164 && !isValidPHMobile(phoneE164)) {
    return NextResponse.json(
      { error: 'Only Philippine mobile numbers (+639XX) are supported.' },
      { status: 400 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('patient_notification_preferences')
    .upsert(
      {
        patient_id: auth.patientId,
        phone_e164: phoneE164,
        sms_enabled: sms_enabled ?? true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'patient_id' },
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to update preferences' }, { status: 500 });
  }

  return NextResponse.json({ preferences: data });
}
