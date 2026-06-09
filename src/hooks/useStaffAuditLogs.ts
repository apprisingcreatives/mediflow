'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export interface AuditLog {
  id: string;
  clinic_id: string;
  actor_id: string;
  actor_name?: string;
  actor_type: 'clinic_admin' | 'practitioner';
  action: string;
  entity_type?: string;
  entity_id?: string;
  metadata?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogFilters {
  actor_id?: string;
  action?: string;
  entity_type?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

const useStaffAuditLogs = (clinicId: string) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (filters?: AuditLogFilters) => {
    if (!clinicId) return;
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const { data } = await axios.get(
        `/api/clinic/${clinicId}/audit-logs`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
          params: filters,
        },
      );
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  return { logs, total, loading, error, fetchLogs };
};

export default useStaffAuditLogs;
