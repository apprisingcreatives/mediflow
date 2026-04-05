'use client';

import { supabase } from '@/lib/supabase';
import { useState, useCallback } from 'react';

interface Clinic {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  logo_url: string | null;
  description: string | null;
  is_active: boolean;
  subscription_plan: string;
  trial_start_date?: string;
  trial_end_date?: string;
  is_trial_active?: boolean;
  is_subscription_active?: boolean;
  payment_status?: string;
  slug?: string;
  email_notifications_enabled: boolean;
  appointment_reminders_enabled: boolean;
  clinic_services?: Array<{
    id: string;
    name: string;
    description: string | null;
    duration_minutes: number;
    price: number;
  }>;
  practitioners?: Array<{
    id: string;
    name: string;
    specialization: string | null;
    bio?: string;
  }>;
}

const useGetClinic = () => {
  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClinic = useCallback(async (clinicId: string) => {
    if (!clinicId) {
      console.error('fetchClinic called without clinicId');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('clinics')
        .select(
          `
          id,
          name,
          email,
          phone,
          address,
          city,
          logo_url,
          description,
          is_active,
          subscription_plan,
          trial_start_date,
          trial_end_date,
          is_trial_active,
          is_subscription_active,
          payment_status,
          slug,
          email_notifications_enabled,
          appointment_reminders_enabled,
          clinic_services (
            id,
            name,
            description,
            duration_minutes,
            price
          ),
          practitioners (
            id,
            name,
            specialization,
            bio
          )
        `,
        )
        .eq('id', clinicId)
        .single();

      if (queryError) {
        console.error('Supabase query error:', queryError);
        throw queryError;
      }

      if (!data) {
        console.error('No clinic data returned');
        throw new Error('Clinic not found');
      }

      setClinic(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch clinic:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clinic');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    clinic,
    loading,
    error,
    fetchClinic,
  };
};

export default useGetClinic;
