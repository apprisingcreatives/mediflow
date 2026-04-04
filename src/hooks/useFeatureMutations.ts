'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface CreateFeatureInput {
  name: string;
  slug: string;
  description: string | null;
  category: string;
  is_premium: boolean;
}

interface UpdateFeatureInput extends CreateFeatureInput {
  id: string;
}

const useFeatureMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createFeature = async (input: CreateFeatureInput) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('ai_features')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create feature';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFeature = async ({ id, ...input }: UpdateFeatureInput) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('ai_features')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update feature';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createFeature, updateFeature, loading, error };
};

export default useFeatureMutations;
