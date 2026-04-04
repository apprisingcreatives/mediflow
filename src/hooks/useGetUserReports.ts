'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { UserReport } from '@/types/super-admin';

const useGetUserReports = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('user_reports')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReports(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  }, []);

  return { reports, loading, error, fetchReports };
};

export default useGetUserReports;
