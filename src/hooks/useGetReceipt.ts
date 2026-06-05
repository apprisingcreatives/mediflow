'use client';

import { useState, useCallback } from 'react';
import axios from 'axios';
import { supabase } from '@/lib/supabase';

export interface Receipt {
  appointment_id: string;
  date: string;
  time: string;
  amount: number | null;
  payment_method: string | null;
  payment_status: string;
  paid_at: string | null;
  refunded_at: string | null;
  patient: { name: string; email: string };
  practitioner: { name: string; specialization: string | null };
  service: { name: string; price: number };
  clinic: { name: string; address: string | null; email: string | null };
}

export function useGetReceipt() {
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReceipt = useCallback(async (appointmentId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const { data } = await axios.get(
        `/api/appointments/${appointmentId}/receipt`,
        { headers: { Authorization: `Bearer ${session.access_token}` } },
      );

      setReceipt(data.receipt);
      return data.receipt as Receipt;
    } catch (err: any) {
      const msg = err?.response?.data?.error || err.message || 'Failed to load receipt';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { receipt, loading, error, fetchReceipt };
}
