'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export interface PractitionerMetric {
  practitioner_id: string;
  practitioner_name: string;
  appointment_count: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  cancellation_rate: number;
  revenue: number;
  utilization_rate: number;
}

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
  practitioner_metrics: PractitionerMetric[];
  patient_return_rate: number;
  total_revenue: number;
}

const useClinicAnalytics = (clinicId: string) => {
  const [analytics, setAnalytics] = useState<ClinicAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(
    async (period: string = '30d', practitionerId?: string) => {
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
            params: { period, ...(practitionerId && { practitionerId }) },
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
