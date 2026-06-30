import { NextRequest, NextResponse } from 'next/server';
import { authenticateClinicRequest, isAuthSuccess } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clinicId: string }> },
) {
  const { clinicId } = await params;
  const auth = await authenticateClinicRequest(request, clinicId, 'staff.manage');
  if (!isAuthSuccess(auth)) return auth;

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') ?? '1');
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100);
  const actorId = url.searchParams.get('actorId');
  const action = url.searchParams.get('action');
  const entityType = url.searchParams.get('entityType');
  const startDate = url.searchParams.get('startDate');
  const endDate = url.searchParams.get('endDate');

  let query = supabaseAdmin
    .from('staff_audit_logs')
    .select('*', { count: 'exact' })
    .eq('clinic_id', clinicId)
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (actorId) query = query.eq('actor_id', actorId);
  if (action) query = query.eq('action', action);
  if (entityType) query = query.eq('entity_type', entityType);
  if (startDate) query = query.gte('created_at', startDate);
  if (endDate) query = query.lte('created_at', endDate);

  const { data: logs, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }

  // Enrich logs with actor names
  const actorIds = [...new Set((logs ?? []).map((l) => l.actor_id))];
  const { data: admins } = await supabaseAdmin
    .from('clinic_admins')
    .select('id, name, email')
    .in('id', actorIds);

  const actorMap = new Map((admins ?? []).map((a) => [a.id, a]));

  const enrichedLogs = (logs ?? []).map((log) => ({
    ...log,
    actor_name: actorMap.get(log.actor_id)?.name ?? 'System',
    actor_email: actorMap.get(log.actor_id)?.email ?? null,
  }));

  return NextResponse.json({
    logs: enrichedLogs,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
