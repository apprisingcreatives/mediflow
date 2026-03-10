'use client';

import { supabase } from '@/lib/supabase';
import { useState, useCallback } from 'react';

export interface AIFeature {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  slug: string;
  is_premium: boolean;
}

const useGetFeatures = () => {
  const [features, setFeatures] = useState<AIFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFeatures = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('ai_features')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;

      setFeatures(data ?? []);
    } catch (err) {
      console.error('Failed to fetch AI features:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch AI features',
      );
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  return {
    features,
    loading,
    error,
    fetchFeatures,
  };
};

export default useGetFeatures;
