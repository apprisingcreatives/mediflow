'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
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
  branch_id?: string | null;
}

export interface UpdateServiceData {
  name?: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number;
  currency?: string;
  is_active?: boolean;
}

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Not authenticated');
  }
  return { Authorization: `Bearer ${session.access_token}` };
}

const useServiceMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createService = useCallback(
    async (data: CreateServiceData): Promise<ClinicService | null> => {
      try {
        setLoading(true);
        setError(null);

        const headers = await getAuthHeaders();
        const { data: responseData } = await axios.post(
          `/api/clinic/${data.clinic_id}/services`,
          {
            name: data.name,
            description: data.description || null,
            duration_minutes: data.duration_minutes,
            price: data.price,
            currency: data.currency || 'PHP',
            is_active: data.is_active ?? true,
            branch_id: data.branch_id || null,
          },
          { headers },
        );

        return responseData.service as ClinicService;
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
      data: UpdateServiceData,
      clinicId?: string
    ): Promise<ClinicService | null> => {
      try {
        setLoading(true);
        setError(null);

        if (!clinicId) {
          throw new Error('clinicId is required for updateService');
        }

        const headers = await getAuthHeaders();
        const { data: responseData } = await axios.patch(
          `/api/clinic/${clinicId}/services/${serviceId}`,
          data,
          { headers },
        );

        return responseData.service as ClinicService;
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

  const deleteService = useCallback(
    async (serviceId: string, clinicId?: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        if (!clinicId) {
          throw new Error('clinicId is required for deleteService');
        }

        const headers = await getAuthHeaders();
        await axios.delete(
          `/api/clinic/${clinicId}/services/${serviceId}`,
          { headers },
        );

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
    },
    []
  );

  const toggleServiceStatus = useCallback(
    async (serviceId: string, isActive: boolean, clinicId?: string): Promise<boolean> => {
      try {
        setLoading(true);
        setError(null);

        if (!clinicId) {
          throw new Error('clinicId is required for toggleServiceStatus');
        }

        const headers = await getAuthHeaders();
        await axios.patch(
          `/api/clinic/${clinicId}/services/${serviceId}`,
          { is_active: isActive },
          { headers },
        );

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
