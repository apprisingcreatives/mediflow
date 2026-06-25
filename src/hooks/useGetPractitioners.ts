'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export interface Practitioner {
  id: string;
  clinic_id: string;
  auth_user_id: string | null;
  name: string;
  email: string | null;
  specialization: string | null;
  bio: string | null;
  image_url: string | null;
  is_active: boolean;
  role: string | null;
  created_at: string;
  updated_at: string;
  working_hours?: PractitionerWorkingHours[];
}

export interface PractitionerWorkingHours {
  id: string;
  practitioner_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export const DAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

interface FetchPractitionersParams {
  clinicId: string;
  branchId?: string | null;
  includeWorkingHours?: boolean;
  activeOnly?: boolean;
}

const useGetPractitioners = () => {
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPractitioners = useCallback(
    async ({
      clinicId,
      branchId,
      includeWorkingHours = false,
      activeOnly = true,
    }: FetchPractitionersParams) => {
      if (!clinicId) {
        console.error('fetchPractitioners called without clinicId');
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error('Not authenticated');
        }

        const params: Record<string, string> = {};
        if (branchId) params.branch_id = branchId;
        if (!activeOnly) params.active_only = 'false';
        if (includeWorkingHours) params.include_working_hours = 'true';

        const { data } = await axios.get(
          `/api/clinic/${clinicId}/practitioners`,
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            params,
          },
        );

        const results: Practitioner[] = data.practitioners ?? [];
        setPractitioners(results);
        return results;
      } catch (err) {
        console.error('Failed to fetch practitioners:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch practitioners';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    practitioners,
    loading,
    error,
    fetchPractitioners,
  };
};

export default useGetPractitioners;
