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

        // ✅ REFACTORED: Direct Supabase access with RLS
        // RLS policy "Super admins have full access to clinic AI features" handles authorization
        
        // Check if record exists
        const { data: existingFeature } = await supabase
          .from('clinic_ai_features')
          .select('id')
          .eq('clinic_id', clinicId)
          .eq('feature_id', featureId)
          .maybeSingle();

        let result;

        if (!existingFeature) {
          // Insert new record (RLS policy enforces only super admins can insert)
          const { data, error: insertError } = await supabase
            .from('clinic_ai_features')
            .insert({
              clinic_id: clinicId,
              feature_id: featureId,
              is_enabled: isEnabled,
              enabled_by: isEnabled ? enabledBy : null,
              enabled_at: isEnabled ? new Date().toISOString() : null,
            })
            .select(`
              *,
              ai_features (*)
            `)
            .single();

          if (insertError) throw insertError;
          result = data;
        } else {
          // Update existing record (RLS policy enforces only super admins can update)
          const { data, error: updateError } = await supabase
            .from('clinic_ai_features')
            .update({
              is_enabled: isEnabled,
              enabled_by: isEnabled ? enabledBy : null,
              enabled_at: isEnabled ? new Date().toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('clinic_id', clinicId)
            .eq('feature_id', featureId)
            .select(`
              *,
              ai_features (*)
            `)
            .single();

          if (updateError) throw updateError;
          result = data;
        }

        return { feature: result };
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
