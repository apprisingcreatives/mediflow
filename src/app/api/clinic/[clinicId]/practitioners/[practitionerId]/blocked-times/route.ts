import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

type RouteParams = { params: Promise<{ clinicId: string; practitionerId: string }> };

async function authenticateClinicUser(token: string, clinicId: string) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: admin } = await supabaseAdmin
    .from('clinic_admins')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (admin) return { userId: user.id, role: 'clinic_admin' as const };

  const { data: practitioner } = await supabaseAdmin
    .from('practitioners')
    .select('id')
    .eq('auth_user_id', user.id)
    .eq('clinic_id', clinicId)
    .single();

  if (practitioner) return { userId: user.id, role: 'practitioner' as const };

  return null;
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { clinicId, practitionerId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await authenticateClinicUser(authHeader.substring(7), clinicId);
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');

    let query = supabaseAdmin
      .from('practitioner_blocked_times')
      .select('*')
      .eq('practitioner_id', practitionerId)
      .order('block_date', { ascending: true });

    if (startDate) query = query.gte('block_date', startDate);
    if (endDate) query = query.lte('block_date', endDate);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blocked_times: data });
  } catch (error) {
    console.error('Get blocked times error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { clinicId, practitionerId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await authenticateClinicUser(authHeader.substring(7), clinicId);
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { block_date, start_time, end_time, reason } = body;

    if (!block_date) {
      return NextResponse.json({ error: 'block_date is required' }, { status: 400 });
    }

    const { data: practitioner } = await supabaseAdmin
      .from('practitioners')
      .select('id')
      .eq('id', practitionerId)
      .eq('clinic_id', clinicId)
      .single();

    if (!practitioner) {
      return NextResponse.json({ error: 'Practitioner not found in this clinic' }, { status: 404 });
    }

    const { data: existing } = await supabaseAdmin
      .from('appointments')
      .select('id, appointment_time')
      .eq('practitioner_id', practitionerId)
      .eq('appointment_date', block_date)
      .in('status', ['scheduled', 'confirmed']);

    let conflicting: string[] = [];
    if (existing && existing.length > 0) {
      if (!start_time || !end_time) {
        conflicting = existing.map((a) => a.appointment_time);
      } else {
        conflicting = existing
          .filter((a) => a.appointment_time >= start_time && a.appointment_time < end_time)
          .map((a) => a.appointment_time);
      }
    }

    const { data: blocked, error } = await supabaseAdmin
      .from('practitioner_blocked_times')
      .insert({
        practitioner_id: practitionerId,
        block_date,
        start_time: start_time || null,
        end_time: end_time || null,
        reason: reason || null,
        created_by: caller.userId,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      blocked_time: blocked,
      conflicting_appointments: conflicting.length > 0 ? conflicting : undefined,
    }, { status: 201 });
  } catch (error) {
    console.error('Create blocked time error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { clinicId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const caller = await authenticateClinicUser(authHeader.substring(7), clinicId);
    if (!caller) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const blockedTimeId = url.searchParams.get('id');

    if (!blockedTimeId) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('practitioner_blocked_times')
      .delete()
      .eq('id', blockedTimeId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete blocked time error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
