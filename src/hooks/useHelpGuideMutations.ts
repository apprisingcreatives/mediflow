'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { HelpGuideCategory } from '@/types/super-admin';

interface GuideInput {
  title: string;
  body: string | null;
  category: HelpGuideCategory;
  sort_order: number;
  is_published: boolean;
}

interface FaqInput {
  question: string;
  answer: string;
  sort_order: number;
}

const useHelpGuideMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createGuide = async (input: GuideInput) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('help_guides')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create guide');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateGuide = async (id: string, input: Partial<GuideInput>) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('help_guides')
        .update({ ...input, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update guide');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteGuide = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.from('help_guides').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete guide');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addFaq = async (guide_id: string, input: FaqInput) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('help_guide_faqs')
        .insert({ guide_id, ...input })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add FAQ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateFaq = async (id: string, input: Partial<FaqInput>) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('help_guide_faqs')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update FAQ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteFaq = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const { error } = await supabase.from('help_guide_faqs').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete FAQ');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createGuide, updateGuide, deleteGuide, addFaq, updateFaq, deleteFaq, loading, error };
};

export default useHelpGuideMutations;
