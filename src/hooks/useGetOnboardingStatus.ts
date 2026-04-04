'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ClinicOnboardingInfo } from '@/types/super-admin';

const STALE_DAYS = 7;

const useGetOnboardingStatus = () => {
  const [clinics, setClinics] = useState<ClinicOnboardingInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOnboardingStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all clinics with related counts
      const { data: clinicsData, error: clinicsError } = await supabase
        .from('clinics')
        .select(`
          id, name, email, created_at, updated_at,
          clinic_admins(id, auth_user_id),
          clinic_services(id),
          practitioners(id, practitioner_working_hours(id)),
          patient_clinics(id)
        `)
        .order('created_at', { ascending: false });

      if (clinicsError) throw clinicsError;

      const now = new Date();
      const staleThreshold = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);

      const results: ClinicOnboardingInfo[] = (clinicsData || []).map((clinic: any) => {
        const hasAdmin = (clinic.clinic_admins || []).some((a: any) => a.auth_user_id !== null);
        const hasServices = (clinic.clinic_services || []).length > 0;
        const hasPractitioners = (clinic.practitioners || []).some(
          (p: any) => (p.practitioner_working_hours || []).length > 0
        );
        const hasPatient = (clinic.patient_clinics || []).length > 0;

        const steps = {
          clinic_created: true,
          admin_set_up: hasAdmin,
          services_added: hasServices,
          practitioners_added: hasPractitioners,
          first_patient: hasPatient,
        };

        const completedSteps = Object.values(steps).filter(Boolean).length;
        const allComplete = completedSteps === 5;
        const isStale = new Date(clinic.updated_at) < staleThreshold;

        let status: ClinicOnboardingInfo['status'];
        if (allComplete) {
          status = 'completed';
        } else if (!allComplete && isStale) {
          status = 'stalled';
        } else if (hasServices || hasPractitioners || hasPatient) {
          status = 'in_progress';
        } else {
          status = 'pending';
        }

        return {
          clinic_id: clinic.id,
          clinic_name: clinic.name,
          clinic_email: clinic.email,
          registered_at: clinic.created_at,
          updated_at: clinic.updated_at,
          steps,
          completed_steps: completedSteps,
          total_steps: 5,
          status,
        };
      });

      setClinics(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch onboarding status');
    } finally {
      setLoading(false);
    }
  }, []);

  return { clinics, loading, error, fetchOnboardingStatus };
};

export default useGetOnboardingStatus;
