'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface ToggleClinicFeatureParams {
  clinicId: string;
  featureId: string;
  isEnabled: boolean;
  enabledBy: string; // super_admin.id
}

const usePutClinicFeatures = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleClinicFeature = useCallback(
    async ({
      clinicId,
      featureId,
      isEnabled,
      enabledBy,
    }: ToggleClinicFeatureParams) => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Use upsert to handle both insert and update in a single query
        // RLS policy "Super admins have full access to clinic AI features" handles authorization
        // The unique constraint on (clinic_id, feature_id) enables upsert to work correctly
        const { data, error: upsertError } = await supabase
          .from('clinic_ai_features')
          .upsert(
            {
              clinic_id: clinicId,
              feature_id: featureId,
              is_enabled: isEnabled,
              enabled_by: isEnabled ? enabledBy : null,
              enabled_at: isEnabled ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'clinic_id,feature_id',
            }
          )
          .select()
          .single();

        if (upsertError) throw upsertError;

        return { feature: data };
      } catch (err) {
        console.error('Failed to update clinic AI feature:', err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to update clinic feature';
        setError(errorMessage);
        throw new Error(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    toggleClinicFeature,
    loading,
    error,
  };
};

export default usePutClinicFeatures;
