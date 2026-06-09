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
  const monthsAhead = Math.min(parseInt(url.searchParams.get('monthsAhead') ?? '3'), 12);

  const { data: forecast, error } = await supabaseAdmin.rpc(
    'get_revenue_forecast',
    { p_clinic_id: clinicId, p_months_ahead: monthsAhead },
  );

  if (error) {
    return NextResponse.json({ error: 'Failed to generate forecast' }, { status: 500 });
  }

  const rows = forecast ?? [];
  const historicalCount = rows.filter((r: Record<string, unknown>) => !r.is_forecast).length;

  return NextResponse.json({
    data: rows.map((r: Record<string, unknown>) => ({
      month: r.month_label,
      revenue: Number(r.revenue),
      isForecast: Boolean(r.is_forecast),
    })),
    hasEnoughData: historicalCount >= 2,
  });
}
