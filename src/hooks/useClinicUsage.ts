'use client';

import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type { ClinicUsage } from '@/types/database';

const useClinicUsage = (clinicId: string) => {
  const [usage, setUsage] = useState<ClinicUsage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchUsage = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const { data } = await axios.get(`/api/clinic/${clinicId}/usage`, { headers });
      setUsage(data);
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.error ?? 'Failed to load usage'
        : 'Failed to load usage';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, error, refetch: fetchUsage };
};

export default useClinicUsage;
