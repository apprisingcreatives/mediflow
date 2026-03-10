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

export interface PatientClinic {
  id: string;
  patient_id: string;
  clinic_id: string;
  created_at: string;
  first_visit_at: string | null;
  last_visit_at: string | null;
  is_primary: boolean;
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

        // Fetch patients through patient_clinics junction table
        // This ensures we only get patients associated with this clinic
        let query = supabase
          .from('patient_clinics')
          .select(
            `
            patient:patients (
              id,
              auth_user_id,
              email,
              first_name,
              last_name,
              phone,
              date_of_birth,
              gender,
              address,
              city,
              is_active,
              onboarding_completed,
              created_at,
              updated_at
            )
          `
          )
          .eq('clinic_id', clinicId);

        const { data, error: queryError } = await query;

        if (queryError) {
          throw queryError;
        }

        // Extract patients from the nested structure and filter out nulls
        // Supabase returns the joined table as an object (not array) for single relations
        const extractedPatients = (data ?? [])
          .map((item) => item.patient as unknown as Patient | null)
          .filter((patient): patient is Patient => patient !== null);

        // Sort by last_name, then first_name
        extractedPatients.sort((a, b) => {
          const lastNameCompare = a.last_name.localeCompare(b.last_name);
          if (lastNameCompare !== 0) return lastNameCompare;
          return a.first_name.localeCompare(b.first_name);
        });

        // Apply search filter if provided (client-side filtering)
        let filteredPatients = extractedPatients;
        if (searchQuery && searchQuery.trim()) {
          const search = searchQuery.trim().toLowerCase();
          filteredPatients = extractedPatients.filter(
            (patient) =>
              patient.first_name.toLowerCase().includes(search) ||
              patient.last_name.toLowerCase().includes(search) ||
              patient.email.toLowerCase().includes(search) ||
              (patient.phone && patient.phone.toLowerCase().includes(search))
          );
        }

        setPatients(filteredPatients);
        return filteredPatients;
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
