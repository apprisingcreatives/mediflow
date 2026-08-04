'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { ClinicOnboardingInfo } from '@/types/super-admin';

const useGetOnboardingStatus = () => {
  const [clinics, setClinics] = useState<ClinicOnboardingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated');

      const { data } = await axios.get('/api/super-admin/onboarding', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setClinics(data.clinics);
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch onboarding status',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { clinics, loading, error, fetchOnboardingStatus };
};

export default useGetOnboardingStatus;
