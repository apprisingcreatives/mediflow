'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export interface ClinicAnalytics {
  no_show_rate: number;
  no_show_count: number;
  total_appointments: number;
  revenue_lost: number;
  confirmation_rate: number;
  peak_hours: { hour: number; count: number }[];
  trends: {
    dates: string[];
    no_show_rates: number[];
    appointment_counts: number[];
  };
}

const useClinicAnalytics = (clinicId: string) => {
  const [analytics, setAnalytics] = useState<ClinicAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (period: string = '30d') => {
      if (!clinicId) return;
      try {
        setLoading(true);
        setError(null);

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) return;

        const { data } = await axios.get(
          `/api/clinic/${clinicId}/analytics`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            params: { period },
          },
        );
        setAnalytics(data);
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    },
    [clinicId],
  );

  return { analytics, loading, error, fetchAnalytics };
};

export default useClinicAnalytics;
