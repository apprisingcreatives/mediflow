'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export interface BlockedTime {
  id: string;
  practitioner_id: string;
  block_date: string;
  start_time: string | null;
  end_time: string | null;
  reason: string | null;
  created_at: string;
  created_by: string | null;
}

interface CreateBlockedTimeParams {
  blockDate: string;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export function useBlockedTimes(clinicId: string, practitionerId: string) {
  const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${session.access_token}` };
  }, []);

  const basePath = `/api/clinic/${clinicId}/practitioners/${practitionerId}/blocked-times`;

  const fetchBlockedTimes = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);

      const { data } = await axios.get(
        `${basePath}?${params.toString()}`,
        { headers },
      );

      setBlockedTimes(data.blocked_times);
      return data.blocked_times as BlockedTime[];
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to load blocked times';
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, [basePath, getAuthHeaders]);

  const createBlockedTime = useCallback(async (params: CreateBlockedTimeParams) => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      const { data } = await axios.post(
        basePath,
        {
          block_date: params.blockDate,
          start_time: params.startTime || null,
          end_time: params.endTime || null,
          reason: params.reason || null,
        },
        { headers },
      );

      setBlockedTimes((prev) => [...prev, data.blocked_time]);
      return data;
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to create blocked time';
      setError(msg);
      return null;
    }
  }, [basePath, getAuthHeaders]);

  const deleteBlockedTime = useCallback(async (blockedTimeId: string) => {
    setError(null);
    try {
      const headers = await getAuthHeaders();
      await axios.delete(`${basePath}?id=${blockedTimeId}`, { headers });
      setBlockedTimes((prev) => prev.filter((bt) => bt.id !== blockedTimeId));
      return true;
    } catch (err: any) {
      const msg = err?.response?.data?.error || 'Failed to delete blocked time';
      setError(msg);
      return false;
    }
  }, [basePath, getAuthHeaders]);

  return {
    blockedTimes,
    loading,
    error,
    fetchBlockedTimes,
    createBlockedTime,
    deleteBlockedTime,
  };
}
