'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { HelpGuide, HelpGuideCategory } from '@/types/super-admin';

const useGetHelpGuides = () => {
  const [guides, setGuides] = useState<HelpGuide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGuides = useCallback(async (category?: HelpGuideCategory) => {
    try {
      setLoading(true);
      setError(null);
      let query = supabase
        .from('help_guides')
        .select('*, help_guide_faqs(*)')
        .order('sort_order', { ascending: true });
      if (category) {
        query = query.eq('category', category);
      }
      const { data, error } = await query;
      if (error) throw error;
      setGuides(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch guides');
    } finally {
      setLoading(false);
    }
  }, []);

  return { guides, loading, error, fetchGuides };
};

export default useGetHelpGuides;
