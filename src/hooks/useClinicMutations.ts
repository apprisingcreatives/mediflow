'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Clinic } from '@/types/database';

export interface CreateClinicData {
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  description?: string | null;
  logo_url?: string | null;
  subscription_plan?: string;
  slug?: string | null;
}

export interface UpdateClinicData {
  name?: string;
  email?: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  description?: string | null;
  logo_url?: string | null;
  subscription_plan?: string;
  is_active?: boolean;
  slug?: string | null;
}

/**
 * Generate a URL-friendly slug from a clinic name.
 * Converts to lowercase, replaces spaces/special chars with hyphens,
 * and appends a short random suffix for uniqueness.
 */
function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.random().toString(36).substring(2, 6);
  return `${base}-${suffix}`;
}

const useClinicMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClinic = useCallback(
    async (data: CreateClinicData): Promise<Clinic | null> => {
      try {
        setLoading(true);
        setError(null);

        const slug = data.slug || generateSlug(data.name);

        const { data: newClinic, error: insertError } = await supabase
          .from('clinics')
          .insert({
            name: data.name,
            email: data.email,
            phone: data.phone || null,
            address: data.address || null,
            city: data.city || null,
            description: data.description || null,
            logo_url: data.logo_url || null,
            subscription_plan: data.subscription_plan || 'starter',
            slug,
            is_active: true,
            is_trial_active: true,
            is_subscription_active: true,
            payment_status: 'trial',
            trial_start_date: new Date().toISOString(),
            trial_end_date: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return newClinic as Clinic;
      } catch (err) {
        console.error('Failed to create clinic:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create clinic';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateClinic = useCallback(
    async (
      clinicId: string,
      data: UpdateClinicData
    ): Promise<Clinic | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data: updatedClinic, error: updateError } = await supabase
          .from('clinics')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clinicId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return updatedClinic as Clinic;
      } catch (err) {
        console.error('Failed to update clinic:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update clinic';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteClinic = useCallback(
    async (clinicId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        // Soft delete — set is_active to false
        const { error: updateError } = await supabase
          .from('clinics')
          .update({
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', clinicId);

        if (updateError) {
          throw updateError;
        }

        return true;
      } catch (err) {
        console.error('Failed to delete clinic:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete clinic';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const hardDeleteClinic = useCallback(
    async (clinicId: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: deleteError } = await supabase
          .from('clinics')
          .delete()
          .eq('id', clinicId);

        if (deleteError) {
          throw deleteError;
        }

        return true;
      } catch (err) {
        console.error('Failed to hard-delete clinic:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to delete clinic';
        setError(errorMessage);
        return false;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    createClinic,
    updateClinic,
    deleteClinic,
    hardDeleteClinic,
    clearError,
  };
};

export default useClinicMutations;
