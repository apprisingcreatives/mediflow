'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ClinicService } from '@/hooks/useGetServices';

export interface CreateServiceData {
  clinic_id: string;
  name: string;
  description?: string | null;
  duration_minutes: number;
  price: number;
  currency?: string;
  is_active?: boolean;
}

export interface UpdateServiceData {
  name?: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number;
  currency?: string;
  is_active?: boolean;
}

const useServiceMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createService = useCallback(
    async (data: CreateServiceData): Promise<ClinicService | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data: newService, error: insertError } = await supabase
          .from('clinic_services')
          .insert({
            clinic_id: data.clinic_id,
            name: data.name,
            description: data.description || null,
            duration_minutes: data.duration_minutes,
            price: data.price,
            currency: data.currency || 'PHP',
            is_active: data.is_active ?? true,
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        return newService as ClinicService;
      } catch (err) {
        console.error('Failed to create service:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to create service';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateService = useCallback(
    async (
      serviceId: string,
      data: UpdateServiceData
    ): Promise<ClinicService | null> => {
      try {
        setLoading(true);
        setError(null);

        const { data: updatedService, error: updateError } = await supabase
          .from('clinic_services')
          .update({
            ...data,
            updated_at: new Date().toISOString(),
          })
          .eq('id', serviceId)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        return updatedService as ClinicService;
      } catch (err) {
        console.error('Failed to update service:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update service';
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteService = useCallback(async (serviceId: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .from('clinic_services')
        .delete()
        .eq('id', serviceId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete service:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to delete service';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleServiceStatus = useCallback(
    async (serviceId: string, isActive: boolean): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        const { error: updateError } = await supabase
          .from('clinic_services')
          .update({
            is_active: isActive,
            updated_at: new Date().toISOString(),
          })
          .eq('id', serviceId);

        if (updateError) {
          throw updateError;
        }

        return true;
      } catch (err) {
        console.error('Failed to toggle service status:', err);
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to update service status';
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
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    clearError,
  };
};

export default useServiceMutations;
