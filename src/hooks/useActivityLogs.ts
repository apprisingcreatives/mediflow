'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ActivityLog {
  id: string;
  patient_id: string;
  clinic_id: string | null;
  actor_id: string;
  actor_role: 'patient' | 'clinic_admin' | 'practitioner' | 'system';
  action_type: ActivityActionType;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type ActivityActionType =
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_checked_in'
  | 'appointment_completed'
  | 'appointment_no_show'
  | 'password_changed'
  | 'profile_updated';

interface FetchByPatientParams {
  patientId: string;
  clinicId?: string;
}

interface FetchByEntityParams {
  entityId: string;
}

type FetchLogsParams = FetchByPatientParams | FetchByEntityParams;

function isEntityParams(params: FetchLogsParams): params is FetchByEntityParams {
  return 'entityId' in params;
}

const useActivityLogs = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (params: FetchLogsParams) => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('activity_logs')
        .select('*');

      if (isEntityParams(params)) {
        query = query
          .eq('entity_id', params.entityId)
          .order('created_at', { ascending: true });
      } else {
        query = query.eq('patient_id', params.patientId);
        if (params.clinicId) {
          query = query.eq('clinic_id', params.clinicId);
        }
        query = query.order('created_at', { ascending: false });
      }

      const { data, error: queryError } = await query;

      if (queryError) throw queryError;

      setLogs((data as ActivityLog[]) ?? []);
      return (data as ActivityLog[]) ?? [];
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch activity logs';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { logs, loading, error, fetchLogs };
};

export default useActivityLogs;
