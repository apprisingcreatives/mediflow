'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export interface WaitlistEntry {
  id: string;
  patient_id: string;
  clinic_id: string;
  practitioner_id: string | null;
  service_id: string | null;
  preferred_date_start: string;
  preferred_date_end: string;
  preferred_time_start: string | null;
  preferred_time_end: string | null;
  status: 'waiting' | 'booked' | 'expired' | 'cancelled';
  booked_appointment_id: string | null;
  notes: string | null;
  expires_at: string;
  created_at: string;
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  practitioner?: {
    id: string;
    name: string;
    specialization: string | null;
  } | null;
  service?: {
    id: string;
    name: string;
  } | null;
}

interface AddToWaitlistParams {
  patient_id?: string;
  practitioner_id?: string;
  service_id?: string;
  preferred_date_start: string;
  preferred_date_end: string;
  preferred_time_start?: string;
  preferred_time_end?: string;
  notes?: string;
}

const useWaitlist = (clinicId: string) => {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getAuthHeader = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token
      ? { Authorization: `Bearer ${session.access_token}` }
      : null;
  };

  const fetchWaitlist = useCallback(
    async (params?: { status?: string; practitioner_id?: string }) => {
      if (!clinicId) return;
      try {
        setLoading(true);
        setError(null);
        const headers = await getAuthHeader();
        if (!headers) return;

        const { data } = await axios.get(`/api/clinic/${clinicId}/waitlist`, {
          headers,
          params,
        });
        setWaitlist(data.waitlist || []);
      } catch (err) {
        console.error('Failed to fetch waitlist:', err);
        setError('Failed to load waitlist');
      } finally {
        setLoading(false);
      }
    },
    [clinicId],
  );

  const addToWaitlist = useCallback(
    async (entry: AddToWaitlistParams) => {
      try {
        setLoading(true);
        setError(null);
        const headers = await getAuthHeader();
        if (!headers) return null;

        const { data } = await axios.post(
          `/api/clinic/${clinicId}/waitlist`,
          entry,
          { headers },
        );
        setWaitlist(prev => [...prev, data.waitlist_entry]);
        return data.waitlist_entry;
      } catch (err: any) {
        const msg = err.response?.data?.error || 'Failed to add to waitlist';
        setError(msg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [clinicId],
  );

  const removeFromWaitlist = useCallback(
    async (waitlistId: string) => {
      try {
        setLoading(true);
        setError(null);
        const headers = await getAuthHeader();
        if (!headers) return false;

        await axios.delete(`/api/clinic/${clinicId}/waitlist/${waitlistId}`, {
          headers,
        });
        setWaitlist(prev => prev.filter(e => e.id !== waitlistId));
        return true;
      } catch (err: any) {
        const msg =
          err.response?.data?.error || 'Failed to remove from waitlist';
        setError(msg);
        return false;
      } finally {
        setLoading(false);
      }
    },
    [clinicId],
  );

  return {
    waitlist,
    loading,
    error,
    fetchWaitlist,
    addToWaitlist,
    removeFromWaitlist,
  };
};

export default useWaitlist;
