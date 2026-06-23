'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type { BranchComparison } from '@/types/database';

const useBranchComparison = (clinicId: string) => {
  const [data, setData] = useState<BranchComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchComparison = useCallback(async (startDate: string, endDate: string) => {
    if (!clinicId) return;
    try {
      setLoading(true);
      setError(null);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data: res } = await axios.get(
        `/api/clinic/${clinicId}/analytics/branch-comparison`,
        {
          params: { start_date: startDate, end_date: endDate },
          headers: { Authorization: `Bearer ${session.access_token}` },
        },
      );
      setData(res.data ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load branch comparison');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  return { data, loading, error, fetchComparison };
};

export default useBranchComparison;
