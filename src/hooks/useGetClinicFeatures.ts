'use client';

import { supabase } from '@/lib/supabase';
import { ClinicAIFeature } from '@/types/database';
import { useState, useEffect, useCallback } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const useGetClinicFeatures = () => {
  const [clinicFeatures, setClinicFeatures] = useState<ClinicAIFeature[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscribedClinicId, setSubscribedClinicId] = useState<string | null>(
    null,
  );

  const fetchClinicFeatures = async ({ clinicId }: { clinicId: string }) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('clinic_ai_features')
        .select(
          `
          *,
          feature:ai_features (
            id,
            slug,
            name,
            is_premium
          )
        `,
        )
        .eq('clinic_id', clinicId);

      if (error) throw error;

      setClinicFeatures(data ?? []);
      setSubscribedClinicId(clinicId);
    } catch (err) {
      console.error('Failed to fetch clinic features:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch clinic features',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!subscribedClinicId) return;

    const channel = supabase
      .channel(`clinic_ai_features:${subscribedClinicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clinic_ai_features',
          filter: `clinic_id=eq.${subscribedClinicId}`,
        },
        async (payload: RealtimePostgresChangesPayload<ClinicAIFeature>) => {
          if (payload.eventType === 'INSERT') {
            const { data: newFeature } = await supabase
              .from('clinic_ai_features')
              .select(
                `
                *,
                feature:ai_features (
                  id,
                  slug,
                  name,
                  is_premium
                )
              `,
              )
              .eq('id', payload.new.id)
              .single();

            if (newFeature) {
              setClinicFeatures((prev) => [...prev, newFeature]);
            }
          } else if (payload.eventType === 'UPDATE') {
            // Fetch the updated record with ai_features relation
            const { data: updatedFeature } = await supabase
              .from('clinic_ai_features')
              .select(
                `
                *,
                feature:ai_features (
                  id,
                  slug,
                  name,
                  is_premium
                )
              `,
              )
              .eq('id', payload.new.id)
              .single();

            if (updatedFeature) {
              setClinicFeatures((prev) =>
                prev.map((feature) =>
                  feature.id === updatedFeature.id ? updatedFeature : feature,
                ),
              );
            }
          } else if (payload.eventType === 'DELETE') {
            setClinicFeatures((prev) =>
              prev.filter((feature) => feature.id !== payload.old.id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [subscribedClinicId]);

  return {
    clinicFeatures,
    loading,
    error,
    fetchClinicFeatures,
  };
};

export default useGetClinicFeatures;
