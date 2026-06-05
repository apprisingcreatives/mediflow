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

  const {
    data: { user },
  } = await supabase.auth.getUser(token);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Verify clinic admin
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

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '30d';
  const days = parseInt(period) || 30;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];

  // Fetch all appointments in the period
  const { data: appointments } = await supabaseAdmin
    .from('appointments')
    .select('id, appointment_date, appointment_time, status, service_id')
    .eq('clinic_id', clinicId)
    .gte('appointment_date', startDateStr);

  if (!appointments || appointments.length === 0) {
    return NextResponse.json({
      no_show_rate: 0,
      no_show_count: 0,
      total_appointments: 0,
      revenue_lost: 0,
      confirmation_rate: 0,
      peak_hours: [],
      trends: { dates: [], no_show_rates: [], appointment_counts: [] },
    });
  }

  // Get service prices for revenue calculation
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

  // Calculate metrics
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

  // Peak hours (appointment_time is HH:MM:SS, convert to hour)
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

  // Daily trends
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

  return NextResponse.json({
    no_show_rate: noShowRate,
    no_show_count: noShows.length,
    total_appointments: total,
    revenue_lost: revenueLost,
    confirmation_rate: confirmationRate,
    peak_hours: peakHours,
    trends,
  });
}
