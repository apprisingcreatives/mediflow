'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

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

const useSubscriptionPlanMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlan = async (input: PlanInput) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('subscription_plans')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (id: string, input: Partial<PlanInput>) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('subscription_plans')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update plan');
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
