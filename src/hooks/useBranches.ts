'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type { Branch } from '@/types/database';

const useBranches = (clinicId: string) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchBranches = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const { data } = await axios.get(`/api/clinic/${clinicId}/branches`, { headers });
      setBranches(data.branches ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load branches');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const createBranch = async (branchData: { name: string; address?: string; city?: string; phone?: string }) => {
    const headers = await getAuthHeaders();
    const { data } = await axios.post(`/api/clinic/${clinicId}/branches`, branchData, { headers });
    await fetchBranches();
    return data.branch;
  };

  const updateBranch = async (branchId: string, updates: Partial<Pick<Branch, 'name' | 'address' | 'city' | 'phone' | 'is_active'>>) => {
    const headers = await getAuthHeaders();
    const { data } = await axios.patch(`/api/clinic/${clinicId}/branches/${branchId}`, updates, { headers });
    await fetchBranches();
    return data.branch;
  };

  const deleteBranch = async (branchId: string) => {
    const headers = await getAuthHeaders();
    await axios.delete(`/api/clinic/${clinicId}/branches/${branchId}`, { headers });
    await fetchBranches();
  };

  const assignPractitioner = async (branchId: string, practitionerId: string) => {
    const headers = await getAuthHeaders();
    await axios.post(`/api/clinic/${clinicId}/branches/${branchId}/practitioners`, { practitioner_id: practitionerId }, { headers });
  };

  const unassignPractitioner = async (branchId: string, practitionerId: string) => {
    const headers = await getAuthHeaders();
    await axios.delete(`/api/clinic/${clinicId}/branches/${branchId}/practitioners/${practitionerId}`, { headers });
  };

  const getBranchPractitioners = async (branchId: string) => {
    const headers = await getAuthHeaders();
    const { data } = await axios.get(`/api/clinic/${clinicId}/branches/${branchId}/practitioners`, { headers });
    return data.practitioners ?? [];
  };

  return {
    branches,
    loading,
    error,
    fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    assignPractitioner,
    unassignPractitioner,
    getBranchPractitioners,
  };
};

export default useBranches;
