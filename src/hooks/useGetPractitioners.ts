'use client';

import { useState, useCallback } from 'react';
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
  // Joined relations
  working_hours?: PractitionerWorkingHours[];
}

export interface PractitionerWorkingHours {
  id: string;
  practitioner_id: string;
  day_of_week: number; // 0=Sunday, 6=Saturday
  start_time: string; // HH:MM:SS
  end_time: string; // HH:MM:SS
  is_available: boolean;
}

// Helper to get day name from day_of_week
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

        // Build query based on whether we need working hours
        if (includeWorkingHours) {
          let query = supabase
            .from('practitioners')
            .select('*, working_hours:practitioner_working_hours(id, practitioner_id, day_of_week, start_time, end_time, is_available)')
            .eq('clinic_id', clinicId)
            .order('name', { ascending: true });

          if (activeOnly) {
            query = query.eq('is_active', true);
          }

          const { data, error: queryError } = await query;

          if (queryError) {
            throw queryError;
          }

          setPractitioners((data as Practitioner[]) ?? []);
          return (data as Practitioner[]) ?? [];
        } else {
          let query = supabase
            .from('practitioners')
            .select('*')
            .eq('clinic_id', clinicId)
            .order('name', { ascending: true });

          if (activeOnly) {
            query = query.eq('is_active', true);
          }

          const { data, error: queryError } = await query;

          if (queryError) {
            throw queryError;
          }

          setPractitioners((data as Practitioner[]) ?? []);
          return (data as Practitioner[]) ?? [];
        }
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
