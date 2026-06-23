'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type {
  PatientDemographic,
  ServicePopularity,
  RevenueForecastPoint,
} from '@/types/database';

export interface DemographicsData {
  age_groups: { group: string; count: number }[];
  genders: { gender: string; count: number }[];
  cities: { city: string; count: number }[];
}

const useAdvancedAnalytics = (clinicId: string, branchId?: string | null) => {
  const [demographics, setDemographics] = useState<DemographicsData | null>(null);
  const [serviceTrends, setServiceTrends] = useState<ServicePopularity[]>([]);
  const [revenueForecast, setRevenueForecast] = useState<RevenueForecastPoint[]>([]);
  const [hasEnoughData, setHasEnoughData] = useState(true);
  const [loading, setLoading] = useState({ demographics: false, services: false, forecast: false });
  const [error, setError] = useState({ demographics: null as string | null, services: null as string | null, forecast: null as string | null });

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchDemographics = useCallback(async (startDate?: string, endDate?: string) => {
    if (!clinicId) return;
    try {
      setLoading((prev) => ({ ...prev, demographics: true }));
      setError((prev) => ({ ...prev, demographics: null }));
      const headers = await getAuthHeaders();
      const { data } = await axios.get(
        `/api/clinic/${clinicId}/analytics/demographics`,
        { headers, params: { start_date: startDate, end_date: endDate, branch_id: branchId || undefined } },
      );
      setDemographics(data);
    } catch (err: any) {
      const msg = err.response?.status === 403
        ? 'Professional plan required'
        : err.response?.data?.error ?? 'Failed to load demographics';
      setError((prev) => ({ ...prev, demographics: msg }));
    } finally {
      setLoading((prev) => ({ ...prev, demographics: false }));
    }
  }, [clinicId, branchId]);

  const fetchServiceTrends = useCallback(async (startDate?: string, endDate?: string) => {
    if (!clinicId) return;
    try {
      setLoading((prev) => ({ ...prev, services: true }));
      setError((prev) => ({ ...prev, services: null }));
      const headers = await getAuthHeaders();
      const { data } = await axios.get(
        `/api/clinic/${clinicId}/analytics/service-trends`,
        { headers, params: { start_date: startDate, end_date: endDate, branch_id: branchId || undefined } },
      );
      setServiceTrends(data.services ?? []);
    } catch (err: any) {
      const msg = err.response?.status === 403
        ? 'Professional plan required'
        : err.response?.data?.error ?? 'Failed to load service trends';
      setError((prev) => ({ ...prev, services: msg }));
    } finally {
      setLoading((prev) => ({ ...prev, services: false }));
    }
  }, [clinicId, branchId]);

  const fetchRevenueForecast = useCallback(async (monthsAhead: number = 3) => {
    if (!clinicId) return;
    try {
      setLoading((prev) => ({ ...prev, forecast: true }));
      setError((prev) => ({ ...prev, forecast: null }));
      const headers = await getAuthHeaders();
      const { data } = await axios.get(
        `/api/clinic/${clinicId}/analytics/revenue-forecast`,
        { headers, params: { monthsAhead, branch_id: branchId || undefined } },
      );
      setRevenueForecast(data.data ?? []);
      setHasEnoughData(data.hasEnoughData ?? false);
    } catch (err: any) {
      const msg = err.response?.status === 403
        ? 'Professional plan required'
        : err.response?.data?.error ?? 'Failed to load revenue forecast';
      setError((prev) => ({ ...prev, forecast: msg }));
    } finally {
      setLoading((prev) => ({ ...prev, forecast: false }));
    }
  }, [clinicId, branchId]);

  return {
    demographics,
    serviceTrends,
    revenueForecast,
    hasEnoughData,
    loading,
    error,
    fetchDemographics,
    fetchServiceTrends,
    fetchRevenueForecast,
  };
};

export default useAdvancedAnalytics;
