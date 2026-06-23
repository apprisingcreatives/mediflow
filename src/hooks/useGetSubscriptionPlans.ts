'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { SubscriptionPlan } from '@/types/super-admin';

const useGetSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [clinicCounts, setClinicCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) throw new Error('Not authenticated');

      const { data } = await axios.get('/api/super-admin/subscription-plans', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      setPlans(data.plans ?? []);
      setClinicCounts(data.clinicCounts ?? {});
    } catch (err) {
      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.error || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to fetch plans',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return { plans, clinicCounts, loading, error, fetchPlans };
};

export default useGetSubscriptionPlans;
