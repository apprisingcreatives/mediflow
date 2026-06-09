import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { requirePlan } from '@/lib/plan-gating';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'analytics.view');
  if (!isAuthSuccess(auth)) return auth;

  const planCheck = await requirePlan(clinicId, 'professional');
  if (planCheck !== true) return planCheck;

  const url = new URL(request.url);
  const period = url.searchParams.get('period') || '90d';
  const days = parseInt(period) || 90;

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const { data: demographics, error } = await supabaseAdmin.rpc(
    'get_patient_demographics',
    { p_clinic_id: clinicId, p_start_date: startDate, p_end_date: endDate },
  );

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch demographics' }, { status: 500 });
  }

  const rows = demographics ?? [];

  const ageGroups: Record<string, number> = {};
  const genders: Record<string, number> = {};
  const cities: Record<string, number> = {};

  for (const row of rows) {
    ageGroups[row.age_group] = (ageGroups[row.age_group] ?? 0) + Number(row.patient_count);
    genders[row.gender] = (genders[row.gender] ?? 0) + Number(row.patient_count);
    cities[row.city] = (cities[row.city] ?? 0) + Number(row.patient_count);
  }

  return NextResponse.json({
    age_groups: Object.entries(ageGroups)
      .map(([group, count]) => ({ group, count }))
      .sort((a, b) => {
        const order = ['0-17', '18-30', '31-45', '46-60', '60+', 'Unknown'];
        return order.indexOf(a.group) - order.indexOf(b.group);
      }),
    genders: Object.entries(genders)
      .map(([gender, count]) => ({ gender, count }))
      .sort((a, b) => b.count - a.count),
    cities: Object.entries(cities)
      .map(([city, count]) => ({ city, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
  });
}
