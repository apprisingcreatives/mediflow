import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.substring(7);
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Dual-access: clinic admin OR practitioner
  let callerRole: 'clinic_admin' | 'practitioner' | null = null;
  let callerPractitionerId: string | null = null;

  const { data: adminRecord } = await supabaseAdmin
    .from('clinic_admins')
    .select('id, staff_role')
    .eq('auth_user_id', user.id)
    .eq('clinic_id', clinicId)
    .eq('is_active', true)
    .single();

  if (adminRecord) {
    callerRole = 'clinic_admin';
  } else {
    const { data: practRecord } = await supabaseAdmin
      .from('practitioners')
      .select('id')
      .eq('auth_user_id', user.id)
      .eq('clinic_id', clinicId)
      .single();

    if (practRecord) {
      callerRole = 'practitioner';
      callerPractitionerId = practRecord.id;
    }
  }

  if (!callerRole) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '30d';
  const days = parseInt(period) || 30;
  const branchId = url.searchParams.get('branch_id');
  const practitionerIdParam = callerRole === 'practitioner'
    ? callerPractitionerId
    : url.searchParams.get('practitionerId') || null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = new Date().toISOString().split('T')[0];

  let appointmentQuery = supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, service_id')
    .eq('clinic_id', clinicId)
    .gte('appointment_date', startDateStr);

  if (branchId) {
    appointmentQuery = appointmentQuery.eq('branch_id', branchId);
  }

  const { data: appointments } = await appointmentQuery;

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({
      no_show_rate: 0,
      no_show_count: 0,
      total_appointments: 0,
      revenue_lost: 0,
      confirmation_rate: 0,
      peak_hours: [],
      trends: { dates: [], no_show_rates: [], appointment_counts: [] },
      practitioner_metrics: [],
      patient_return_rate: 0,
      total_revenue: 0,
    });
  }

  const serviceIds = [...new Set(appointments.filter(a => a.service_id).map(a => a.service_id))];
  const servicePrices: Record<string, number> = {};
  if (serviceIds.length > 0) {
    const { data: services } = await supabaseAdmin
      .from('clinic_services')
      .select('id, price')
      .in('id', serviceIds);
    services?.forEach(s => {
      servicePrices[s.id] = s.price || 0;
    });
  }

  const total = appointments.length;
  const noShows = appointments.filter(a => a.status === 'no-show');
  const confirmed = appointments.filter(a => a.status === 'confirmed' || a.status === 'completed');
  const nonCancelled = appointments.filter(a => a.status !== 'cancelled');

  const noShowRate = total > 0 ? Math.round((noShows.length / total) * 1000) / 10 : 0;
  const confirmationRate =
    nonCancelled.length > 0
      ? Math.round((confirmed.length / nonCancelled.length) * 1000) / 10
      : 0;

  const revenueLost = noShows.reduce((sum, a) => {
    return sum + (a.service_id ? servicePrices[a.service_id] || 0 : 0);
  }, 0);

  const hourCounts: Record<number, number> = {};
  appointments
    .filter(a => a.status !== 'cancelled')
    .forEach(a => {
      if (a.appointment_time) {
        const hour = parseInt(a.appointment_time.split(':')[0]);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });
  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => a.hour - b.hour);

  const dailyData: Record<string, { total: number; noShows: number }> = {};
  appointments.forEach(a => {
    const date = a.appointment_date;
    if (!dailyData[date]) dailyData[date] = { total: 0, noShows: 0 };
    dailyData[date].total++;
    if (a.status === 'no-show') dailyData[date].noShows++;
  });

  const sortedDates = Object.keys(dailyData).sort();
  const trends = {
    dates: sortedDates,
    no_show_rates: sortedDates.map(d =>
      dailyData[d].total > 0
        ? Math.round((dailyData[d].noShows / dailyData[d].total) * 1000) / 10
        : 0,
    ),
    appointment_counts: sortedDates.map(d => dailyData[d].total),
  };

  const { data: practitionerMetrics } = await supabaseAdmin.rpc('get_practitioner_metrics', {
    p_clinic_id: clinicId,
    p_start_date: startDateStr,
    p_end_date: endDateStr,
    p_practitioner_id: practitionerIdParam || null,
  });

  const { data: patientReturnRate } = await supabaseAdmin.rpc('get_patient_return_rate', {
    p_clinic_id: clinicId,
    p_start_date: startDateStr,
    p_end_date: endDateStr,
  });

  const { data: totalRevenue } = await supabaseAdmin.rpc('get_clinic_revenue', {
    p_clinic_id: clinicId,
    p_start_date: startDateStr,
    p_end_date: endDateStr,
  });

  return NextResponse.json({
    no_show_rate: noShowRate,
    no_show_count: noShows.length,
    total_appointments: total,
    revenue_lost: revenueLost,
    confirmation_rate: confirmationRate,
    peak_hours: peakHours,
    trends,
    practitioner_metrics: (practitionerMetrics || []).map((m: any) => ({
      practitioner_id: m.practitioner_id,
      practitioner_name: m.practitioner_name,
      appointment_count: Number(m.appointment_count),
      completed_count: Number(m.completed_count),
      cancelled_count: Number(m.cancelled_count),
      no_show_count: Number(m.no_show_count),
      cancellation_rate: Number(m.cancellation_rate),
      revenue: Number(m.revenue),
      utilization_rate: Number(m.utilization_rate),
    })),
    patient_return_rate: Number(patientReturnRate || 0),
    total_revenue: Number(totalRevenue || 0),
  });
}
