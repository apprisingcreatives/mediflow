import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function authenticateUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  return user;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify clinic admin or practitioner
  const { data: adminRecord } = await supabaseAdmin
    .from('clinic_admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  const { data: practitionerRecord } = await supabaseAdmin
    .from('practitioners')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (!adminRecord && !practitionerRecord) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'waiting';
  const practitionerId = url.searchParams.get('practitioner_id');

  let query = supabaseAdmin
    .from('appointment_waitlist')
    .select(
      `*, patient:patients(id, first_name, last_name, email, phone),
       practitioner:practitioners(id, name, specialization),
       service:clinic_services(id, name)`,
    )
    .eq('clinic_id', clinicId)
    .eq('status', status)
    .order('created_at', { ascending: true });

  if (practitionerId) {
    query = query.eq('practitioner_id', practitionerId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch waitlist' }, { status: 500 });
  }

  return NextResponse.json({ waitlist: data || [] });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const user = await authenticateUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const {
    patient_id,
    practitioner_id,
    service_id,
    preferred_date_start,
    preferred_date_end,
    preferred_time_start,
    preferred_time_end,
    notes,
  } = body;

  // Determine if patient self-add or clinic admin add
  let resolvedPatientId = patient_id;
  if (!resolvedPatientId) {
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('auth_user_id', user.id)
      .single();
    resolvedPatientId = patient?.id;
  } else {
    // Verify caller is clinic admin
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
  }

  if (!resolvedPatientId) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  if (!preferred_date_start || !preferred_date_end) {
    return NextResponse.json(
      { error: 'preferred_date_start and preferred_date_end are required' },
      { status: 400 },
    );
  }

  if (preferred_date_end < preferred_date_start) {
    return NextResponse.json(
      { error: 'End date must be after start date' },
      { status: 400 },
    );
  }

  // Check for duplicate active entry
  const { data: existing } = await supabaseAdmin
    .from('appointment_waitlist')
    .select('id')
    .eq('patient_id', resolvedPatientId)
    .eq('clinic_id', clinicId)
    .eq('status', 'waiting')
    .eq('practitioner_id', practitioner_id || null)
    .eq('service_id', service_id || null)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'Patient already has an active waitlist entry for this practitioner/service' },
      { status: 409 },
    );
  }

  const { data, error } = await supabaseAdmin
    .from('appointment_waitlist')
    .insert({
      patient_id: resolvedPatientId,
      clinic_id: clinicId,
      practitioner_id: practitioner_id || null,
      service_id: service_id || null,
      preferred_date_start,
      preferred_date_end,
      preferred_time_start: preferred_time_start || null,
      preferred_time_end: preferred_time_end || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to add to waitlist' }, { status: 500 });
  }

  return NextResponse.json({ waitlist_entry: data }, { status: 201 });
}
