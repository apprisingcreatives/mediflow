'use client';

import { useState, useCallback } from 'react';

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

        // Call API route instead of direct Supabase access
        // API route uses supabaseAdmin which bypasses RLS
        const response = await fetch(
          `/api/super-admin/clinics/${clinicId}/features`,
          {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              featureId,
              isEnabled,
              adminId: enabledBy,
            }),
          }
        );

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to toggle feature');
        }

        const data = await response.json();
        return data;
      } catch (err) {
        console.error('Failed to update clinic AI feature:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to update clinic feature'
        );
        throw err;
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
