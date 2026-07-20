import { useState } from 'react';
import { AIFeature, Clinic, ClinicAIFeature, ClinicService, Practitioner } from '@/types/database';
import { supabase } from '@/lib/supabase';

export type PublicClinicWithDetails = Pick<
  Clinic,
  | 'id'
  | 'name'
  | 'email'
  | 'phone'
  | 'address'
  | 'city'
  | 'logo_url'
  | 'description'
  | 'is_active'
  | 'subscription_plan'
> & {
  clinic_services?: ClinicService[];
  practitioners?: Practitioner[];
  clinic_ai_features?: ClinicAIFeature[];

};

interface UseGetClinicsOptions {
  /** When true, fetches all clinics including inactive ones (for super admin). Defaults to false. */
  showAll?: boolean;
}

const useGetClinics = (options?: UseGetClinicsOptions) => {
  const [clinics, setClinics] = useState<PublicClinicWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendRequest = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
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
          clinic_services (*),
          practitioners (*),
          clinic_ai_features (*)
        `,
        )
        .order('name', { ascending: true });

      if (!options?.showAll) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      setClinics(data ?? []);
    } catch (err) {
      console.error('Failed to fetch clinics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch clinics');
    } finally {
      setLoading(false);
    }
  };

  return { clinics, loading, error, sendRequest };
};

export default useGetClinics;
