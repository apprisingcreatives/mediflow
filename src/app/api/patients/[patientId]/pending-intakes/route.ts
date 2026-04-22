import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface RouteParams {
  params: Promise<{ patientId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { patientId } = await params;

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify the authenticated user owns this patient record
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('auth_user_id', user.id)
      .single();

    if (!patient) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('id, appointment_date, appointment_time, clinic_id, clinics(name)')
      .eq('patient_id', patientId)
      .eq('intake_status', 'pending')
      .gte('appointment_date', today)
      .order('appointment_date', { ascending: true });

    if (error) {
      console.error('Error fetching pending intakes:', error);
      return NextResponse.json({ error: 'Failed to fetch pending intakes' }, { status: 500 });
    }

    const intakes = (data || []).map((a: any) => ({
      id: a.id,
      appointment_date: a.appointment_date,
      appointment_time: a.appointment_time,
      clinic_name: a.clinics?.name || 'Clinic',
    }));

    return NextResponse.json({ intakes });
  } catch (error) {
    console.error('Pending intakes error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
