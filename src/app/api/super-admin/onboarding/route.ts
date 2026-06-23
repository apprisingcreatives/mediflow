import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';
import { SuperAdminStatus } from '@/types/super-admin';

const STALE_DAYS = 7;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseWithAuth = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } },
  );

  const { data: requester } = await supabaseWithAuth
    .from('super_admins')
    .select('id, status')
    .eq('auth_user_id', user.id)
    .eq('status', SuperAdminStatus.ACTIVE)
    .single();

  if (!requester) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: clinicsData, error: clinicsError } = await supabaseAdmin
    .from('clinics')
    .select(`
      id, name, email, created_at, updated_at,
      clinic_admins(id, auth_user_id),
      clinic_services(id),
      practitioners(id, practitioner_working_hours(id)),
      patient_clinics(id)
    `)
    .order('created_at', { ascending: false });

  if (clinicsError) {
    return NextResponse.json({ error: clinicsError.message }, { status: 500 });
  }

  const now = new Date();
  const staleThreshold = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const clinics = (clinicsData || []).map((clinic: any) => {
    const hasAdmin = (clinic.clinic_admins || []).some((a: any) => a.auth_user_id !== null);
    const hasServices = (clinic.clinic_services || []).length > 0;
    const hasPractitioners = (clinic.practitioners || []).some(
      (p: any) => (p.practitioner_working_hours || []).length > 0,
    );
    const hasPatient = (clinic.patient_clinics || []).length > 0;

    const steps = {
      clinic_created: true,
      admin_set_up: hasAdmin,
      services_added: hasServices,
      practitioners_added: hasPractitioners,
      first_patient: hasPatient,
    };

    const completedSteps = Object.values(steps).filter(Boolean).length;
    const allComplete = completedSteps === 5;
    const isStale = new Date(clinic.updated_at) < staleThreshold;

    let status: string;
    if (allComplete) {
      status = 'completed';
    } else if (!allComplete && isStale) {
      status = 'stalled';
    } else if (hasServices || hasPractitioners || hasPatient) {
      status = 'in_progress';
    } else {
      status = 'pending';
    }

    return {
      clinic_id: clinic.id,
      clinic_name: clinic.name,
      clinic_email: clinic.email,
      registered_at: clinic.created_at,
      updated_at: clinic.updated_at,
      steps,
      completed_steps: completedSteps,
      total_steps: 5,
      status,
    };
  });

  return NextResponse.json({ clinics });
}
