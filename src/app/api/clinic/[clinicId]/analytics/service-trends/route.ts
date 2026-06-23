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
  const branchId = url.searchParams.get('branch_id');

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  const rpcParams: Record<string, unknown> = {
    p_clinic_id: clinicId,
    p_start_date: startDate,
    p_end_date: endDate,
  };
  if (branchId) rpcParams.p_branch_id = branchId;

  const { data: services, error } = await supabaseAdmin.rpc(
    'get_service_popularity',
    rpcParams,
  );

  if (error) {
    console.error('Service trends RPC error:', error.message);
    return NextResponse.json({ error: error.message || 'Failed to fetch service trends' }, { status: 500 });
  }

  return NextResponse.json({
    services: (services ?? []).map((s: Record<string, unknown>) => ({
      service_id: s.service_id,
      service_name: s.service_name,
      booking_count: Number(s.booking_count),
      completed_count: Number(s.completed_count),
      completion_rate: Number(s.completion_rate),
      revenue: Number(s.revenue),
    })),
  });
}
