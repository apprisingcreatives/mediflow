'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PatientClinicInfo } from '@/components/patient/dashboard/types';

const useAllClinics = () => {
  const [clinics, setClinics] = useState<PatientClinicInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('clinics')
        .select('id, name, address, phone')
        .eq('is_active', true)
        .order('name');

      if (queryError) {
        throw queryError;
      }

      const clinicsData: PatientClinicInfo[] = (data || []).map((c) => ({
        id: c.id,
        clinic_id: c.id,
        clinic: {
          id: c.id,
          name: c.name,
          address: c.address,
          phone: c.phone,
        },
      }));

      setClinics(clinicsData);
      return clinicsData;
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
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

export default useAllClinics;
