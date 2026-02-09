'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface Patient {
  id: string;
  auth_user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  is_active: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

interface FetchPatientsParams {
  clinicId: string;
  searchQuery?: string;
}

const useGetPatients = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = useCallback(
    async ({ clinicId, searchQuery }: FetchPatientsParams) => {
      if (!clinicId) {
        console.error('fetchPatients called without clinicId');
        return [];
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch patients who have appointments at this clinic
        // This is enforced by RLS policy
        let query = supabase
          .from('patients')
          .select('*')
          .order('last_name', { ascending: true })
          .order('first_name', { ascending: true });

        // Apply search filter if provided
        if (searchQuery && searchQuery.trim()) {
          const search = searchQuery.trim().toLowerCase();
          query = query.or(
            `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
          );
        }

        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        setPatients(data ?? []);
        return data ?? [];
      } catch (err) {
        console.error('Failed to fetch patients:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to fetch patients';
        setError(errorMessage);
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Search patients by email (for checking if patient exists)
  const searchPatientByEmail = useCallback(async (email: string) => {
    try {
      const { data, error: queryError } = await supabase
        .from('patients')
        .select('*')
        .eq('email', email)
        .single();

      if (queryError && queryError.code !== 'PGRST116') {
        throw queryError;
      }

      return data;
    } catch (err) {
      console.error('Failed to search patient:', err);
      return null;
    }
  }, []);

  return {
    patients,
    loading,
    error,
    fetchPatients,
    searchPatientByEmail,
  };
};

export default useGetPatients;
