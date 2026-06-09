'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';
import type { StaffRole } from '@/types/database';

export interface StaffMember {
  id: string;
  clinic_id: string;
  email: string;
  name: string;
  role: string;
  staff_role: StaffRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const useStaffMembers = (clinicId: string) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Not authenticated');
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const fetchStaff = useCallback(async () => {
    if (!clinicId) return;
    try {
      setLoading(true);
      setError(null);
      const headers = await getAuthHeaders();
      const { data } = await axios.get(`/api/clinic/${clinicId}/staff`, { headers });
      setStaff(data.staff ?? []);
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  const inviteStaff = useCallback(async (params: {
    email: string;
    name: string;
    staff_role: StaffRole;
  }) => {
    const headers = await getAuthHeaders();
    const { data } = await axios.post(`/api/clinic/${clinicId}/staff`, params, { headers });
    await fetchStaff();
    return data;
  }, [clinicId, fetchStaff]);

  const updateStaffRole = useCallback(async (
    staffId: string,
    updates: { staff_role?: StaffRole; is_active?: boolean },
  ) => {
    const headers = await getAuthHeaders();
    const { data } = await axios.patch(
      `/api/clinic/${clinicId}/staff/${staffId}`,
      updates,
      { headers },
    );
    await fetchStaff();
    return data;
  }, [clinicId, fetchStaff]);

  const deactivateStaff = useCallback(async (staffId: string) => {
    const headers = await getAuthHeaders();
    await axios.delete(`/api/clinic/${clinicId}/staff/${staffId}`, { headers });
    await fetchStaff();
  }, [clinicId, fetchStaff]);

  return { staff, loading, error, fetchStaff, inviteStaff, updateStaffRole, deactivateStaff };
};

export default useStaffMembers;
