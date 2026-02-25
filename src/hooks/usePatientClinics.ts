'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface PatientClinicInfo {
  id: string;
  clinic_id: string;
  clinic: {
    id: string;
    name: string;
    address: string | null;
    phone: string | null;
  };
}

const usePatientClinics = () => {
  const [clinics, setClinics] = useState<PatientClinicInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = useCallback(async (patientId: string) => {
    if (!patientId) {
      console.error('fetchClinics called without patientId');
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('patient_clinics')
        .select(
          `
          id,
          clinic_id,
          clinic:clinics (id, name, address, phone)
        `
        )
        .eq('patient_id', patientId);

      if (queryError) {
        throw queryError;
      }

      const clinicsData = (data as unknown as PatientClinicInfo[]) || [];
      setClinics(clinicsData);
      return clinicsData;
    } catch (err) {
      console.error('Failed to fetch patient clinics:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch clinics';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clinics,
    loading,
    error,
    fetchClinics,
  };
};

export default usePatientClinics;
