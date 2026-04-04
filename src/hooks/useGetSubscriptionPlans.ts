'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { SubscriptionPlan } from '@/types/super-admin';

const useGetSubscriptionPlans = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setPlans(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  }, []);

  return { plans, loading, error, fetchPlans };
};

export default useGetSubscriptionPlans;
