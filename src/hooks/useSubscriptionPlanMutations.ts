'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import axios from 'axios';

interface PlanInput {
  name: string;
  slug: string;
  price: number;
  currency: string;
  billing_cycle: string;
  description: string | null;
  features: string[];
  max_practitioners: number | null;
  max_patients: number | null;
  is_active: boolean;
  sort_order: number;
}

async function getAuthHeaders() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return { Authorization: `Bearer ${session.access_token}` };
}

const useSubscriptionPlanMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlan = async (input: PlanInput) => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const { data } = await axios.post('/api/super-admin/subscription-plans', input, { headers });
      return data.plan;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : err instanceof Error
          ? err.message
          : 'Failed to create plan';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (id: string, input: Partial<PlanInput>) => {
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const { data } = await axios.patch(`/api/super-admin/subscription-plans/${id}`, input, { headers });
      return data.plan;
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error || err.message
        : err instanceof Error
          ? err.message
          : 'Failed to update plan';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const togglePlanActive = async (id: string, is_active: boolean) => {
    return updatePlan(id, { is_active });
  };

  return { createPlan, updatePlan, togglePlanActive, loading, error };
};

export default useSubscriptionPlanMutations;
