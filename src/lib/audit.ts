import { supabaseAdmin } from '@/lib/supabase-admin';

interface AuditLogParams {
  clinicId: string;
  actorId: string;
  actorType: 'clinic_admin' | 'practitioner' | 'system';
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}

export async function logStaffAction(params: AuditLogParams): Promise<void> {
  try {
    await supabaseAdmin.from('staff_audit_logs').insert({
      clinic_id: params.clinicId,
      actor_id: params.actorId,
      actor_type: params.actorType,
      action: params.action,
      entity_type: params.entityType ?? null,
      entity_id: params.entityId ?? null,
      metadata: params.metadata ?? {},
      ip_address: params.ipAddress ?? null,
    });
  } catch {
    // Fire-and-forget: audit logging should never break the main operation
    console.error('Failed to write audit log:', params.action);
  }
}
