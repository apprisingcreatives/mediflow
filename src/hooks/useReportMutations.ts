'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReportStatus } from '@/types/super-admin';

const useReportMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateReportStatus = async (id: string, status: ReportStatus, admin_notes?: string) => {
    try {
      setLoading(true);
      setError(null);
      const updates: Record<string, any> = {
        status,
        updated_at: new Date().toISOString(),
      };
      if (admin_notes !== undefined) {
        updates.admin_notes = admin_notes;
      }
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }
      const { data, error } = await supabase
        .from('user_reports')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update report');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAdminNotes = async (id: string, admin_notes: string) => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('user_reports')
        .update({ admin_notes, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update notes');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateReportStatus, updateAdminNotes, loading, error };
};

export default useReportMutations;
